/**
 * Utility functions for the game
 */

/**
 * Logs a message with timestamp and level
 * @param {string} message - The message to log
 * @param {'info'|'warn'|'error'} [level='info'] - Log level
 */
export function debugLog(message, level = "info") {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  switch (level) {
    case "warn":
      console.warn(formattedMessage);
      break;
    case "error":
      console.error(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

/**
 * Returns a random integer between min and max (inclusive)
 * @param {number} min - Minimum integer
 * @param {number} max - Maximum integer
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random float between min and max
 * @param {number} min - Minimum float
 * @param {number} max - Maximum float
 * @returns {number}
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Clamps a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linearly interpolates between a and b by t
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Checks if a value is within a range (inclusive)
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function inRange(value, min, max) {
  return value >= min && value <= max;
}
