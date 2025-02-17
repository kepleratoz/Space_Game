// Game state is now managed in index.js
// This file can be used for state-related utilities and functions

// Mouse state
const mouse = {
    x: 0,
    y: 0,
    isDown: false,    // Left button
    rightDown: false, // Right button
    middleDown: false // Middle button
};

// Keyboard state
const keys = {};

// Game state management
let gameState = GAME_STATES.CLASS_SELECT;
let selectedClass = null;
let selectedShipClass = null;
let selectedShipForAbilities = null;
let showingAbilityUnlockScreen = false;
let isPaused = false;
let isDebugMode = false;
let isInvincible = false;
let gameOver = false;
let score = 0;

// Settings management
let settings = {
    maxFPS: 60,
    controlMode: 'mouse', // 'mouse' or 'keyboard'
    keybinds: {
        up: 'w',
        down: 's',
        left: 'a',
        right: 'd',
        shoot: 'LMB', // Default to left mouse button
        pause: 'p',
        debug: 'o'
    }
};

// Default settings for easy restoration
const DEFAULT_SETTINGS = {
    maxFPS: 60,
    controlMode: 'mouse',
    keybinds: {
        up: 'w',
        down: 's',
        left: 'a',
        right: 'd',
        shoot: 'LMB',
        pause: 'p',
        debug: 'o'
    }
};

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('spaceGameSettings');
    if (savedSettings) {
        const loaded = JSON.parse(savedSettings);
        settings = {
            ...settings,
            maxFPS: loaded.maxFPS || DEFAULT_SETTINGS.maxFPS,
            controlMode: loaded.controlMode || DEFAULT_SETTINGS.controlMode,
            keybinds: { ...settings.keybinds, ...loaded.keybinds }
        };
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('spaceGameSettings', JSON.stringify(settings));
}

// Restore default settings
function restoreDefaultSettings() {
    settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // Deep copy
    saveSettings();
}

// Game objects
let player = null;
let enemies = [];
let asteroids = [];
let healthPacks = [];
let gems = [];
let enemyProjectiles = [];

// Game state functions
function resetGameState() {
    gameState = GAME_STATES.CLASS_SELECT;
    selectedClass = null;
    selectedShipClass = null;
    selectedShipForAbilities = null;
    showingAbilityUnlockScreen = false;
    isPaused = false;
    isDebugMode = false;
    isInvincible = false;
    gameOver = false;
    score = 0;
    
    // Reset game objects
    player = null;
    enemies = [];
    asteroids = [];
    healthPacks = [];
    gems = [];
    enemyProjectiles = [];
}

function initializeWaveSystem() {
    window.waveNumber = 1;
    window.enemiesRemainingInWave = 5;
    window.waveStartTime = Date.now();
    window.waveTimer = 0;
}

// Keybind management
let isRemappingKey = false;
let currentRemappingAction = null;

// Initialize settings on load
loadSettings();