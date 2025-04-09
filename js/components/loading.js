import { debugLog } from "../utils/utils.js";

// Initialize the loading screen
export function initLoading(gameState, showScreenCallback) {
  debugLog("Initializing loading screen");

  // Make sure we're showing the loading screen first
  showScreenCallback("loading-screen");

  // Find or create loading elements
  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) {
    console.error("Loading screen element not found!");
    return;
  }

  // If loading screen doesn't have a loading bar, create one
  let loadingBar = document.getElementById("loading-bar");
  if (!loadingBar) {
    // Create loading bar container
    const loadingBarContainer = document.createElement("div");
    loadingBarContainer.className = "loading-bar-container";
    loadingScreen.appendChild(loadingBarContainer);

    // Create loading bar
    loadingBar = document.createElement("div");
    loadingBar.id = "loading-bar";
    loadingBar.className = "loading-bar";
    loadingBarContainer.appendChild(loadingBar);
  }

  // If loading screen doesn't have a status text, create one
  let loadingStatus = document.getElementById("loading-status");
  if (!loadingStatus) {
    loadingStatus = document.createElement("div");
    loadingStatus.id = "loading-status";
    loadingStatus.className = "loading-status";
    loadingStatus.textContent = "Loading assets...";
    loadingScreen.appendChild(loadingStatus);
  }

  // If loading screen doesn't have a skip button, create one
  let skipButton = document.getElementById("skip-loading-button");
  if (!skipButton) {
    skipButton = document.createElement("button");
    skipButton.id = "skip-loading-button";
    skipButton.textContent = "Skip Loading";
    loadingScreen.appendChild(skipButton);
  }

  // Ensure the loading screen is visible
  loadingScreen.style.display = "flex";
  loadingScreen.classList.add("active");

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
    if (loadingBar) loadingBar.style.width = "100%";
    if (loadingStatus) loadingStatus.textContent = "Loading complete!";

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
