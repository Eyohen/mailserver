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
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3002'],
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
const externalChatRoutes = require('./route/externalChat');
const scrabbleRoutes = require('./route/scrabble');

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
app.use('/api/external-chat', externalChatRoutes);
app.use('/api/scrabble', scrabbleRoutes);

// Serve scrabble HTML
app.use('/scrabble', express.static(require('path').join(__dirname, 'scrabble-game')));

// Socket.IO for real-time features
const connectedUsers = new Map();
const activeSupportChats = new Map();
const externalChatRooms = new Map(); // For external chat rooms

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('authenticate', (data) => {
    const { merchantId, userType, userId, userName } = data;
    connectedUsers.set(socket.id, { merchantId, userType, userId, userName });
    socket.join(`merchant-${merchantId}`);
    console.log(`${userType} ${merchantId} authenticated on socket ${socket.id}`);
  });

  // External chat room events
  socket.on('join-room', (data) => {
    const { roomId, userId, userName } = data;
    socket.join(`room-${roomId}`);

    if (!externalChatRooms.has(roomId)) {
      externalChatRooms.set(roomId, new Map());
    }
    externalChatRooms.get(roomId).set(socket.id, { userId, userName });

    console.log(`User ${userName} joined room ${roomId}`);

    // Notify others in the room
    socket.to(`room-${roomId}`).emit('user-joined-room', {
      roomId,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('leave-room', (data) => {
    const { roomId, userId, userName } = data;
    socket.leave(`room-${roomId}`);

    if (externalChatRooms.has(roomId)) {
      externalChatRooms.get(roomId).delete(socket.id);
      if (externalChatRooms.get(roomId).size === 0) {
        externalChatRooms.delete(roomId);
      }
    }

    console.log(`User ${userName} left room ${roomId}`);

    // Notify others in the room
    socket.to(`room-${roomId}`).emit('user-left-room', {
      roomId,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('send-room-message', (data) => {
    const { roomId, message } = data;
    console.log(`Message in room ${roomId}:`, message);

    // Broadcast to all users in the room including sender
    io.to(`room-${roomId}`).emit('receive-room-message', {
      roomId,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('typing-in-room', (data) => {
    const { roomId, userId, userName, isTyping } = data;
    socket.to(`room-${roomId}`).emit('user-typing-in-room', {
      roomId,
      userId,
      userName,
      isTyping,
    });
  });

  // Message updated event
  socket.on('message-updated', (data) => {
    const { roomId, messageId, content, editedAt, userId } = data;
    io.to(`room-${roomId}`).emit('message-updated', {
      roomId,
      messageId,
      content,
      editedAt,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Message deleted event
  socket.on('message-deleted', (data) => {
    const { roomId, messageId, userId } = data;
    io.to(`room-${roomId}`).emit('message-deleted', {
      roomId,
      messageId,
      deletedBy: userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Reaction added event
  socket.on('reaction-added', (data) => {
    const { roomId, messageId, userId, userName, emoji } = data;
    io.to(`room-${roomId}`).emit('reaction-added', {
      roomId,
      messageId,
      userId,
      userName,
      emoji,
      timestamp: new Date().toISOString(),
    });
  });

  // Reaction removed event
  socket.on('reaction-removed', (data) => {
    const { roomId, messageId, userId, emoji } = data;
    io.to(`room-${roomId}`).emit('reaction-removed', {
      roomId,
      messageId,
      userId,
      emoji,
      timestamp: new Date().toISOString(),
    });
  });

  // Messages read event
  socket.on('messages-read', (data) => {
    const { roomId, userId, lastReadAt } = data;
    socket.to(`room-${roomId}`).emit('messages-read', {
      roomId,
      userId,
      lastReadAt,
      timestamp: new Date().toISOString(),
    });
  });

  // Presence update event
  socket.on('presence-update', (data) => {
    const { merchantId, userId, status } = data;
    io.to(`merchant-${merchantId}`).emit('presence-updated', {
      userId,
      status,
      lastSeenAt: new Date().toISOString(),
    });
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

  // --- Scrabble Game Events ---
  const scrabbleController = require('./controller/scrabble');

  socket.on('scrabble:join', (data) => {
    const { gameCode, playerName } = data;
    socket.join(`scrabble-${gameCode}`);
    socket.scrabbleGame = gameCode;
    socket.scrabblePlayer = playerName;
    console.log(`${playerName} joined scrabble game ${gameCode}`);
    socket.to(`scrabble-${gameCode}`).emit('scrabble:player-joined', { playerName });
  });

  socket.on('scrabble:submit-word', async (data) => {
    const { gameCode, playerName, placements } = data;
    const result = await scrabbleController.submitWord(gameCode, playerName, placements);
    if (result.error) {
      socket.emit('scrabble:error', { message: result.error });
    } else {
      // Fetch updated state and send to each player
      const game = await db.ScrabbleGame.findOne({ where: { gameCode } });
      if (game) {
        // Send personalized state to each player in the room
        const sockets = await io.in(`scrabble-${gameCode}`).fetchSockets();
        for (const s of sockets) {
          const state = scrabbleController.buildPlayerState(game, s.scrabblePlayer);
          s.emit('scrabble:state-update', {
            state,
            event: 'word-submitted',
            message: `${playerName} scored ${result.totalScore} points! (${result.words})`,
          });
        }
      }
    }
  });

  socket.on('scrabble:pass-turn', async (data) => {
    const { gameCode, playerName } = data;
    const result = await scrabbleController.passTurn(gameCode, playerName);
    if (result.error) {
      socket.emit('scrabble:error', { message: result.error });
    } else {
      const game = await db.ScrabbleGame.findOne({ where: { gameCode } });
      if (game) {
        const sockets = await io.in(`scrabble-${gameCode}`).fetchSockets();
        for (const s of sockets) {
          const state = scrabbleController.buildPlayerState(game, s.scrabblePlayer);
          s.emit('scrabble:state-update', {
            state,
            event: 'turn-passed',
            message: `${playerName} passed their turn.`,
          });
        }
      }
    }
  });

  socket.on('scrabble:request-state', async (data) => {
    const { gameCode, playerName } = data;
    const game = await db.ScrabbleGame.findOne({ where: { gameCode } });
    if (game) {
      const state = scrabbleController.buildPlayerState(game, playerName);
      socket.emit('scrabble:state-update', { state, event: 'refresh' });
    }
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
const PORT = process.env.PORT || 3002;

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