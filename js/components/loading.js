import { debugLog } from "../utils/utils.js";

// Initialize the loading screen
export function initLoading(gameState, showScreenCallback) {
  debugLog("Initializing loading screen");

  // Create loading screen content
  const loadingScreen = document.getElementById("loading-screen");

  loadingScreen.innerHTML = `
        <img src="assets/images/logo_title.png" alt="Cockroach Run" class="loading-logo-image">
        <div class="loading-bar-container">
            <div id="loading-bar" class="loading-bar"></div>
        </div>
        <div id="loading-status" class="loading-status">Loading assets...</div>
        <div class="transition-text">
            "Roaches scurry in the shadows..."
        </div>
        <div id="loading-quote" class="loading-quote">"Roaches scurry in the shadows..."</div>
        <div class="promo-text">
            <span class="highlight">$Roach</span> to launch soon on <span class="highlight">Odin.fun</span>
        </div>
        <div id="loading-error" class="loading-error" style="display:none;">An error occurred. Retrying with fallback options...</div>
        <button id="skip-loading-button" class="skip-button">Skip Loading</button>
    `;

  // Get elements
  const loadingBar = document.getElementById("loading-bar");
  const loadingStatus = document.getElementById("loading-status");
  const skipButton = document.getElementById("skip-loading-button");

  console.log("--- Loading Screen Element IDs Check ---");
  [
    "loading-bar",
    "loadingBar",
    "loading-status",
    "loadingStatus",
    "skip-loading-button",
    "skipLoadingButton",
  ].forEach((id) => {
    const el = document.getElementById(id);
    console.log(`Element with ID "${id}":`, el);
  });
  console.log("Loading screen innerHTML:", loadingScreen.innerHTML);
  console.log("---------------------------------------");

  // Show skip button after delay
  setTimeout(() => {
    skipButton.classList.add("visible");
  }, 1000);

  // Skip button functionality
  skipButton.addEventListener("click", () => {
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
