// Import modules
import { initLoading } from './components/loading.js';
import { initMenu } from './components/menu.js';
import { initCharacters } from './components/characters.js';
import { initGameUI } from './components/game-ui.js';
import { initAudio } from './core/audio.js';
import { initWallet } from './services/wallet.js';
import { debugLog } from './utils/utils.js';

// Game state
const gameState = {
    currentScreen: 'loading-screen',
    selectedMode: 'free',
    selectedCharacter: 'default',
    isRunning: false,
    isPaused: false,
    walletConnected: false,
    ordinalsDetected: false
};

// Initialize the game
function initGame() {
    debugLog('Initializing game');
    
    // Initialize all components
    initLoading(gameState, showScreen);
    initMenu(gameState, showScreen);
    initCharacters(gameState, showScreen);
    initGameUI(gameState);
    initAudio();
    initWallet(gameState);
    
    // Set up global error handling
    window.addEventListener('error', handleError);
    
    debugLog('Game initialized');
}

// Screen management
function showScreen(screenId) {
    debugLog(`Showing screen: ${screenId}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        gameState.currentScreen = screenId;
        
        // Special handling for specific screens
        switch(screenId) {
            case 'game-mode-screen':
                // Any specific logic for game mode screen
                break;
            case 'character-screen':
                // Any specific logic for character screen
                break;
        }
    } else {
        debugLog(`Screen not found: ${screenId}`, 'error');
    }
}

// Error handling
function handleError(event) {
    debugLog(`Error: ${event.error.message}`, 'error');
    console.error('Full error:', event.error);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);

// Export functions for debugging
window.gameDebug = {
    getState: () => JSON.parse(JSON.stringify(gameState)),
    showScreen: showScreen
};