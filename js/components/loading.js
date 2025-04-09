import { debugLog } from "../utils/utils.js";

// Initialize the loading screen
export function initLoading(gameState, showScreenCallback) {
  debugLog("Initializing loading screen");

  // Show loading screen immediately
  showScreenCallback("loading-screen");

  // Set up loading screen content
  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) {
    console.error("Loading screen element not found!");
    return;
  }

  // Clear and rebuild loading screen content
  loadingScreen.innerHTML = `
    <div class="loading-container">
      <img src="assets/images/logo_title.png" alt="Cockroach Run" class="loading-logo">
      <div class="loading-bar-container">
        <div id="loading-bar" class="loading-bar"></div>
      </div>
      <div id="loading-status" class="loading-status">Loading assets...</div>
      <div class="loading-flavor">"Roaches scurry in the shadows..."</div>
      <div class="loading-info">$Roach to launch soon on Odin.fun</div>
      <button id="skip-loading-button" class="button">Skip Loading</button>
    </div>
  `;

  // Get references to elements
  const loadingBar = document.getElementById("loading-bar");
  const loadingStatus = document.getElementById("loading-status");
  const skipButton = document.getElementById("skip-loading-button");

  if (!loadingBar || !loadingStatus || !skipButton) {
    console.error("Loading screen elements are missing!");
    return;
  }

  // Skip button functionality
  skipButton.addEventListener("click", () => {
    console.log("Skip button clicked");
    completeLoading();
  });

  // Simulate loading
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 5;
    if (progress > 100) progress = 100;

    if (loadingBar) loadingBar.style.width = `${progress}%`;

    // Update status text based on progress
    if (loadingStatus) {
      if (progress < 30) {
        loadingStatus.textContent = "Loading game assets...";
      } else if (progress < 60) {
        loadingStatus.textContent = "Initializing game environment...";
      } else if (progress < 90) {
        loadingStatus.textContent = "Preparing cockroach models...";
      } else {
        loadingStatus.textContent = "Almost ready...";
      }
    }

    if (progress >= 100) {
      clearInterval(loadingInterval);
      completeLoading();
    }
  }, 100);

  // Function to complete loading
  function completeLoading() {
    clearInterval(loadingInterval);
    if (loadingBar) loadingBar.style.width = "100%";
    if (loadingStatus) loadingStatus.textContent = "Loading complete!";

    console.log("Loading complete, transitioning to start screen...");

    // Add fade-out animation
    loadingScreen.classList.add("fade-out");

    // Move to start screen after animation
    setTimeout(() => {
      console.log("Showing start screen...");
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
