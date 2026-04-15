import {
  GRID_SIZE,
  makeInitialState,
  queueDirection,
  stepGame
} from "./snake-logic.js";

const TICK_MS = 120;

const gridElement = document.querySelector("#grid");
const scoreElement = document.querySelector("#score");
const statusElement = document.querySelector("#status");
const restartButton = document.querySelector("#restartBtn");
const pauseButton = document.querySelector("#pauseBtn");
const controlButtons = document.querySelectorAll("[data-dir]");

let state = makeInitialState(GRID_SIZE);
let isPaused = false;

const cells = createGrid(gridElement, GRID_SIZE);
render();

const timer = setInterval(() => {
  if (isPaused || state.isGameOver) return;
  state = stepGame(state);
  render();
}, TICK_MS);

document.addEventListener("keydown", (event) => {
  const direction = toDirection(event.key);
  if (direction) {
    event.preventDefault();
    state = queueDirection(state, direction);
    return;
  }

  if (event.key === " " || event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    restart();
  }
});

restartButton.addEventListener("click", restart);
pauseButton.addEventListener("click", togglePause);

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.dir;
    state = queueDirection(state, direction);
  });
});

window.addEventListener("beforeunload", () => {
  clearInterval(timer);
});

function restart() {
  state = makeInitialState(GRID_SIZE);
  isPaused = false;
  pauseButton.textContent = "Pause";
  render();
}

function togglePause() {
  if (state.isGameOver) return;
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  render();
}

function render() {
  cells.forEach((cell) => {
    cell.className = "cell";
  });

  for (let index = state.snake.length - 1; index >= 0; index -= 1) {
    const segment = state.snake[index];
    const cell = getCell(cells, state.size, segment.x, segment.y);
    if (!cell) continue;
    cell.classList.add("snake");
  }

  const head = state.snake[0];
  const headCell = getCell(cells, state.size, head.x, head.y);
  if (headCell) {
    headCell.classList.add("head");
  }

  if (state.food) {
    const foodCell = getCell(cells, state.size, state.food.x, state.food.y);
    if (foodCell) {
      foodCell.classList.add("food");
    }
  }

  scoreElement.textContent = String(state.score);
  statusElement.textContent = getStatusText();
}

function getStatusText() {
  if (state.isGameOver && state.hasWon) {
    return "You win! Press Restart to play again.";
  }
  if (state.isGameOver) {
    return "Game over. Press Restart to play again.";
  }
  if (isPaused) {
    return "Paused. Press Resume to continue.";
  }
  return "Use arrows/WASD. Space or P pauses. R restarts.";
}

function createGrid(container, size) {
  container.style.setProperty("--size", String(size));
  const total = size * size;
  const nextCells = [];
  for (let index = 0; index < total; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    container.appendChild(cell);
    nextCells.push(cell);
  }
  return nextCells;
}

function getCell(cellsList, size, x, y) {
  const index = y * size + x;
  return cellsList[index];
}

function toDirection(key) {
  switch (key.toLowerCase()) {
    case "arrowup":
    case "w":
      return "up";
    case "arrowdown":
    case "s":
      return "down";
    case "arrowleft":
    case "a":
      return "left";
    case "arrowright":
    case "d":
      return "right";
    default:
      return null;
  }
}
