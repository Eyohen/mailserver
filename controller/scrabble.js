//controller/scrabble.js
const crypto = require("crypto");
const db = require("../models");
const { ScrabbleGame } = db;

// --- Tile Distribution & Points ---
const TILE_DIST = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1,
  L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2,
  W: 2, X: 1, Y: 2, Z: 1, _: 2,
};

const TILE_PTS = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5,
  L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4,
  W: 4, X: 8, Y: 4, Z: 10, _: 0,
};

// --- Board Bonus Layout ---
const BONUS = {};
function setBonus(cells, type) {
  cells.forEach((c) => (BONUS[c] = type));
}
setBonus(["0,0", "0,7", "0,14", "7,0", "7,14", "14,0", "14,7", "14,14"], "tw");
setBonus(["1,1", "1,13", "2,2", "2,12", "3,3", "3,11", "4,4", "4,10", "10,4", "10,10", "11,3", "11,11", "12,2", "12,12", "13,1", "13,13"], "dw");
setBonus(["1,5", "1,9", "5,1", "5,5", "5,9", "5,13", "9,1", "9,5", "9,9", "9,13", "13,5", "13,9"], "tl");
setBonus(["0,3", "0,11", "2,6", "2,8", "3,0", "3,7", "3,14", "6,2", "6,6", "6,8", "6,12", "7,3", "7,11", "8,2", "8,6", "8,8", "8,12", "11,0", "11,7", "11,14", "12,6", "12,8", "14,3", "14,11"], "dl");
BONUS["7,7"] = "center";

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function createBag() {
  const bag = [];
  for (const [letter, count] of Object.entries(TILE_DIST)) {
    for (let i = 0; i < count; i++) bag.push(letter);
  }
  shuffle(bag);
  return bag;
}

function drawTiles(bag, n) {
  const drawn = [];
  for (let i = 0; i < n && bag.length > 0; i++) drawn.push(bag.pop());
  return drawn;
}

function generateGameCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// --- Create a new game ---
exports.createGame = async (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ success: false, message: "playerName is required" });
    }

    const bag = createBag();
    const player1Rack = drawTiles(bag, 7);
    const gameCode = generateGameCode();

    const game = await ScrabbleGame.create({
      gameCode,
      player1Name: playerName,
      player1Rack,
      bag,
      board: Array.from({ length: 15 }, () => Array(15).fill(null)),
      status: "waiting",
    });

    return res.status(201).json({
      success: true,
      gameCode: game.gameCode,
      gameId: game.id,
      message: `Game created! Share code: ${game.gameCode}`,
    });
  } catch (error) {
    console.error("Create game error:", error);
    return res.status(500).json({ success: false, message: "Failed to create game" });
  }
};

// --- Join an existing game ---
exports.joinGame = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ success: false, message: "playerName is required" });
    }

    const game = await ScrabbleGame.findOne({ where: { gameCode } });
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    // Allow reconnecting as existing player
    if (game.player1Name === playerName || game.player2Name === playerName) {
      const playerNum = game.player1Name === playerName ? 1 : 2;
      return res.status(200).json({
        success: true,
        gameId: game.id,
        gameCode: game.gameCode,
        playerNum,
        message: `Reconnected as ${playerName}`,
      });
    }

    if (game.status !== "waiting") {
      return res.status(400).json({ success: false, message: "Game already full" });
    }

    const bag = [...game.bag];
    const player2Rack = drawTiles(bag, 7);

    await game.update({
      player2Name: playerName,
      player2Rack,
      bag,
      status: "active",
    });

    return res.status(200).json({
      success: true,
      gameId: game.id,
      gameCode: game.gameCode,
      playerNum: 2,
      message: `Joined game as ${playerName}`,
    });
  } catch (error) {
    console.error("Join game error:", error);
    return res.status(500).json({ success: false, message: "Failed to join game" });
  }
};

// --- Get game state (filtered per player) ---
exports.getGameState = async (req, res) => {
  try {
    const { gameCode } = req.params;
    const { playerName } = req.query;

    const game = await ScrabbleGame.findOne({ where: { gameCode } });
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    const state = buildPlayerState(game, playerName);
    return res.status(200).json({ success: true, state });
  } catch (error) {
    console.error("Get game state error:", error);
    return res.status(500).json({ success: false, message: "Failed to get game state" });
  }
};

