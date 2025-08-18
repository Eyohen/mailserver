"use strict";

// models/admin.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Merchant extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  Merchant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: true,
       // unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
      apiKey: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true, 
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordOTP: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Merchant",
    }
  );

  return Merchant;
};
