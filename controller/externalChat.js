const db = require('../models');
const { ChatRoom, ChatParticipant, ChatMessage, MessageReaction, UserPresence, Webhook } = db;
const { Op } = require('sequelize');

// Helper function to trigger webhooks
const triggerWebhooks = async (merchantId, eventType, data) => {
  try {
    const webhooks = await Webhook.findAll({
      where: {
        merchantId,
        isActive: true,
      },
    });

    for (const webhook of webhooks) {
      if (webhook.events.includes(eventType)) {
        const payload = {
          event: eventType,
          timestamp: new Date().toISOString(),
          data,
        };

        const signature = webhook.generateSignature(payload);

        // Fire and forget - don't block the response
        fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': eventType,
          },
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (res.ok) {
              await webhook.update({
                failureCount: 0,
                lastSuccessAt: new Date(),
              });
            } else {
              await webhook.update({
                failureCount: webhook.failureCount + 1,
                lastFailedAt: new Date(),
              });
              // Disable webhook after 10 consecutive failures
              if (webhook.failureCount >= 10) {
                await webhook.update({ isActive: false });
              }
            }
          })
          .catch(async () => {
            await webhook.update({
              failureCount: webhook.failureCount + 1,
              lastFailedAt: new Date(),
            });
          });
      }
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
};

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

    // Trigger webhook
    triggerWebhooks(merchantId, 'room.created', { room: fullRoom });

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

    // Trigger webhook
    triggerWebhooks(merchantId, 'message.created', { roomId, message });

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

    // Trigger webhook
    triggerWebhooks(merchantId, 'participant.added', { roomId, participant });

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

    // Trigger webhook
    triggerWebhooks(merchantId, 'participant.removed', { roomId, userId });

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

// Get or create a direct conversation between two users
const getOrCreateDirectConversation = async (req, res) => {
  try {
    const { user1Id, user1Name, user1Avatar, user2Id, user2Name, user2Avatar, metadata } = req.body;
    const merchantId = req.merchant.id;

    if (!user1Id || !user1Name || !user2Id || !user2Name) {
      return res.status(400).json({ msg: 'user1Id, user1Name, user2Id, and user2Name are required' });
    }

    // Look for existing direct conversation between these two users
    const existingRooms = await ChatRoom.findAll({
      where: {
        merchantId,
        type: 'direct',
      },
      include: [{ model: ChatParticipant, as: 'participants' }],
    });

    // Find room where both users are participants
    let existingRoom = null;
    for (const room of existingRooms) {
      const participantIds = room.participants.map(p => p.userId);
      if (participantIds.includes(user1Id) && participantIds.includes(user2Id) && participantIds.length === 2) {
        existingRoom = room;
        break;
      }
    }

    if (existingRoom) {
      return res.status(200).json({
        success: true,
        room: existingRoom,
        created: false,
        msg: 'Existing conversation found',
      });
    }

    // Create new direct conversation
    const room = await ChatRoom.create({
      merchantId,
      type: 'direct',
      metadata: metadata || {},
      lastMessageAt: new Date(),
    });

    // Add both participants
    await Promise.all([
      ChatParticipant.create({
        roomId: room.id,
        userId: user1Id,
        userName: user1Name,
        userAvatar: user1Avatar || null,
        role: 'member',
      }),
      ChatParticipant.create({
        roomId: room.id,
        userId: user2Id,
        userName: user2Name,
        userAvatar: user2Avatar || null,
        role: 'member',
      }),
    ]);

    // Fetch room with participants
    const fullRoom = await ChatRoom.findOne({
      where: { id: room.id },
      include: [{ model: ChatParticipant, as: 'participants' }],
    });

    // Trigger webhook
    triggerWebhooks(merchantId, 'room.created', { room: fullRoom });

    return res.status(201).json({
      success: true,
      room: fullRoom,
      created: true,
      msg: 'New conversation created',
    });
  } catch (error) {
    console.log('Error in getOrCreateDirectConversation:', error);
    return res.status(500).json({ msg: 'Failed to get or create conversation', error: error.message });
  }
};

