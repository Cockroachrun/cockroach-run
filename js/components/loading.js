import { debugLog } from "../utils/utils.js";

// Initialize the loading screen
export function initLoading(gameState, showScreenCallback) {
  debugLog("Initializing loading screen");

  // Ensure loading screen is visible
  showScreenCallback("loading-screen");

  // Get loading screen elements
  const loadingBar = document.getElementById("loading-bar");
  const loadingStatus = document.getElementById("loading-status");
  const skipButton = document.getElementById("skip-loading-button");

  if (!loadingBar || !loadingStatus || !skipButton) {
    console.error("[ERROR] Loading screen elements not found!");
    return;
  }

  // Skip button functionality
  skipButton.addEventListener("click", () => {
    console.log("[UI] Skip loading button clicked");
    completeLoading();
  });

  // Simulate loading
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 5;
    if (progress > 100) progress = 100;

    // Update loading bar
    loadingBar.style.width = `${progress}%`;

    // Update status text based on progress
    if (progress < 30) {
      loadingStatus.textContent = "Loading game assets...";
    } else if (progress < 60) {
      loadingStatus.textContent = "Initializing game environment...";
    } else if (progress < 90) {
      loadingStatus.textContent = "Preparing cockroach models...";
    } else {
      loadingStatus.textContent = "Almost ready...";
    }

    // Complete loading when progress reaches 100
    if (progress >= 100) {
      clearInterval(loadingInterval);
      completeLoading();
    }
  }, 100);

  // Function to complete loading
  function completeLoading() {
    clearInterval(loadingInterval);
    loadingBar.style.width = "100%";
    loadingStatus.textContent = "Loading complete!";

    // Add fade-out animation
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.classList.add("fade-out");

    // Move to start screen after animation
    setTimeout(() => {
      showScreenCallback("start-screen");
      debugLog("Loading complete, showing start screen");

      // Try to play menu music
      const menuMusic = document.getElementById("menu-music");
      if (menuMusic) {
        menuMusic.play().catch((e) => {
          debugLog("Music autoplay blocked by browser", "warn");
        });
      }
    }, 500);
  }
}
