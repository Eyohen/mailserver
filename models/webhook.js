"use strict";

//models/webhook.js
const { Model, UUIDV4 } = require("sequelize");
const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  class Webhook extends Model {
    static associate(models) {
      Webhook.belongsTo(models.Merchant, {
        foreignKey: "merchantId",
        as: "merchant",
      });
    }

    // Generate signature for webhook payload
    generateSignature(payload) {
      const hmac = crypto.createHmac("sha256", this.secret);
      hmac.update(JSON.stringify(payload));
      return hmac.digest("hex");
    }
  }

  Webhook.init(
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
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
      secret: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: () => crypto.randomBytes(32).toString("hex"),
      },
      events: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        validate: {
          isValidEvents(value) {
            const validEvents = [
              "message.created",
              "message.updated",
              "message.deleted",
              "room.created",
              "participant.added",
              "participant.removed",
              "reaction.added",
              "reaction.removed",
            ];
            if (!Array.isArray(value)) {
              throw new Error("Events must be an array");
            }
            for (const event of value) {
              if (!validEvents.includes(event)) {
                throw new Error(`Invalid event type: ${event}`);
              }
            }
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      failureCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastFailedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastSuccessAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Webhook",
      timestamps: true,
    }
  );

  return Webhook;
};
