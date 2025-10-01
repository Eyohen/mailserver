// route/merchant.js
// const express = require('express');
// const router = express.Router();
// const merchantController = require('../controller/merchant');
// const { verifyApiKey, verifyToken, isAdmin } = require('../middleware/authMerchant');

// // Public routes
// router.post('/register', merchantController.register);
// router.post('/login', merchantController.login);
// router.post('/admin/login', merchantController.adminLogin);
// router.post('/refresh', merchantController.refresh);

// // Email verification routes
// router.get('/verify-email', merchantController.verifyEmail);
// router.post('/resend-verification', merchantController.resendVerificationEmail);



// // Protected routes with API Key
// router.get('/api-key-profile', verifyApiKey, merchantController.getProfile);

// // Protected routes with JWT token
// router.get('/profile', verifyToken, merchantController.getProfile);
// router.post('/regenerate-key', verifyToken, merchantController.regenerateApiKey);

// // Admin routes
// router.get('/admin-only', verifyToken, isAdmin, (req, res) => {
//   res.status(200).json({ message: 'Admin access granted' });
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const merchantController = require('../controller/merchant');
const { verifyToken, isAdmin } = require('../middleware/authMerchant');

// Public routes
router.post('/register', merchantController.register);
router.post('/login', merchantController.login);
router.post('/admin/login', merchantController.adminLogin);
router.post('/refresh', merchantController.refresh);

// Email verification routes
router.get('/verify-email', merchantController.verifyEmail);
router.post('/resend-verification', merchantController.resendVerificationEmail);

// Protected routes with API Key
router.get('/api-key-profile', merchantController.verifyApiKey, merchantController.getProfile);

// Protected routes with JWT token
router.get('/profile', verifyToken, merchantController.getProfile);
router.post('/regenerate-key', verifyToken, merchantController.regenerateApiKey);

// Admin routes
router.get('/admin-only', verifyToken, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Admin access granted' });
});

module.exports = router;