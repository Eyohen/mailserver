//index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Import database
const db = require('./models');

// Import routes
const merchantRoutes = require('./route/merchant');
const chatRoutes = require('./route/chat');
const emailRoutes = require('./route/emailTransaction');
const notificationRoutes = require('./route/notification');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Make io accessible to routes
app.set('io', io);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Customer Support API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/merchant', merchantRoutes);
app.use('/api', chatRoutes);
app.use('/api', emailRoutes);
app.use('/api', notificationRoutes);

// Socket.IO for real-time features
const connectedUsers = new Map();
const activeSupportChats = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('authenticate', (data) => {
    const { merchantId, userType } = data;
    connectedUsers.set(socket.id, { merchantId, userType });
    socket.join(`merchant-${merchantId}`);
    console.log(`${userType} ${merchantId} authenticated on socket ${socket.id}`);
  });

  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    if (!activeSupportChats.has(chatId)) {
      activeSupportChats.set(chatId, []);
    }
    activeSupportChats.get(chatId).push(socket.id);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat-${chatId}`);
    if (activeSupportChats.has(chatId)) {
      const chatSockets = activeSupportChats.get(chatId);
      const index = chatSockets.indexOf(socket.id);
      if (index > -1) {
        chatSockets.splice(index, 1);
      }
      if (chatSockets.length === 0) {
        activeSupportChats.delete(chatId);
      }
    }
    console.log(`Socket ${socket.id} left chat ${chatId}`);
  });

  socket.on('send-chat-message', (data) => {
    const { chatId, message } = data;
    io.to(`chat-${chatId}`).emit('receive-chat-message', {
      chatId,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('typing', (data) => {
    const { chatId, isTyping, userName } = data;
    socket.to(`chat-${chatId}`).emit('user-typing', {
      chatId,
      isTyping,
      userName,
    });
  });

  socket.on('send-notification', (data) => {
    const { merchantId, notification } = data;
    io.to(`merchant-${merchantId}`).emit('new-notification', notification);
  });

  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      console.log(`${userData.userType} ${userData.merchantId} disconnected`);
    }
    
    activeSupportChats.forEach((sockets, chatId) => {
      const index = sockets.indexOf(socket.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          activeSupportChats.delete(chatId);
        }
      }
    });
    
    connectedUsers.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Database sync and server start
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await db.sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await db.sequelize.close();
    console.log('Database connection closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };