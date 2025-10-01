"use strict";

//models/chat.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      Chat.belongsTo(models.Merchant, {
        foreignKey: "merchantId",
        as: "merchant",
      });
      
      Chat.hasMany(models.Message, {
        foreignKey: "chatId",
        as: "messages",
      });
    }
  }

  Chat.init(
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
      customerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("open", "in-progress", "resolved", "closed"),
        defaultValue: "open",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "urgent"),
        defaultValue: "medium",
      },
      assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Merchants",
          key: "id",
        },
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Chat",
      timestamps: true,
    }
  );

  return Chat;
};