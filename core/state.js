// Game state is now managed in index.js
// This file can be used for state-related utilities and functions

// Mouse state
const mouse = {
    x: 0,
    y: 0,
    isDown: false
};

// Game state management
let gameState = GAME_STATES.CLASS_SELECT;
let selectedClass = null;
let isPaused = false;
let isDebugMode = false;
let isInvincible = false;
let gameOver = false;
let score = 0;

// Settings management
let settings = {
    maxFPS: 60
};

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('spaceGameSettings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('spaceGameSettings', JSON.stringify(settings));
}

// Game objects
let player = null;
let enemies = [];
let asteroids = [];
let healthPacks = [];
let gems = [];

// Game state functions
function resetGameState() {
    gameState = GAME_STATES.CLASS_SELECT;
    selectedClass = null;
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
}

function initializeWaveSystem() {
    window.waveNumber = 1;
    window.enemiesRemainingInWave = 5;
    window.waveStartTime = Date.now();
    window.waveTimer = 0;
}

// Initialize settings on load
loadSettings();