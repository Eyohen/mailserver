const db = require('../models');
const { Notification, Merchant } = db;
const { Op } = require('sequelize');

const createNotification = async (req, res) => {
  try {
    const {
      merchantId,
      type,
      title,
      message,
      priority,
      actionUrl,
      metadata,
      expiresAt,
    } = req.body;

    if (!merchantId || !type || !title || !message) {
      return res.status(400).json({
        msg: 'Merchant ID, type, title, and message are required',
      });
    }

    const notification = await Notification.create({
      merchantId,
      type,
      title,
      message,
      priority: priority || 'medium',
      actionUrl,
      metadata: metadata || {},
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      notification,
      msg: 'Notification created successfully',
    });
  } catch (error) {
    console.log('Error creating notification:', error);
    return res.status(500).json({ msg: 'Failed to create notification', error });
  }
};

const getNotifications = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { isRead, type, priority, page = 1, limit = 20 } = req.query;

    const whereClause = { merchantId };

    whereClause[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } },
    ];

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    const offset = (page - 1) * limit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const unreadCount = await Notification.count({
      where: {
        merchantId,
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } },
        ],
      },
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.log('Error fetching notifications:', error);
    return res.status(500).json({ msg: 'Failed to fetch notifications', error });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const merchantId = req.user.id;

    const notification = await Notification.findOne({
      where: { id: notificationId, merchantId },
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.log('Error fetching notification:', error);
    return res.status(500).json({ msg: 'Failed to fetch notification', error });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const merchantId = req.user.id;

    const notification = await Notification.findOne({
      where: { id: notificationId, merchantId },
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      notification,
      msg: 'Notification marked as read',
    });
  } catch (error) {
    console.log('Error marking notification as read:', error);
    return res.status(500).json({ msg: 'Failed to mark notification as read', error });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const merchantId = req.user.id;

    await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          merchantId,
          isRead: false,
        },
      }
    );

    return res.status(200).json({
      success: true,
      msg: 'All notifications marked as read',
    });
  } catch (error) {
    console.log('Error marking all notifications as read:', error);
    return res.status(500).json({ msg: 'Failed to mark all notifications as read', error });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const merchantId = req.user.id;

    const notification = await Notification.findOne({
      where: { id: notificationId, merchantId },
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      msg: 'Notification deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting notification:', error);
    return res.status(500).json({ msg: 'Failed to delete notification', error });
  }
};

const deleteAllRead = async (req, res) => {
  try {
    const merchantId = req.user.id;

    await Notification.destroy({
      where: {
        merchantId,
        isRead: true,
      },
    });

    return res.status(200).json({
      success: true,
      msg: 'All read notifications deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting read notifications:', error);
    return res.status(500).json({ msg: 'Failed to delete read notifications', error });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const merchantId = req.user.id;

    const unreadCount = await Notification.count({
      where: {
        merchantId,
        isRead: false,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } },
        ],
      },
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.log('Error fetching unread count:', error);
    return res.status(500).json({ msg: 'Failed to fetch unread count', error });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getUnreadCount,
};