// Get all conversations for a user with unread counts
const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const merchantId = req.merchant.id;
    const { type, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ msg: 'userId is required' });
    }

    const offset = (page - 1) * limit;

    // Find all rooms where user is a participant
    const participantRecords = await ChatParticipant.findAll({
      where: { userId },
      include: [{
        model: ChatRoom,
        as: 'room',
        where: {
          merchantId,
          ...(type && { type }),
        },
        include: [{ model: ChatParticipant, as: 'participants' }],
      }],
      order: [[{ model: ChatRoom, as: 'room' }, 'lastMessageAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get total count
    const totalCount = await ChatParticipant.count({
      where: { userId },
      include: [{
        model: ChatRoom,
        as: 'room',
        where: {
          merchantId,
          ...(type && { type }),
        },
      }],
    });

    // Calculate unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      participantRecords.map(async (record) => {
        const room = record.room;
        const lastReadAt = record.lastReadAt;

        // Count messages after lastReadAt (excluding user's own messages)
        const unreadCount = await ChatMessage.count({
          where: {
            roomId: room.id,
            userId: { [Op.ne]: userId },
            isDeleted: false,
            ...(lastReadAt && { createdAt: { [Op.gt]: lastReadAt } }),
          },
        });

        // Get last message
        const lastMessage = await ChatMessage.findOne({
          where: { roomId: room.id, isDeleted: false },
          order: [['createdAt', 'DESC']],
        });

        return {
          ...room.toJSON(),
          unreadCount,
          lastMessage,
        };
      })
    );

    return res.status(200).json({
      success: true,
      conversations: conversationsWithUnread,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.log('Error fetching user conversations:', error);
    return res.status(500).json({ msg: 'Failed to fetch conversations', error: error.message });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, messageId } = req.body;
    const merchantId = req.merchant.id;

    if (!userId) {
      return res.status(400).json({ msg: 'userId is required' });
    }

    // Verify room exists and belongs to merchant
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Find participant
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId },
    });

    if (!participant) {
      return res.status(404).json({ msg: 'User is not a participant in this room' });
    }

    // Update lastReadAt to now (or to the timestamp of the specific message)
    let readAt = new Date();
    if (messageId) {
      const message = await ChatMessage.findOne({
        where: { id: messageId, roomId },
      });
      if (message) {
        readAt = message.createdAt;
      }
    }

    await participant.update({ lastReadAt: readAt });

    return res.status(200).json({
      success: true,
      lastReadAt: readAt,
      msg: 'Messages marked as read',
    });
  } catch (error) {
    console.log('Error marking messages as read:', error);
    return res.status(500).json({ msg: 'Failed to mark messages as read', error: error.message });
  }
};

// Update (edit) a message
const updateMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { userId, content, metadata } = req.body;
    const merchantId = req.merchant.id;

    if (!userId || !content) {
      return res.status(400).json({ msg: 'userId and content are required' });
    }

    // Verify room exists and belongs to merchant
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Find message and verify ownership
    const message = await ChatMessage.findOne({
      where: { id: messageId, roomId },
    });

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (message.userId !== userId) {
      return res.status(403).json({ msg: 'You can only edit your own messages' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ msg: 'Cannot edit a deleted message' });
    }

    // Update message
    await message.update({
      content,
      editedAt: new Date(),
      ...(metadata && { metadata: { ...message.metadata, ...metadata } }),
    });

    // Trigger webhook
    triggerWebhooks(merchantId, 'message.updated', { roomId, message: message.toJSON() });

    return res.status(200).json({
      success: true,
      message,
      msg: 'Message updated successfully',
    });
  } catch (error) {
    console.log('Error updating message:', error);
    return res.status(500).json({ msg: 'Failed to update message', error: error.message });
  }
};

