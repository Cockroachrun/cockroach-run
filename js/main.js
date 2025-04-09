// Import modules
import { initLoading } from "./components/loading.js";
import { initMenu } from "./components/menu.js";
import { initCharacters } from "./components/characters.js";
import { initGameUI } from "./components/game-ui.js";
import { initAudio } from "./core/audio.js";
import { initWallet } from "./services/wallet.js";
import { debugLog } from "./utils/utils.js";
import { startGameLoop } from "./core/game-loop.js";
import { AssetLoader } from "./core/asset-loader.js";

// Game state
const gameState = {
  currentScreen: "loading-screen",
  selectedMode: "free",
  selectedCharacter: "default",
  isRunning: false,
  isPaused: false,
  walletConnected: false,
  ordinalsDetected: false,
};

// Initialize the game
function initGame() {
  debugLog("Initializing game");

  // Initialize core Three.js components and asset loader
  window.game = {};

  // Scene
  window.game.scene = new THREE.Scene();

  // Camera
  window.game.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  window.game.camera.position.set(0, 5, 10);

  // Renderer
  const canvas = document.getElementById("gameCanvas");
  window.game.renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  window.game.renderer.setSize(window.innerWidth, window.innerHeight);
  window.game.renderer.shadowMap.enabled = true;

  // Asset Loader
  window.game.assetLoader = new AssetLoader();

  // Basic animation loop
  startGameLoop(
    (dt) => {
      console.log("[GameLoop] Update tick, dt:", dt);
      // Update game state (fixed time step)
      if (window.game && window.game.sceneManager) {
        window.game.sceneManager.update(dt);
      }
    },
    () => {
      console.log("[GameLoop] Render frame");
      // Render frame
      if (window.game) {
        window.game.renderer.render(window.game.scene, window.game.camera);
      }
    }
  );

  window.addEventListener("resize", () => {
    window.game.camera.aspect = window.innerWidth / window.innerHeight;
    window.game.camera.updateProjectionMatrix();
    window.game.renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Initialize all components
  initLoading(gameState, showScreen);
  initMenu(gameState, showScreen);
  initCharacters(gameState, showScreen);
  initGameUI(gameState);
  initAudio();
  initWallet(gameState);

  // Set up global error handling
  window.addEventListener("error", handleError);

  debugLog("Game initialized");

  // Diagnostic logs
  console.log("--- Diagnostic Check ---");
  console.log("Is THREE defined:", typeof THREE !== "undefined");
  console.log("Is window.game defined:", typeof window.game !== "undefined");
  if (typeof window.game !== "undefined") {
    console.log("window.game.scene:", window.game.scene);
    console.log("window.game.renderer:", window.game.renderer);
    console.log("window.game.camera:", window.game.camera);
    console.log("window.game.assetLoader:", window.game.assetLoader);
  } else {
    console.log("window.game is not defined");
  }
  console.log("------------------------");
}

// Screen management
function showScreen(screenId) {
  debugLog(`Showing screen: ${screenId}`);

  // Hide all screens
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  // Show requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add("active");
    gameState.currentScreen = screenId;

    // Special handling for specific screens
    switch (screenId) {
      case "game-mode-screen":
        // Any specific logic for game mode screen
        break;
      case "character-screen":
        // Any specific logic for character screen
        break;
    }
  } else {
    debugLog(`Screen not found: ${screenId}`, "error");
  }
}

// Error handling
function handleError(event) {
  debugLog(`Error: ${event.error.message}`, "error");
  console.error("Full error:", event.error);
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initGame);

// Export functions for debugging
window.gameDebug = {
  getState: () => JSON.parse(JSON.stringify(gameState)),
  showScreen: showScreen,
};
