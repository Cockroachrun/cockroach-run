import { debugLog } from "../utils/utils.js";

// Initialize the loading screen
export function initLoading(gameState, showScreenCallback) {
  debugLog("Initializing loading screen");

  // Ensure loading screen is showing
  showScreenCallback("loading-screen");

  // Get loading elements
  const loadingBar = document.getElementById("loading-bar");
  const loadingStatus = document.getElementById("loading-status");
  const skipButton = document.getElementById("skip-loading-button");

  if (!loadingBar || !loadingStatus || !skipButton) {
    console.error("[ERROR] Loading screen elements missing!");
    return;
  }

  // Skip button functionality
  skipButton.addEventListener("click", () => {
    console.log("[UI] Skip button clicked");
    completeLoading();
  });

  // Simulate loading
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 5;
    if (progress > 100) progress = 100;

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

    if (progress >= 100) {
      clearInterval(loadingInterval);
      completeLoading();
    }
  }, 100);

  // Function to complete loading
  function completeLoading() {
    console.log("[UI] Completing loading process");
    clearInterval(loadingInterval);
    loadingBar.style.width = "100%";
    loadingStatus.textContent = "Loading complete!";

    // Add fade-out animation
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.classList.add("fade-out");
    }

    // Move to start screen after animation
    setTimeout(() => {
      console.log("[UI] Transitioning to start screen");
      showScreenCallback("start-screen");

      // Start menu music
      const menuMusic = document.getElementById("menu-music");
      if (menuMusic) {
        menuMusic.play().catch((e) => {
          debugLog("Music autoplay blocked by browser", "warn");
        });
      }

      debugLog("Loading complete, showing start screen");
    }, 500);
  }
}