// --- Submit a word (called via Socket.IO handler) ---
exports.submitWord = async (gameCode, playerName, placements) => {
  const game = await ScrabbleGame.findOne({ where: { gameCode } });
  if (!game) return { error: "Game not found" };
  if (game.status !== "active") return { error: "Game is not active" };

  const playerNum = game.player1Name === playerName ? 1 : game.player2Name === playerName ? 2 : 0;
  if (playerNum === 0) return { error: "You are not in this game" };
  if (game.currentPlayer !== playerNum) return { error: "Not your turn" };

  const rack = playerNum === 1 ? [...game.player1Rack] : [...game.player2Rack];
  const board = game.board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  const bag = [...game.bag];

  // Validate placements
  if (!placements || placements.length === 0) return { error: "No tiles placed" };

  // Check all tiles are in same row or column
  const rows = [...new Set(placements.map((p) => p.r))];
  const cols = [...new Set(placements.map((p) => p.c))];
  const isHorizontal = rows.length === 1;
  const isVertical = cols.length === 1;
  if (!isHorizontal && !isVertical) return { error: "Tiles must be in a single row or column" };

  // Check contiguity
  if (isHorizontal) {
    const r = rows[0];
    const minC = Math.min(...placements.map((p) => p.c));
    const maxC = Math.max(...placements.map((p) => p.c));
    for (let c = minC; c <= maxC; c++) {
      if (!board[r][c] && !placements.find((p) => p.r === r && p.c === c)) {
        return { error: "Tiles must be contiguous" };
      }
    }
  } else {
    const c = cols[0];
    const minR = Math.min(...placements.map((p) => p.r));
    const maxR = Math.max(...placements.map((p) => p.r));
    for (let r = minR; r <= maxR; r++) {
      if (!board[r][c] && !placements.find((p) => p.r === r && p.c === c)) {
        return { error: "Tiles must be contiguous" };
      }
    }
  }

  // First move must cover center
  if (game.firstMove) {
    if (!placements.some((p) => p.r === 7 && p.c === 7)) {
      return { error: "First word must cover the center star" };
    }
    if (placements.length < 2) {
      return { error: "First word must be at least 2 letters" };
    }
  } else {
    // Must connect to existing tiles
    let connected = false;
    for (const p of placements) {
      const neighbors = [[p.r - 1, p.c], [p.r + 1, p.c], [p.r, p.c - 1], [p.r, p.c + 1]];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr]?.[nc]) {
          connected = true;
          break;
        }
      }
      if (connected) break;
    }
    if (!connected) return { error: "Word must connect to existing tiles" };
  }

  // Verify tiles are in player's rack
  const rackCopy = [...rack];
  for (const p of placements) {
    const tileInRack = p.isBlank ? "_" : p.letter;
    const idx = rackCopy.indexOf(tileInRack);
    if (idx === -1) return { error: `Tile '${p.letter}' not in your rack` };
    rackCopy.splice(idx, 1);
  }

  // Place tiles on temp board
  const tempBoard = board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  placements.forEach((p) => {
    tempBoard[p.r][p.c] = { letter: p.letter, pts: p.isBlank ? 0 : TILE_PTS[p.letter] || 0, isNew: true };
  });

  // Find all words formed
  const words = findAllWords(tempBoard, placements);
  if (words.length === 0) return { error: "No valid word formed" };

  // Calculate score
  let totalScore = 0;
  for (const word of words) {
    let wordScore = 0;
    let wordMultiplier = 1;
    for (const cell of word.cells) {
      let letterScore = cell.pts;
      if (cell.isNew) {
        const bonus = BONUS[cell.r + "," + cell.c];
        if (bonus === "dl") letterScore *= 2;
        else if (bonus === "tl") letterScore *= 3;
        else if (bonus === "dw" || bonus === "center") wordMultiplier *= 2;
        else if (bonus === "tw") wordMultiplier *= 3;
      }
      wordScore += letterScore;
    }
    totalScore += wordScore * wordMultiplier;
  }
  if (placements.length === 7) totalScore += 50;

  // Commit to board
  placements.forEach((p) => {
    board[p.r][p.c] = { letter: p.letter, pts: p.isBlank ? 0 : TILE_PTS[p.letter] || 0 };
  });

  // Update rack
  const newRack = rackCopy;
  const drawn = drawTiles(bag, placements.length);
  newRack.push(...drawn);

  // Update scores
  const newScore = (playerNum === 1 ? game.player1Score : game.player2Score) + totalScore;

  // Check game over
  let status = game.status;
  let winner = null;
  if (bag.length === 0 && newRack.length === 0) {
    status = "finished";
    const otherScore = playerNum === 1 ? game.player2Score : game.player1Score;
    winner = newScore > otherScore ? playerName : newScore < otherScore ? (playerNum === 1 ? game.player2Name : game.player1Name) : "Tie";
  }

  const updateData = {
    board,
    bag,
    currentPlayer: playerNum === 1 ? 2 : 1,
    firstMove: false,
    consecutivePasses: 0,
    status,
    winner,
  };

  if (playerNum === 1) {
    updateData.player1Rack = newRack;
    updateData.player1Score = newScore;
  } else {
    updateData.player2Rack = newRack;
    updateData.player2Score = newScore;
  }

  await game.update(updateData);

  const wordStr = words.map((w) => w.cells.map((c) => c.letter).join("")).join(", ");

  return {
    success: true,
    totalScore,
    words: wordStr,
    gameOver: status === "finished",
    winner,
  };
};

