//route/externalChat.js
const express = require('express');
const router = express.Router();
const externalChatController = require('../controller/externalChat');
const { verifyApiKey } = require('../middleware/authMerchant');

// All external chat routes use API key authentication

// Room management
router.post('/rooms', verifyApiKey, externalChatController.createRoom);
router.get('/rooms', verifyApiKey, externalChatController.getRooms);
router.get('/rooms/:roomId', verifyApiKey, externalChatController.getRoomById);
router.delete('/rooms/:roomId', verifyApiKey, externalChatController.deleteRoom);

// Conversations
router.post('/conversations/direct', verifyApiKey, externalChatController.getOrCreateDirectConversation);

// User conversations
router.get('/users/:userId/conversations', verifyApiKey, externalChatController.getUserConversations);

// Messages
router.post('/rooms/:roomId/messages', verifyApiKey, externalChatController.sendMessage);
router.patch('/rooms/:roomId/messages/:messageId', verifyApiKey, externalChatController.updateMessage);
router.delete('/rooms/:roomId/messages/:messageId', verifyApiKey, externalChatController.deleteMessage);

// Read receipts
router.post('/rooms/:roomId/read', verifyApiKey, externalChatController.markMessagesAsRead);

// Reactions
router.post('/rooms/:roomId/messages/:messageId/reactions', verifyApiKey, externalChatController.addReaction);
router.delete('/rooms/:roomId/messages/:messageId/reactions', verifyApiKey, externalChatController.removeReaction);
router.get('/rooms/:roomId/messages/:messageId/reactions', verifyApiKey, externalChatController.getReactions);

// Participants
router.post('/rooms/:roomId/participants', verifyApiKey, externalChatController.addParticipant);
router.delete('/rooms/:roomId/participants/:userId', verifyApiKey, externalChatController.removeParticipant);

// Presence
router.post('/users/:userId/presence', verifyApiKey, externalChatController.updatePresence);
router.get('/users/:userId/presence', verifyApiKey, externalChatController.getPresence);
router.post('/users/presence/bulk', verifyApiKey, externalChatController.getBulkPresence);

// Webhooks
router.post('/webhooks', verifyApiKey, externalChatController.createWebhook);
router.get('/webhooks', verifyApiKey, externalChatController.getWebhooks);
router.patch('/webhooks/:webhookId', verifyApiKey, externalChatController.updateWebhook);
router.delete('/webhooks/:webhookId', verifyApiKey, externalChatController.deleteWebhook);

module.exports = router;
