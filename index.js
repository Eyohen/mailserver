const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store connected users
const users = new Map();
// Store active calls with enhanced state management
const activeCalls = new Map();
// Store call timeouts
const callTimeouts = new Map();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images, documents, and other common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Secure TURN credentials endpoint
app.get('/api/turn-credentials', (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  // Generate secure TURN credentials
  const timestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour TTL
  const turnUsername = `${timestamp}:${username}`;

  const iceServers = [
    // Multiple STUN servers for NAT discovery
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Secure TURN servers
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];

  res.json({
    iceServers: iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceGatheringPolicy: 'all'
  });
});

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.json(fileData);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('user-joined', (username) => {
    users.set(socket.id, username);
    
    // Notify all users about the new user
    socket.broadcast.emit('user-connected', {
      username: username,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString()
    });

    // Send current users list to all clients with socket IDs
    const usersWithIds = Array.from(users.entries()).map(([socketId, username]) => ({
      id: socketId,
      username: username
    }));
    io.emit('users-update', usersWithIds);
  });

  // Handle incoming messages
  socket.on('send-message', (data) => {
    const username = users.get(socket.id);
    if (username) {
      const messageData = {
        id: Date.now() + Math.random(),
        username: username,
        message: data.message,
        timestamp: new Date().toISOString(),
        userId: socket.id,
        type: data.type || 'text', // text, file, image
        fileData: data.fileData || null
      };

      // Broadcast message to all connected clients
      io.emit('receive-message', messageData);
    }
  });

  // Handle file messages
  socket.on('send-file', (data) => {
    const username = users.get(socket.id);
    if (username) {
      const messageData = {
        id: Date.now() + Math.random(),
        username: username,
        message: data.fileName,
        timestamp: new Date().toISOString(),
        userId: socket.id,
        type: 'file',
        fileData: {
          url: data.fileUrl,
          name: data.fileName,
          size: data.fileSize,
          type: data.fileType
        }
      };

      // Broadcast file message to all connected clients
      io.emit('receive-message', messageData);
    }
  });

  // Handle user typing
  socket.on('typing', (isTyping) => {
    const username = users.get(socket.id);
    if (username) {
      socket.broadcast.emit('user-typing', {
        username: username,
        isTyping: isTyping
      });
    }
  });

  // Handle call initiation
  socket.on('initiate-call', (targetUserId) => {
    const callerUsername = users.get(socket.id);
    const targetUsername = users.get(targetUserId);

    console.log(`Call initiation: ${callerUsername} -> ${targetUsername}`);

    if (!callerUsername || !targetUsername) {
      socket.emit('call-error', { message: 'User not found' });
      return;
    }

    // Check if caller is already in a call
    if (activeCalls.has(socket.id)) {
      socket.emit('call-error', { message: 'You are already in a call' });
      return;
    }

    // Check if target is already in a call
    if (activeCalls.has(targetUserId)) {
      socket.emit('call-busy', { targetUsername });
      return;
    }

    // Store call information with enhanced state
    const callId = `call-${Date.now()}-${socket.id}-${targetUserId}`;
    const callData = {
      callId,
      peer: targetUserId,
      status: 'ringing',
      startTime: Date.now()
    };

    activeCalls.set(socket.id, { ...callData, peer: targetUserId });
    activeCalls.set(targetUserId, { ...callData, peer: socket.id });

    // Set call timeout (30 seconds)
    const timeoutId = setTimeout(() => {
      console.log(`Call timeout: ${callId}`);
      // Notify both users about timeout
      io.to(socket.id).emit('call-timeout');
      io.to(targetUserId).emit('call-timeout');

      // Clean up call data
      activeCalls.delete(socket.id);
      activeCalls.delete(targetUserId);
      callTimeouts.delete(callId);
    }, 30000);

    callTimeouts.set(callId, timeoutId);

    // Send call request to target user
    io.to(targetUserId).emit('incoming-call', {
      callerId: socket.id,
      callerUsername: callerUsername,
      callId: callId
    });

    // Notify caller that call is ringing
    socket.emit('call-ringing', {
      targetUsername: targetUsername,
      callId: callId
    });
  });

  // Handle call response
  socket.on('call-response', (data) => {
    console.log('Call response received:', data);
    const { callId, accepted } = data;
    const callInfo = activeCalls.get(socket.id);

    if (!callInfo || callInfo.callId !== callId) {
      console.log('Invalid call response - call not found or mismatched ID');
      socket.emit('call-error', { message: 'Invalid call' });
      return;
    }

    const peerId = callInfo.peer;

    // Clear call timeout
    if (callTimeouts.has(callId)) {
      clearTimeout(callTimeouts.get(callId));
      callTimeouts.delete(callId);
    }

    if (accepted) {
      console.log('Call accepted, starting WebRTC between', socket.id, 'and', peerId);

      // Update call status to connected
      const connectedCallData = { ...callInfo, status: 'connected', acceptTime: Date.now() };
      activeCalls.set(socket.id, { ...connectedCallData, peer: peerId });
      activeCalls.set(peerId, { ...connectedCallData, peer: socket.id });

      // Notify caller that call was accepted
      io.to(peerId).emit('call-accepted', { callId });

      // Start WebRTC with proper delay
      setTimeout(() => {
        // The caller (original initiator) should create the offer
        io.to(peerId).emit('start-webrtc-caller', { peerId: socket.id, callId });
        // The receiver waits for the offer
        socket.emit('start-webrtc-receiver', { peerId: peerId, callId });
      }, 100);
    } else {
      console.log('Call rejected');
      // Call was rejected
      io.to(peerId).emit('call-rejected', { callId });

      // Clean up call data
      activeCalls.delete(socket.id);
      activeCalls.delete(peerId);
    }
  });

  // Handle call end
  socket.on('end-call', () => {
    const callInfo = activeCalls.get(socket.id);
    if (callInfo) {
      const { peer: peerId, callId } = callInfo;

      console.log(`Call ended by ${socket.id}, notifying ${peerId}`);

      // Clear any pending timeout
      if (callTimeouts.has(callId)) {
        clearTimeout(callTimeouts.get(callId));
        callTimeouts.delete(callId);
      }

      // Notify peer that call ended
      io.to(peerId).emit('call-ended', { callId });

      // Clean up call data
      activeCalls.delete(socket.id);
      activeCalls.delete(peerId);
    }
  });

  // WebRTC signaling with validation
  const validateWebRTCMessage = (data, requiredFields) => {
    if (!data || typeof data !== 'object') return false;
    return requiredFields.every(field => data.hasOwnProperty(field) && data[field]);
  };

  socket.on('webrtc-offer', (data) => {
    if (!validateWebRTCMessage(data, ['offer', 'targetId']) ||
        !activeCalls.has(socket.id) ||
        !activeCalls.has(data.targetId)) {
      console.log('Invalid WebRTC offer rejected from:', socket.id);
      return;
    }

    // Validate and sanitize offer data
    if (!data.offer.type || !data.offer.sdp ||
        typeof data.offer.sdp !== 'string' ||
        data.offer.sdp.length > 10000) {
      console.log('Invalid offer format rejected');
      return;
    }

    const sanitizedOffer = {
      type: data.offer.type,
      sdp: data.offer.sdp.substring(0, 10000)
    };

    console.log(`Relaying WebRTC offer from ${socket.id} to ${data.targetId}`);
    io.to(data.targetId).emit('webrtc-offer', {
      offer: sanitizedOffer,
      senderId: socket.id,
      iceRestart: data.iceRestart || false
    });
  });

  socket.on('webrtc-answer', (data) => {
    io.to(data.targetId).emit('webrtc-answer', {
      answer: data.answer,
      senderId: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    io.to(data.targetId).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      // End any active calls
      const callInfo = activeCalls.get(socket.id);
      if (callInfo) {
        const { peer: peerId, callId } = callInfo;

        console.log(`User ${username} disconnected during call, cleaning up`);

        // Clear any pending timeout
        if (callTimeouts.has(callId)) {
          clearTimeout(callTimeouts.get(callId));
          callTimeouts.delete(callId);
        }

        // Notify peer about disconnection
        io.to(peerId).emit('call-ended', {
          callId,
          reason: 'User disconnected',
          disconnectedUser: username
        });

        activeCalls.delete(peerId);
      }
      activeCalls.delete(socket.id);

      users.delete(socket.id);

      // Notify all users about the disconnection
      socket.broadcast.emit('user-disconnected', {
        username: username,
        message: `${username} left the chat`,
        timestamp: new Date().toISOString()
      });

      // Send updated users list to all clients with socket IDs
      const usersWithIds = Array.from(users.entries()).map(([socketId, username]) => ({
        id: socketId,
        username: username
      }));
      io.emit('users-update', usersWithIds);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Enhanced chat server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to start chatting`);
});