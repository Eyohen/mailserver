//route/emailTransaction.js
const express = require('express');
const router = express.Router();
const emailController = require('../controller/emailTransaction');
const { verifyApiKey, verifyToken } = require('../middleware/authMerchant');

// API Key authentication routes
router.post('/api-key/emails/send', verifyApiKey, emailController.sendEmail);
router.get('/api-key/emails', verifyApiKey, emailController.getEmailTransactions);
router.get('/api-key/emails/stats', verifyApiKey, emailController.getEmailStats);
router.get('/api-key/emails/:emailId', verifyApiKey, emailController.getEmailTransactionById);
router.patch('/api-key/emails/:emailId/status', verifyApiKey, emailController.updateEmailStatus);
router.post('/api-key/emails/:emailId/resend', verifyApiKey, emailController.resendEmail);

// JWT Token authentication routes
router.post('/emails/send', verifyToken, emailController.sendEmail);
router.get('/emails', verifyToken, emailController.getEmailTransactions);
router.get('/emails/stats', verifyToken, emailController.getEmailStats);
router.get('/emails/:emailId', verifyToken, emailController.getEmailTransactionById);
router.patch('/emails/:emailId/status', verifyToken, emailController.updateEmailStatus);
router.post('/emails/:emailId/resend', verifyToken, emailController.resendEmail);

module.exports = router;