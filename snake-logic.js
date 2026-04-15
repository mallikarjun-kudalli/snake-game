export const GRID_SIZE = 20;
export const INITIAL_DIRECTION = "right";

const VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function makeInitialState(size = GRID_SIZE, rng = Math.random) {
  const snake = [
    { x: 3, y: 10 },
    { x: 2, y: 10 },
    { x: 1, y: 10 }
  ];
  return {
    size,
    snake,
    direction: INITIAL_DIRECTION,
    pendingDirection: null,
    food: randomFreeCell(size, snake, rng),
    score: 0,
    isGameOver: false,
    hasWon: false
  };
}

export function queueDirection(state, nextDirection) {
  if (!VECTORS[nextDirection]) return state;
  if (nextDirection === OPPOSITES[state.direction] && state.snake.length > 1) return state;
  if (state.pendingDirection && nextDirection === OPPOSITES[state.pendingDirection]) return state;
  return {
    ...state,
    pendingDirection: nextDirection
  };
}

export function stepGame(state, rng = Math.random) {
  if (state.isGameOver) return state;

  const nextDirection = state.pendingDirection || state.direction;
  const vector = VECTORS[nextDirection];
  const head = state.snake[0];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y
  };

  if (isOutOfBounds(nextHead, state.size)) {
    return {
      ...state,
      direction: nextDirection,
      pendingDirection: null,
      isGameOver: true
    };
  }

  const ateFood = state.food && sameCell(nextHead, state.food);
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1);
  if (hasCollision(nextHead, bodyToCheck)) {
    return {
      ...state,
      direction: nextDirection,
      pendingDirection: null,
      isGameOver: true
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!ateFood) {
    nextSnake.pop();
  }

  let nextFood = state.food;
  let score = state.score;
  let isGameOver = false;
  let hasWon = false;

  if (ateFood) {
    score += 1;
    nextFood = randomFreeCell(state.size, nextSnake, rng);
    if (!nextFood) {
      isGameOver = true;
      hasWon = true;
    }
  }

  return {
    ...state,
    snake: nextSnake,
    direction: nextDirection,
    pendingDirection: null,
    food: nextFood,
    score,
    isGameOver,
    hasWon
  };
}

export function randomFreeCell(size, snake, rng = Math.random) {
  const occupied = new Set(snake.map((cell) => toKey(cell)));
  const freeCells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const key = toKey({ x, y });
      if (!occupied.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) return null;
  const index = Math.floor(rng() * freeCells.length);
  return freeCells[index];
}

function hasCollision(head, snake) {
  return snake.some((part) => sameCell(part, head));
}

function isOutOfBounds(cell, size) {
  return cell.x < 0 || cell.y < 0 || cell.x >= size || cell.y >= size;
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function toKey(cell) {
  return `${cell.x},${cell.y}`;
}
