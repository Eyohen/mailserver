// email-server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());

// API key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'API key is required' 
    });
  }
  
  // Check if the API key is valid
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid API key' 
    });
  }
  
  next();
};

// Create a transporter object using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  // port: Number(process.env.SMTP_PORT ) || 587,
  port: 465,
  //secure: process.env.SMTP_SECURE === '465', // true for 465, false for other ports
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS

  },
  debug:true

});

// Use .then/.catch instead of await
transporter.verify()
  .then(verification => {
    console.log('Server is ready to take messages:', verification);
  })
  .catch(error => {
    console.error('Connection failed:', error);
  });

// Basic health check endpoint - public access
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'PaperSignal email API service is running' });
});

// Generate API key endpoint - only accessible in development
if (process.env.NODE_ENV === 'development') {
  app.get('/api/generate-key', (req, res) => {
    const newApiKey = crypto.randomBytes(32).toString('hex');
    console.log('Generated new API key (for development only):', newApiKey);
    res.status(200).json({ 
      success: true, 
      message: 'New API key generated (for development only)',
      apiKey: newApiKey
    });
  });
}

// Send email endpoint - protected
app.post('/api/send-email', authenticateApiKey, async (req, res) => {
  try {
    const { to, subject, text, html, from, cc, bcc } = req.body;
    
    // Basic validation
    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }
    
    if (!subject || !text) {
      return res.status(400).json({ success: false, message: 'Subject and text content are required' });
    }
    
    // Prepare email options
    const mailOptions = {
      from: from,
      to,
      subject,
      text,
      html: html || text // Use HTML if provided, otherwise use plain text
    };
    
    // Add CC and BCC if provided
    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.log('Error sending email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Bulk send email endpoint - protected
app.post('/api/bulk-send-email', authenticateApiKey, async (req, res) => {
  try {
    const { recipients, subject, text, html, from } = req.body;
    
    // Basic validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'Recipients list is required and must be an array' });
    }
    
    if (!subject || !text) {
      return res.status(400).json({ success: false, message: 'Subject and text content are required' });
    }
    
    const results = [];
    
    // Send emails to each recipient
    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: from || process.env.DEFAULT_FROM_EMAIL,
          to: recipient,
          subject,
          text,
          html: html || text
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        results.push({
          email: recipient,
          success: true,
          messageId: info.messageId
        });
        
        console.log(`Email sent to ${recipient}:`, info.messageId);
        
      } catch (error) {
        results.push({
          email: recipient,
          success: false,
          error: error.message
        });
        
        console.log(`Error sending email to ${recipient}:`, error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Bulk email processing completed',
      results
    });
    
  } catch (error) {
    console.log('Error processing bulk emails:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk emails',
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`PaperSignal API server running on port ${PORT}`);
});

