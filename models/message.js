"use strict";

//models/message.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Chat, {
        foreignKey: "chatId",
        as: "chat",
      });
      
      Message.belongsTo(models.Merchant, {
        foreignKey: "senderId",
        as: "sender",
      });
    }
  }

  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      chatId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Chats",
          key: "id",
        },
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Merchants",
          key: "id",
        },
      },
      senderType: {
        type: DataTypes.ENUM("customer", "agent", "system"),
        allowNull: false,
      },
      senderName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      messageType: {
        type: DataTypes.ENUM("text", "file", "image", "system"),
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
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Message",
      timestamps: true,
    }
  );

  return Message;
};