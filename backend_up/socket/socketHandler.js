const jwt = require('jsonwebtoken');

// Store online users
const onlineUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

const socketHandler = (io) => {
    // Socket authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`User connected: ${userId} (${socket.id})`);

        // Store user connection
        onlineUsers.set(userId, socket.id);
        userSockets.set(socket.id, userId);

        // Join user's personal room
        socket.join(`user:${userId}`);

        // Broadcast user online status
        socket.broadcast.emit('user:online', { userId });

        // Handle typing events
        socket.on('typing:start', ({ conversationId, receiverId }) => {
            io.to(`user:${receiverId}`).emit('typing:start', {
                conversationId,
                userId,
            });
        });

        socket.on('typing:stop', ({ conversationId, receiverId }) => {
            io.to(`user:${receiverId}`).emit('typing:stop', {
                conversationId,
                userId,
            });
        });

        // Handle message read
        socket.on('message:read', async ({ messageId, conversationId, senderId }) => {
            try {
                // Emit to sender that their message was read
                io.to(`user:${senderId}`).emit('message:read', {
                    messageId,
                    conversationId,
                    readBy: userId,
                });
            } catch (error) {
                console.error('Error handling message read:', error);
            }
        });

        // Handle notification read
        socket.on('notification:read', ({ notificationId }) => {
            // Could emit to admin or other relevant users
            console.log(`Notification ${notificationId} read by ${userId}`);
        });

        // Handle user going offline
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId} (${socket.id})`);

            onlineUsers.delete(userId);
            userSockets.delete(socket.id);

            // Broadcast user offline status
            socket.broadcast.emit('user:offline', { userId });
        });

        // Get online status for specific users
        socket.on('users:getOnlineStatus', ({ userIds }, callback) => {
            const onlineStatus = {};
            userIds.forEach(id => {
                onlineStatus[id] = onlineUsers.has(id);
            });
            callback(onlineStatus);
        });
    });

    return {
        // Helper function to emit to specific user
        emitToUser: (userId, event, data) => {
            const socketId = onlineUsers.get(userId);
            if (socketId) {
                io.to(`user:${userId}`).emit(event, data);
                return true;
            }
            return false;
        },

        // Helper function to emit to multiple users
        emitToUsers: (userIds, event, data) => {
            userIds.forEach(userId => {
                io.to(`user:${userId}`).emit(event, data);
            });
        },

        // Check if user is online
        isUserOnline: (userId) => {
            return onlineUsers.has(userId);
        },

        // Get all online users
        getOnlineUsers: () => {
            return Array.from(onlineUsers.keys());
        },

        // Emit notification to user
        emitNotification: (userId, notification) => {
            io.to(`user:${userId}`).emit('notification:new', notification);
        },

        // Emit message to user
        emitMessage: (userId, message) => {
            io.to(`user:${userId}`).emit('message:new', message);
        },

        // Emit conversation update
        emitConversationUpdate: (userId, conversation) => {
            io.to(`user:${userId}`).emit('conversation:update', conversation);
        },
    };
};

module.exports = socketHandler;
