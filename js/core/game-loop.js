/**
 * Fixed time step game loop module
 * Usage:
 * import { startGameLoop } from './core/game-loop.js';
 * startGameLoop(updateFunction, renderFunction);
 */

export function startGameLoop(update, render, options = {}) {
  const fps = options.fps || 60;
  const timestep = 1000 / fps;

  let lastTime = performance.now();
  let accumulator = 0;

  function gameLoop(now) {
    accumulator += now - lastTime;
    lastTime = now;

    while (accumulator >= timestep) {
      update(timestep / 1000); // Pass deltaTime in seconds
      accumulator -= timestep;
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    requestAnimationFrame(gameLoop);
  });
}
