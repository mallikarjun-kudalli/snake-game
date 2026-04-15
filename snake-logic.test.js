import test from "node:test";
import assert from "node:assert/strict";
import { makeInitialState, queueDirection, randomFreeCell, stepGame } from "./snake-logic.js";

test("moves one cell in current direction", () => {
  const state = makeInitialState(20, () => 0);
  const next = stepGame(state, () => 0);
  assert.deepEqual(next.snake[0], { x: 4, y: 10 });
  assert.equal(next.score, 0);
  assert.equal(next.isGameOver, false);
});

test("prevents direct reversal", () => {
  const state = makeInitialState(20, () => 0);
  const queued = queueDirection(state, "left");
  assert.equal(queued.pendingDirection, null);
});

test("grows and scores when eating food", () => {
  const state = {
    size: 6,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 }
    ],
    direction: "right",
    pendingDirection: null,
    food: { x: 3, y: 2 },
    score: 0,
    isGameOver: false,
    hasWon: false
  };

  const next = stepGame(state, () => 0);
  assert.equal(next.snake.length, 4);
  assert.equal(next.score, 1);
  assert.equal(next.isGameOver, false);
  assert.notDeepEqual(next.food, { x: 3, y: 2 });
});

test("ends game on wall collision", () => {
  const state = {
    size: 4,
    snake: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 }
    ],
    direction: "right",
    pendingDirection: null,
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    hasWon: false
  };

  const next = stepGame(state, () => 0);
  assert.equal(next.isGameOver, true);
});

test("ends game on self collision", () => {
  const state = {
    size: 8,
    snake: [
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 2 }
    ],
    direction: "left",
    pendingDirection: "down",
    food: { x: 7, y: 7 },
    score: 0,
    isGameOver: false,
    hasWon: false
  };

  const next = stepGame(state, () => 0);
  assert.equal(next.isGameOver, true);
});

test("food is placed on a free cell", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ];
  const food = randomFreeCell(3, snake, () => 0);
  assert.deepEqual(food, { x: 0, y: 1 });
});
