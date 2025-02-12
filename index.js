// emailServer.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Secure API key middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.MAIL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verification email endpoint
app.post('/api/send-verification', validateApiKey, async (req, res) => {
  const { email, token } = req.body;
  
  try {
    const mailOptions = {
      from: `"Pigeonhire Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email address",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #fff;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #F08E1F;
        }
        .content {
            text-align: center;
            margin-bottom: 20px;
        }
        .content p {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #F08E1F;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${process.env.FRONTEND_URL}/verify?token=${token}" class="button">Verify Email</a>
        </div>
        <div class="footer">
            <p>If you did not request this email, please ignore it.</p>
        </div>
    </div>
</body>
</html>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Reset password email endpoint
app.post('/api/send-reset-password', validateApiKey, async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const mailOptions = {
      from: `"Pigeonhire Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #fff;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #F08E1F;
        }
        .content {
            text-align: center;
            margin-bottom: 20px;
        }
        .content p {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .otp {
            display: inline-block;
            padding: 10px 20px;
            background-color: #F08E1F;
            color: #fff;
            font-size: 20px;
            font-weight: bold;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset OTP</h1>
        </div>
        <div class="content">
            <p>Your OTP for password reset is:</p>
            <div class="otp">${otp}</div>
            <p>This otp will expire in 10 minutes.</p>
        </div>
        <div class="footer">
            <p>If you did not request a password reset, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Reset password email sent successfully' });
  } catch (error) {
    console.error('Error sending reset password email:', error);
    res.status(500).json({ error: 'Failed to send reset password email' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
});