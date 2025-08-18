const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../models');
const {Merchant} = db;
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');


  const register = async (req, res) => {
    try {
      const { firstName, lastName, businessName, country, email, password } = req.body;
  
      // Check if user with the given email already exists
      const existingUser = await Merchant.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ msg: 'Merchant with this email already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Generate a unique API key for the merchant
      const apiKey = crypto.randomBytes(16).toString('hex') + '-' + uuidv4();

      const verificationToken = crypto.randomBytes(32).toString('hex');
  
      // Create the user record with hashed password
      const record = await Merchant.create({ 
        ...req.body,
        email,
        password: hashedPassword,
        apiKey,
        verificationToken,
        verified: false
      });
  

      // send verification email
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const emailSent = await sendVerificationEmail(record, verificationToken, frontendUrl);

      if(!emailSent){
        console.log("Failed to send verification email to", record.email);
        // still proceed with registration but note the email failure
      }

      // Send back the merchant info but exclude the password
      const { password: pwd, verificationToken:token, ...merchantWithoutPassword } = record.toJSON();
  
      // Return the merchant without the password
      return res.status(201).json({ 
        merchant: merchantWithoutPassword, 
        msg: "Merchant successfully created. Please check your email to verify your account." 
      });
    } catch (error) {
      console.log("Error during registration:", error);
      return res.status(500).json({ msg: "Failed to register merchant", error });
    }
  };

  
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ msg: 'Verification token is required' });
    }
    
    // Find the merchant with this verification token
    const merchant = await Merchant.findOne({ where: { verificationToken: token } });
    
    if (!merchant) {
      return res.status(404).json({ msg: 'Invalid verification token' });
    }
    
    // Update merchant as verified and clear the verification token
    await merchant.update({
      verified: true,
      verificationToken: null
    });
    
    // Send welcome email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendWelcomeEmail(merchant, frontendUrl);
    
    // Redirect to the frontend login page with a success message
    const frontend_Url = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontend_Url}/login?verified=true`);
  } catch (error) {
    console.log("Error verifying email:", error);
    return res.status(500).json({ msg: "Failed to verify email", error });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    
    // Find the merchant with this email
    const merchant = await Merchant.findOne({ where: { email } });
    
    if (!merchant) {
      return res.status(404).json({ msg: 'Merchant not found' });
    }
    
    if (merchant.verified) {
      return res.status(400).json({ msg: 'Email is already verified' });
    }
    
    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Update merchant with new verification token
    await merchant.update({ verificationToken });
    
    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendVerificationEmail(merchant, verificationToken, frontendUrl);
    
    return res.status(200).json({ msg: 'Verification email resent successfully' });
  } catch (error) {
    console.log("Error resending verification email:", error);
    return res.status(500).json({ msg: "Failed to resend verification email", error });
  }
};
  

  const login = async (req, res) => {
    try {
      const {firstName, lastName, businessName, country, email, password, verified} = req.body;

      // Check if user with the given email exists
      const user = await Merchant.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ msg: 'Merchant not found' });
      }

      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ msg: 'Invalid credentials' });
      }

      if (!user.verified) {
        return res.status(401).json({ 
          msg: 'Email not verified. Please check your email for the verification link.',
          verified: false
        });
      }

      const userPayload = {
        id: user.id,
        email: user.email,
        fname: user.firstName,
        lname: user.lastName,
        bName: user.businessName,
        country: user.country
      };

      // Generate JWT token with user object
      const accessToken = jwt.sign(
        { user: userPayload },
      
       process.env.JWT_SECRET, // Use a secure secret key, preferably from environment variables
        { expiresIn: '14d' } // Token expiration time
      );

      // Generate Refresh Token
      const refreshToken = jwt.sign(
        { user: userPayload },
       
       process.env.JWT_REFRESH_SECRET, // Use a secure refresh secret key
        { expiresIn: '14d' } // Refresh token expiration time
      );

      return res.status(200).json({ accessToken, refreshToken, user: userPayload });
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ msg: 'Failed to log in', error });
    }
  }

  const adminLogin = async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if user with the given email exists
      const user = await Merchant.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check if user's role is admin
      if (user.role !== 'admin') {
        return res.status(401).json({ msg: 'Unauthorized access: Only admins are allowed' });
      }

      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ msg: 'Invalid credentials' });
      }

      const userPayload = {
        id: user.id,
        email: user.email,
        fname: user.firstName,
        lname: user.lastName,
        bName: user.businessName,
        country: user.country
      };

      // Generate JWT token with user object
      const accessToken = jwt.sign(
        {user: userPayload},
        // { userId: user.id, email: user.email },
        process.env.JWT_SECRET, // Use a secure secret key, preferably from environment variables
        { expiresIn: '14d' } // Token expiration time
      );

      // Generate Refresh Token
      const refreshToken = jwt.sign(
        { user: userPayload },
     
       process.env.JWT_REFRESH_SECRET, // Use a secure refresh secret key
        { expiresIn: '14d' } // Refresh token expiration time
      );


      return res.status(200).json({ accessToken, refreshToken, user: userPayload });
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ msg: 'Failed to log in', error });
    }
  }

  const refresh = async (req, res) => {
    const token = req.headers?.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: "Unauthorized - Missing token" });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.status(200).json({ ...decoded, access_token: token });
    } catch (err) {
      res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
  }

  const verifyApiKey = async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({ 
          success: false, 
          message: 'API key is required' 
        });
      }
      
      // Find the merchant with this API key
      const merchant = await Merchant.findOne({ where: { apiKey } });
      
      if (!merchant) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid API key' 
        });
      }
      
      // Attach the merchant to the request object for later use
      req.merchant = merchant;
      
      next();
    } catch (error) {
      console.error('API key verification error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'API key verification failed' 
      });
    }
  };

  const regenerateApiKey = async (req, res) => {
    try {
      const merchantId = req.user.id; // Assuming you have middleware to get the authenticated user
      
      // Generate a new API key
      const newApiKey = crypto.randomBytes(16).toString('hex') + '-' + uuidv4();
      
      // Update the merchant's API key
      await Merchant.update(
        { apiKey: newApiKey },
        { where: { id: merchantId } }
      );
      
      return res.status(200).json({ 
        apiKey: newApiKey,
        msg: "API key successfully regenerated" 
      });
    } catch (error) {
      console.log("Error regenerating API key:", error);
      return res.status(500).json({ msg: "Failed to regenerate API key", error });
    }
  };


  // Add function to get merchant profile
const getProfile = async (req, res) => {
  try {
    // req.merchant comes from middleware
    const { password, ...merchantWithoutPassword } = req.merchant.toJSON();
    
    return res.status(200).json({
      merchant: merchantWithoutPassword
    });
  } catch (error) {
    console.log("Error getting profile:", error);
    return res.status(500).json({ msg: "Failed to get profile", error });
  }
};

  module.exports = {register, verifyEmail, resendVerificationEmail, login, adminLogin, refresh, verifyApiKey, regenerateApiKey, getProfile};