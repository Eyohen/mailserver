"use strict";


//models/notification.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.Merchant, {
        foreignKey: "merchantId",
        as: "merchant",
      });
    }
  }

  Notification.init(
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
      type: {
        type: DataTypes.ENUM(
          "new-chat",
          "new-message",
          "chat-assigned",
          "chat-resolved",
          "email-sent",
          "email-failed",
          "system",
          "alert"
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium",
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Notification",
      timestamps: true,
    }
  );

  return Notification;
};