// Delete a message (soft delete)
const deleteMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { userId } = req.body;
    const merchantId = req.merchant.id;

    if (!userId) {
      return res.status(400).json({ msg: 'userId is required' });
    }

    // Verify room exists and belongs to merchant
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Find message and verify ownership
    const message = await ChatMessage.findOne({
      where: { id: messageId, roomId },
    });

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (message.userId !== userId) {
      return res.status(403).json({ msg: 'You can only delete your own messages' });
    }

    // Soft delete
    await message.update({ isDeleted: true });

    // Trigger webhook
    triggerWebhooks(merchantId, 'message.deleted', { roomId, messageId, deletedBy: userId });

    return res.status(200).json({
      success: true,
      msg: 'Message deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting message:', error);
    return res.status(500).json({ msg: 'Failed to delete message', error: error.message });
  }
};

// Add reaction to a message
const addReaction = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { userId, userName, emoji } = req.body;
    const merchantId = req.merchant.id;

    if (!userId || !userName || !emoji) {
      return res.status(400).json({ msg: 'userId, userName, and emoji are required' });
    }

    // Verify room exists and belongs to merchant
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Verify message exists
    const message = await ChatMessage.findOne({
      where: { id: messageId, roomId, isDeleted: false },
    });

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    // Check if reaction already exists
    const existingReaction = await MessageReaction.findOne({
      where: { messageId, userId, emoji },
    });

    if (existingReaction) {
      return res.status(400).json({ msg: 'Reaction already exists' });
    }

    // Create reaction
    const reaction = await MessageReaction.create({
      messageId,
      userId,
      userName,
      emoji,
    });

    // Trigger webhook
    triggerWebhooks(merchantId, 'reaction.added', { roomId, messageId, reaction });

    return res.status(201).json({
      success: true,
      reaction,
      msg: 'Reaction added successfully',
    });
  } catch (error) {
    console.log('Error adding reaction:', error);
    return res.status(500).json({ msg: 'Failed to add reaction', error: error.message });
  }
};

// Remove reaction from a message
const removeReaction = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { userId, emoji } = req.body;
    const merchantId = req.merchant.id;

    if (!userId || !emoji) {
      return res.status(400).json({ msg: 'userId and emoji are required' });
    }

    // Verify room exists and belongs to merchant
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Remove reaction
    const deleted = await MessageReaction.destroy({
      where: { messageId, userId, emoji },
    });

    if (deleted === 0) {
      return res.status(404).json({ msg: 'Reaction not found' });
    }

    // Trigger webhook
    triggerWebhooks(merchantId, 'reaction.removed', { roomId, messageId, userId, emoji });

    return res.status(200).json({
      success: true,
      msg: 'Reaction removed successfully',
    });
  } catch (error) {
    console.log('Error removing reaction:', error);
    return res.status(500).json({ msg: 'Failed to remove reaction', error: error.message });
  }
};

// Get reactions for a message
const getReactions = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const merchantId = req.merchant.id;

    // Verify room exists and belongs to merchant
    const room = await ChatRoom.findOne({
      where: { id: roomId, merchantId },
    });

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    // Get reactions
    const reactions = await MessageReaction.findAll({
      where: { messageId },
      order: [['createdAt', 'ASC']],
    });

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push({
        userId: reaction.userId,
        userName: reaction.userName,
      });
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      reactions: groupedReactions,
      total: reactions.length,
    });
  } catch (error) {
    console.log('Error fetching reactions:', error);
    return res.status(500).json({ msg: 'Failed to fetch reactions', error: error.message });
  }
};

// Update user presence
const updatePresence = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, userName, metadata } = req.body;
    const merchantId = req.merchant.id;

    if (!status || !['online', 'away', 'offline'].includes(status)) {
      return res.status(400).json({ msg: 'Valid status (online, away, offline) is required' });
    }

    // Find or create presence record
    const [presence, created] = await UserPresence.findOrCreate({
      where: { merchantId, userId },
      defaults: {
        merchantId,
        userId,
        userName: userName || userId,
        status,
        lastSeenAt: new Date(),
        metadata: metadata || {},
      },
    });

    if (!created) {
      await presence.update({
        status,
        lastSeenAt: new Date(),
        ...(userName && { userName }),
        ...(metadata && { metadata: { ...presence.metadata, ...metadata } }),
      });
    }

    return res.status(200).json({
      success: true,
      presence,
      msg: 'Presence updated successfully',
    });
  } catch (error) {
    console.log('Error updating presence:', error);
    return res.status(500).json({ msg: 'Failed to update presence', error: error.message });
  }
};