// --- Pass turn ---
exports.passTurn = async (gameCode, playerName) => {
  const game = await ScrabbleGame.findOne({ where: { gameCode } });
  if (!game) return { error: "Game not found" };
  if (game.status !== "active") return { error: "Game is not active" };

  const playerNum = game.player1Name === playerName ? 1 : game.player2Name === playerName ? 2 : 0;
  if (playerNum === 0) return { error: "You are not in this game" };
  if (game.currentPlayer !== playerNum) return { error: "Not your turn" };

  const passes = game.consecutivePasses + 1;
  const updateData = {
    currentPlayer: playerNum === 1 ? 2 : 1,
    consecutivePasses: passes,
  };

  if (passes >= 4) {
    updateData.status = "finished";
    // Subtract remaining tiles
    let s1 = game.player1Score - game.player1Rack.reduce((s, t) => s + (TILE_PTS[t] || 0), 0);
    let s2 = game.player2Score - game.player2Rack.reduce((s, t) => s + (TILE_PTS[t] || 0), 0);
    updateData.player1Score = s1;
    updateData.player2Score = s2;
    updateData.winner = s1 > s2 ? game.player1Name : s2 > s1 ? game.player2Name : "Tie";
  }

  await game.update(updateData);

  return {
    success: true,
    gameOver: passes >= 4,
    winner: updateData.winner || null,
  };
};

// --- Helpers ---
function findAllWords(tempBoard, placements) {
  const words = [];
  const seen = new Set();

  for (const p of placements) {
    // Horizontal
    const hWord = getWordAt(tempBoard, p.r, p.c, 0, 1);
    if (hWord && hWord.cells.length >= 2) {
      const key = hWord.cells.map((c) => c.r + "," + c.c).join("|");
      if (!seen.has(key)) { seen.add(key); words.push(hWord); }
    }
    // Vertical
    const vWord = getWordAt(tempBoard, p.r, p.c, 1, 0);
    if (vWord && vWord.cells.length >= 2) {
      const key = vWord.cells.map((c) => c.r + "," + c.c).join("|");
      if (!seen.has(key)) { seen.add(key); words.push(vWord); }
    }
  }
  return words;
}

function getWordAt(tempBoard, r, c, dr, dc) {
  let sr = r, sc = c;
  while (sr - dr >= 0 && sc - dc >= 0 && tempBoard[sr - dr]?.[sc - dc]) {
    sr -= dr;
    sc -= dc;
  }
  const cells = [];
  let cr = sr, cc = sc;
  while (cr < 15 && cc < 15 && tempBoard[cr][cc]) {
    const cell = tempBoard[cr][cc];
    cells.push({ r: cr, c: cc, letter: cell.letter, pts: cell.pts, isNew: !!cell.isNew });
    cr += dr;
    cc += dc;
  }
  return { cells };
}

function buildPlayerState(game, playerName) {
  const playerNum = game.player1Name === playerName ? 1 : game.player2Name === playerName ? 2 : 0;

  return {
    gameCode: game.gameCode,
    board: game.board,
    player1Name: game.player1Name,
    player2Name: game.player2Name,
    player1Score: game.player1Score,
    player2Score: game.player2Score,
    currentPlayer: game.currentPlayer,
    status: game.status,
    winner: game.winner,
    firstMove: game.firstMove,
    bagCount: game.bag.length,
    myRack: playerNum === 1 ? game.player1Rack : playerNum === 2 ? game.player2Rack : [],
    myPlayerNum: playerNum,
  };
}

exports.buildPlayerState = buildPlayerState;
