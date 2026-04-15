# Classic Snake Game

A minimal, dependency-free implementation of the classic Snake game.

## Features

- Grid-based snake movement
- Food spawning and snake growth
- Score tracking
- Game-over on wall or self collision
- Restart and pause controls
- Keyboard and on-screen controls

## Run Locally

From the project folder:

```powershell
python -m http.server 5173
```

Then open:

`http://localhost:5173`

## Controls

- Move: Arrow keys or `W`, `A`, `S`, `D`
- Pause/Resume: `Space` or `P`
- Restart: `R` or the Restart button

## Test Logic

If Node.js is installed:

```powershell
node --test snake-logic.test.js
```

## Manual Verification Checklist

- Snake moves correctly in a grid at a steady tick.
- Snake grows and score increments when food is eaten.
- Game ends when snake hits wall or itself.
- Pause and resume work.
- Restart resets board and score.
