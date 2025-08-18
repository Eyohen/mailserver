// // email-server.js
// const express = require('express');
// const db = require ('./models');
// const nodemailer = require('nodemailer');
// const bodyParser = require('body-parser');
// const crypto = require('crypto');
// const morgan = require('morgan');
// const helmet = require('helmet');
// const cors = require('cors');
// const merchant =  require('./route/merchant');
// const receipt =  require('./route/receipt');

// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3001;


// // Middleware
// app.use(bodyParser.json());
// app.use(morgan('dev'))
// app.use(helmet());
// app.use(express.json());
// app.use(cors({
//   //origin: ['http://localhost:5173', 'https://solarpaddy-five.vercel.app'],
//   origin: '*',  // Allow all origins
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-reset-token'],
//   credentials: false  // Set to false when using origin: '*'
// }));
// app.use(express.urlencoded({ extended: true }));




// // routes
// app.use("/api/merchants", merchant)
// app.use("/api/receipt", receipt)







// // API key authentication middleware
// const authenticateApiKey = (req, res, next) => {
//   const apiKey = req.headers['x-api-key'];
  
//   if (!apiKey) {
//     return res.status(401).json({ 
//       success: false, 
//       message: 'API key is required' 
//     });
//   }
  
//   // Check if the API key is valid
//   if (apiKey !== process.env.API_KEY) {
//     return res.status(403).json({ 
//       success: false, 
//       message: 'Invalid API key' 
//     });
//   }
  
//   next();
// };

// // Create a transporter object using SMTP
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   // port: Number(process.env.SMTP_PORT ) || 587,
//   port: 465,
//   //secure: process.env.SMTP_SECURE === '465', // true for 465, false for other ports
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS

//   },
//   debug:true

// });

// // Use .then/.catch instead of await
// transporter.verify()
//   .then(verification => {
//     console.log('Server is ready to take messages:', verification);
//   })
//   .catch(error => {
//     console.error('Connection failed:', error);
//   });

// // Basic health check endpoint - public access
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ status: 'OK', message: 'PaperSignal email API service is running' });
// });

// // Generate API key endpoint - only accessible in development
// if (process.env.NODE_ENV === 'development') {
//   app.get('/api/generate-key', (req, res) => {
//     const newApiKey = crypto.randomBytes(32).toString('hex');
//     console.log('Generated new API key (for development only):', newApiKey);
//     res.status(200).json({ 
//       success: true, 
//       message: 'New API key generated (for development only)',
//       apiKey: newApiKey
//     });
//   });
// }

// // Send email endpoint - protected
// app.post('/api/send-email', authenticateApiKey, async (req, res) => {
//   try {
//     const { to, subject, text, html, from, cc, bcc } = req.body;
    
//     // Basic validation
//     if (!to) {
//       return res.status(400).json({ success: false, message: 'Recipient email is required' });
//     }
    
//     if (!subject || !text) {
//       return res.status(400).json({ success: false, message: 'Subject and text content are required' });
//     }
    
//     // Prepare email options
//     const mailOptions = {
//       from: from,
//       to,
//       subject,
//       text,
//       html: html || text // Use HTML if provided, otherwise use plain text
//     };
    
//     // Add CC and BCC if provided
//     if (cc) mailOptions.cc = cc;
//     if (bcc) mailOptions.bcc = bcc;
    
//     // Send email
//     const info = await transporter.sendMail(mailOptions);
    
//     console.log('Email sent successfully:', info.messageId);
    
//     res.status(200).json({
//       success: true,
//       message: 'Email sent successfully',
//       messageId: info.messageId
//     });
    
//   } catch (error) {
//     console.log('Error sending email:', error);
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send email',
//       error: error.message
//     });
//   }
// });

// // Bulk send email endpoint - protected
// app.post('/api/bulk-send-email', authenticateApiKey, async (req, res) => {
//   try {
//     const { recipients, subject, text, html, from } = req.body;
    
//     // Basic validation
//     if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
//       return res.status(400).json({ success: false, message: 'Recipients list is required and must be an array' });
//     }
    
//     if (!subject || !text) {
//       return res.status(400).json({ success: false, message: 'Subject and text content are required' });
//     }
    
//     const results = [];
    
//     // Send emails to each recipient
//     for (const recipient of recipients) {
//       try {
//         const mailOptions = {
//           from: from || process.env.DEFAULT_FROM_EMAIL,
//           to: recipient,
//           subject,
//           text,
//           html: html || text
//         };
        
//         const info = await transporter.sendMail(mailOptions);
        
//         results.push({
//           email: recipient,
//           success: true,
//           messageId: info.messageId
//         });
        
//         console.log(`Email sent to ${recipient}:`, info.messageId);
        
//       } catch (error) {
//         results.push({
//           email: recipient,
//           success: false,
//           error: error.message
//         });
        
//         console.log(`Error sending email to ${recipient}:`, error);
//       }
//     }
    
//     res.status(200).json({
//       success: true,
//       message: 'Bulk email processing completed',
//       results
//     });
    
//   } catch (error) {
//     console.log('Error processing bulk emails:', error);
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process bulk emails',
//       error: error.message
//     });
//   }
// });


// db.sequelize
//     .authenticate()
//     .then(() => {
//         console.log(`postgres connection has been established successfully... ${process.env.NODE_ENV}`)
//     })
//     .catch((err) => {
//         console.log(`unable to connect to the databse ${err.message}`)
//         if(
//             err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefuseError'
//         ){
//             console.log('the databse is disconnected please check the connection and try again')
//         }
//         else{
//             console.log(`An error occured while connecting to the database: ${err.message}`)
//         }
//     })
    

// app.use((req, res, next)=>{
//     console.log(`incoming request... ${req.method} ${req.path}`)
//     next()
// })


// if (process.env.NODE_ENV === 'development') {
//   // PORT = process.env.TEST_PORT;
//   drop = { force: true };
// }

// db.sequelize.sync({alter:true}).then(() => {
//   console.log('All models were synchronized successfully')
//   app.listen(port, () => {
//       console.log(`PaperSignal API server running on port ${port}`)
//   })
// })









const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store connected users
const users = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

    // Send current users list to all clients
    io.emit('users-update', Array.from(users.values()));
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
        userId: socket.id
      };

      // Broadcast message to all connected clients
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

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      
      // Notify all users about the disconnection
      socket.broadcast.emit('user-disconnected', {
        username: username,
        message: `${username} left the chat`,
        timestamp: new Date().toISOString()
      });

      // Send updated users list to all clients
      io.emit('users-update', Array.from(users.values()));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to start chatting`);
});