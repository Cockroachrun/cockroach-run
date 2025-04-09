import { debugLog } from "../utils/utils.js";

// Initialize the loading screen
export function initLoading(gameState, showScreenCallback) {
  debugLog("Initializing loading screen");

  // Make sure we're showing the loading screen first
  showScreenCallback("loading-screen");

  // Find loading elements or create them if missing
  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) {
    console.error("Loading screen element not found!");
    return;
  }

  // Get or create loading UI elements
  let loadingBar = document.getElementById("loading-bar");
  let loadingStatus = document.getElementById("loading-status");
  let skipButton = document.getElementById("skip-loading-button");

  // Create elements if they don't exist
  if (!loadingBar) {
    loadingBar = document.createElement("div");
    loadingBar.id = "loading-bar";
    loadingBar.className = "loading-bar";
    loadingScreen.appendChild(loadingBar);
  }

  if (!loadingStatus) {
    loadingStatus = document.createElement("p");
    loadingStatus.id = "loading-status";
    loadingStatus.textContent = "Loading assets...";
    loadingScreen.appendChild(loadingStatus);
  }

  if (!skipButton) {
    skipButton = document.createElement("button");
    skipButton.id = "skip-loading-button";
    skipButton.textContent = "Skip Loading";
    skipButton.className = "button";
    loadingScreen.appendChild(skipButton);
  }

  // Show skip button after delay
  setTimeout(() => {
    skipButton.classList.add("visible");
  }, 1000);

  // Skip button functionality
  skipButton.addEventListener("click", () => {
    completeLoading();
  });

  // Simulate loading process
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
  }, 200);

  // Function to complete loading
  function completeLoading() {
    clearInterval(loadingInterval);
    loadingBar.style.width = "100%";
    loadingStatus.textContent = "Loading complete!";

    // Add fade-out animation
    loadingScreen.classList.add("fade-out");

    // Move to start screen after animation
    setTimeout(() => {
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
