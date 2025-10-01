"use strict";

//models/emailTransaction.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class EmailTransaction extends Model {
    static associate(models) {
      EmailTransaction.belongsTo(models.Merchant, {
        foreignKey: "merchantId",
        as: "merchant",
      });
    }
  }

  EmailTransaction.init(
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
      recipientEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      recipientName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      senderEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      senderName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      templateType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emailType: {
        type: DataTypes.ENUM(
          "verification",
          "welcome",
          "password-reset",
          "notification",
          "marketing",
          "transactional",
          "support"
        ),
        defaultValue: "transactional",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      htmlContent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "sent", "failed", "bounced", "opened", "clicked"),
        defaultValue: "pending",
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      openedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clickedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "EmailTransaction",
      timestamps: true,
    }
  );

  return EmailTransaction;
};