//route/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controller/chat');
const { verifyApiKey, verifyToken } = require('../middleware/authMerchant');

// API Key authentication routes
router.post('/api-key/chats', verifyApiKey, chatController.createChat);
router.get('/api-key/chats', verifyApiKey, chatController.getChats);
router.get('/api-key/chats/:chatId', verifyApiKey, chatController.getChatById);
router.patch('/api-key/chats/:chatId', verifyApiKey, chatController.updateChatStatus);
router.delete('/api-key/chats/:chatId', verifyApiKey, chatController.deleteChat);
router.post('/api-key/chats/:chatId/messages', verifyApiKey, chatController.sendMessage);
router.patch('/api-key/chats/:chatId/read', verifyApiKey, chatController.markMessagesAsRead);

// JWT Token authentication routes
router.post('/chats', verifyToken, chatController.createChat);
router.get('/chats', verifyToken, chatController.getChats);
router.get('/chats/:chatId', verifyToken, chatController.getChatById);
router.patch('/chats/:chatId', verifyToken, chatController.updateChatStatus);
router.delete('/chats/:chatId', verifyToken, chatController.deleteChat);
router.post('/chats/:chatId/messages', verifyToken, chatController.sendMessage);
router.patch('/chats/:chatId/read', verifyToken, chatController.markMessagesAsRead);

module.exports = router;