let gameState = 'CLASS_SELECT'; // 'CLASS_SELECT', 'PLAYING', 'GAME_OVER'
let selectedClass = null;

// Add pause state
let isPaused = false;

// Add debug state and controls
let isDebugMode = false;
let isInvincible = false;

let player = null;
let enemies = [];
let asteroids = [];
let healthPacks = [];
let gems = [];
let gameOver = false;
let score = 0;