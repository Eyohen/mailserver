"use strict";

//models/chatMessage.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      ChatMessage.belongsTo(models.ChatRoom, {
        foreignKey: "roomId",
        as: "room",
      });
      ChatMessage.hasMany(models.MessageReaction, {
        foreignKey: "messageId",
        as: "reactions",
      });
    }
  }

  ChatMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "ChatRooms",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userAvatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      messageType: {
        type: DataTypes.ENUM("text", "image", "file", "system"),
        defaultValue: "text",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fileData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "ChatMessage",
      timestamps: true,
    }
  );

  return ChatMessage;
};
