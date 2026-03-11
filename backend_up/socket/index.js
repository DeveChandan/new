const jwt = require('jsonwebtoken');

let io;

// Store online users
const onlineUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId
// Rate limiting store for socket events
const rateLimits = new Map(); // socketId -> { count, lastReset }

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_EVENTS_PER_WINDOW = 120; // 120 events per minute

const initSocket = (httpServer) => {
  io = require('socket.io')(httpServer, {
    path: '/api/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    // Implement Event Rate Limiting per socket
    socket.use((packet, nextPacket) => {
      const now = Date.now();
      let limit = rateLimits.get(socket.id);

      if (!limit || now - limit.lastReset > RATE_LIMIT_WINDOW_MS) {
        limit = { count: 0, lastReset: now };
      }

      limit.count++;
      rateLimits.set(socket.id, limit);

      if (limit.count > MAX_EVENTS_PER_WINDOW) {
        console.warn(`🚀 Socket Rate Limit Exceeded for socket ${socket.id}`);
        return nextPacket(new Error('Rate limit exceeded. Please slow down.'));
      }
      nextPacket();
    });

    try {
      let token = socket.handshake.auth.token;

      // If no token in auth object, try to get it from cookies
      if (!token && socket.request.headers.cookie) {
        const cookie = require('cookie');
        const cookies = cookie.parse(socket.request.headers.cookie);
        token = cookies.access_token;
      }

      if (!token) {
        console.log('⚠️  Socket connection without token');
        // Allow connection but mark as unauthenticated
        socket.userId = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      console.log('⚠️  Socket authentication error:', error.message);
      socket.userId = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ Socket connected: ${socket.id}${userId ? ` (User: ${userId})` : ' (Unauthenticated)'}`);

    if (userId) {
      // Store user connection
      onlineUsers.set(userId, socket.id);
      userSockets.set(socket.id, userId);

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Broadcast user online status
      socket.broadcast.emit('user:online', { userId });
    }

    // Join a conversation
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`💬 User joined conversation: ${conversationId}`);
    });

    // Leave a conversation
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`👋 User left conversation: ${conversationId}`);
    });

    // Join a job room (for live tracking)
    socket.on('joinJobRoom', (jobId) => {
      socket.join(`job:${jobId}`);
      console.log(`👷 User joined job room: job:${jobId}`);
    });

    // Leave a job room
    socket.on('leaveJobRoom', (jobId) => {
      socket.leave(`job:${jobId}`);
      console.log(`👋 User left job room: job:${jobId}`);
    });

    // Send message (legacy support)
    socket.on('sendMessage', ({ conversationId, sender, text }) => {
      io.to(conversationId).emit('receiveMessage', { conversationId, sender, text });
    });

    // Notifications (legacy support)
    socket.on('sendNotification', ({ receiverId, type, message }) => {
      io.to(receiverId).emit('receiveNotification', { type, message });
    });

    // Join a user-specific room (legacy support)
    socket.on('joinUserRoom', (userRoomId) => {
      socket.join(userRoomId);
      console.log(`🔐 User ${userRoomId} joined their personal room (Socket ID: ${socket.id})`);
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId, receiverId }) => {
      if (userId) {
        // Emit to conversation room
        socket.to(conversationId).emit('typing:start', {
          conversationId,
          userId,
        });

        // Also emit to specific user room
        if (receiverId) {
          io.to(`user:${receiverId}`).emit('typing:start', {
            conversationId,
            userId,
          });
        }
      }
    });

    socket.on('typing:stop', ({ conversationId, receiverId }) => {
      if (userId) {
        socket.to(conversationId).emit('typing:stop', {
          conversationId,
          userId,
        });

        if (receiverId) {
          io.to(`user:${receiverId}`).emit('typing:stop', {
            conversationId,
            userId,
          });
        }
      }
    });

    // Legacy typing events
    socket.on('typing', ({ conversationId, userId: typingUserId }) => {
      socket.to(conversationId).emit('userTyping', { userId: typingUserId });
    });

    socket.on('stopTyping', ({ conversationId, userId: typingUserId }) => {
      socket.to(conversationId).emit('userStoppedTyping', { userId: typingUserId });
    });

    // Message status updates
    socket.on('message:read', ({ messageId, conversationId, senderId }) => {
      if (userId) {
        // Emit to sender that their message was read
        io.to(`user:${senderId}`).emit('message:read', {
          messageId,
          conversationId,
          readBy: userId,
        });

        // Also emit to conversation room
        socket.to(conversationId).emit('messageRead', { messageId });
      }
    });

    socket.on('message:delivered', ({ messageId, conversationId }) => {
      socket.to(conversationId).emit('message:delivered', { messageId });
    });

    // Legacy message status events
    socket.on('markMessageDelivered', ({ conversationId, messageId }) => {
      socket.to(conversationId).emit('messageDelivered', { messageId });
    });

    socket.on('markMessageRead', ({ conversationId, messageId }) => {
      socket.to(conversationId).emit('messageRead', { messageId });
    });

    // Notification read
    socket.on('notification:read', ({ notificationId }) => {
      console.log(`📬 Notification ${notificationId} read by ${userId}`);
    });

    // Get online status for specific users
    socket.on('users:getOnlineStatus', ({ userIds }, callback) => {
      const onlineStatus = {};
      userIds.forEach(id => {
        onlineStatus[id] = onlineUsers.has(id);
      });
      if (callback) callback(onlineStatus);
    });

    // Handle user going offline
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}${userId ? ` (User: ${userId})` : ''}`);

      if (userId) {
        onlineUsers.delete(userId);
        userSockets.delete(socket.id);
        rateLimits.delete(socket.id);

        // Broadcast user offline status
        socket.broadcast.emit('user:offline', { userId });
      }
    });
  });

  console.log('🚀 Socket.IO initialized');
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper functions
const emitToUser = (userId, event, data) => {
  if (!io) return false;
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(`user:${userId}`).emit(event, data);
    return true;
  }
  return false;
};

const emitToUsers = (userIds, event, data) => {
  if (!io) return;
  userIds.forEach(userId => {
    io.to(`user:${userId}`).emit(event, data);
  });
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

const emitNotification = (userId, notification) => {
  if (!io) return false;
  io.to(`user:${userId}`).emit('notification:new', notification);
  return true;
};

const emitMessage = (userId, message) => {
  if (!io) return false;
  io.to(`user:${userId}`).emit('message:new', message);
  return true;
};

const emitConversationUpdate = (userId, conversation) => {
  if (!io) return false;
  io.to(`user:${userId}`).emit('conversation:update', conversation);
  return true;
};

module.exports = {
  initSocket,
  getIo,
  emitToUser,
  emitToUsers,
  isUserOnline,
  getOnlineUsers,
  emitNotification,
  emitMessage,
  emitConversationUpdate,
};
