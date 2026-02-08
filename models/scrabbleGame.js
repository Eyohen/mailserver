"use strict";

//models/scrabbleGame.js
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ScrabbleGame extends Model {
    static associate(models) {
      // No foreign key dependencies - standalone game
    }
  }

  ScrabbleGame.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      gameCode: {
        type: DataTypes.STRING(8),
        allowNull: false,
        unique: true,
      },
      board: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: Array.from({ length: 15 }, () => Array(15).fill(null)),
      },
      bag: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      player1Name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      player2Name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      player1Rack: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      player2Rack: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      player1Score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      player2Score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      currentPlayer: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.ENUM("waiting", "active", "finished"),
        defaultValue: "waiting",
      },
      winner: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      firstMove: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      consecutivePasses: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "ScrabbleGame",
      timestamps: true,
    }
  );

  return ScrabbleGame;
};
