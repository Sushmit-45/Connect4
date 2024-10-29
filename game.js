// ELEMENTS
const elements = {
  balls: document.querySelector('.balls'),
  ball: undefined,
  columns: document.querySelectorAll('.column'),
  line: document.querySelector('.line'),
  score: document.querySelector('.score'),
  resetScoreBtn: document.querySelector('.reset-score button'),
  playAgainBtn: document.querySelector('.play-again button'),
  columnsParent: document.querySelector('.columns'),
};

// VARIABLES
const game = {
  step: { amount: 100, offset: 10 },
  ball_type: { PLAYER: 'PLAYER', OPPENENT: 'OPPENENT' },
  ball: { position: { row: -1, column: 3 }, DEFAULT_POSITION: { row: -1, column: 3 } },
  last_player: undefined,
  dimension: { rows: 6, columns: 7 },
  board: [],
  score: { OPPENENT: 0, PLAYER: 0, key: 'for-in-a-row-score' },
  sounds: {
    collision: new Audio('./assets/audio/collision.mp3'),
    selectColumn: new Audio('./assets/audio/select-column.mp3'),
    scratch: new Audio('./assets/audio/scratch.mp3'),
  },
  isBallFalling: false,
};
const savedScore = JSON.parse(localStorage.getItem(game.score.key));
if (savedScore) {
  game.score.OPPENENT = savedScore.OPPENENT;
  game.score.PLAYER = savedScore.PLAYER;
}

// CONTROL GAME
elements.columns.forEach((columnEl) => {
  columnEl.addEventListener('mouseover', changeColumn);
  columnEl.addEventListener('click', play);
});
elements.resetScoreBtn.addEventListener('click', () => {
  game.score.PLAYER = 0;
  game.score.OPPENENT = 0;
  updateScore();
});
elements.playAgainBtn.addEventListener('click', startGame);
elements.columnsParent.addEventListener('mouseleave', () => {
  game.ball.position.column = game.ball.DEFAULT_POSITION.column;
});

// START GAME
function startGame() {
  elements.balls.innerHTML = '';
  elements.line.classList = ['line'];
  game.isBallFalling = false;

  disableButtons(true);
  resetBoard();
  switchPlayer();
  generateBall(game.last_player);
  addHoverEffectToColumns();
  updateScore();
}
startGame();

// PLAY
function play(evt) {
  if (game.isBallFalling) return;
  game.isBallFalling = true;

  const { column } = evt.target.dataset;

  let emptyHoles = 0;
  for (let r = 0; r < game.dimension.rows; r++) if (!game.board[r][column]) emptyHoles++;
  if (!emptyHoles) {
    game.isBallFalling = false;
    return;
  }
  const row = emptyHoles - 1;

  const gravity = 0.1;
  let position = 0,
    velocity = 0,
    bounce = 6;

  function freeFall() {
    velocity += gravity;
    position += velocity;
    elements.ball.style.top = toPixel(elements.ball.offsetTop + position);

    if (elements.ball.offsetTop <= calculateBallPosition(row)) {
      requestAnimationFrame(freeFall);
      return;
    }
    elements.ball.style.top = toPixel(calculateBallPosition(row));
    game.sounds.collision.play();

    position = -bounce * row;
    bounce -= 5;
    if (bounce > 0) {
      requestAnimationFrame(freeFall);
      return;
    }

    game.board[row][column] = game.last_player;

    // check for game over
    const state = checkForFourInARow(game.board);
    if (state) {
      const { row, column, direction } = state;
      animateLine(row, column, direction);
      game.score[game.last_player]++;
      updateScore();
      disableButtons(false);
      removeHoverEffectFromColumns();

      return;
    }

    switchPlayer();
    generateBall(game.last_player);

    game.isBallFalling = false;
  }
  requestAnimationFrame(freeFall);
}

