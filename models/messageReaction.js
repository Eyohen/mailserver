"use strict";

//models/messageReaction.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MessageReaction extends Model {
    static associate(models) {
      MessageReaction.belongsTo(models.ChatMessage, {
        foreignKey: "messageId",
        as: "message",
      });
    }
  }

  MessageReaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      messageId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "ChatMessages",
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
      emoji: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "MessageReaction",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["messageId", "userId", "emoji"],
        },
      ],
    }
  );

  return MessageReaction;
};
