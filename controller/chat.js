const db = require('../models');
const { Chat, Message, Merchant } = db;
const { Op } = require('sequelize');

const createChat = async (req, res) => {
  try {
    const { customerName, customerEmail, subject, customerId, priority } = req.body;
    const merchantId = req.merchant.id;

    if (!customerName || !customerEmail) {
      return res.status(400).json({ msg: 'Customer name and email are required' });
    }

    const chat = await Chat.create({
      merchantId,
      customerId,
      customerName,
      customerEmail,
      subject,
      priority: priority || 'medium',
      status: 'open',
      lastMessageAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      chat,
      msg: 'Chat created successfully',
    });
  } catch (error) {
    console.log('Error creating chat:', error);
    return res.status(500).json({ msg: 'Failed to create chat', error });
  }
};

const getChats = async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const { status, priority, page = 1, limit = 20, search } = req.query;

    const whereClause = { merchantId };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause[Op.or] = [
        { customerName: { [Op.iLike]: `%${search}%` } },
        { customerEmail: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: chats } = await Chat.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
        },
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      chats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.log('Error fetching chats:', error);
    return res.status(500).json({ msg: 'Failed to fetch chats', error });
  }
};

const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const merchantId = req.merchant.id;

    const chat = await Chat.findOne({
      where: { id: chatId, merchantId },
      include: [
        {
          model: Message,
          as: 'messages',
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.log('Error fetching chat:', error);
    return res.status(500).json({ msg: 'Failed to fetch chat', error });
  }
};

const updateChatStatus = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status, priority, assignedTo, tags } = req.body;
    const merchantId = req.merchant.id;

    const chat = await Chat.findOne({
      where: { id: chatId, merchantId },
    });

    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (tags) updateData.tags = tags;

    await chat.update(updateData);

    return res.status(200).json({
      success: true,
      chat,
      msg: 'Chat updated successfully',
    });
  } catch (error) {
    console.log('Error updating chat:', error);
    return res.status(500).json({ msg: 'Failed to update chat', error });
  }
};

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const merchantId = req.merchant.id;

    const chat = await Chat.findOne({
      where: { id: chatId, merchantId },
    });

    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    await Message.destroy({ where: { chatId } });
    await chat.destroy();

    return res.status(200).json({
      success: true,
      msg: 'Chat deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting chat:', error);
    return res.status(500).json({ msg: 'Failed to delete chat', error });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType, fileData, senderType: requestSenderType, senderName: requestSenderName } = req.body;
    const merchantId = req.merchant.id;
    const senderId = req.user?.id || null;

    // Use senderType and senderName from request body if provided (for customer messages)
    // Otherwise default to agent
    const senderType = requestSenderType || 'agent';
    const senderName = requestSenderName || (req.user ? `${req.user.fname} ${req.user.lname}` : 'Agent');

    const chat = await Chat.findOne({
      where: { id: chatId, merchantId },
    });

    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    const message = await Message.create({
      chatId,
      senderId,
      senderType,
      senderName,
      messageType: messageType || 'text',
      content,
      fileData,
      isRead: false,
    });

    await chat.update({ lastMessageAt: new Date() });

    return res.status(201).json({
      success: true,
      message,
      msg: 'Message sent successfully',
    });
  } catch (error) {
    console.log('Error sending message:', error);
    return res.status(500).json({ msg: 'Failed to send message', error });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const merchantId = req.merchant.id;

    const chat = await Chat.findOne({
      where: { id: chatId, merchantId },
    });

    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found' });
    }

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          chatId,
          isRead: false,
          senderType: 'customer',
        },
      }
    );

    return res.status(200).json({
      success: true,
      msg: 'Messages marked as read',
    });
  } catch (error) {
    console.log('Error marking messages as read:', error);
    return res.status(500).json({ msg: 'Failed to mark messages as read', error });
  }
};

module.exports = {
  createChat,
  getChats,
  getChatById,
  updateChatStatus,
  deleteChat,
  sendMessage,
  markMessagesAsRead,
};