"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Link, useRouter } from "@/navigation"
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { clearAuthToken } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { useNotification } from "@/contexts/NotificationContext"
import { Briefcase, Loader2, LogOut, MessageSquare, User, Menu, X, Send, ArrowLeft, Check, CheckCheck } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useTranslationLocale } from '@/hooks/useTranslation'

interface Conversation {
  _id: string
  members: { _id: string, name: string, profilePicture?: string }[]
  lastMessage?: {
    text: string;
    sender: string;
    createdAt: string;
  }
  updatedAt: string
}

interface Message {
  _id: string
  conversationId: string
  sender: string
  text: string
  createdAt: string
  status?: 'sent' | 'delivered' | 'read'
  clientMessageId?: string
}

export default function MessagesPage() {
  const t = useTranslations('Messages')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { socket, isUserOnline, checkOnlineStatus } = useNotification()
  const { locale } = useTranslationLocale()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [showConversationListOnMobile, setShowConversationListOnMobile] = useState(true)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const conversationId = searchParams.get('conversationId')

  const fetchConversations = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      const data = (await apiClient.getConversations(userId)) as any
      setConversations(data)
    } catch (err: any) {
      setError(err.message || t('errors.fetchConversations'))
    } finally {
      setLoading(false)
    }
  }, [t]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true)
      const data = (await apiClient.getMessages(convId, locale)) as any
      setMessages(data)
    } catch (err: any) {
      setError(err.message || t('errors.loadFailed'))
    } finally {
      setLoadingMessages(false)
    }
  }, [locale, t]);

  // Initial fetch
  useEffect(() => {
    if (!authLoading && user?._id) {
      fetchConversations(user._id)
    } else if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router, fetchConversations]);

  // Fetch messages when conversation is selected - Fixed dependencies
  useEffect(() => {
    if (conversationId && user?._id) {
      fetchMessages(conversationId)
      setShowConversationListOnMobile(false)
    } else {
      setMessages([])
      setShowConversationListOnMobile(true)
    }
  }, [conversationId, user?._id, fetchMessages]);

  // Handle online status check separately
  useEffect(() => {
    if (conversationId && user?._id && conversations.length > 0) {
      const convo = conversations.find(c => c._id === conversationId);
      const other = convo?.members.find(m => m._id !== user._id);
      if (other?._id) {
        checkOnlineStatus(other._id);
      }
    }
  }, [conversationId, user?._id, conversations, checkOnlineStatus]);

    // Mark messages as read when viewing conversation
    const markAsRead = useCallback(async () => {
        if (!conversationId || !user?._id || messages.length === 0) return;

        // Check if there are any unread messages from the OTHER user
        const hasUnread = messages.some(m => m.sender !== user._id && m.status !== 'read');
        if (!hasUnread) return;

        try {
            await apiClient.markMessagesAsRead(conversationId);
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    }, [conversationId, user?._id, messages]);

    useEffect(() => {
        const timer = setTimeout(markAsRead, 1000);
        return () => clearTimeout(timer);
    }, [markAsRead]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage: any) => {
      // Update conversation list
      setConversations(prevConvos => {
        const convoToUpdate = prevConvos.find(c => c._id === newMessage.conversationId);
        if (convoToUpdate) {
          const updatedConvo = {
            ...convoToUpdate,
            updatedAt: newMessage.createdAt,
            lastMessage: {
              text: newMessage.text,
              sender: newMessage.sender,
              createdAt: newMessage.createdAt
            }
          };
          const otherConvos = prevConvos.filter(c => c._id !== newMessage.conversationId);
          return [updatedConvo, ...otherConvos];
        }
        return prevConvos;
      });

      // Update messages if viewing this conversation
      if (newMessage.conversationId === conversationId) {
        // Mark as read immediately via socket
        if (newMessage.sender !== user?._id) {
            socket.emit('message:read', { 
                messageId: newMessage._id, 
                conversationId: newMessage.conversationId,
                senderId: newMessage.sender
            });
        }

        setMessages(prev => {
          // Check if message already exists to prevent duplicates via ID or clientMessageId
          const exists = prev.some(msg => 
            msg._id === newMessage._id || 
            (newMessage.clientMessageId && msg.clientMessageId === newMessage.clientMessageId)
          );
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }
    };

    const handleNewConversation = (newConversation: Conversation) => {
      setConversations(prevConvos => [newConversation, ...prevConvos]);
      socket.emit('joinConversation', newConversation._id);
    }

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('newConversation', handleNewConversation);

    // Typing indicators
    socket.on('userTyping', ({ userId }: { userId: string }) => {
      if (userId !== user?._id) {
        setIsOtherUserTyping(true);
        // Auto-clear after 3 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false);
        }, 3000);
      }
    });

    socket.on('userStoppedTyping', ({ userId }: { userId: string }) => {
      if (userId !== user?._id) {
        setIsOtherUserTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    });

    // Message status updates
    const updateMessageStatus = (data: { messageId?: string, clientMessageId?: string, status: 'delivered' | 'read' }) => {
      const { messageId, clientMessageId, status } = data;
      setMessages(prev => prev.map(msg => {
        const isMatch = msg._id === messageId || (clientMessageId && msg.clientMessageId === clientMessageId);
        if (isMatch) {
          // Don't downgrade status (e.g., if it's already 'read', don't set to 'delivered')
          const statusWeights = { 'sent': 1, 'delivered': 2, 'read': 3 };
          const currentWeight = statusWeights[msg.status as keyof typeof statusWeights] || 1;
          const newWeight = statusWeights[status as keyof typeof statusWeights];
          
          if (newWeight > currentWeight) {
            return { ...msg, status };
          }
        }
        return msg;
      }));
    };

    socket.on('messageDelivered', (data) => updateMessageStatus({ ...data, status: 'delivered' }));
    socket.on('message:delivered', (data) => updateMessageStatus({ ...data, status: 'delivered' })); // Alias
    
    socket.on('messageRead', (data) => updateMessageStatus({ ...data, status: 'read' }));
    socket.on('message:read', (data) => updateMessageStatus({ ...data, status: 'read' })); // Alias

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('newConversation', handleNewConversation);
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('messageDelivered');
      socket.off('messageRead');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, conversationId, user?._id]);

  // Join conversation rooms
  useEffect(() => {
    if (socket && conversations.length > 0) {
      conversations.forEach(c => socket.emit('joinConversation', c._id));
    }
  }, [socket, conversations]);

  // Helper to format date for headers
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return tCommon('dates.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return tCommon('dates.yesterday');
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  // Group messages by date
  const groupedMessages = useCallback(() => {
    const groups: { date: string, messages: Message[] }[] = [];
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toDateString();
      const existingGroup = groups.find(g => g.date === date);
      if (existingGroup) {
        existingGroup.messages.push(msg);
      } else {
        groups.push({ date, messages: [msg] });
      }
    });
    return groups;
  }, [messages]);

  // Auto-scroll with specific behavior
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Emit typing event
    if (socket && conversationId) {
      socket.emit('typing', { conversationId, userId: user?._id });

      // Clear previous timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      // Set timeout to emit stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { conversationId, userId: user?._id });
      }, 2000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!newMessage.trim() || !user?._id || !conversationId) return

    const text = newMessage.trim();
    const tempId = Date.now().toString();

    setSending(true)
    try {
      await apiClient.sendMessage({
        conversationId: conversationId,
        sender: user._id,
        text: text,
        clientMessageId: tempId
      })
      // Don't add here - let the socket event handle it to avoid duplicates
      // The socket will emit 'receiveMessage' which will add it to the state
      setNewMessage("")
    } catch (err: any) {
      setError(err.message || t('errors.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  const handleBackToList = () => {
    // Navigate to /messages without query params. 
    // next-intl's router.push will automatically preserve the current locale.
    router.push("/messages")
    setShowConversationListOnMobile(true)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedConversation = conversations.find(c => c._id === conversationId)
  const otherMember = selectedConversation?.members.find((member) => member._id !== user?._id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10">
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href={user?.role === 'employer' ? '/dashboard/employer' : '/dashboard/worker'} className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Shramik Seva" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {tCommon('appName')}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" className="text-foreground hover:bg-accent font-bold rounded-xl px-6">
                  {tCommon('navigation.profile')}
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 border-border/50 bg-background text-foreground rounded-xl font-bold px-6 h-11 hover:bg-accent transition-all"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('buttons.logout')}
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl sm:hidden border-border/50"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 sm:hidden transition-opacity duration-300 ${isMobileNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileNavOpen(false)}
      >
        <div
          className={`fixed right-0 top-0 h-full w-[280px] bg-card shadow-2xl p-6 transition-transform duration-300 ease-in-out border-l border-border ${isMobileNavOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-lg text-primary">{tCommon('appName')}</span>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsMobileNavOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <div className="space-y-6">
            <Link href="/profile" onClick={() => setIsMobileNavOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-primary/10 rounded-xl py-6 h-auto font-bold">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user?.name} className="w-5 h-5 mr-3 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 mr-3" />
                )}
                {tCommon('navigation.profile')}
              </Button>
            </Link>
            <div className="space-y-3 pt-4 border-t border-border">
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start flex items-center gap-2 text-destructive hover:bg-destructive/10 rounded-xl py-6 h-auto">
                <LogOut className="w-5 h-5 mr-3" />
                {tCommon('buttons.logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground mb-4 leading-tight">{t('conversations')}</h1>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-xl mx-auto sm:mx-0">{t('selectConversation')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Conversation List */}
          <div className={`lg:col-span-1 ${showConversationListOnMobile ? 'block' : 'hidden lg:block'}`}>
            <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader className="p-6 border-b border-border/50 bg-muted/30">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Recent Chats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {error && <div className="p-4 text-destructive">{error}</div>}
                <div className="divide-y divide-border/50">
                  {conversations.length === 0 ? (
                    <div className="p-10 text-center"><p className="text-muted-foreground font-medium">{t('noConversations')}</p></div>
                  ) : (
                    conversations.map((conversation) => {
                      const otherMember = conversation.members.find((member) => member._id !== user?._id)
                      const otherMemberName = otherMember?.name || "Unknown User";
                      const lastMessageText = conversation.lastMessage?.text || "No messages yet...";
                      const isActive = conversation._id === conversationId;

                      return (
                        <Link key={conversation._id} href={`/messages?conversationId=${conversation._id}`}>
                          <div className={`flex items-center gap-4 p-5 hover:bg-muted/50 transition-all cursor-pointer group relative overflow-hidden ${isActive ? 'bg-muted/50' : ''}`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-primary transition-transform origin-center rounded-r-full ${isActive ? 'scale-y-75' : 'scale-y-0 group-hover:scale-y-75'}`} />
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 overflow-hidden">
                              {otherMember?.profilePicture ? (
                                <img src={otherMember.profilePicture} alt={otherMemberName} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-7 h-7 text-primary" />
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className={`font-bold truncate ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>{otherMemberName}</p>
                                <span className="text-xs font-medium text-muted-foreground">
                                  {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{lastMessageText}</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface or Placeholder */}
          <div className={`lg:col-span-2 h-full min-h-[500px] ${!showConversationListOnMobile ? 'block' : 'hidden lg:block'}`}>
            {conversationId ? (
              <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden h-full flex flex-col">
                <CardHeader className="p-6 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden rounded-xl"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
                      {otherMember?.profilePicture ? (
                        <img src={otherMember.profilePicture} alt={otherMember?.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <CardTitle className="text-xl font-bold tracking-tight">{otherMember?.name || 'Unknown User'}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${otherMember?._id && isUserOnline(otherMember._id) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                          {otherMember?._id && isUserOnline(otherMember._id) ? 'Online' : 'Offline'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent bg-[#e5ddd5] dark:bg-[#0b141a] relative">
                  {/* WhatsApp Wallpaper Pattern */}
                  <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/580/630/HD-wallpaper-whatsapp-background-whatsapp-texture.jpg")', backgroundSize: '400px' }} />
                  
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 relative z-10">
                      <div className="w-20 h-20 bg-background/50 backdrop-blur-md rounded-3xl flex items-center justify-center border border-border/50">
                        <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground font-bold text-lg">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6 relative z-10">
                      {groupedMessages().map((group) => (
                        <div key={group.date} className="space-y-4">
                          <div className="flex justify-center my-4">
                            <span className="px-4 py-1.5 bg-background/80 dark:bg-muted/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-widest text-muted-foreground rounded-lg shadow-sm border border-border/10">
                              {formatDateHeader(group.messages[0].createdAt)}
                            </span>
                          </div>
                          
                          {group.messages.map((message, idx) => {
                            const isOwn = message.sender === user?._id;
                            const prevMessage = idx > 0 ? group.messages[idx - 1] : null;
                            const showTail = !prevMessage || prevMessage.sender !== message.sender;

                            return (
                              <div
                                key={message._id}
                                className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-1`}
                              >
                                <div className={`relative max-w-[85%] sm:max-w-[75%] px-3 py-2 shadow-sm ${isOwn
                                  ? "bg-[#dcf8c6] dark:bg-[#005c4b] text-[#303030] dark:text-[#e9edef] rounded-lg rounded-tr-none"
                                  : "bg-white dark:bg-[#202c33] text-[#303030] dark:text-[#e9edef] rounded-lg rounded-tl-none"
                                  }`}>
                                  
                                  {/* Custom WhatsApp-style Tail */}
                                  {showTail && (
                                    <div className={`absolute top-0 w-3 h-4 ${isOwn ? "-right-2 text-[#dcf8c6] dark:text-[#005c4b]" : "-left-2 text-white dark:text-[#202c33]"}`}>
                                      <svg viewBox="0 0 8 13" preserveAspectRatio="none" className="w-full h-full fill-current">
                                        {isOwn ? (
                                          <path d="M0 0h8v13z" />
                                        ) : (
                                          <path d="M8 0H0v13z" />
                                        )}
                                      </svg>
                                    </div>
                                  )}

                                  <div className="flex flex-col">
                                    <p className="text-[14.5px] leading-[19px] whitespace-pre-wrap">{message.text}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5 ml-8 auto">
                                      <span className="text-[10px] text-muted-foreground/60 dark:text-gray-400 font-medium whitespace-nowrap">
                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                      {isOwn && message.status && (
                                        <div className="flex items-center">
                                          {message.status === 'sent' && (
                                            <Check className="w-3.5 h-3.5 text-muted-foreground/40" />
                                          )}
                                          {(message.status === 'delivered' || message.status === 'read') && (
                                            <CheckCheck className={`w-3.5 h-3.5 ${message.status === 'read' ? 'text-[#53bdeb]' : 'text-muted-foreground/40'}`} />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-6 border-t border-border/50 bg-muted/30 backdrop-blur-xl">
                  {/* Typing indicator */}
                  {isOtherUserTyping && (
                    <div className="mb-3 flex items-center gap-2 text-muted-foreground text-sm px-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                      <span className="text-xs font-medium">typing...</span>
                    </div>
                  )}
                  {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive text-xs font-bold rounded-xl border border-destructive/20 text-center">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                    <div className="flex-1 relative group">
                      <Input
                        placeholder={t('typeMessage')}
                        value={newMessage}
                        onChange={handleInputChange}
                        className="w-full h-14 bg-background border-border/50 text-foreground placeholder:text-muted-foreground/50 rounded-2xl pl-6 pr-14 transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                        disabled={sending}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className={`w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 ${sending || !newMessage.trim() ? "bg-muted text-muted-foreground opacity-50" : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/20"}`}
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </Card>
            ) : (
              <Card className="bg-card/80 border-border/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/5 h-full flex flex-col items-center justify-center p-12 text-center relative overflow-hidden border-dashed border-2">
                <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-xl shadow-primary/5 animate-bounce-slow">
                    <MessageSquare className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">{t('selectToChat')}</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed font-medium">{t('chooseFromList')}</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

