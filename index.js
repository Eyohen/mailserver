// //index.js
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const path = require('path');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// // Store connected users
// const users = new Map();

// // Serve static files
// app.use(express.static(path.join(__dirname, 'public')));

// // Routes
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Socket.IO connection handling
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // Handle user joining
//   socket.on('user-joined', (username) => {
//     users.set(socket.id, username);
    
//     // Notify all users about the new user
//     socket.broadcast.emit('user-connected', {
//       username: username,
//       message: `${username} joined the chat`,
//       timestamp: new Date().toISOString()
//     });

//     // Send current users list to all clients
//     io.emit('users-update', Array.from(users.values()));
//   });

//   // Handle incoming messages
//   socket.on('send-message', (data) => {
//     const username = users.get(socket.id);
//     if (username) {
//       const messageData = {
//         id: Date.now() + Math.random(),
//         username: username,
//         message: data.message,
//         timestamp: new Date().toISOString(),
//         userId: socket.id
//       };

//       // Broadcast message to all connected clients
//       io.emit('receive-message', messageData);
//     }
//   });

//   // Handle user typing
//   socket.on('typing', (isTyping) => {
//     const username = users.get(socket.id);
//     if (username) {
//       socket.broadcast.emit('user-typing', {
//         username: username,
//         isTyping: isTyping
//       });
//     }
//   });

//   // Handle disconnection
//   socket.on('disconnect', () => {
//     const username = users.get(socket.id);
//     if (username) {
//       users.delete(socket.id);
      
//       // Notify all users about the disconnection
//       socket.broadcast.emit('user-disconnected', {
//         username: username,
//         message: `${username} left the chat`,
//         timestamp: new Date().toISOString()
//       });

//       // Send updated users list to all clients
//       io.emit('users-update', Array.from(users.values()));
//     }
//     console.log('User disconnected:', socket.id);
//   });
// });

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`Chat server running on port ${PORT}`);
//   console.log(`Open http://localhost:${PORT} to start chatting`);
// });











// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const path = require('path');
// const multer = require('multer');
// const fs = require('fs');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// // Store connected users
// const users = new Map();
// // Store active calls
// const activeCalls = new Map();

// // Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, 'public', 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsDir);
//   },
//   filename: function (req, file, cb) {
//     // Generate unique filename
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   },
//   fileFilter: function (req, file, cb) {
//     // Allow images, documents, and other common file types
//     const allowedMimes = [
//       'image/jpeg', 'image/png', 'image/gif', 'image/webp',
//       'application/pdf', 'text/plain', 'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     ];
    
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('File type not allowed'), false);
//     }
//   }
// });

// // Middleware
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.json());

// // Routes
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // File upload endpoint
// app.post('/upload', upload.single('file'), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const fileData = {
//       filename: req.file.filename,
//       originalName: req.file.originalname,
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//       url: `/uploads/${req.file.filename}`
//     };

//     res.json(fileData);
//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({ error: 'Upload failed' });
//   }
// });

// // Socket.IO connection handling
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // Handle user joining
//   socket.on('user-joined', (username) => {
//     users.set(socket.id, username);
    
//     // Notify all users about the new user
//     socket.broadcast.emit('user-connected', {
//       username: username,
//       message: `${username} joined the chat`,
//       timestamp: new Date().toISOString()
//     });

//     // Send current users list to all clients
//     io.emit('users-update', Array.from(users.values()));
//   });

//   // Handle incoming messages
//   socket.on('send-message', (data) => {
//     const username = users.get(socket.id);
//     if (username) {
//       const messageData = {
//         id: Date.now() + Math.random(),
//         username: username,
//         message: data.message,
//         timestamp: new Date().toISOString(),
//         userId: socket.id,
//         type: data.type || 'text', // text, file, image
//         fileData: data.fileData || null
//       };

//       // Broadcast message to all connected clients
//       io.emit('receive-message', messageData);
//     }
//   });

//   // Handle file messages
//   socket.on('send-file', (data) => {
//     const username = users.get(socket.id);
//     if (username) {
//       const messageData = {
//         id: Date.now() + Math.random(),
//         username: username,
//         message: data.fileName,
//         timestamp: new Date().toISOString(),
//         userId: socket.id,
//         type: 'file',
//         fileData: {
//           url: data.fileUrl,
//           name: data.fileName,
//           size: data.fileSize,
//           type: data.fileType
//         }
//       };

//       // Broadcast file message to all connected clients
//       io.emit('receive-message', messageData);
//     }
//   });

//   // Handle user typing
//   socket.on('typing', (isTyping) => {
//     const username = users.get(socket.id);
//     if (username) {
//       socket.broadcast.emit('user-typing', {
//         username: username,
//         isTyping: isTyping
//       });
//     }
//   });

//   // Handle call initiation
//   socket.on('initiate-call', (targetUserId) => {
//     const callerUsername = users.get(socket.id);
//     const targetUsername = users.get(targetUserId);
    
//     if (callerUsername && targetUsername) {
//       // Check if target is already in a call
//       if (activeCalls.has(targetUserId)) {
//         socket.emit('call-busy');
//         return;
//       }

