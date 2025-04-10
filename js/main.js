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

  // Force renderer canvas position and z-index for UI layering
  window.game.renderer.domElement.style.position = "absolute";
  window.game.renderer.domElement.style.zIndex = "1";

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
  console.log(`[UI] Attempting to show screen: ${screenId}`);

  // Hide all screens using both class and direct style
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
    screen.style.display = "none"; // Explicitly set display none
    console.log(`[UI] Hidden screen: ${screen.id}`);
  });

  // Show requested screen using both class and direct style
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add("active");
    screen.style.display = "flex"; // Explicitly set display flex
    console.log(`[UI] Made visible: ${screenId}`);
    gameState.currentScreen = screenId;

    // Special handling for specific screens
    switch (screenId) {
      case "game-mode-screen":
        console.log("[UI] Applying game mode screen specifics");
        break;
      case "character-screen":
        console.log("[UI] Applying character screen specifics");
        break;
    }
  } else {
    debugLog(`Screen not found: ${screenId}`, "error");
    console.error(
      `[ERROR] Screen element with ID "${screenId}" not found in the DOM`
    );

    // List all screens to help debug
    document.querySelectorAll(".screen").forEach((s) => {
      console.log(`[UI] Available screen: ${s.id || "no-id"}`);
    });
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

window.debugUI = {
  listScreens: function () {
    const screens = document.querySelectorAll(".screen");
    console.log(`Found ${screens.length} screens:`);
    screens.forEach((screen) => {
      console.log(
        `ID: ${screen.id}, Display: ${
          getComputedStyle(screen).display
        }, Classes: ${screen.className}`
      );
    });
  },

  showScreen: function (screenId) {
    showScreen(screenId);
    console.log(`Manually triggered showing screen: ${screenId}`);
  },

  forceShowScreen: function (screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      // First hide all screens
      document.querySelectorAll(".screen").forEach((s) => {
        s.style.display = "none";
        s.classList.remove("active");
      });

      // Force show the requested screen
      screen.style.display = "flex";
      screen.classList.add("active");
      console.log(
        `Forced screen ${screenId} to be visible with explicit styling`
      );
    } else {
      console.error(`Screen ${screenId} not found`);
      // List all available screens
      console.log("Available screens:");
      document.querySelectorAll(".screen").forEach((s, i) => {
        console.log(`${i}: ID="${s.id || "NO ID"}"`);
      });
    }
  },

  checkCanvasZIndex: function () {
    const canvases = document.querySelectorAll("canvas");
    console.log(`Found ${canvases.length} canvas elements:`);
    canvases.forEach((canvas, i) => {
      console.log(
        `Canvas ${i}: z-index: ${getComputedStyle(canvas).zIndex}, position: ${
          getComputedStyle(canvas).position
        }`
      );
    });
  },
};
