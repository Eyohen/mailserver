// middleware/authMerchant.js
const db = require('../models');
const { Merchant } = db;
const jwt = require('jsonwebtoken');

// Middleware to verify API key
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

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token is required' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.user || !decoded.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    // Find merchant by ID from token
    const merchant = await Merchant.findByPk(decoded.user.id);
    
    if (!merchant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Merchant not found' 
      });
    }
    
    // Attach merchant to request
    req.merchant = merchant;
    req.user = decoded.user;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Token verification failed' 
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.merchant || req.merchant.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Requires admin privileges' 
    });
  }
  
  next();
};

module.exports = { 
  verifyApiKey,
  verifyToken,
  isAdmin
};