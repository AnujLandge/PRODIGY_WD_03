/**
 * Celestial Tic-Tac-Toe - Core Application Logic
 * Premium, interactive vanilla HTML5/CSS3/JS game.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // STATE DEFINITIONS
  // ==========================================
  let boardState = ["", "", "", "", "", "", "", "", ""];
  let gameActive = false;
  let currentPlayer = "X"; // X always starts
  let gameMode = "pvp"; // 'pvp' or 'ai'
  let aiDifficulty = "easy"; // 'easy', 'medium', 'hard'
  let humanMarker = "X"; // For PvAI mode
  let aiMarker = "O"; // For PvAI mode
  
  let playerNames = {
    X: "Player 1",
    O: "Player 2"
  };
  
  let scores = {
    pvp: { X: 0, O: 0, draws: 0 },
    ai: { X: 0, O: 0, draws: 0 }
  };
  
  let matchHistory = [];
  let moveHistory = []; // For Undo functionality: stack of board state snapshots

  // Series logic: first player to reach this many game-wins takes the series
  const SERIES_TARGET = 3;
  let lastWinWasSeries = false; // Whether the most recent win clinched the series
  
  // Timer State
  let timerInterval = null;
  let timerSeconds = 0;
  
  // Audio State
  let audioCtx = null;
  let soundEnabled = true;
  
  // Haptic State
  let hapticsEnabled = true;
  
  // Canvas / Particles State
  const canvas = document.getElementById('canvas-overlay');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let winCombo = null; // Stored winning combination e.g. [0, 1, 2]
  let winProgress = 0;
  let winAnimationStart = null;
  let animationActive = false;
  
  // Win combinations index mapper
  const winConditions = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Col 1
    [1, 4, 7], // Col 2
    [2, 5, 8], // Col 3
    [0, 4, 8], // Diagonal 1
    [2, 4, 6]  // Diagonal 2
  ];

  // ==========================================
  // DOM ELEMENT SELECTIONS
  // ==========================================
  // Screens
  const screenMenu = document.getElementById('screen-menu');
  const screenGame = document.getElementById('screen-game');
  const screenStats = document.getElementById('screen-stats');
  
  // Panels / Forms
  const configPanelPvp = document.getElementById('config-panel-pvp');
  const configPanelAi = document.getElementById('config-panel-ai');
  const boardGrid = document.getElementById('tic-tac-toe-board');
  const cells = document.querySelectorAll('.board-cell');
  
  // Modals
  const modalSettings = document.getElementById('modal-settings');
  const modalMatchOver = document.getElementById('modal-match-over');
  
  // Inputs & Control Elements
  const inputP1Name = document.getElementById('player1-name');
  const inputP2Name = document.getElementById('player2-name');
  const inputAiPlayerName = document.getElementById('player-ai-name');
  const segmentDiffBtns = document.querySelectorAll('#ai-difficulty-control .segment-btn');
  const markerSelectBtns = document.querySelectorAll('#ai-marker-selection .marker-option');
  
  // UI Display Toggles / Buttons
  const btnPvpMode = document.getElementById('mode-select-pvp');
  const btnAiMode = document.getElementById('mode-select-ai');
  const btnStartPvp = document.getElementById('btn-start-pvp');
  const btnStartAi = document.getElementById('btn-start-ai');
  const btnUndo = document.getElementById('btn-undo-move');
  const btnReset = document.getElementById('btn-reset-game');
  const btnResetScore = document.getElementById('btn-reset-score');
  const btnQuit = document.getElementById('btn-quit-game');
  const btnShowStats = document.getElementById('btn-show-stats');
  const btnBackStats = document.getElementById('btn-back-from-stats');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const btnShowSettings = document.getElementById('btn-show-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const checkSynthAudio = document.getElementById('toggle-synth-audio');
  const checkHaptic = document.getElementById('toggle-haptic-feedback');
  const themeCards = document.querySelectorAll('.theme-card');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalReplay = document.getElementById('btn-modal-replay');
  
  // Text Outputs
  const textTurn = document.getElementById('game-turn-text');
  const dotTurn = document.getElementById('game-turn-dot');
  const textTimer = document.getElementById('game-timer');
  const labelP1Score = document.getElementById('score-p1-label');
  const labelP2Score = document.getElementById('score-p2-label');
  const valP1Score = document.getElementById('score-p1-val');
  const valP2Score = document.getElementById('score-p2-val');
  const valDrawsScore = document.getElementById('score-draws-val');
  const statsHistoryList = document.getElementById('stats-history-list');
  
  // Match Over Modal details
  const matchWinTitle = document.getElementById('match-win-title');
  const matchWinDesc = document.getElementById('match-win-desc');
  const matchOverIcon = document.getElementById('match-over-icon');

  // ==========================================
  // INITIALIZATION & PERSISTENCE
  // ==========================================
  function init() {
    loadSettings();
    loadScoresAndHistory();
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    updateTurnGhostEffect();
  }
  
  function setupCanvas() {
    canvas.width = boardGrid.clientWidth;
    canvas.height = boardGrid.clientHeight;
    // Redraw win line if game is over and won
    if (!gameActive && winCombo) {
      drawWinLineStatic();
    }
  }

  function loadSettings() {
    // Theme
    const savedTheme = localStorage.getItem('celestial_theme') || 'default';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeCards.forEach(c => {
      if (c.getAttribute('data-theme-id') === savedTheme) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
    
    // Audio Toggle
    const savedAudio = localStorage.getItem('celestial_audio');
    soundEnabled = savedAudio !== 'false';
    checkSynthAudio.checked = soundEnabled;
    updateAudioIcon();
    
    // Haptics Toggle
    const savedHaptics = localStorage.getItem('celestial_haptics');
    hapticsEnabled = savedHaptics !== 'false';
    checkHaptic.checked = hapticsEnabled;
  }

  function saveSettings() {
    localStorage.setItem('celestial_audio', soundEnabled);
    localStorage.setItem('celestial_haptics', hapticsEnabled);
  }

  function loadScoresAndHistory() {
    const savedHistory = localStorage.getItem('celestial_history');
    if (savedHistory) {
      matchHistory = JSON.parse(savedHistory);
    }
    
    const savedScores = localStorage.getItem('celestial_scores');
    if (savedScores) {
      scores = JSON.parse(savedScores);
    } else {
      rebuildScoresFromHistory();
    }
  }
  
  function rebuildScoresFromHistory() {
    scores = {
      pvp: { X: 0, O: 0, draws: 0 },
      ai: { X: 0, O: 0, draws: 0 }
    };
    
    matchHistory.forEach(match => {
      const modeCat = match.mode.startsWith('AI') ? 'ai' : 'pvp';
      if (match.winner === 'X') scores[modeCat].X++;
      else if (match.winner === 'O') scores[modeCat].O++;
      else scores[modeCat].draws++;
    });
    
    localStorage.setItem('celestial_scores', JSON.stringify(scores));
  }
  
  function saveMatchToHistory(winner) {
    const formattedDate = new Date().toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    let modeLabel = "Pass & Play";
    if (gameMode === 'ai') {
      const diffLabel = aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1);
      modeLabel = `AI (${diffLabel})`;
    }
    
    const newMatch = {
      mode: modeLabel,
      p1Name: playerNames.X,
      p2Name: playerNames.O,
      winner: winner, // 'X', 'O', or 'Draw'
      date: formattedDate
    };
    
    matchHistory.unshift(newMatch); // Prepend to show latest first
    localStorage.setItem('celestial_history', JSON.stringify(matchHistory));
    
    // Increment local scores
    const modeCat = gameMode === 'ai' ? 'ai' : 'pvp';
    if (winner === 'X') scores[modeCat].X++;
    else if (winner === 'O') scores[modeCat].O++;
    else scores[modeCat].draws++;
    
    localStorage.setItem('celestial_scores', JSON.stringify(scores));
  }

  // ==========================================
  // SOUND SYNTHESIZER (WEB AUDIO API)
  // ==========================================
  function initAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthSound(type) {
    if (!soundEnabled) return;
    initAudioContext();
    if (!audioCtx) return;
    
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
      
    } else if (type === 'x-move') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      
    } else if (type === 'o-move') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.09);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
      
    } else if (type === 'win') {
      // Arpeggio sound sweep (victory)
      const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4 -> E4 -> G4 -> C5 -> E5
      arpeggio.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.07);
        g.gain.setValueAtTime(0.05, now + idx * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.16);
        o.start(now + idx * 0.07);
        o.stop(now + idx * 0.07 + 0.16);
      });
      
    } else if (type === 'draw') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.35);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
      
    } else if (type === 'error') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(130, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      
    } else if (type === 'reset') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  }

  function updateAudioIcon() {
    const onIcon = document.getElementById('icon-sound-on');
    const offIcon = document.getElementById('icon-sound-off');
    if (soundEnabled) {
      onIcon.style.display = 'block';
      offIcon.style.display = 'none';
    } else {
      onIcon.style.display = 'none';
      offIcon.style.display = 'block';
    }
  }

  // ==========================================
  // HAPTIC FEEDBACK (MOBILE VIBRATIONS)
  // ==========================================
  function triggerHapticFeedback(type) {
    if (!hapticsEnabled || !navigator.vibrate) return;
    if (type === 'click') {
      navigator.vibrate(12);
    } else if (type === 'error') {
      navigator.vibrate(25);
    } else if (type === 'win') {
      navigator.vibrate([80, 40, 80]);
    } else if (type === 'draw') {
      navigator.vibrate(100);
    }
  }

  // ==========================================
  // GAME ENGINE STATE MANAGERS
  // ==========================================
  function startNewGame() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    moveHistory = [];
    currentPlayer = "X"; // X always begins
    gameActive = true;
    winCombo = null;
    
    // Clear board DOM
    cells.forEach(cell => {
      cell.innerHTML = "";
      cell.className = "board-cell";
    });
    
    // Reset Canvas overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = [];
    animationActive = false;
    
    // Reset Match Timer
    resetTimer();
    startTimer();
    
    // UI Update
    updateTurnIndicator();
    updateUndoButtonState();
    updateScoreboardValues();
    updateTurnGhostEffect();
    
    // Sync active player score cards
    updateScoreboardActiveHighlight();
    
    // If PvAI mode and AI goes first (Human is O)
    if (gameMode === 'ai' && humanMarker === 'O') {
      triggerAiTurn();
    }
  }
  
  function updateScoreboardActiveHighlight() {
    const cardP1 = document.getElementById('card-score-p1');
    const cardP2 = document.getElementById('card-score-p2');
    
    cardP1.classList.remove('active-score-p1', 'active-score-p2');
    cardP2.classList.remove('active-score-p1', 'active-score-p2');
    
    if (gameActive) {
      if (currentPlayer === 'X') {
        cardP1.classList.add('active-score-p1');
      } else {
        cardP2.classList.add('active-score-p2');
      }
    }
  }
  
  function handleCellClick(index) {
    if (!gameActive || boardState[index] !== "") {
      playSynthSound('error');
      triggerHapticFeedback('error');
      return;
    }
    
    // Push state to history before changing it
    moveHistory.push([...boardState]);
    
    makeMove(index, currentPlayer);
    
    if (!gameActive) return; // Check if move finished the game
    
    // If single player AI mode
    if (gameMode === 'ai') {
      triggerAiTurn();
    }
  }
  
  function makeMove(index, player) {
    boardState[index] = player;
    
    // Play audio/haptics
    if (player === 'X') {
      playSynthSound('x-move');
    } else {
      playSynthSound('o-move');
    }
    triggerHapticFeedback('click');
    
    // Update DOM cell
    const cell = cells[index];
    cell.classList.add('filled');
    
    if (player === 'X') {
      cell.innerHTML = `
        <svg class="marker-svg" viewBox="0 0 100 100">
          <line class="marker-x-path" x1="22" y1="22" x2="78" y2="78"></line>
          <line class="marker-x-path" x1="78" y1="22" x2="22" y2="78"></line>
        </svg>
      `;
    } else {
      cell.innerHTML = `
        <svg class="marker-svg" viewBox="0 0 100 100">
          <circle class="marker-o-circle" cx="50" cy="50" r="33"></circle>
        </svg>
      `;
    }
    
    // Check game outcome
    const win = checkWin(boardState, player);
    if (win) {
      endGame(player, win);
      return;
    }
    
    const draw = checkDraw(boardState);
    if (draw) {
      endGame('Draw');
      return;
    }
    
    // Toggle player turn
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
    updateUndoButtonState();
    updateTurnGhostEffect();
    updateScoreboardActiveHighlight();
  }
  
  function triggerAiTurn() {
    gameActive = false; // Temporarily lock board inputs
    setTimeout(() => {
      if (boardState.every(c => c === "") && currentPlayer === 'X') {
        // If AI starts empty board, pick a quick strategic cell to look natural
        const randomStartMove = [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
        gameActive = true;
        makeMove(randomStartMove, aiMarker);
      } else {
        const move = getAiMove();
        gameActive = true;
        makeMove(move, aiMarker);
      }
    }, 550); // Small artificial delay to mimic thinking
  }
  
  function checkWin(board, player) {
    for (let i = 0; i < winConditions.length; i++) {
      const [a, b, c] = winConditions[i];
      if (board[a] === player && board[b] === player && board[c] === player) {
        return winConditions[i]; // Return winning indexes combo
      }
    }
    return null;
  }
  
  function checkDraw(board) {
    return board.every(cell => cell !== "");
  }
  
  function endGame(winner, winComboData = null) {
    gameActive = false;
    stopTimer();
    lastWinWasSeries = false;

    // Remove scoreboard turn highlights
    const cardP1 = document.getElementById('card-score-p1');
    const cardP2 = document.getElementById('card-score-p2');
    cardP1.classList.remove('active-score-p1');
    cardP2.classList.remove('active-score-p2');

    if (winner === 'Draw') {
      playSynthSound('draw');
      triggerHapticFeedback('draw');
      saveMatchToHistory('Draw');

      showMatchOverModal('Draw', false);
    } else {
      // Winner: 'X' or 'O'
      winCombo = winComboData;
      saveMatchToHistory(winner); // increments scores[modeCat][winner]

      // Highlight the winning cells on the board
      if (winCombo) {
        winCombo.forEach(i => cells[i].classList.add('winning-cell'));
      }

      // Did this win clinch the series (first to SERIES_TARGET wins)?
      const modeCat = gameMode === 'ai' ? 'ai' : 'pvp';
      lastWinWasSeries = scores[modeCat][winner] >= SERIES_TARGET;

      // Start celebration and line animation
      winProgress = 0;
      winAnimationStart = null;
      animationActive = true;
      spawnParticles(winner);
      requestAnimationFrame(tickAnimation);

      playSynthSound('win');
      triggerHapticFeedback('win');

      showMatchOverModal(winner, lastWinWasSeries);
    }

    updateScoreboardValues();
  }
  
  function undoLastMove() {
    if (moveHistory.length === 0) return;
    
    playSynthSound('reset');
    triggerHapticFeedback('click');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    winCombo = null;
    animationActive = false;
    
    if (gameMode === 'pvp') {
      // Restore previous state
      boardState = moveHistory.pop();
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    } else {
      // In PvAI mode, undo must pop TWO moves (AI move and Human move) to give player their turn back
      if (moveHistory.length >= 2) {
        moveHistory.pop(); // Pop AI turn state
        boardState = moveHistory.pop(); // Pop Human turn state
      } else {
        // Only one move was made, reset completely
        boardState = ["", "", "", "", "", "", "", "", ""];
        moveHistory = [];
        currentPlayer = humanMarker === 'X' ? 'X' : 'O';
      }
      currentPlayer = humanMarker;
    }
    
    // Re-sync Board cells in DOM
    boardState.forEach((val, idx) => {
      const cell = cells[idx];
      cell.className = "board-cell";
      if (val === "") {
        cell.innerHTML = "";
      } else {
        cell.classList.add('filled');
        if (val === 'X') {
          cell.innerHTML = `
            <svg class="marker-svg" viewBox="0 0 100 100">
              <line class="marker-x-path" style="stroke-dashoffset: 0;" x1="22" y1="22" x2="78" y2="78"></line>
              <line class="marker-x-path" style="stroke-dashoffset: 0;" x1="78" y1="22" x2="22" y2="78"></line>
            </svg>
          `;
        } else {
          cell.innerHTML = `
            <svg class="marker-svg" viewBox="0 0 100 100">
              <circle class="marker-o-circle" style="stroke-dashoffset: 0;" cx="50" cy="50" r="33"></circle>
            </svg>
          `;
        }
      }
    });
    
    gameActive = true;
    updateTurnIndicator();
    updateUndoButtonState();
    updateTurnGhostEffect();
    updateScoreboardActiveHighlight();
  }
  
  function updateUndoButtonState() {
    if (gameActive && moveHistory.length > 0) {
      btnUndo.disabled = false;
      btnUndo.style.opacity = "1";
      btnUndo.style.cursor = "pointer";
    } else {
      btnUndo.disabled = true;
      btnUndo.style.opacity = "0.4";
      btnUndo.style.cursor = "not-allowed";
    }
  }

  // ==========================================
  // TURNS & TIMERS
  // ==========================================
  function startTimer() {
    timerInterval = setInterval(() => {
      timerSeconds++;
      const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
      const secs = (timerSeconds % 60).toString().padStart(2, '0');
      textTimer.textContent = `${mins}:${secs}`;
    }, 1000);
  }
  
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    textTimer.textContent = "00:00";
  }
  
  function updateTurnIndicator() {
    if (currentPlayer === 'X') {
      dotTurn.className = "turn-dot";
      textTurn.textContent = `TURN: ${playerNames.X.toUpperCase()}`;
    } else {
      dotTurn.className = "turn-dot o-turn";
      textTurn.textContent = `TURN: ${playerNames.O.toUpperCase()}`;
    }
  }
  
  function updateScoreboardValues() {
    const modeCat = gameMode === 'ai' ? 'ai' : 'pvp';
    
    // Labels
    if (gameMode === 'pvp') {
      labelP1Score.textContent = `${playerNames.X} (X)`;
      labelP2Score.textContent = `${playerNames.O} (O)`;
    } else {
      if (humanMarker === 'X') {
        labelP1Score.textContent = `${playerNames.X} (X)`;
        labelP2Score.textContent = `${playerNames.O} (O)`;
      } else {
        labelP1Score.textContent = `${playerNames.X} (X)`;
        labelP2Score.textContent = `${playerNames.O} (O)`;
      }
    }
    
    // Values
    valP1Score.textContent = scores[modeCat].X;
    valP2Score.textContent = scores[modeCat].O;
    valDrawsScore.textContent = scores[modeCat].draws;
  }
  
  function updateTurnGhostEffect() {
    const hoverColor = currentPlayer === 'X' ? 'var(--color-x)' : 'var(--color-o)';
    const hoverSymbol = currentPlayer === 'X' ? '"X"' : '"O"';
    boardGrid.style.setProperty('--hover-color', hoverColor);
    boardGrid.style.setProperty('--hover-symbol', hoverSymbol);
  }

  // ==========================================
  // GRAPHICS: WIN-LINE & CONFETTI PARTICLES
  // ==========================================
  function getCellCenter(index, w, h) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: (col * 2 + 1) * (w / 6),
      y: (row * 2 + 1) * (h / 6)
    };
  }

  function spawnParticles(winner) {
    particles = [];
    const colors = winner === 'X'
      ? ['#00f2fe', '#4facfe', '#00ffcc', '#a7f3d0']
      : ['#ff0844', '#f43f5e', '#ec4899', '#fbcfe8'];
      
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        gravity: 0.12,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15
      });
    }
  }

  function drawWinLineStatic() {
    if (!winCombo) return;
    const start = getCellCenter(winCombo[0], canvas.width, canvas.height);
    const end = getCellCenter(winCombo[2], canvas.width, canvas.height);
    
    const winPlayer = boardState[winCombo[0]];
    const color = winPlayer === 'X' 
      ? getComputedStyle(document.documentElement).getPropertyValue('--color-x').trim() 
      : getComputedStyle(document.documentElement).getPropertyValue('--color-o').trim();
    const shadowColor = winPlayer === 'X' 
      ? getComputedStyle(document.documentElement).getPropertyValue('--color-x-glow').trim() 
      : getComputedStyle(document.documentElement).getPropertyValue('--color-o-glow').trim();
      
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 12;
    ctx.stroke();
    
    // Reset shadow state
    ctx.shadowBlur = 0;
  }

  function tickAnimation(timestamp) {
    if (!animationActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw animated Win Line
    if (winCombo) {
      if (!winAnimationStart) winAnimationStart = timestamp;
      const elapsed = timestamp - winAnimationStart;
      const lineDuration = 320; // ms
      winProgress = Math.min(elapsed / lineDuration, 1);
      
      const start = getCellCenter(winCombo[0], canvas.width, canvas.height);
      const end = getCellCenter(winCombo[2], canvas.width, canvas.height);
      const winPlayer = boardState[winCombo[0]];
      
      const color = winPlayer === 'X' 
        ? getComputedStyle(document.documentElement).getPropertyValue('--color-x').trim() 
        : getComputedStyle(document.documentElement).getPropertyValue('--color-o').trim();
      const shadowColor = winPlayer === 'X' 
        ? getComputedStyle(document.documentElement).getPropertyValue('--color-x-glow').trim() 
        : getComputedStyle(document.documentElement).getPropertyValue('--color-o-glow').trim();
        
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(
        start.x + (end.x - start.x) * winProgress, 
        start.y + (end.y - start.y) * winProgress
      );
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // 2. Draw Confetti particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      p.rotation += p.rotationSpeed;
      
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    
    if (particles.length > 0 || winProgress < 1) {
      requestAnimationFrame(tickAnimation);
    } else {
      animationActive = false;
    }
  }

  // ==========================================
  // PLAY VS SYNTHESIZER AI ENGINE
  // ==========================================
  function getAiMove() {
    if (aiDifficulty === "easy") {
      return getEasyMove();
    } else if (aiDifficulty === "medium") {
      return getMediumMove();
    } else {
      // Hard/Invincible (Minimax)
      return getMinimaxMove();
    }
  }
  
  function getEasyMove() {
    const emptyIndices = [];
    boardState.forEach((val, idx) => {
      if (val === "") emptyIndices.push(idx);
    });
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }
  
  function getMediumMove() {
    // 1. Can AI win immediately?
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === "") {
        boardState[i] = aiMarker;
        const isWin = checkWin(boardState, aiMarker);
        boardState[i] = "";
        if (isWin) return i;
      }
    }
    
    // 2. Can Human win immediately? Block it.
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === "") {
        boardState[i] = humanMarker;
        const isWin = checkWin(boardState, humanMarker);
        boardState[i] = "";
        if (isWin) return i;
      }
    }
    
    // 3. Strategic centers / corners
    if (boardState[4] === "") return 4; // Center
    
    const corners = [0, 2, 6, 8];
    const freeCorners = corners.filter(c => boardState[c] === "");
    if (freeCorners.length > 0) {
      return freeCorners[Math.floor(Math.random() * freeCorners.length)];
    }
    
    // 4. Default: Random
    return getEasyMove();
  }
  
  function getMinimaxMove() {
    let bestVal = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === "") {
        // Place move
        boardState[i] = aiMarker;
        // Evaluate
        let score = minimax(boardState, 0, false);
        // Reset move
        boardState[i] = "";
        
        if (score > bestVal) {
          bestVal = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }
  
  function minimax(board, depth, isMax) {
    // Check terminal nodes
    if (checkWin(board, aiMarker)) {
      return 10 - depth; // Prefer winning in fewer steps
    }
    if (checkWin(board, humanMarker)) {
      return depth - 10; // Prefer delaying losses
    }
    if (checkDraw(board)) {
      return 0;
    }
    
    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
          board[i] = aiMarker;
          best = Math.max(best, minimax(board, depth + 1, false));
          board[i] = "";
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
          board[i] = humanMarker;
          best = Math.min(best, minimax(board, depth + 1, true));
          board[i] = "";
        }
      }
      return best;
    }
  }

  // ==========================================
  // NAVIGATION & UI FLOW
  // ==========================================
  function showScreen(screenId) {
    playSynthSound('click');
    triggerHapticFeedback('click');
    
    // Hide all screens
    screenMenu.classList.remove('active');
    screenGame.classList.remove('active');
    screenStats.classList.remove('active');
    
    // Show selected screen
    const activeScreen = document.getElementById(screenId);
    activeScreen.classList.add('active');
    
    // Additional configurations based on loaded screen
    if (screenId === 'screen-game') {
      setupCanvas();
    } else if (screenId === 'screen-stats') {
      renderStatsReport();
    }
  }
  
  function openSettingsModal() {
    playSynthSound('click');
    triggerHapticFeedback('click');
    modalSettings.classList.add('active');
    modalSettings.setAttribute('aria-hidden', 'false');
  }
  
  function closeSettingsModal() {
    playSynthSound('click');
    triggerHapticFeedback('click');
    modalSettings.classList.remove('active');
    modalSettings.setAttribute('aria-hidden', 'true');
    saveSettings();
  }
  
  function showMatchOverModal(winner, isSeriesWin = false) {
    // Delay modal view slightly to let drawing animations and particles display first
    setTimeout(() => {
      modalMatchOver.classList.add('active');
      modalMatchOver.setAttribute('aria-hidden', 'false');

      const pvpThemeX = getComputedStyle(document.documentElement).getPropertyValue('--color-x').trim();
      const pvpThemeO = getComputedStyle(document.documentElement).getPropertyValue('--color-o').trim();

      if (winner === 'Draw') {
        matchWinTitle.textContent = "IT'S A DRAW!";
        matchWinDesc.textContent = "No three in a row — the grid is full. Play again!";
        matchOverIcon.style.stroke = "var(--text-muted)";
        btnModalReplay.textContent = "Play Again";
      } else {
        const winningName = playerNames[winner];
        matchOverIcon.style.stroke = winner === 'X' ? pvpThemeX : pvpThemeO;

        if (isSeriesWin) {
          // First to SERIES_TARGET wins takes the series
          matchWinTitle.textContent = `${winningName.toUpperCase()} WON THE SERIES! 🏆`;
          matchWinDesc.textContent = `First to ${SERIES_TARGET} wins. The scoreboard resets for a new series.`;
          btnModalReplay.textContent = "New Series";
        } else {
          const modeCat = gameMode === 'ai' ? 'ai' : 'pvp';
          const current = scores[modeCat][winner];
          matchWinTitle.textContent = `${winningName.toUpperCase()} WON!`;
          matchWinDesc.textContent = `Three (${winner}) in a row — ${current}/${SERIES_TARGET} wins this series.`;
          btnModalReplay.textContent = "Play Again";
        }
      }
    }, 1000);
  }
  
  function closeMatchOverModal() {
    modalMatchOver.classList.remove('active');
    modalMatchOver.setAttribute('aria-hidden', 'true');
  }

  function renderStatsReport() {
    const totalGames = matchHistory.length;
    const modeCat = gameMode === 'ai' ? 'ai' : 'pvp';
    
    let drawsCount = 0;
    let p1Wins = 0;
    let p2Wins = 0;
    
    matchHistory.forEach(m => {
      if (m.winner === 'X') p1Wins++;
      else if (m.winner === 'O') p2Wins++;
      else drawsCount++;
    });
    
    const p1WinRate = totalGames > 0 ? Math.round((p1Wins / totalGames) * 100) : 0;
    const p2WinRate = totalGames > 0 ? Math.round((p2Wins / totalGames) * 100) : 0;
    
    document.getElementById('stat-total-games').textContent = totalGames;
    document.getElementById('stat-total-draws').textContent = drawsCount;
    document.getElementById('stat-winrate-p1').textContent = `${p1WinRate}%`;
    document.getElementById('stat-winrate-p2').textContent = `${p2WinRate}%`;
    
    // Sync labels
    document.getElementById('label-winrate-p1').textContent = `${playerNames.X} Win Rate`;
    document.getElementById('label-winrate-p2').textContent = `${playerNames.O} Win Rate`;
    
    // Match log lists
    statsHistoryList.innerHTML = "";
    if (totalGames === 0) {
      statsHistoryList.innerHTML = `<div class="empty-history">No games recorded yet.</div>`;
      return;
    }
    
    matchHistory.forEach(match => {
      const item = document.createElement('div');
      item.className = "history-item";
      
      let winnerLabel = "";
      let winnerClass = "";
      if (match.winner === 'Draw') {
        winnerLabel = "Draw";
        winnerClass = "history-result-draw";
      } else {
        const winnerName = match.winner === 'X' ? match.p1Name : match.p2Name;
        winnerLabel = `${winnerName} Won`;
        winnerClass = match.winner === 'X' ? 'history-result-won' : 'history-result-lost';
      }
      
      item.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-weight: 600;">${match.p1Name} vs ${match.p2Name}</span>
          <span class="history-mode-badge">${match.mode} • ${match.date}</span>
        </div>
        <span class="${winnerClass}">${winnerLabel}</span>
      `;
      statsHistoryList.appendChild(item);
    });
  }

  function clearHistoryData() {
    if (confirm("Are you sure you want to permanently clear all scoring statistics and match records?")) {
      playSynthSound('reset');
      triggerHapticFeedback('click');
      matchHistory = [];
      scores = {
        pvp: { X: 0, O: 0, draws: 0 },
        ai: { X: 0, O: 0, draws: 0 }
      };

      localStorage.removeItem('celestial_history');
      localStorage.removeItem('celestial_scores');

      renderStatsReport();
      updateScoreboardValues();
    }
  }

  // Reset only the live scoreboard for the current mode (keeps all-time stats/history)
  function resetScoreboard() {
    const modeCat = gameMode === 'ai' ? 'ai' : 'pvp';
    scores[modeCat] = { X: 0, O: 0, draws: 0 };
    localStorage.setItem('celestial_scores', JSON.stringify(scores));
    lastWinWasSeries = false;
    updateScoreboardValues();
  }

  // ==========================================
  // EVENT LISTENERS BINDINGS
  // ==========================================
  
  // Menu configuration mode selection
  btnPvpMode.addEventListener('click', () => {
    playSynthSound('click');
    configPanelPvp.style.display = 'flex';
    configPanelAi.style.display = 'none';
    btnPvpMode.style.borderColor = 'var(--accent)';
    btnAiMode.style.borderColor = 'var(--card-border)';
  });
  
  btnAiMode.addEventListener('click', () => {
    playSynthSound('click');
    configPanelAi.style.display = 'flex';
    configPanelPvp.style.display = 'none';
    btnAiMode.style.borderColor = 'var(--accent)';
    btnPvpMode.style.borderColor = 'var(--card-border)';
  });
  
  // AI Difficulty control toggles
  segmentDiffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSynthSound('click');
      segmentDiffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      aiDifficulty = btn.getAttribute('data-diff');
    });
  });
  
  // AI Marker selections
  markerSelectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSynthSound('click');
      markerSelectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      humanMarker = btn.getAttribute('data-marker');
      aiMarker = humanMarker === 'X' ? 'O' : 'X';
    });
  });
  
  // Start PvP Match
  btnStartPvp.addEventListener('click', () => {
    gameMode = 'pvp';
    
    // Fetch custom names
    const p1 = inputP1Name.value.trim();
    const p2 = inputP2Name.value.trim();
    
    playerNames.X = p1 !== "" ? p1 : "Player X";
    playerNames.O = p2 !== "" ? p2 : "Player O";
    
    showScreen('screen-game');
    startNewGame();
  });
  
  // Start AI Match
  btnStartAi.addEventListener('click', () => {
    gameMode = 'ai';
    
    // Fetch user name
    const humanName = inputAiPlayerName.value.trim();
    const userLabel = humanName !== "" ? humanName : "Human";
    
    const diffCapitalized = aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1);
    const aiLabel = `Synthesizer AI (${diffCapitalized})`;
    
    if (humanMarker === 'X') {
      playerNames.X = userLabel;
      playerNames.O = aiLabel;
    } else {
      playerNames.X = aiLabel;
      playerNames.O = userLabel;
    }
    
    showScreen('screen-game');
    startNewGame();
  });
  
  // Grid board cells
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const idx = parseInt(cell.getAttribute('data-index'));
      handleCellClick(idx);
    });
  });
  
  // Control Panel buttons
  btnUndo.addEventListener('click', undoLastMove);
  btnReset.addEventListener('click', () => {
    playSynthSound('reset');
    triggerHapticFeedback('click');
    startNewGame();
  });
  btnResetScore.addEventListener('click', () => {
    playSynthSound('reset');
    triggerHapticFeedback('click');
    resetScoreboard();
  });
  btnQuit.addEventListener('click', () => {
    stopTimer();
    showScreen('screen-menu');
  });
  
  // Stats Screens
  btnShowStats.addEventListener('click', () => {
    showScreen('screen-stats');
  });
  btnBackStats.addEventListener('click', () => {
    showScreen('screen-menu');
  });
  btnClearHistory.addEventListener('click', clearHistoryData);
  
  // Settings Modals
  btnShowSettings.addEventListener('click', openSettingsModal);
  btnCloseSettings.addEventListener('click', closeSettingsModal);
  modalSettings.addEventListener('click', (e) => {
    if (e.target === modalSettings) closeSettingsModal();
  });
  
  // Audio Icon toggle
  btnToggleSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    checkSynthAudio.checked = soundEnabled;
    updateAudioIcon();
    playSynthSound('click');
    saveSettings();
  });
  
  checkSynthAudio.addEventListener('change', () => {
    soundEnabled = checkSynthAudio.checked;
    updateAudioIcon();
    playSynthSound('click');
    saveSettings();
  });
  
  checkHaptic.addEventListener('change', () => {
    hapticsEnabled = checkHaptic.checked;
    playSynthSound('click');
    triggerHapticFeedback('click');
    saveSettings();
  });
  
  // Theme selectors
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.getAttribute('data-theme-id');
      
      themeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      document.documentElement.setAttribute('data-theme', themeId);
      localStorage.setItem('celestial_theme', themeId);
      
      // Canvas colors need to fetch variables dynamically, so redraw static win-line if game ended
      if (!gameActive && winCombo) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWinLineStatic();
      }
      
      playSynthSound('click');
      triggerHapticFeedback('click');
    });
  });
  
  // Match Over Modals
  btnModalClose.addEventListener('click', () => {
    closeMatchOverModal();
    playSynthSound('click');
  });
  btnModalReplay.addEventListener('click', () => {
    closeMatchOverModal();
    playSynthSound('reset');
    triggerHapticFeedback('click');
    // If the last win clinched the series, start a fresh series (reset scoreboard)
    if (lastWinWasSeries) {
      resetScoreboard();
    }
    startNewGame();
  });
  modalMatchOver.addEventListener('click', (e) => {
    if (e.target === modalMatchOver) closeMatchOverModal();
  });

  // Run initializations
  init();
});
