//route/externalChat.js
const express = require('express');
const router = express.Router();
const externalChatController = require('../controller/externalChat');
const { verifyApiKey } = require('../middleware/authMerchant');

// All external chat routes use API key authentication
router.post('/rooms', verifyApiKey, externalChatController.createRoom);
router.get('/rooms', verifyApiKey, externalChatController.getRooms);
router.get('/rooms/:roomId', verifyApiKey, externalChatController.getRoomById);
router.delete('/rooms/:roomId', verifyApiKey, externalChatController.deleteRoom);

router.post('/rooms/:roomId/messages', verifyApiKey, externalChatController.sendMessage);
router.post('/rooms/:roomId/participants', verifyApiKey, externalChatController.addParticipant);
router.delete('/rooms/:roomId/participants/:userId', verifyApiKey, externalChatController.removeParticipant);

module.exports = router;