// HELPERS
function resetBoard() {
  for (let r = 0; r < game.dimension.rows; r++) {
    game.board[r] = [];
    for (let c = 0; c < game.dimension.columns; c++) {
      game.board[r][c] = '';
    }
  }
}
function disableButtons(state) {
  elements.resetScoreBtn.disabled = state;
  elements.playAgainBtn.disabled = state;
}
function updateScore() {
  elements.score.innerHTML = `${game.score.PLAYER} - ${game.score.OPPENENT}`;
  localStorage.setItem(game.score.key, JSON.stringify(game.score));
}
function animateLine(row, column, direction) {
  const offset = {
    top: 35,
    left: 35,
  };
  if (direction === 90) offset.left = 45;

  elements.line.style.top = toPixel(calculateBallPosition(row) + offset.top);
  elements.line.style.left = toPixel(calculateBallPosition(column) + offset.left);
  elements.line.style.transform = `rotate(${direction}deg)`;

  const className =
    direction === 0 ? 'horizontal' : direction === 90 ? 'vertical' : 'diagonal';
  elements.line.classList.add(className);
  game.sounds.scratch.play();
}

function checkForFourInARow(board) {
  const rows = board.length;
  const cols = board[0].length;
  const numOfBalls = 4;

  // helper
  function areSameAndNotNull(values) {
    return values.every((value) => value && value === values[0]);
  }

  // Horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - numOfBalls; c++) {
      if (!board[r][c]) continue;
      if (
        areSameAndNotNull([
          board[r][c],
          board[r][c + 1],
          board[r][c + 2],
          board[r][c + 3],
        ])
      ) {
        return {
          row: r,
          column: c,
          direction: 0,
        };
      }
    }
  }
  // Vertical
  for (let r = 0; r <= rows - numOfBalls; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c]) continue;
      if (
        areSameAndNotNull([
          board[r][c],
          board[r + 1][c],
          board[r + 2][c],
          board[r + 3][c],
        ])
      ) {
        return {
          row: r,
          column: c,
          direction: 90,
        };
      }
    }
  }
  // Diagonal (top left  -> bottom right)
  for (let r = 0; r <= rows - numOfBalls; r++) {
    for (let c = 0; c <= cols - numOfBalls; c++) {
      if (!board[r][c]) continue;
      if (
        areSameAndNotNull([
          board[r][c],
          board[r + 1][c + 1],
          board[r + 2][c + 2],
          board[r + 3][c + 3],
        ])
      ) {
        return {
          row: r,
          column: c,
          direction: 45,
        };
      }
    }
  }
  // Diagonal (bottom left  -> top right)
  for (let r = numOfBalls - 1; r < rows; r++) {
    for (let c = 0; c <= cols - numOfBalls; c++) {
      if (!board[r][c]) continue;
      if (
        areSameAndNotNull([
          board[r][c],
          board[r - 1][c + 1],
          board[r - 2][c + 2],
          board[r - 3][c + 3],
        ])
      ) {
        return {
          row: r,
          column: c,
          direction: -45,
        };
      }
    }
  }

  return false;
}

function placeBall(row, column) {
  elements.ball.style.top = toPixel(calculateBallPosition(row));
  elements.ball.style.left = toPixel(calculateBallPosition(column));
}
function calculateBallPosition(rowOrColumn) {
  return rowOrColumn * game.step.amount + game.step.offset;
}
function toPixel(amount) {
  return `${amount}px`;
}
function addHoverEffectToColumns() {
  elements.columns.forEach((column) => {
    column.classList.add('column-hover');
  });
}
function removeHoverEffectFromColumns() {
  elements.columns.forEach((column) => {
    column.classList.remove('column-hover');
  });
}
function changeColumn(evt) {
  const { column } = evt.target.dataset;
  game.ball.position.column = column;

  if (!game.isBallFalling) {
    game.sounds.selectColumn.play();
    placeBall(game.ball.position.row, game.ball.position.column);
  }
}
function switchPlayer() {
  if (!game.last_player) {
    game.last_player = game.ball_type.PLAYER;
  } else {
    game.last_player =
      game.last_player === game.ball_type.PLAYER
        ? game.ball_type.OPPENENT
        : game.ball_type.PLAYER;
  }
}
function generateBall(ball_type) {
  elements.ball = document.createElement('div');
  elements.ball.setAttribute('class', ball_type);

  elements.balls.appendChild(elements.ball);
  placeBall(game.ball.position.row, game.ball.position.column);
}
