// Game States
const GAME_STATES = {
    CLASS_SELECT: 'CLASS_SELECT',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    SETTINGS: 'SETTINGS',
    STATION: 'STATION'
};

// World Constants
const WORLD_WIDTH = Math.max(4500, window.innerWidth * 3);
const WORLD_HEIGHT = Math.max(4500, window.innerHeight * 3);

// Testing Zone Constants
const TESTING_ZONE = {
    WIDTH: WORLD_WIDTH,  // Match world width
    HEIGHT: WORLD_HEIGHT, // Match world height
    LINE_COUNT: 15,
    LINE_SEGMENTS: 8,
    CIRCLE_RADIUS: 15,
    LINE_WIDTH: 3
};

// Game Zones
const GAME_ZONES = {
    TESTING: 'TESTING',
    STATION: 'STATION',
    MAIN: 'MAIN',
    DEBRIS_FIELD: 'DEBRIS_FIELD'
};

// Station Constants
const STATION = {
    WIDTH: 1800,
    HEIGHT: 1500,
    HEAL_POSITION: { x: 0, y: 0 }, // Will be set dynamically
    SHIP_POSITION: { x: 0, y: 0 }, // Will be set dynamically
    SHOP_POSITION: { x: 0, y: 0 }, // Will be set dynamically
    INTERACTION_RADIUS: 80
};

// Debris Field Constants
const DEBRIS_FIELD = {
    WIDTH: 3000,
    HEIGHT: 3000,
    WALL_POINTS: [
        // Irregular shape with twists and turns - scaled up by 1.5x
        { x: 0, y: 0 },
        { x: 600, y: 150 },
        { x: 1200, y: 75 },
        { x: 1800, y: 300 },
        { x: 2400, y: 150 },
        { x: 3000, y: 0 },
        { x: 3000, y: 600 },
        { x: 2850, y: 1200 },
        { x: 3000, y: 1800 },
        { x: 2700, y: 2400 },
        { x: 3000, y: 3000 },
        { x: 2400, y: 3000 },
        { x: 1800, y: 2850 },
        { x: 1200, y: 3000 },
        { x: 600, y: 2700 },
        { x: 0, y: 3000 },
        { x: 0, y: 2400 },
        { x: 150, y: 1800 },
        { x: 0, y: 1200 },
        { x: 300, y: 600 },
        { x: 0, y: 0 }
    ],
    WALL_WIDTH: 40,
    BACKGROUND_COLOR: '#1a1a2e',
    WALL_COLOR: '#4a4a6a'
};

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
        xpRequired: 0,
        archetypes: {
            ASSAULT: {
                name: 'Assault Fighter',
                health: 25,
                maxSpeed: 6,
                acceleration: 0.6,
                rotationalAcceleration: 0.015,
                shootCost: 10,
                maxEnergy: 120,
                energyRegen: 1.3,
                healthRegen: 0.04,
                contactDamageReduction: 5,
                color: '#ff4242',
                energyScaling: {
                    maxEnergyPerLevel: [20, 20, 10], // Level 2: 140, Level 3: 160, Level 4: 170
                    regenPerLevel: 0.2
                }
            }
        }
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
    },
    RAMMER: {
        name: 'Rammer',
        health: 125,
        maxSpeed: 7,
        acceleration: 0.5,
        rotationalAcceleration: 0.012,
        shootCost: 40,
        maxEnergy: 100,
        energyRegen: 1.0,
        healthRegen: 0.08,
        color: '#ff4242',
        xpRequired: 500,
        energyScaling: {
            maxEnergyPerLevel: 15,
            regenPerLevel: 0.2,
            costPerLevel: 10
        }
    }
}; 