const express = require('express');
const { sendMessage, getMessages } = require('../controller/chat');

const router = express.Router();

router.post('/send', sendMessage);
router.get('/messages/:room', getMessages);

module.exports = router;