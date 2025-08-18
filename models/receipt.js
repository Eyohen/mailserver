"use strict";

// models/admin.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Receipt extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  Receipt.init(
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
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      plan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      total: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      receiptNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
     
    },
    {
      sequelize,
      modelName: "Receipt",
    }
  );

  return Receipt;
};
