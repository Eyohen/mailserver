(function() {
  var API_BASE = window.location.origin;
  var socket = null;

  var gameCode = null;
  var playerName = null;
  var myPlayerNum = 0;
  var gameState = null;
  var selectedTileIdx = null;
  var pendingPlacements = [];
  var localRack = [];

  var TILE_PTS = {
    A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,
    Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,'_':0
  };

  var BONUS = {};
  function setBonus(cells, type) { cells.forEach(function(c) { BONUS[c] = type; }); }
  setBonus(['0,0','0,7','0,14','7,0','7,14','14,0','14,7','14,14'], 'tw');
  setBonus(['1,1','1,13','2,2','2,12','3,3','3,11','4,4','4,10','10,4','10,10','11,3','11,11','12,2','12,12','13,1','13,13'], 'dw');
  setBonus(['1,5','1,9','5,1','5,5','5,9','5,13','9,1','9,5','9,9','9,13','13,5','13,9'], 'tl');
  setBonus(['0,3','0,11','2,6','2,8','3,0','3,7','3,14','6,2','6,6','6,8','6,12','7,3','7,11','8,2','8,6','8,8','8,12','11,0','11,7','11,14','12,6','12,8','14,3','14,11'], 'dl');
  BONUS['7,7'] = 'center';
  var BONUS_LABELS = { tw:'TW', dw:'DW', tl:'TL', dl:'DL', center:'\u2605' };

  // --- Socket Connection ---
  function connectSocket() {
    socket = io(API_BASE);

    socket.on('connect', function() {
      setConnStatus(true);
      if (gameCode && playerName) {
        socket.emit('scrabble:join', { gameCode: gameCode, playerName: playerName });
        socket.emit('scrabble:request-state', { gameCode: gameCode, playerName: playerName });
      }
    });

    socket.on('disconnect', function() { setConnStatus(false); });

    socket.on('scrabble:state-update', function(data) {
      gameState = data.state;
      localRack = data.state.myRack.slice();
      myPlayerNum = data.state.myPlayerNum;
      pendingPlacements = [];
      selectedTileIdx = null;
      renderGame();
      if (data.message) msg(data.message);
    });

    socket.on('scrabble:player-joined', function(data) {
      lobbyMsg(data.playerName + ' joined the game!');
      socket.emit('scrabble:request-state', { gameCode: gameCode, playerName: playerName });
    });

    socket.on('scrabble:error', function(data) {
      msg('Error: ' + data.message);
    });
  }

  function setConnStatus(connected) {
    var el = document.getElementById('connStatus');
    if (connected) {
      el.className = 'connection-status connected';
      el.textContent = 'Connected';
    } else {
      el.className = 'connection-status disconnected';
      el.textContent = 'Disconnected - reconnecting...';
    }
  }

  // --- Lobby ---
  function createGame() {
    playerName = document.getElementById('playerNameInput').value.trim();
    if (!playerName) { lobbyMsg('Enter your name first.'); return; }

    lobbyMsg('Creating game...');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_BASE + '/api/scrabble/new', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        var data = JSON.parse(xhr.responseText);
        if (!data.success) { lobbyMsg(data.message); return; }
        gameCode = data.gameCode;
        document.getElementById('gameCodeDisplay').textContent = gameCode;
        document.getElementById('waitingArea').style.display = 'block';
        lobbyMsg('Game created! Share the code with your opponent.');
        connectSocket();
      } else {
        lobbyMsg('Server error: ' + xhr.status);
      }
    };
    xhr.onerror = function() {
      lobbyMsg('Failed to connect to server. Is it running?');
    };
    xhr.send(JSON.stringify({ playerName: playerName }));
  }

  function joinGame() {
    playerName = document.getElementById('playerNameInput').value.trim();
    var code = document.getElementById('gameCodeInput').value.trim().toUpperCase();
    if (!playerName) { lobbyMsg('Enter your name first.'); return; }
    if (!code) { lobbyMsg('Enter a game code.'); return; }

    lobbyMsg('Joining game...');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_BASE + '/api/scrabble/' + code + '/join', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        var data = JSON.parse(xhr.responseText);
        if (!data.success) { lobbyMsg(data.message); return; }
        gameCode = data.gameCode;
        myPlayerNum = data.playerNum;
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        connectSocket();
      } else {
        lobbyMsg('Server error: ' + xhr.status);
      }
    };
    xhr.onerror = function() {
      lobbyMsg('Failed to connect to server.');
    };
    xhr.send(JSON.stringify({ playerName: playerName }));
  }

  function lobbyMsg(text) {
    document.getElementById('lobbyStatus').textContent = text;
  }

  // --- Rendering ---
  function renderGame() {
    if (!gameState) return;

    // If still waiting for opponent, stay on lobby and show the code
    if (gameState.status === 'waiting') {
      document.getElementById('lobby').style.display = '';
      document.getElementById('gameContainer').style.display = 'none';
      document.getElementById('gameCodeDisplay').textContent = gameCode;
      document.getElementById('waitingArea').style.display = 'block';
      lobbyMsg('Game created! Share this code with your opponent:');
      return;
    }

    document.getElementById('lobby').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    var isMyTurn = gameState.currentPlayer === myPlayerNum && gameState.status === 'active';

    var banner = document.getElementById('turnBanner');
    if (gameState.status === 'finished') {
      banner.textContent = 'Game Over! ' + (gameState.winner === 'Tie' ? "It's a tie!" : gameState.winner + ' wins!');
      banner.className = 'turn-banner turn-over';
    } else if (gameState.status === 'waiting') {
      banner.textContent = 'Waiting for opponent...';
      banner.className = 'turn-banner turn-theirs';
    } else {
      banner.textContent = isMyTurn ? "Your Turn!" : (gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name) + "'s Turn";
      banner.className = 'turn-banner ' + (isMyTurn ? 'turn-mine' : 'turn-theirs');
    }

    var p1Active = gameState.currentPlayer === 1 && gameState.status === 'active';
    var p2Active = gameState.currentPlayer === 2 && gameState.status === 'active';
    document.getElementById('scoreP1').textContent = (gameState.player1Name || 'Player 1') + ': ' + gameState.player1Score;
    document.getElementById('scoreP1').className = 'player score-p1' + (p1Active ? ' active' : '');
    document.getElementById('scoreP2').textContent = (gameState.player2Name || 'Waiting...') + ': ' + gameState.player2Score;
    document.getElementById('scoreP2').className = 'player score-p2' + (p2Active ? ' active' : '');

    document.getElementById('btnSubmit').disabled = !isMyTurn;
    document.getElementById('btnRecall').disabled = !isMyTurn;
    document.getElementById('btnPass').disabled = !isMyTurn;
    document.getElementById('tilesRemaining').textContent = 'Tiles in bag: ' + gameState.bagCount;

    renderBoard();
    renderRack();
  }

  function renderBoard() {
    if (!gameState) return;
    var boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    var boardData = gameState.board;

    for (var r = 0; r < 15; r++) {
      for (var c = 0; c < 15; c++) {
        var cell = document.createElement('div');
        cell.classList.add('cell');
        var key = r + ',' + c;
        var pending = null;
        for (var pi = 0; pi < pendingPlacements.length; pi++) {
          if (pendingPlacements[pi].r === r && pendingPlacements[pi].c === c) { pending = pendingPlacements[pi]; break; }
        }

        if (boardData[r][c]) {
          cell.classList.add('has-tile');
          cell.innerHTML = boardData[r][c].letter + '<span class="points">' + boardData[r][c].pts + '</span>';
        } else if (pending) {
          cell.classList.add('pending-tile');
          cell.innerHTML = pending.letter + '<span class="points">' + pending.pts + '</span>';
          (function(rr, cc) { cell.addEventListener('click', function() { recallSingleTile(rr, cc); }); })(r, c);
        } else {
          var bonus = BONUS[key];
          cell.classList.add(bonus || 'normal');
          cell.textContent = BONUS_LABELS[bonus] || '';
          (function(rr, cc) { cell.addEventListener('click', function() { placeTile(rr, cc); }); })(r, c);
        }
        boardEl.appendChild(cell);
      }
    }
  }

  function renderRack() {
    var rackEl = document.getElementById('currentRack');
    rackEl.innerHTML = '';
    var usedSet = {};
    for (var pi = 0; pi < pendingPlacements.length; pi++) { usedSet[pendingPlacements[pi].rackIdx] = true; }

    for (var i = 0; i < localRack.length; i++) {
      if (usedSet[i]) continue;
      var letter = localRack[i];
      var tile = document.createElement('div');
      tile.classList.add('tile');
      if (selectedTileIdx === i) tile.classList.add('selected');
      var display = letter === '_' ? ' ' : letter;
      var pts = TILE_PTS[letter] || 0;
      tile.innerHTML = display + '<span class="pts">' + pts + '</span>';
      (function(idx) { tile.addEventListener('click', function() { selectTile(idx); }); })(i);
      rackEl.appendChild(tile);
    }
  }

  function selectTile(rackIdx) {
    if (!gameState || gameState.currentPlayer !== myPlayerNum || gameState.status !== 'active') return;
    var letter = localRack[rackIdx];
    if (letter === '_') {
      var chosen = prompt('Blank tile! Enter a letter (A-Z):');
      if (!chosen || chosen.length !== 1 || !/[a-zA-Z]/.test(chosen)) { msg('Invalid letter.'); return; }
      localRack[rackIdx] = chosen.toUpperCase() + '*';
    }
    selectedTileIdx = rackIdx;
    renderRack();
    msg('Click a board cell to place the tile.');
  }

  function placeTile(r, c) {
    if (!gameState || gameState.currentPlayer !== myPlayerNum || gameState.status !== 'active') return;
    if (selectedTileIdx === null) { msg('Select a tile from your rack first.'); return; }
    var letter = localRack[selectedTileIdx];
    var pts = TILE_PTS[letter] || 0;
    var displayLetter = letter;
    var isBlank = false;
    if (typeof letter === 'string' && letter.indexOf('*') === letter.length - 1 && letter.length === 2) {
      displayLetter = letter[0];
      pts = 0;
      isBlank = true;
    }
    pendingPlacements.push({ r: r, c: c, letter: displayLetter, pts: pts, rackIdx: selectedTileIdx, isBlank: isBlank });
    selectedTileIdx = null;
    renderBoard();
    renderRack();
    msg('Tile placed. Continue placing or submit.');
  }

  function recallSingleTile(r, c) {
    var idx = -1;
    for (var i = 0; i < pendingPlacements.length; i++) {
      if (pendingPlacements[i].r === r && pendingPlacements[i].c === c) { idx = i; break; }
    }
    if (idx === -1) return;
    var removed = pendingPlacements.splice(idx, 1)[0];
    if (removed.isBlank) localRack[removed.rackIdx] = '_';
    selectedTileIdx = null;
    renderBoard();
    renderRack();
    msg('Tile recalled.');
  }

  function recallTiles() {
    for (var i = 0; i < pendingPlacements.length; i++) {
      if (pendingPlacements[i].isBlank) localRack[pendingPlacements[i].rackIdx] = '_';
    }
    pendingPlacements = [];
    selectedTileIdx = null;
    renderBoard();
    renderRack();
    msg('All tiles recalled.');
  }

  function shuffleRack() {
    recallTiles();
    for (var i = localRack.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = localRack[i]; localRack[i] = localRack[j]; localRack[j] = tmp;
    }
    renderRack();
  }

  function submitWord() {
    if (!gameState || pendingPlacements.length === 0) { msg('Place at least one tile.'); return; }
    var placements = [];
    for (var i = 0; i < pendingPlacements.length; i++) {
      var p = pendingPlacements[i];
      placements.push({ r: p.r, c: p.c, letter: p.letter, isBlank: p.isBlank });
    }
    socket.emit('scrabble:submit-word', { gameCode: gameCode, playerName: playerName, placements: placements });
    msg('Submitting...');
  }

  function passTurn() {
    if (!gameState) return;
    recallTiles();
    socket.emit('scrabble:pass-turn', { gameCode: gameCode, playerName: playerName });
    msg('Passing turn...');
  }

  function msg(text) {
    document.getElementById('message').textContent = text;
  }

  // --- Wire up buttons ---
  document.getElementById('btnCreate').addEventListener('click', createGame);
  document.getElementById('btnJoin').addEventListener('click', joinGame);
  document.getElementById('btnSubmit').addEventListener('click', submitWord);
  document.getElementById('btnRecall').addEventListener('click', recallTiles);
  document.getElementById('btnShuffle').addEventListener('click', shuffleRack);
  document.getElementById('btnPass').addEventListener('click', passTurn);
})();