//       // Store call information
//       const callId = `call-${socket.id}-${targetUserId}`;
//       activeCalls.set(socket.id, { callId, peer: targetUserId });
//       activeCalls.set(targetUserId, { callId, peer: socket.id });

//       // Send call request to target user
//       io.to(targetUserId).emit('incoming-call', {
//         callerId: socket.id,
//         callerUsername: callerUsername,
//         callId: callId
//       });
//     }
//   });

//   // Handle call response
//   socket.on('call-response', (data) => {
//     const { callId, accepted } = data;
//     const callInfo = activeCalls.get(socket.id);
    
//     if (callInfo) {
//       const peerId = callInfo.peer;
      
//       if (accepted) {
//         // Notify caller that call was accepted
//         io.to(peerId).emit('call-accepted', { callId });
//         // Start WebRTC signaling
//         io.to(peerId).emit('start-call', { peerId: socket.id });
//         socket.emit('start-call', { peerId: peerId });
//       } else {
//         // Call was rejected
//         io.to(peerId).emit('call-rejected');
//         activeCalls.delete(socket.id);
//         activeCalls.delete(peerId);
//       }
//     }
//   });

//   // Handle call end
//   socket.on('end-call', () => {
//     const callInfo = activeCalls.get(socket.id);
//     if (callInfo) {
//       const peerId = callInfo.peer;
//       io.to(peerId).emit('call-ended');
//       activeCalls.delete(socket.id);
//       activeCalls.delete(peerId);
//     }
//   });

//   // WebRTC signaling
//   socket.on('webrtc-offer', (data) => {
//     io.to(data.targetId).emit('webrtc-offer', {
//       offer: data.offer,
//       senderId: socket.id
//     });
//   });

//   socket.on('webrtc-answer', (data) => {
//     io.to(data.targetId).emit('webrtc-answer', {
//       answer: data.answer,
//       senderId: socket.id
//     });
//   });

//   socket.on('webrtc-ice-candidate', (data) => {
//     io.to(data.targetId).emit('webrtc-ice-candidate', {
//       candidate: data.candidate,
//       senderId: socket.id
//     });
//   });

//   // Handle disconnection
//   socket.on('disconnect', () => {
//     const username = users.get(socket.id);
//     if (username) {
//       // End any active calls
//       const callInfo = activeCalls.get(socket.id);
//       if (callInfo) {
//         const peerId = callInfo.peer;
//         io.to(peerId).emit('call-ended');
//         activeCalls.delete(peerId);
//       }
//       activeCalls.delete(socket.id);

//       users.delete(socket.id);
      
//       // Notify all users about the disconnection
//       socket.broadcast.emit('user-disconnected', {
//         username: username,
//         message: `${username} left the chat`,
//         timestamp: new Date().toISOString()
//       });

//       // Send updated users list to all clients
//       io.emit('users-update', Array.from(users.values()));
//     }
//     console.log('User disconnected:', socket.id);
//   });
// });

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`Enhanced chat server running on port ${PORT}`);
//   console.log(`Open http://localhost:${PORT} to start chatting`);
// });





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
// Store active calls
const activeCalls = new Map();

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
    
    if (callerUsername && targetUsername) {
      // Check if target is already in a call
      if (activeCalls.has(targetUserId)) {
        socket.emit('call-busy');
        return;
      }

      // Store call information
      const callId = `call-${socket.id}-${targetUserId}`;
      activeCalls.set(socket.id, { callId, peer: targetUserId });
      activeCalls.set(targetUserId, { callId, peer: socket.id });

      // Send call request to target user
      io.to(targetUserId).emit('incoming-call', {
        callerId: socket.id,
        callerUsername: callerUsername,
        callId: callId
      });
    }
  });

  // Handle call response
  socket.on('call-response', (data) => {
    console.log('Call response received:', data);
    const { callId, accepted } = data;
    const callInfo = activeCalls.get(socket.id);
    
    if (callInfo) {
      const peerId = callInfo.peer;
      
      if (accepted) {
        console.log('Call accepted, starting WebRTC between', socket.id, 'and', peerId);
        // Notify caller that call was accepted
        io.to(peerId).emit('call-accepted', { callId });
        
        // Small delay to ensure both clients are ready
        setTimeout(() => {
          // Start WebRTC signaling - caller initiates
          io.to(peerId).emit('start-call', { peerId: socket.id });
          // Receiver waits for offer
          socket.emit('start-call', { peerId: peerId });
        }, 500);
      } else {
        console.log('Call rejected');
        // Call was rejected
        io.to(peerId).emit('call-rejected');
        activeCalls.delete(socket.id);
        activeCalls.delete(peerId);
      }
    } else {
      console.log('No call info found for socket:', socket.id);
    }
  });

  // Handle call end
  socket.on('end-call', () => {
    const callInfo = activeCalls.get(socket.id);
    if (callInfo) {
      const peerId = callInfo.peer;
      io.to(peerId).emit('call-ended');
      activeCalls.delete(socket.id);
      activeCalls.delete(peerId);
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    io.to(data.targetId).emit('webrtc-offer', {
      offer: data.offer,
      senderId: socket.id
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
        const peerId = callInfo.peer;
        io.to(peerId).emit('call-ended');
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