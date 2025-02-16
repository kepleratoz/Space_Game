const SHIP_CLASSES = {
    FIGHTER: {
        name: 'Fighter',
        description: 'Balanced ship with good maneuverability',
        health: 100,
        maxSpeed: 10,
        acceleration: 0.4,
        rotationalAcceleration: 0.03,
        shootCost: 10,
        maxEnergy: 100,
        energyRegen: 0.3,
        color: '#00ff00',
        xpRequired: 0
    },
    TANK: {
        name: 'Tank',
        description: 'High health and damage, but slow',
        health: 150,
        maxSpeed: 7,
        acceleration: 0.3,
        rotationalAcceleration: 0.02,
        shootCost: 15,
        maxEnergy: 150,
        energyRegen: 0.2,
        color: '#00aaff',
        xpRequired: 0
    },
    SPEEDSTER: {
        name: 'Speedster',
        description: 'Fast and agile, but fragile',
        health: 70,
        maxSpeed: 13,
        acceleration: 0.5,
        rotationalAcceleration: 0.04,
        shootCost: 8,
        maxEnergy: 80,
        energyRegen: 0.4,
        color: '#ff00ff',
        xpRequired: 0
    },
    SNIPER: {
        name: 'Sniper',
        description: 'Single powerful cannon, slow but deadly',
        health: 75,
        maxSpeed: 6,
        acceleration: 0.25,
        rotationalAcceleration: 0.02,
        shootCost: 25,
        maxEnergy: 120,
        energyRegen: 0.2,
        color: '#ffff00',
        xpRequired: 100
    }
};