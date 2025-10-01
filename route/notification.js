//route/notification.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notification');
const { verifyToken, isAdmin } = require('../middleware/authMerchant');

router.get('/notifications', verifyToken, notificationController.getNotifications);
router.get('/notifications/unread-count', verifyToken, notificationController.getUnreadCount);
router.get('/notifications/:notificationId', verifyToken, notificationController.getNotificationById);
router.patch('/notifications/:notificationId/read', verifyToken, notificationController.markAsRead);
router.patch('/notifications/mark-all-read', verifyToken, notificationController.markAllAsRead);
router.delete('/notifications/:notificationId', verifyToken, notificationController.deleteNotification);
router.delete('/notifications/delete-all-read', verifyToken, notificationController.deleteAllRead);
router.post('/notifications', verifyToken, isAdmin, notificationController.createNotification);

module.exports = router;