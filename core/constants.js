// Game States
const GAME_STATES = {
    CLASS_SELECT: 'CLASS_SELECT',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    SETTINGS: 'SETTINGS'
};

// World Constants
const WORLD_WIDTH = Math.max(3000, window.innerWidth * 2);
const WORLD_HEIGHT = Math.max(3000, window.innerHeight * 2);

// Upgrade Levels
const UPGRADE_LEVELS = {
    LEVEL1: { gems: 100 },
    LEVEL2: { gems: 250 },
    LEVEL3: { gems: 500 },
    LEVEL4: { gems: 1000 },
    LEVEL5: { gems: 2000 }
};

// Ship Classes
const SHIP_CLASSES = {
    FIGHTER: {
        name: 'Fighter',
        health: 100,
        maxSpeed: 6,
        acceleration: 0.6,
        rotationalAcceleration: 0.015,
        shootCost: 10,
        maxEnergy: 100,
        energyRegen: 1.3,
        color: '#42f554',
        xpRequired: 0
    },
    TANK: {
        name: 'Tank',
        health: 200,
        maxSpeed: 3,
        acceleration: 0.3,
        rotationalAcceleration: 0.005,
        shootCost: 25,
        maxEnergy: 150,
        energyRegen: 0.8,
        healthRegen: 0.15,
        color: '#4287f5',
        xpRequired: 350
    },
    SPEEDSTER: {
        name: 'Speedster',
        health: 75,
        maxSpeed: 10.5,
        acceleration: 0.7,
        rotationalAcceleration: 0.015,
        shootCost: 8,
        maxEnergy: 80,
        energyRegen: 0.9,
        color: '#f542f2',
        xpRequired: 350
    },
    SNIPER: {
        name: 'Sniper',
        health: 85,
        maxSpeed: 5.5,
        acceleration: 0.5,
        rotationalAcceleration: 0.008,
        shootCost: 35,
        maxEnergy: 120,
        energyRegen: 0.4,
        color: '#f5d742',
        xpRequired: 500
    }
}; 