// Get user presence
const getPresence = async (req, res) => {
  try {
    const { userId } = req.params;
    const merchantId = req.merchant.id;

    const presence = await UserPresence.findOne({
      where: { merchantId, userId },
    });

    if (!presence) {
      return res.status(200).json({
        success: true,
        presence: {
          userId,
          status: 'offline',
          lastSeenAt: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      presence,
    });
  } catch (error) {
    console.log('Error fetching presence:', error);
    return res.status(500).json({ msg: 'Failed to fetch presence', error: error.message });
  }
};

// Get bulk user presence
const getBulkPresence = async (req, res) => {
  try {
    const { userIds } = req.body;
    const merchantId = req.merchant.id;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ msg: 'userIds array is required' });
    }

    const presences = await UserPresence.findAll({
      where: {
        merchantId,
        userId: { [Op.in]: userIds },
      },
    });

    // Create a map of userId -> presence
    const presenceMap = {};
    presences.forEach(p => {
      presenceMap[p.userId] = p;
    });

    // Fill in missing users as offline
    const result = userIds.map(userId => {
      if (presenceMap[userId]) {
        return presenceMap[userId];
      }
      return {
        userId,
        status: 'offline',
        lastSeenAt: null,
      };
    });

    return res.status(200).json({
      success: true,
      presences: result,
    });
  } catch (error) {
    console.log('Error fetching bulk presence:', error);
    return res.status(500).json({ msg: 'Failed to fetch presence', error: error.message });
  }
};

// Create webhook
const createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    const merchantId = req.merchant.id;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ msg: 'url and events array are required' });
    }

    const webhook = await Webhook.create({
      merchantId,
      url,
      events,
    });

    return res.status(201).json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
      msg: 'Webhook created successfully',
    });
  } catch (error) {
    console.log('Error creating webhook:', error);
    return res.status(500).json({ msg: 'Failed to create webhook', error: error.message });
  }
};

// Get webhooks
const getWebhooks = async (req, res) => {
  try {
    const merchantId = req.merchant.id;

    const webhooks = await Webhook.findAll({
      where: { merchantId },
      attributes: ['id', 'url', 'events', 'isActive', 'failureCount', 'lastSuccessAt', 'lastFailedAt', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      webhooks,
    });
  } catch (error) {
    console.log('Error fetching webhooks:', error);
    return res.status(500).json({ msg: 'Failed to fetch webhooks', error: error.message });
  }
};

// Update webhook
const updateWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { url, events, isActive } = req.body;
    const merchantId = req.merchant.id;

    const webhook = await Webhook.findOne({
      where: { id: webhookId, merchantId },
    });

    if (!webhook) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    await webhook.update({
      ...(url && { url }),
      ...(events && { events }),
      ...(typeof isActive === 'boolean' && { isActive }),
    });

    return res.status(200).json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
      msg: 'Webhook updated successfully',
    });
  } catch (error) {
    console.log('Error updating webhook:', error);
    return res.status(500).json({ msg: 'Failed to update webhook', error: error.message });
  }
};

// Delete webhook
const deleteWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const merchantId = req.merchant.id;

    const deleted = await Webhook.destroy({
      where: { id: webhookId, merchantId },
    });

    if (deleted === 0) {
      return res.status(404).json({ msg: 'Webhook not found' });
    }

    return res.status(200).json({
      success: true,
      msg: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.log('Error deleting webhook:', error);
    return res.status(500).json({ msg: 'Failed to delete webhook', error: error.message });
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
  // New methods
  getOrCreateDirectConversation,
  getUserConversations,
  markMessagesAsRead,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  getReactions,
  updatePresence,
  getPresence,
  getBulkPresence,
  createWebhook,
  getWebhooks,
  updateWebhook,
  deleteWebhook,
};
