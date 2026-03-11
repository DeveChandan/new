"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "@/navigation"
import { useTranslations } from "next-intl"
import { APIClient, API_ROOT_URL } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Calendar, MapPin, IndianRupee, Briefcase, User, MessageSquare, Clock } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"


const apiClient = new APIClient()

export default function AdminJobDetailsPage() {
    const t = useTranslations("Admin.jobDetails")
    const tCommon = useTranslations("Common")
    const params = useParams()
    const router = useRouter()
    const [job, setJob] = useState<any>(null)
    const [conversations, setConversations] = useState<any[]>([])
    const [selectedConversation, setSelectedConversation] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Fetch Job Details and Conversations
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiClient.getAdminJobDetails(params.id as string) as any
                setJob(data.job)
                setConversations(data.conversations || [])
            } catch (error) {
                console.error("Error fetching job details:", error)
                toast.error(tCommon("messages.error"))
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchData()
        }
    }, [params.id])

    // Fetch Messages when a conversation is selected
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedConversation) return

            setLoadingMessages(true)
            try {
                const data = await apiClient.getAdminConversationMessages(selectedConversation._id) as any[]
                setMessages(data)
            } catch (error) {
                console.error("Error fetching messages:", error)
                toast.error(tCommon("messages.error"))
            } finally {
                setLoadingMessages(false)
            }
        }

        fetchMessages()
    }, [selectedConversation])

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, loadingMessages])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!job) {
        return <div className="p-8 text-center text-muted-foreground">{t("jobNotFound")}</div>
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                    <Badge variant={job.status === "open" ? "default" : "secondary"} className="text-lg px-3 py-1 capitalize">
                        {job.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{t("posted")} {format(new Date(job.createdAt), "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location?.address || t("locationNotSpecified")}</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Job Details & Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Overview Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("jobOverview")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">{t("budget")}</span>
                                    <div className="flex items-center gap-1 text-lg font-semibold">
                                        <IndianRupee className="h-4 w-4" />
                                        {job.salary.toLocaleString('en-IN')}<span className="text-xs text-muted-foreground font-medium ml-1">/ {job.workType === 'permanent' ? 'month' : 'day'}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">{t("workType")}</span>
                                    <div className="flex items-center gap-1 text-lg font-semibold capitalize">
                                        <Briefcase className="h-4 w-4" />
                                        {job.workType} {job.durationDays ? `(${job.durationDays} days)` : ""}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">{t("openings")}</span>
                                    <div className="text-lg font-semibold">{job.totalOpenings}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-muted-foreground">{t("category")}</span>
                                    <div className="flex flex-wrap gap-1">
                                        {job.workerType?.map((type: string) => (
                                            <Badge key={type} variant="outline">{type}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-2">{t("description")}</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-2">{t("requiredSkills")}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills?.map((skill: string) => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conversations / Chat Section */}
                    <Card className="h-[600px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                {t("conversations")}
                            </CardTitle>
                            <CardDescription>
                                {t("conversationsDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex overflow-hidden p-0">
                            {/* Conversation List */}
                            <div className="w-1/3 border-r flex flex-col min-h-0">
                                {conversations.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground">{t("noConversations")}</div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        {conversations.map((convo) => {
                                            // Determine the "other details" (not the employer)
                                            // In this view, we want to show the Worker's name primarily
                                            const otherMember = convo.members.find((m: any) => m._id !== job.employer._id) || convo.members[0];
                                            const isSelected = selectedConversation?._id === convo._id;

                                            return (
                                                <button
                                                    key={convo._id}
                                                    onClick={() => setSelectedConversation(convo)}
                                                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors border-b flex items-start gap-3 ${isSelected ? 'bg-muted' : ''}`}
                                                >
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={otherMember?.profilePicture ? `${API_ROOT_URL}${otherMember.profilePicture}` : undefined} />
                                                        <AvatarFallback>{otherMember?.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="font-medium truncate">{otherMember?.name}</div>
                                                        <div className="text-xs text-muted-foreground truncate">
                                                            {convo.lastMessage?.text || t("noMessagesYet")}
                                                        </div>
                                                        {convo.lastMessage && (
                                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                                {format(new Date(convo.lastMessage.createdAt), "MMM d, h:mm a")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Chat Window */}
                            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 min-h-0">
                                {selectedConversation ? (
                                    <>
                                        <div className="p-4 border-b bg-card flex items-center gap-3 shadow-sm z-10">
                                            {(() => {
                                                const otherMember = selectedConversation.members.find((m: any) => m._id !== job.employer._id) || selectedConversation.members[0];
                                                return (
                                                    <>
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={otherMember?.profilePicture ? `${API_ROOT_URL}${otherMember.profilePicture}` : undefined} />
                                                            <AvatarFallback>{otherMember?.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-sm">{otherMember?.name}</div>
                                                            <div className="text-xs text-muted-foreground capitalize">{otherMember?.role}</div>
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>

                                        <div className="flex-1 p-4 overflow-y-auto min-h-0">
                                            {loadingMessages ? (
                                                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                            ) : messages.length === 0 ? (
                                                <div className="text-center text-muted-foreground py-8 text-sm">{t("noMessages")}</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {messages.map((msg) => {
                                                        const isEmployer = msg.sender === job.employer._id;
                                                        return (
                                                            <div key={msg._id} className={`flex ${isEmployer ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isEmployer
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-white dark:bg-slate-800 border'
                                                                    }`}>
                                                                    {msg.text}
                                                                    <div className={`text-[10px] mt-1 text-right ${isEmployer ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                                        {format(new Date(msg.createdAt), "h:mm a")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    <div ref={scrollRef} />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                        {t("selectConversation")}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: People Involved */}
                <div className="space-y-6">
                    {/* Employer Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t("employer")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={job.employer.profilePicture ? `${API_ROOT_URL}${job.employer.profilePicture}` : undefined} />
                                    <AvatarFallback>{job.employer.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{job.employer.name}</div>
                                    <div className="text-sm text-muted-foreground">{job.employer.companyName || "Individual"}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{job.employer.email}</div>
                                    <div className="text-xs text-muted-foreground">{job.employer.mobile}</div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full mt-4" onClick={() => router.push(`/admin/users/${job.employer._id}`)}>
                                {t("viewProfile")}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Workers / Applicants Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t("applicantsWorkers")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs defaultValue="hired" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="hired">{t("hired")} ({job.workers?.length || 0})</TabsTrigger>
                                    <TabsTrigger value="applicants">{t("applicants")} ({job.applicants?.length || 0})</TabsTrigger>
                                </TabsList>

                                <TabsContent value="hired" className="mt-4">
                                    {job.workers?.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-2">{t("noWorkersHired")}</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {job.workers.map((w: any) => (
                                                <div key={w.workerId._id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={w.workerId.profilePicture ? `${API_ROOT_URL}${w.workerId.profilePicture}` : undefined} />
                                                            <AvatarFallback>{w.workerId.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="text-sm font-medium">{w.workerId.name}</div>
                                                            <div className="text-xs text-muted-foreground capitalize">{w.workerId.mobile}</div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${w.workerId._id}`)}>
                                                        {t("view")}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="applicants" className="mt-4">
                                    {job.applicants?.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-2">{t("noApplicants")}</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {job.applicants.map((a: any) => (
                                                <div key={a._id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={a.profilePicture ? `${API_ROOT_URL}${a.profilePicture}` : undefined} />
                                                            <AvatarFallback>{a.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="text-sm font-medium">{a.name}</div>
                                                            <div className="text-xs text-muted-foreground capitalize">{a.mobile}</div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${a._id}`)}>
                                                        {t("view")}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
