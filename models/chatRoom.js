"use strict";

//models/chatRoom.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatRoom extends Model {
    static associate(models) {
      ChatRoom.belongsTo(models.Merchant, {
        foreignKey: "merchantId",
        as: "merchant",
      });

      ChatRoom.hasMany(models.ChatParticipant, {
        foreignKey: "roomId",
        as: "participants",
      });

      ChatRoom.hasMany(models.ChatMessage, {
        foreignKey: "roomId",
        as: "messages",
      });
    }
  }

  ChatRoom.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      merchantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Merchants",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("direct", "group", "channel"),
        defaultValue: "direct",
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ChatRoom",
      timestamps: true,
    }
  );

  return ChatRoom;
};
