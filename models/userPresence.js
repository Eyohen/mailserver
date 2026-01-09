"use strict";

//models/userPresence.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserPresence extends Model {
    static associate(models) {
      UserPresence.belongsTo(models.Merchant, {
        foreignKey: "merchantId",
        as: "merchant",
      });
    }
  }

  UserPresence.init(
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
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("online", "away", "offline"),
        defaultValue: "offline",
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: "UserPresence",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["merchantId", "userId"],
        },
      ],
    }
  );

  return UserPresence;
};
