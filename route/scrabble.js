//route/scrabble.js
const express = require("express");
const router = express.Router();
const scrabbleController = require("../controller/scrabble");

// Create a new game
router.post("/new", scrabbleController.createGame);

// Join an existing game
router.post("/:gameCode/join", scrabbleController.joinGame);

// Get game state
router.get("/:gameCode", scrabbleController.getGameState);

module.exports = router;
