const db = require('../models');
const { ChatRoom, ChatParticipant, ChatMessage } = db;
const { Op } = require('sequelize');

// Create a new chat room
const createRoom = async (req, res) => {
  try {
    const { name, type, participants, metadata } = req.body;
    const merchantId = req.merchant.id;

    if (!participants || !Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ msg: 'At least one participant is required' });
    }

    const room = await ChatRoom.create({
      merchantId,
      name,
      type: type || 'direct',
      metadata: metadata || {},
      lastMessageAt: new Date(),
    });

    // Add participants
    const participantPromises = participants.map(p =>
      ChatParticipant.create({
        roomId: room.id,
        userId: p.userId,
        userName: p.userName,
        userAvatar: p.userAvatar || null,
        role: p.role || 'member',
      })
    );

    await Promise.all(participantPromises);

    // Fetch room with participants
    const fullRoom = await ChatRoom.findOne({
      where: { id: room.id },
      include: [{ model: ChatParticipant, as: 'participants' }],
    });

    return res.status(201).json({
      success: true,
      room: fullRoom,
      msg: 'Chat room created successfully',
    });
  } catch (error) {
    console.log('Error creating chat room:', error);
    return res.status(500).json({ msg: 'Failed to create chat room', error: error.message });
  }
};

// Get all rooms for a merchant
const getRooms = async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const { type, userId, page = 1, limit = 20 } = req.query;

    const whereClause = { merchantId };
    if (type) whereClause.type = type;

    const offset = (page - 1) * limit;

    let rooms;
    if (userId) {
      // Filter by participant userId
      rooms = await ChatRoom.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ChatParticipant,
            as: 'participants',
            where: { userId },
          },
        ],
        order: [['lastMessageAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
      });
    } else {
      rooms = await ChatRoom.findAndCountAll({
        where: whereClause,
        include: [{ model: ChatParticipant, as: 'participants' }],
        order: [['lastMessageAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
      });
    }

    return res.status(200).json({
      success: true,
      rooms: rooms.rows,
      pagination: {
        total: rooms.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(rooms.count / limit),
      },
    });
  } catch (error) {
    console.log('Error fetching rooms:', error);
    return res.status(500).json({ msg: 'Failed to fetch rooms', error: error.message });
  }
};

// Get room by ID with messages
const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const merchantId = req.merchant.id;
    const { limit = 50, before } = req.query;

    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
      include: [{ model: ChatParticipant, as: 'participants' }],
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Fetch messages
    const messageWhere = { roomId };
    if (before) {
      messageWhere.createdAt = { [Op.lt]: new Date(before) };
    }

    const messages = await ChatMessage.findAll({
      where: messageWhere,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    return res.status(200).json({
      success: true,
      room: {
        ...room.toJSON(),
        messages: messages.reverse(),
      },
    });
  } catch (error) {
    console.log('Error fetching room:', error);
    return res.status(500).json({ msg: 'Failed to fetch room', error: error.message });
  }
};

// Send a message to a room
const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, userName, userAvatar, content, messageType, fileData, metadata } = req.body;
    const merchantId = req.merchant.id;

    if (!userId || !userName || !content) {
      return res.status(400).json({ msg: 'userId, userName, and content are required' });
    }

    // Verify room exists and belongs to merchant
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Create message
    const message = await ChatMessage.create({
      roomId,
      userId,
      userName,
      userAvatar: userAvatar || null,
      messageType: messageType || 'text',
      content,
      fileData: fileData || null,
      metadata: metadata || {},
    });

    // Update room's lastMessageAt
    await room.update({ lastMessageAt: new Date() });

    return res.status(201).json({
      success: true,
      message,
      msg: 'Message sent successfully',
    });
  } catch (error) {
    console.log('Error sending message:', error);
    return res.status(500).json({ msg: 'Failed to send message', error: error.message });
  }
};

// Add participant to room
const addParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, userName, userAvatar, role } = req.body;
    const merchantId = req.merchant.id;

    if (!userId || !userName) {
      return res.status(400).json({ msg: 'userId and userName are required' });
    }

    // Verify room exists
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Check if participant already exists
    const existingParticipant = await ChatParticipant.findOne({
      where: { roomId, userId },
    });

    if (existingParticipant) {
      return res.status(400).json({ msg: 'Participant already in room' });
    }

    // Add participant
    const participant = await ChatParticipant.create({
      roomId,
      userId,
      userName,
      userAvatar: userAvatar || null,
      role: role || 'member',
    });

    return res.status(201).json({
      success: true,
      participant,
      msg: 'Participant added successfully',
    });
  } catch (error) {
    console.log('Error adding participant:', error);
    return res.status(500).json({ msg: 'Failed to add participant', error: error.message });
  }
};

// Remove participant from room
const removeParticipant = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const merchantId = req.merchant.id;

    // Verify room exists
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Remove participant
    const deleted = await ChatParticipant.destroy({
      where: { roomId, userId },
    });

    if (deleted === 0) {
      return res.status(404).json({ msg: 'Participant not found' });
    }

    return res.status(200).json({
      success: true,
      msg: 'Participant removed successfully',
    });
  } catch (error) {
    console.log('Error removing participant:', error);
    return res.status(500).json({ msg: 'Failed to remove participant', error: error.message });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const merchantId = req.merchant.id;

    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Delete messages and participants
    await ChatMessage.destroy({ where: { roomId } });
    await ChatParticipant.destroy({ where: { roomId } });
    await room.destroy();

    return res.status(200).json({
      success: true,
      msg: 'Room deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting room:', error);
    return res.status(500).json({ msg: 'Failed to delete room', error: error.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  sendMessage,
  addParticipant,
  removeParticipant,
  deleteRoom,
};
