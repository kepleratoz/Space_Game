const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set initial canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Initial resize
resizeCanvas();

// Handle window resizing
window.addEventListener('resize', () => {
    resizeCanvas();
});

// Camera and world settings
const WORLD_WIDTH = Math.max(3000, window.innerWidth * 2);
const WORLD_HEIGHT = Math.max(3000, window.innerHeight * 2);
const camera = {
    x: 0,
    y: 0
};

// Physics constants
const FRICTION = 0.98;
const BOUNCE = 0.7;

// Mouse state
const mouse = {
    x: 0,
    y: 0,
    isDown: false
};

// Add mouse event listeners
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        mouse.isDown = true;
    }
});
window.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left click
        mouse.isDown = false;
    }
});

// Add at the top after initial constants
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

const UPGRADE_LEVELS = {
    LEVEL1: { gems: 100, name: 'Level 1' },
    LEVEL2: { gems: 220, name: 'Level 2' },
    LEVEL3: { gems: 360, name: 'Level 3' },
    LEVEL4: { gems: 560, name: 'Level 4' }
};

// Add before the Player class
let gameState = 'CLASS_SELECT'; // 'CLASS_SELECT', 'PLAYING', 'GAME_OVER'
let selectedClass = null;

// Add pause state
let isPaused = false;

// Add debug state and controls
let isDebugMode = false;
let isInvincible = false;

class Player {
    constructor(shipClass) {
        this.width = 40;
        this.height = 40;
        this.x = WORLD_WIDTH / 2;
        this.y = WORLD_HEIGHT / 2;
        this.rotation = 0;
        this.rotationalVelocity = 0;
        this.rotationalFriction = 0.85;
        this.maxRotationalVelocity = 0.2;
        this.shipClass = shipClass;
        this.upgradeLevel = 0;
        
        // Apply ship class stats with smaller initial bonuses
        this.maxHealth = shipClass.health;
        this.health = this.maxHealth;
        this.maxSpeed = shipClass.maxSpeed;
        this.acceleration = shipClass.acceleration;
        this.rotationalAcceleration = shipClass.rotationalAcceleration;
        this.shootCost = shipClass.shootCost;
        this.color = shipClass.color;
        
        // Add health regeneration rates based on ship class
        this.healthRegen = 0;
        switch(shipClass.name) {
            case 'Tank':
                this.healthRegen = 0.1; // 6 health per second at 60 FPS
                break;
            case 'Fighter':
                this.healthRegen = 0.08; // 4.8 health per second at 60 FPS
                break;
            case 'Speedster':
                this.healthRegen = 0.03; // 1.8 health per second at 60 FPS
                break;
            case 'Sniper':
                this.healthRegen = 0.02; // 1.2 health per second at 60 FPS
                break;
        }
        
        this.lasers = [];
        this.energy = shipClass.maxEnergy;
        this.maxEnergy = shipClass.maxEnergy;
        this.energyRegen = shipClass.energyRegen;
        this.gems = 0;
        this.maxGems = UPGRADE_LEVELS.LEVEL1.gems;
        this.shootCooldown = 0;
        this.maxShootCooldown = 15;
        this.velocityX = 0;
        this.velocityY = 0;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.mouseControls = true;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.invulnerable ? this.color + '88' : this.color;
        
        // Class-specific ship designs based on upgrade level
        if (this.shipClass.name === 'Fighter') {
            if (this.upgradeLevel === 0) {
                // Basic fighter - sleek and pointed
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - dual wing design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 3);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(0, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - quad wing design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 3);
                ctx.lineTo(-this.width / 3, this.height / 2);
                ctx.lineTo(-this.width / 2, 0);
                ctx.lineTo(-this.width / 3, -this.height / 2);
                ctx.lineTo(this.width / 4, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - advanced fighter with multiple cannons
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 3);
                ctx.lineTo(0, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(0, -this.height / 2);
                ctx.lineTo(this.width / 3, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            }
        } else if (this.shipClass.name === 'Tank') {
            if (this.upgradeLevel === 0) {
                // Basic tank - wide and sturdy
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 4, -this.height / 2);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - reinforced hull
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 3, -this.height / 2);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - heavy armor
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 2, -this.height / 2);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - fortress design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 2, -this.height / 2);
                ctx.closePath();
                ctx.fill();
                
                // Add armor plates
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        } else if (this.shipClass.name === 'Speedster') {
            if (this.upgradeLevel === 0) {
                // Basic speedster - small and agile
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - streamlined design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 4);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(0, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - aerodynamic form
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 4);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.lineTo(this.width / 4, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - high-tech racer
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 4);
                ctx.lineTo(0, this.height / 3);
                ctx.lineTo(-this.width / 2, this.height / 4);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 4);
                ctx.lineTo(0, -this.height / 3);
                ctx.lineTo(this.width / 3, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            }
        } else if (this.shipClass.name === 'Sniper') {
            if (this.upgradeLevel === 0) {
                // Basic sniper - slow and powerful
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - improved accuracy
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 4);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(0, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - enhanced range
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 4);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.lineTo(this.width / 4, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - master sniper
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 4);
                ctx.lineTo(0, this.height / 3);
                ctx.lineTo(-this.width / 2, this.height / 4);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 4);
                ctx.lineTo(0, -this.height / 3);
                ctx.lineTo(this.width / 3, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
        this.drawStatusBars(screenX, screenY);
    }

    drawStatusBars(screenX, screenY) {
        // Draw gem count text only
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        if (this.upgradeLevel < 4) {
            let nextUpgradeGems;
            switch(this.upgradeLevel) {
                case 0:
                    nextUpgradeGems = UPGRADE_LEVELS.LEVEL1.gems;
                    break;
                case 1:
                    nextUpgradeGems = UPGRADE_LEVELS.LEVEL2.gems;
                    break;
                case 2:
                    nextUpgradeGems = UPGRADE_LEVELS.LEVEL3.gems;
                    break;
                case 3:
                    nextUpgradeGems = UPGRADE_LEVELS.LEVEL4.gems;
                    break;
            }
            // Add black outline to make text more readable
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(`${this.gems}/${nextUpgradeGems}`, screenX, screenY + 25);
            ctx.fillText(`${this.gems}/${nextUpgradeGems}`, screenX, screenY + 25);
        } else {
            // Add black outline to make text more readable
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(`${this.gems}`, screenX, screenY + 25);
            ctx.fillText(`${this.gems}`, screenX, screenY + 25);
        }
        ctx.textAlign = 'left'; // Reset text align
    }

    move() {
        // Handle rotation with physics
        if (this.mouseControls) {
            // Calculate angle to mouse
            const screenX = this.x - camera.x;
            const screenY = this.y - camera.y;
            const targetRotation = Math.atan2(mouse.y - screenY, mouse.x - screenX);
            
            // Calculate the shortest rotation direction
            let rotationDiff = targetRotation - this.rotation;
            while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
            while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
            
            // Apply rotational acceleration towards target
            this.rotationalVelocity += rotationDiff * this.rotationalAcceleration;
        } else {
            if (keys['ArrowLeft']) this.rotationalVelocity -= this.rotationalAcceleration;
            if (keys['ArrowRight']) this.rotationalVelocity += this.rotationalAcceleration;
        }

        // Apply rotational physics
        this.rotationalVelocity *= this.rotationalFriction;
        
        // Limit rotational velocity
        this.rotationalVelocity = Math.max(-this.maxRotationalVelocity, 
            Math.min(this.maxRotationalVelocity, this.rotationalVelocity));
        
        // Apply rotation
        this.rotation += this.rotationalVelocity;
        
        // Forward movement with either W or ArrowUp
        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            this.velocityX += Math.cos(this.rotation) * this.acceleration;
            this.velocityY += Math.sin(this.rotation) * this.acceleration;
        }

        // Apply physics
        this.velocityX *= FRICTION;
        this.velocityY *= FRICTION;

        // Limit speed
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > this.maxSpeed) {
            const ratio = this.maxSpeed / speed;
            this.velocityX *= ratio;
            this.velocityY *= ratio;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // World boundaries with smoother collision
        if (this.x < 0) {
            this.x = 0;
            this.velocityX *= -0.5;
        } else if (this.x > WORLD_WIDTH) {
            this.x = WORLD_WIDTH;
            this.velocityX *= -0.5;
        }
        
        if (this.y < 0) {
            this.y = 0;
            this.velocityY *= -0.5;
        } else if (this.y > WORLD_HEIGHT) {
            this.y = WORLD_HEIGHT;
            this.velocityY *= -0.5;
        }

        // Update camera to follow player smoothly (with less padding)
        const targetCameraX = this.x - canvas.width / 2;
        const targetCameraY = this.y - canvas.height / 2;
        
        camera.x += (targetCameraX - camera.x) * 0.2; // Increased from 0.1 to 0.2
        camera.y += (targetCameraY - camera.y) * 0.2;
        
        // Camera bounds
        camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));
        camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camera.y));

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
    }

    update() {
        // Check for upgrades
        if (this.gems >= UPGRADE_LEVELS.LEVEL4.gems && this.upgradeLevel === 3) {
            this.upgradeLevel = 4;
            this.maxHealth += 50;
            this.health = this.maxHealth;
            this.gems = 0;
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL3.gems && this.upgradeLevel === 2) {
            this.upgradeLevel = 3;
            this.maxHealth += 40;
            this.health = this.maxHealth;
            this.gems = 0;
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL2.gems && this.upgradeLevel === 1) {
            this.upgradeLevel = 2;
            this.maxHealth += 30;
            this.health = this.maxHealth;
            this.gems = 0;
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL1.gems && this.upgradeLevel === 0) {
            this.upgradeLevel = 1;
            this.maxHealth += 20;
            this.health = this.maxHealth;
            this.gems = 0;
        }
        
        // Apply health regeneration if not at full health and not recently damaged
        if (this.health < this.maxHealth && !this.invulnerable) {
            // Increase regeneration rate based on upgrade level
            const regenMultiplier = 1 + (this.upgradeLevel * 0.2); // 20% increase per level
            this.health = Math.min(this.maxHealth, this.health + (this.healthRegen * regenMultiplier));
        }
        
        // Existing update code
        this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen);
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        this.move();
    }

    shoot() {
        if ((!keys[' '] && !mouse.isDown) || this.energy < this.shootCost || this.shootCooldown > 0) return;
        
        let energyCost = this.shootCost;
        
        // Class-specific shooting patterns with different energy costs
        if (this.shipClass.name === 'Fighter') {
            switch(this.upgradeLevel) {
                case 0: // Single precise shot
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1);
                    }
                    break;
                case 1: // Dual shots
                    energyCost *= 1.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.1, 1);
                        this.createLaser(this.rotation + 0.1, 1);
                    }
                    break;
                case 2: // Triple shots
                    energyCost *= 2;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1);
                        this.createLaser(this.rotation - 0.15, 0.8);
                        this.createLaser(this.rotation + 0.15, 0.8);
                    }
                    break;
                default: // Level 3+ - Two side shots and one powerful center shot
                    energyCost *= 2.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1.5);
                        this.createLaser(this.rotation - 0.2, 0.8);
                        this.createLaser(this.rotation + 0.2, 0.8);
                    }
                    break;
            }
        } else if (this.shipClass.name === 'Tank') {
            switch(this.upgradeLevel) {
                case 0: // Single heavy shot
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1.2);
                    }
                    break;
                case 1: // Two heavy shots
                    energyCost *= 1.8;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.1, 1.2);
                        this.createLaser(this.rotation + 0.1, 1.2);
                    }
                    break;
                case 2: // Three spread shots
                    energyCost *= 2.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1.2);
                        this.createLaser(this.rotation - 0.2, 1.2);
                        this.createLaser(this.rotation + 0.2, 1.2);
                    }
                    break;
                default: // Level 3+ - Five heavy spread shots
                    energyCost *= 3;
                    if (this.energy >= energyCost) {
                        for (let i = -2; i <= 2; i++) {
                            this.createLaser(this.rotation + (i * 0.15), 1.3);
                        }
                    }
                    break;
            }
        } else if (this.shipClass.name === 'Speedster') {
            switch(this.upgradeLevel) {
                case 0: // Quick single shot
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 0.8);
                    }
                    break;
                case 1: // Rapid dual shots
                    energyCost *= 1.3;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.05, 0.8);
                        this.createLaser(this.rotation + 0.05, 0.8);
                    }
                    break;
                case 2: // Triple quick shots
                    energyCost *= 1.6;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 0.8);
                        this.createLaser(this.rotation - 0.1, 0.8);
                        this.createLaser(this.rotation + 0.1, 0.8);
                    }
                    break;
                default: // Level 3+ - Four rapid shots in tight formation
                    energyCost *= 2;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.05, 0.8);
                        this.createLaser(this.rotation + 0.05, 0.8);
                        this.createLaser(this.rotation - 0.15, 0.8);
                        this.createLaser(this.rotation + 0.15, 0.8);
                    }
                    break;
            }
        } else if (this.shipClass.name === 'Sniper') {
            switch(this.upgradeLevel) {
                case 0: // Single powerful shot
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1.5, 8);
                    }
                    break;
                case 1: // Two powerful shots
                    energyCost *= 1.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.03, 1.5, 8);
                        this.createLaser(this.rotation + 0.03, 1.5, 8);
                    }
                    break;
                case 2: // Three powerful shots
                    energyCost *= 2;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.05, 1.5, 8);
                        this.createLaser(this.rotation, 1.8, 8);
                        this.createLaser(this.rotation + 0.05, 1.5, 8);
                    }
                    break;
                default: // Level 3+ - Four powerful shots
                    energyCost *= 2.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.08, 1.5, 8);
                        this.createLaser(this.rotation - 0.03, 1.8, 8);
                        this.createLaser(this.rotation + 0.03, 1.8, 8);
                        this.createLaser(this.rotation + 0.08, 1.5, 8);
                    }
                    break;
            }
        }
        
        if (this.energy >= energyCost) {
            this.energy -= energyCost;
            // Sniper has longer cooldown
            this.shootCooldown = this.shipClass.name === 'Sniper' ? this.maxShootCooldown * 2.5 : this.maxShootCooldown;
        }
    }

    createLaser(angle, sizeMultiplier = 1, speedMultiplier = 1) {
        const laser = {
            x: this.x,
            y: this.y,
            velocityX: Math.cos(angle) * (10 * speedMultiplier) + this.velocityX,
            velocityY: Math.sin(angle) * (10 * speedMultiplier) + this.velocityY,
            width: 4 * sizeMultiplier,
            height: 4 * sizeMultiplier,
            rotation: angle,
            color: this.upgradeLevel >= 2 ? this.color : '#ff0000',
            damage: this.shipClass.name === 'Sniper' ? 25 * sizeMultiplier : 10 * sizeMultiplier
        };
        this.lasers.push(laser);
    }

    drawLasers() {
        this.lasers.forEach(laser => {
            ctx.save();
            ctx.translate(laser.x - camera.x, laser.y - camera.y);
            ctx.rotate(laser.rotation);
            ctx.fillStyle = laser.color;
            
            if (this.upgradeLevel >= 2) {
                // Advanced laser appearance
                ctx.shadowColor = laser.color;
                ctx.shadowBlur = 5;
            }
            
            ctx.fillRect(-laser.width/2, -laser.height/2, laser.width, laser.height);
            ctx.restore();
        });
    }

    takeDamage(amount) {
        if (this.invulnerable) return;
        this.health -= amount;
        if (this.health <= 0) {
            gameOver = true;
        }
        // Temporary invulnerability
        this.invulnerable = true;
        this.invulnerableTime = 20; // Reduced from 60 to 20 frames (0.33 seconds)
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    collectGems(amount) {
        this.gems = Math.min(UPGRADE_LEVELS.LEVEL4.gems, this.gems + amount);
    }

    updateLasers() {
        // Update laser positions
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.x += laser.velocityX;
            laser.y += laser.velocityY;

            // Remove lasers that are off screen or out of bounds
            if (laser.x < 0 || laser.x > WORLD_WIDTH || 
                laser.y < 0 || laser.y > WORLD_HEIGHT) {
                this.lasers.splice(i, 1);
            }
        }
    }
}

class Enemy {
    constructor(x, y) {
        this.width = 30;
        this.height = 30;
        this.x = x || Math.random() * WORLD_WIDTH;
        this.y = y || Math.random() * WORLD_HEIGHT;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotation = 0;
        this.health = 30;
        this.color = '#ff0000';
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        this.drawShape(0, 0);
        ctx.restore();
    }

    drawShape(x, y) {
        ctx.fillRect(x - this.width/2, y - this.height/2, this.width, this.height);
    }

    update() {
        this.behavior();
        
        // World boundaries
        this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));

        return this.health <= 0;
    }

    behavior() {
        // Base behavior - do nothing
    }

    takeDamage(amount) {
        this.health -= amount;
    }
}

class ChaserEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff3333';
        this.speed = 3;
        this.health = 20;
    }

    drawShape(x, y) {
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y);
        ctx.lineTo(x - this.width/2, y + this.height/2);
        ctx.lineTo(x - this.width/2, y - this.height/2);
        ctx.closePath();
        ctx.fill();
    }

    behavior() {
        // Chase the player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.rotation = angle;
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
        
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
}

class ShooterEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff6666';
        this.shootCooldown = 0;
        this.maxShootCooldown = 90; // 1.5 seconds
        this.lasers = [];
        this.health = 40;
    }

    drawShape(x, y) {
        // Draw main body
        ctx.fillRect(x - this.width/2, y - this.height/2, this.width, this.height);
        // Draw gun barrel in front
        ctx.fillRect(x, y - this.width/6, this.height/2, this.width/3);
    }

    behavior() {
        // Rotate to face player
        this.rotation = Math.atan2(player.y - this.y, player.x - this.x);
        
        // Move slowly and keep distance
        const distToPlayer = distance(this.x, this.y, player.x, player.y);
        const idealDistance = 300;
        const moveSpeed = 1;
        
        if (distToPlayer < idealDistance - 50) {
            // Move away
            this.velocityX = -Math.cos(this.rotation) * moveSpeed;
            this.velocityY = -Math.sin(this.rotation) * moveSpeed;
        } else if (distToPlayer > idealDistance + 50) {
            // Move closer
            this.velocityX = Math.cos(this.rotation) * moveSpeed;
            this.velocityY = Math.sin(this.rotation) * moveSpeed;
        } else {
            this.velocityX *= 0.95;
            this.velocityY *= 0.95;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Shooting
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.maxShootCooldown;
        } else {
            this.shootCooldown--;
        }

        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.x += laser.velocityX;
            laser.y += laser.velocityY;

            if (laser.x < 0 || laser.x > WORLD_WIDTH || 
                laser.y < 0 || laser.y > WORLD_HEIGHT) {
                this.lasers.splice(i, 1);
            }
        }
    }

    shoot() {
        const laser = {
            x: this.x + Math.cos(this.rotation) * this.width,
            y: this.y + Math.sin(this.rotation) * this.width,
            velocityX: Math.cos(this.rotation) * 8,
            velocityY: Math.sin(this.rotation) * 8,
            width: 4,
            height: 4
        };
        this.lasers.push(laser);
    }

    draw() {
        super.draw();
        
        // Draw lasers
        ctx.fillStyle = '#ff0000';
        this.lasers.forEach(laser => {
            const screenX = laser.x - camera.x;
            const screenY = laser.y - camera.y;
            ctx.fillRect(screenX - laser.width/2, screenY - laser.height/2, laser.width, laser.height);
        });
    }
}

class DasherEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff9999';
        this.rotationSpeed = 0.02;
        this.dashCooldown = 0;
        this.maxDashCooldown = 180; // 3 seconds
        this.dashSpeed = 15;
        this.normalSpeed = 1;
        this.isDashing = false;
        this.dashDuration = 0;
        this.maxDashDuration = 20;
        this.health = 60;
    }

    drawShape(x, y) {
        const size = this.width * (this.isDashing ? 1.2 : 1);
        ctx.beginPath();
        ctx.moveTo(x + size/2, y);
        ctx.lineTo(x - size/2, y + size/2);
        ctx.lineTo(x - size/4, y);
        ctx.lineTo(x - size/2, y - size/2);
        ctx.closePath();
        ctx.fill();
    }

    behavior() {
        // Rotate slowly towards player
        const targetRotation = Math.atan2(player.y - this.y, player.x - this.x);
        const rotationDiff = targetRotation - this.rotation;
        
        // Normalize rotation difference
        let normalizedDiff = rotationDiff;
        while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
        while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
        
        this.rotation += Math.sign(normalizedDiff) * this.rotationSpeed;

        if (this.isDashing) {
            // Continue dash
            this.dashDuration++;
            if (this.dashDuration >= this.maxDashDuration) {
                this.isDashing = false;
                this.dashCooldown = this.maxDashCooldown;
            }
            this.velocityX = Math.cos(this.rotation) * this.dashSpeed;
            this.velocityY = Math.sin(this.rotation) * this.dashSpeed;
        } else {
            // Normal movement
            this.velocityX = Math.cos(this.rotation) * this.normalSpeed;
            this.velocityY = Math.sin(this.rotation) * this.normalSpeed;
            
            // Check if we should start a dash
            if (this.dashCooldown <= 0 && Math.abs(normalizedDiff) < 0.1) {
                this.isDashing = true;
                this.dashDuration = 0;
            } else {
                this.dashCooldown--;
            }
        }

        this.x += this.velocityX;
        this.y += this.velocityY;
    }
}

class HealthPack {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.x = Math.random() * WORLD_WIDTH;
        this.y = Math.random() * WORLD_HEIGHT;
        this.healAmount = 30;
        this.collected = false;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX - this.width/2, screenY - this.height/2, this.width, this.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - this.height/4);
        ctx.lineTo(screenX, screenY + this.height/4);
        ctx.moveTo(screenX - this.width/4, screenY);
        ctx.lineTo(screenX + this.width/4, screenY);
        ctx.stroke();
    }
}

class Asteroid {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = Math.random() * WORLD_WIDTH;
        this.y = Math.random() * WORLD_HEIGHT;
        // Increase initial velocity for more momentum
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.health = 50;
        this.mass = 5; // Add mass property for collision calculations
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some surface detail
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(5, 5, this.width/4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-10, -10, this.width/6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    update() {
        // Apply constant velocity with minimal friction
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;

        // Bounce off world boundaries with high conservation of momentum
        if (this.x < 0 || this.x > WORLD_WIDTH) {
            this.velocityX *= -0.95; // Only lose 5% velocity on bounce
            this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        }
        if (this.y < 0 || this.y > WORLD_HEIGHT) {
            this.velocityY *= -0.95; // Only lose 5% velocity on bounce
            this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
        }

        return this.health <= 0;
    }

    // Add method to handle collision response
    handleCollision(otherObject, overlap, angle) {
        // Calculate mass ratio for collision response
        const otherMass = otherObject.mass || 1;
        const totalMass = this.mass + otherMass;
        const thisRatio = this.mass / totalMass;
        const otherRatio = otherMass / totalMass;

        // Move objects apart based on mass
        this.x -= Math.cos(angle) * overlap * otherRatio;
        this.y -= Math.sin(angle) * overlap * otherRatio;
        otherObject.x += Math.cos(angle) * overlap * thisRatio;
        otherObject.y += Math.sin(angle) * overlap * thisRatio;

        // Transfer some momentum
        const relativeSpeed = Math.sqrt(
            Math.pow(this.velocityX - otherObject.velocityX, 2) +
            Math.pow(this.velocityY - otherObject.velocityY, 2)
        );

        // Heavy objects maintain more of their velocity
        const thisSpeedLoss = 0.1; // Asteroid loses very little speed
        const otherSpeedGain = 0.8; // Other object gets pushed significantly

        otherObject.velocityX = this.velocityX * otherSpeedGain;
        otherObject.velocityY = this.velocityY * otherSpeedGain;
        
        // Slightly adjust asteroid velocity
        this.velocityX *= (1 - thisSpeedLoss);
        this.velocityY *= (1 - thisSpeedLoss);
    }
}

class Gem {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.amount = amount;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = (Math.random() - 0.5) * 4;
        this.friction = 0.98;
        this.attractionRadius = 150; // Radius within which gems are attracted to player
        this.maxAttractionSpeed = 8; // Maximum speed when being attracted
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        ctx.fillStyle = '#f0f';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - this.height/2);
        ctx.lineTo(screenX + this.width/2, screenY);
        ctx.lineTo(screenX, screenY + this.height/2);
        ctx.lineTo(screenX - this.width/2, screenY);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        // Check if player exists and gem is within attraction radius
        if (player) {
            const distToPlayer = distance(this.x, this.y, player.x, player.y);
            if (distToPlayer < this.attractionRadius) {
                // Calculate direction to player
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                
                // Attraction force increases as gem gets closer to player
                const attractionStrength = 0.5 * (1 - distToPlayer / this.attractionRadius);
                
                // Apply attraction force
                this.velocityX += Math.cos(angle) * attractionStrength;
                this.velocityY += Math.sin(angle) * attractionStrength;
                
                // Limit attraction speed
                const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                if (speed > this.maxAttractionSpeed) {
                    const ratio = this.maxAttractionSpeed / speed;
                    this.velocityX *= ratio;
                    this.velocityY *= ratio;
                }
            }
        }

        // Apply existing physics
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Bounce off world boundaries
        if (this.x < 0 || this.x > WORLD_WIDTH) {
            this.velocityX *= -BOUNCE;
            this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        }
        if (this.y < 0 || this.y > WORLD_HEIGHT) {
            this.velocityY *= -BOUNCE;
            this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
        }
    }
}

// Game state
let player = null;
let enemies = [];
let asteroids = [];
let healthPacks = [];
let gems = [];
let gameOver = false;
let score = 0;

// Input handling
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Replace the spawnObjects function with improved wave system
function spawnObjects() {
    // Wave system variables
    if (typeof window.waveNumber === 'undefined') {
        window.waveNumber = 1;
        window.enemiesRemainingInWave = Math.min(5 + window.waveNumber * 2, 25);
        window.waveStartTime = Date.now();
        window.waveTimer = 0;
    }

    // Calculate wave timeout (1.5 minutes * wave number)
    const waveTimeout = 1.5 * 60 * 1000 * window.waveNumber;
    const timeElapsed = Date.now() - window.waveStartTime;

    // If we're between waves
    if (window.enemiesRemainingInWave <= 0 && enemies.length === 0) {
        if (window.waveTimer > 0) {
            window.waveTimer--;
            
            // Display wave information
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.fillText(`Wave ${window.waveNumber} Complete!`, canvas.width/2 - 150, canvas.height/2 - 30);
            ctx.fillText(`Next Wave in ${Math.ceil(window.waveTimer/60)}...`, canvas.width/2 - 120, canvas.height/2 + 30);
            
            // Update waves cleared when completing a wave
            if (window.waveTimer === 299) { // Just completed a wave (first frame of timer)
                updateWavesCleared(player.shipClass.name, window.waveNumber);
            }
            
            return;
        }

        // Start new wave
        window.waveNumber++;
        window.enemiesRemainingInWave = Math.min(5 + window.waveNumber * 2, 25);
        window.waveTimer = 300; // 5 seconds between waves
        window.waveStartTime = Date.now();
        
        // Spawn initial wave enemies
        const baseEnemies = Math.floor(window.waveNumber/2);
        for (let i = 0; i < baseEnemies && enemies.length < 15; i++) {
            spawnEnemy();
        }
        
        // Spawn some asteroids with each wave
        const asteroidsToSpawn = Math.min(3 + Math.floor(window.waveNumber/2), 8);
        while (asteroids.length < asteroidsToSpawn) {
            asteroids.push(new Asteroid());
        }
    } else if (timeElapsed > waveTimeout) {
        // Force next wave if time limit exceeded
        window.enemiesRemainingInWave = 0;
        enemies = [];
        return;
    }

    // During wave spawning
    if (enemies.length < 15 && Math.random() < 0.03 && window.enemiesRemainingInWave > 0) {
        spawnEnemy();
        window.enemiesRemainingInWave--;
    }

    // Health packs spawn more frequently in higher waves
    if (healthPacks.length < 3 && Math.random() < 0.005 + (window.waveNumber * 0.001)) {
        healthPacks.push(new HealthPack());
    }

    // Display current wave and time remaining
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Wave ${window.waveNumber}`, 10, canvas.height - 60);
    ctx.fillText(`Level ${player.upgradeLevel}`, 10, canvas.height - 30);
    
    const timeRemaining = Math.max(0, Math.ceil((waveTimeout - timeElapsed) / 1000));
    if (timeRemaining < 30) {
        ctx.fillStyle = '#ff0000';
    }
    ctx.fillText(`Time Remaining: ${Math.floor(timeRemaining/60)}:${(timeRemaining%60).toString().padStart(2, '0')}`, 10, canvas.height - 90);
}

function spawnEnemy() {
    // Spawn enemies away from the player
    let x, y;
    do {
        x = Math.random() * WORLD_WIDTH;
        y = Math.random() * WORLD_HEIGHT;
    } while (distance(x, y, player.x, player.y) < 400); // Minimum spawn distance from player

    // Enemy type probability changes with waves
    const rand = Math.random();
    if (window.waveNumber < 3) {
        // Early waves: More chasers
        if (rand < 0.7) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.9) {
            enemies.push(new ShooterEnemy(x, y));
        } else {
            enemies.push(new DasherEnemy(x, y));
        }
    } else if (window.waveNumber < 6) {
        // Mid waves: Balanced mix
        if (rand < 0.3) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.6) {
            enemies.push(new ShooterEnemy(x, y));
        } else if (rand < 0.8) {
            enemies.push(new DasherEnemy(x, y));
        } else if (rand < 0.9) {
            enemies.push(new BomberEnemy(x, y));
        } else {
            enemies.push(new SwarmerEnemy(x, y));
        }
    } else {
        // Later waves: More advanced enemies
        if (rand < 0.2) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.4) {
            enemies.push(new ShooterEnemy(x, y));
        } else if (rand < 0.6) {
            enemies.push(new DasherEnemy(x, y));
        } else if (rand < 0.8) {
            enemies.push(new BomberEnemy(x, y));
        } else {
            enemies.push(new SwarmerEnemy(x, y));
        }
    }
}

function drawBackground() {
    // Draw a grid pattern for better spatial awareness
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    const gridSize = 100;
    const offsetX = camera.x % gridSize;
    const offsetY = camera.y % gridSize;
    
    for (let x = -offsetX; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = -offsetY; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function handleCollisions() {
    const playerRadius = player.width / 2;

    // Add asteroid-enemy collisions
    asteroids.forEach(asteroid => {
        const asteroidRadius = asteroid.width / 2;
        
        // Check collisions with enemies
        enemies.forEach(enemy => {
            const enemyRadius = enemy.width / 2;
            const dist = distance(asteroid.x, asteroid.y, enemy.x, enemy.y);
            
            if (dist < asteroidRadius + enemyRadius) {
                // Calculate collision response
                const angle = Math.atan2(enemy.y - asteroid.y, enemy.x - asteroid.x);
                const overlap = (asteroidRadius + enemyRadius) - dist;
                
                // Handle collision physics
                asteroid.handleCollision(enemy, overlap, angle);
                
                // Deal damage to enemy
                const impactSpeed = Math.sqrt(
                    Math.pow(asteroid.velocityX - enemy.velocityX, 2) +
                    Math.pow(asteroid.velocityY - enemy.velocityY, 2)
                );
                
                // Damage based on impact speed
                const damage = Math.min(30, Math.max(10, impactSpeed * 5));
                enemy.takeDamage(damage);
            }
        });
    });

    // Check laser hits with ray-casting
    player.lasers.forEach((laser, laserIndex) => {
        // Store the previous position
        const prevX = laser.x - laser.velocityX;
        const prevY = laser.y - laser.velocityY;
        
        // Check enemies with ray-casting
        let hitSomething = false;
        enemies.forEach((enemy, enemyIndex) => {
            // Check if line segment intersects with enemy circle
            const hit = lineCircleIntersect(
                prevX, prevY,
                laser.x, laser.y,
                enemy.x, enemy.y,
                enemy.width/2
            );
            
            if (hit) {
                hitSomething = true;
                enemy.takeDamage(laser.damage);
                if (enemy.health <= 0) {
                    // Drop gems when enemy is destroyed
                    const gemCount = Math.floor(Math.random() * 3) + 1;
                    for (let i = 0; i < gemCount; i++) {
                        gems.push(new Gem(enemy.x, enemy.y, 10));
                    }
                    enemies.splice(enemyIndex, 1);
                    score += 100;
                }
            }
        });

        // Check asteroids with ray-casting
        asteroids.forEach((asteroid, asteroidIndex) => {
            const hit = lineCircleIntersect(
                prevX, prevY,
                laser.x, laser.y,
                asteroid.x, asteroid.y,
                asteroid.width/2
            );
            
            if (hit) {
                hitSomething = true;
                asteroid.health -= laser.damage;
                if (asteroid.health <= 0) {
                    // Drop gems when asteroid is destroyed
                    const gemCount = Math.floor(Math.random() * 2) + 1;
                    for (let i = 0; i < gemCount; i++) {
                        gems.push(new Gem(asteroid.x, asteroid.y, 5));
                    }
                    asteroids.splice(asteroidIndex, 1);
                    score += 50;
                }
            }
        });

        // Remove laser if it hit something
        if (hitSomething) {
            player.lasers.splice(laserIndex, 1);
        }
    });

    // Check player collisions with enemies and asteroids
    [...enemies, ...asteroids].forEach(object => {
        const objectRadius = object.width / 2;
        const dist = distance(player.x, player.y, object.x, object.y);
        
        if (dist < playerRadius + objectRadius) {
            // Collision response
            const angle = Math.atan2(player.y - object.y, player.x - object.x);
            const overlap = (playerRadius + objectRadius) - dist;
            
            // Push objects apart
            if (object instanceof Asteroid) {
                // For asteroids, use more realistic physics
                const massRatio = 0.3; // Player has more "mass" than asteroid
                
                // Move both objects apart
                player.x += Math.cos(angle) * overlap * (1 - massRatio);
                player.y += Math.sin(angle) * overlap * (1 - massRatio);
                object.x -= Math.cos(angle) * overlap * massRatio;
                object.y -= Math.sin(angle) * overlap * massRatio;
                
                // Calculate bounce velocities
                const bounceForce = 0.3;
                const relativeSpeed = Math.sqrt(
                    Math.pow(player.velocityX - object.velocityX, 2) +
                    Math.pow(player.velocityY - object.velocityY, 2)
                );
                
                // Apply velocities based on collision angle and relative speed
                object.velocityX = Math.cos(angle) * relativeSpeed * bounceForce;
                object.velocityY = Math.sin(angle) * relativeSpeed * bounceForce;
                
                // Reduce player velocity slightly
                player.velocityX *= 0.9;
                player.velocityY *= 0.9;
            } else {
                // For enemies, keep existing behavior
                object.x -= Math.cos(angle) * overlap;
                object.y -= Math.sin(angle) * overlap;
                object.velocityX = (player.velocityX * 0.5) + (Math.cos(angle) * 5);
                object.velocityY = (player.velocityY * 0.5) + (Math.sin(angle) * 5);
            }
            
            player.takeDamage(10);
        }
    });

    // Check health pack collection
    healthPacks = healthPacks.filter(pack => {
        if (distance(player.x, player.y, pack.x, pack.y) < playerRadius + pack.width/2) {
            player.heal(pack.healAmount);
            return false;
        }
        return true;
    });

    // Check gem collection
    gems = gems.filter(gem => {
        if (distance(player.x, player.y, gem.x, gem.y) < playerRadius + gem.width) {
            player.collectGems(gem.amount);
            // Add XP when collecting gems
            addXP(gem.amount);
            return false;
        }
        return true;
    });

    // Check enemy laser hits on player
    enemies.forEach(enemy => {
        if (enemy instanceof ShooterEnemy) {
            enemy.lasers.forEach((laser, laserIndex) => {
                if (distance(laser.x, laser.y, player.x, player.y) < playerRadius) {
                    player.takeDamage(5);
                    enemy.lasers.splice(laserIndex, 1);
                }
            });
        }
    });
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function drawMinimap() {
    const mapSize = Math.min(150, Math.min(canvas.width, canvas.height) * 0.2);
    const mapX = canvas.width - mapSize - 10;
    const mapY = 10;
    const mapScale = mapSize / WORLD_WIDTH;

    // Draw map background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
        mapX + player.x * mapScale - 2,
        mapY + player.y * mapScale - 2,
        4, 4
    );

    // Draw enemies
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        ctx.fillRect(
            mapX + enemy.x * mapScale - 1,
            mapY + enemy.y * mapScale - 1,
            2, 2
        );
    });

    // Draw asteroids
    ctx.fillStyle = '#808080';
    asteroids.forEach(asteroid => {
        ctx.fillRect(
            mapX + asteroid.x * mapScale - 1,
            mapY + asteroid.y * mapScale - 1,
            2, 2
        );
    });

    // Draw health packs
    ctx.fillStyle = '#00ff00';
    healthPacks.forEach(pack => {
        ctx.fillRect(
            mapX + pack.x * mapScale - 1,
            mapY + pack.y * mapScale - 1,
            2, 2
        );
    });

    // Draw gems
    ctx.fillStyle = '#f0f';
    gems.forEach(gem => {
        ctx.fillRect(
            mapX + gem.x * mapScale - 1,
            mapY + gem.y * mapScale - 1,
            2, 2
        );
    });

    // Draw viewport rectangle
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(
        mapX + camera.x * mapScale,
        mapY + camera.y * mapScale,
        canvas.width * mapScale,
        canvas.height * mapScale
    );
}

function drawStatusBars() {
    const barWidth = 200;
    const barHeight = 20;
    const barSpacing = 30;
    const barX = 10;
    let barY = 10;

    // Health bar
    ctx.fillStyle = '#400';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#f00';
    ctx.fillRect(barX, barY, barWidth * (player.health / player.maxHealth), barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Health: ${Math.ceil(player.health)}/${player.maxHealth}`, barX + 5, barY + 15);

    // Energy bar
    barY += barSpacing;
    ctx.fillStyle = '#004';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = player.shootCooldown > 0 ? '#0066aa' : '#0af';
    ctx.fillRect(barX, barY, barWidth * (player.energy / player.maxEnergy), barHeight);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Energy: ${Math.ceil(player.energy)}/${player.maxEnergy}${player.shootCooldown > 0 ? ' (Cooling)' : ''}`, barX + 5, barY + 15);

    // Gem bar
    barY += barSpacing;
    ctx.fillStyle = '#404';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#f0f';
    
    if (player.upgradeLevel >= 4) {
        // At max level, show full bar and just gem count
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Gems: ${player.gems}`, barX + 5, barY + 15);
    } else {
        // Show progress to next level
        let nextUpgradeGems;
        switch(player.upgradeLevel) {
            case 0:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL1.gems;
                break;
            case 1:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL2.gems;
                break;
            case 2:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL3.gems;
                break;
            case 3:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL4.gems;
                break;
        }
        ctx.fillRect(barX, barY, barWidth * (player.gems / nextUpgradeGems), barHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Gems: ${player.gems}/${nextUpgradeGems}`, barX + 5, barY + 15);
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, barX, barY + 40);
}

function drawDebugInfo() {
    if (!isDebugMode) return;
    
    ctx.fillStyle = '#ff0';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('DEBUG MODE', canvas.width - 10, canvas.height - 160);
    ctx.fillText('K: Add 100 gems', canvas.width - 10, canvas.height - 140);
    ctx.fillText('L: Fill health/energy', canvas.width - 10, canvas.height - 120);
    ctx.fillText('M: Add 1000 score', canvas.width - 10, canvas.height - 100);
    ctx.fillText(';: Toggle invincibility' + (isInvincible ? ' (ON)' : ' (OFF)'), canvas.width - 10, canvas.height - 80);
    ctx.fillText('N: Clear & next wave', canvas.width - 10, canvas.height - 60);
    ctx.fillText('C: Clear all enemies', canvas.width - 10, canvas.height - 40);
    
    // Show additional debug info
    ctx.fillText(`X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}`, canvas.width - 10, canvas.height - 20);
    ctx.fillText(`Enemies: ${enemies.length}, Asteroids: ${asteroids.length}`, canvas.width - 10, canvas.height - 0);
    ctx.textAlign = 'left';
}

function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'CLASS_SELECT') {
        drawClassSelection();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameState === 'GAME_OVER' || gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.min(48, canvas.width * 0.1)}px Arial`;
        ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
        ctx.font = `${Math.min(24, canvas.width * 0.05)}px Arial`;
        ctx.fillText(`Score: ${score}`, canvas.width/2 - 50, canvas.height/2 + 40);
        requestAnimationFrame(gameLoop);
        return;
    }

    // Draw background
    drawBackground();

    // Update and draw game objects only if not paused
    if (gameState === 'PLAYING') {
        // Update player invincibility from debug mode
        if (isDebugMode && isInvincible) {
            player.invulnerable = true;
            player.invulnerableTime = 2;
        }

        // Update player
        player.update();
        player.shoot();
        player.updateLasers();

        // Update gems
        gems.forEach(gem => gem.update());

        // Spawn and update objects
        spawnObjects();
        enemies = enemies.filter(enemy => !enemy.update());
        asteroids = asteroids.filter(asteroid => !asteroid.update());

        // Handle collisions
        handleCollisions();
    }

    // Always draw game objects
    [...asteroids, ...enemies, ...healthPacks, ...gems].forEach(obj => obj.draw());
    player.drawLasers();
    player.draw();

    // Draw UI elements
    drawMinimap();
    drawStatusBars();
    drawDebugInfo();
    drawPauseButton();

    // Draw pause screen if paused
    if (gameState === 'PAUSED') {
        drawPauseScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Add class selection screen rendering
function drawClassSelection() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Space Game', canvas.width/2, 60);
    
    // Draw XP counter
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`XP: ${getXP()}`, canvas.width/2, 100);
    
    // Draw wipe save button in top left
    const wipeBtn = {
        x: 20,
        y: 20,
        width: 140,
        height: 40
    };
    
    ctx.fillStyle = mouse.x >= wipeBtn.x && mouse.x <= wipeBtn.x + wipeBtn.width &&
                   mouse.y >= wipeBtn.y && mouse.y <= wipeBtn.y + wipeBtn.height
                   ? '#e74c3c' : '#c0392b';
    ctx.beginPath();
    ctx.roundRect(wipeBtn.x, wipeBtn.y, wipeBtn.width, wipeBtn.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Wipe Save', wipeBtn.x + wipeBtn.width/2, wipeBtn.y + 28);
    
    // Draw save button if game is in progress
    if (player) {
        const saveBtn = {
            x: canvas.width - 160,
            y: 20,
            width: 140,
            height: 40
        };
        
        ctx.fillStyle = mouse.x >= saveBtn.x && mouse.x <= saveBtn.x + saveBtn.width &&
                       mouse.y >= saveBtn.y && mouse.y <= saveBtn.y + saveBtn.height
                       ? '#5DBE64' : '#4CAF50';
        ctx.beginPath();
        ctx.roundRect(saveBtn.x, saveBtn.y, saveBtn.width, saveBtn.height, 8);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.fillText('Save Game', saveBtn.x + saveBtn.width/2, saveBtn.y + 28);
    }
    
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.fillText('Select Your Ship', canvas.width/2, 150);
    
    const classes = Object.entries(SHIP_CLASSES);
    const spacing = canvas.width / (classes.length + 1);
    const wavesCleared = getWavesCleared();
    const currentXP = getXP();
    
    classes.forEach(([key, shipClass], index) => {
        const x = spacing * (index + 1);
        const y = canvas.height/2;
        const width = 100;
        const height = 100;
        
        const isLocked = currentXP < shipClass.xpRequired;
        
        // Draw selection box
        ctx.strokeStyle = isLocked ? '#444' : 
                         (mouse.x > x - width/2 && 
                         mouse.x < x + width/2 && 
                         mouse.y > y - height/2 && 
                         mouse.y < y + height/2)
                         ? shipClass.color 
                         : '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - width/2, y - height/2, width, height);
        
        // Draw ship preview
        ctx.fillStyle = isLocked ? '#444' : shipClass.color;
        ctx.beginPath();
        ctx.moveTo(x + width/4, y);
        ctx.lineTo(x - width/4, y + height/4);
        ctx.lineTo(x - width/4, y - height/4);
        ctx.closePath();
        ctx.fill();
        
        // Draw ship name and stats
        ctx.fillStyle = isLocked ? '#666' : '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(shipClass.name, x, y + height);
        ctx.font = '16px Arial';
        
        if (isLocked) {
            ctx.fillText(`Requires ${shipClass.xpRequired} XP`, x, y + height + 25);
        } else {
            ctx.fillText(`Health: ${shipClass.health}`, x, y + height + 25);
            ctx.fillText(`Speed: ${shipClass.maxSpeed}`, x, y + height + 45);
            
            // Draw waves cleared
            const wavesCount = wavesCleared[shipClass.name] || 0;
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`Best Wave: ${wavesCount}`, x, y + height + 65);
        }
    });
    
    ctx.textAlign = 'left';
}

// Add wipe save function
function wipeSaveData() {
    localStorage.removeItem('spaceGameSave_1');
    localStorage.removeItem('spaceGameSaveMetadata');
    localStorage.removeItem('spaceGameWavesCleared');
    localStorage.removeItem('spaceGameGamesPlayed');
    showNotification('All save data wiped!', 'warning');
    player = null;
}

// Add click handler for class selection
canvas.addEventListener('click', (e) => {
    // Check pause button click
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    if (e.clientX >= x && e.clientX <= x + buttonSize &&
        e.clientY >= y && e.clientY <= y + buttonSize) {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            isPaused = true;
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            isPaused = false;
        }
        return;
    }

    if (gameState === 'CLASS_SELECT') {
        // Check wipe save button
        const wipeBtn = {
            x: 20,
            y: 20,
            width: 140,
            height: 40
        };
        
        if (e.clientX >= wipeBtn.x && e.clientX <= wipeBtn.x + wipeBtn.width &&
            e.clientY >= wipeBtn.y && e.clientY <= wipeBtn.y + wipeBtn.height) {
            wipeSaveData();
            return;
        }

        // Check save button click if game is in progress
        if (player) {
            const saveBtn = {
                x: canvas.width - 160,
                y: 20,
                width: 140,
                height: 40
            };
            
            if (e.clientX >= saveBtn.x && e.clientX <= saveBtn.x + saveBtn.width &&
                e.clientY >= saveBtn.y && e.clientY <= saveBtn.y + saveBtn.height) {
                saveGame(1); // Save to slot 1 by default
                return;
            }
        }
        
        // Check ship class selection
        const classes = Object.entries(SHIP_CLASSES);
        const spacing = canvas.width / (classes.length + 1);
        
        classes.forEach(([key, shipClass], index) => {
            const x = spacing * (index + 1);
            const y = canvas.height/2;  // This is where ships are actually drawn
            const width = 100;
            const height = 100;
            
            if (e.clientX > x - width/2 && 
                e.clientX < x + width/2 && 
                e.clientY > y - height/2 && 
                e.clientY < y + height/2) {
                
                // Check if ship is locked
                if (getXP() < shipClass.xpRequired) {
                    showNotification(`Need ${shipClass.xpRequired} XP to unlock ${shipClass.name}`, 'warning');
                    return;
                }
                
                selectedClass = shipClass;
                
                // Reset game state
                player = new Player(shipClass);
                enemies = [];
                asteroids = [];
                healthPacks = [];
                gems = [];
                gameOver = false;
                score = 0;
                
                // Reset camera
                camera.x = player.x - canvas.width / 2;
                camera.y = player.y - canvas.height / 2;
                
                // Initialize wave system
                window.waveNumber = 1;
                window.enemiesRemainingInWave = Math.min(5 + window.waveNumber * 2, 25);
                window.waveStartTime = Date.now();
                window.waveTimer = 0;
                
                gameState = 'PLAYING';
                isPaused = false;
                
                // Increment games played when starting a new game
                incrementGamesPlayed(shipClass.name);
            }
        });
        return;
    }

    // Handle pause menu clicks
    if (gameState === 'PAUSED') {
        // Resume button
        const resumeBtn = {
            x: canvas.width/2 - 150,
            y: canvas.height/2 - 50,
            width: 300,
            height: 50
        };
        
        if (e.clientX >= resumeBtn.x && e.clientX <= resumeBtn.x + resumeBtn.width &&
            e.clientY >= resumeBtn.y && e.clientY <= resumeBtn.y + resumeBtn.height) {
            gameState = 'PLAYING';
            isPaused = false;
            return;
        }

        // Exit button
        const exitBtn = {
            x: canvas.width/2 - 150,
            y: canvas.height/2 + 20,
            width: 300,
            height: 50
        };
        
        if (e.clientX >= exitBtn.x && e.clientX <= exitBtn.x + exitBtn.width &&
            e.clientY >= exitBtn.y && e.clientY <= exitBtn.y + exitBtn.height) {
            // Add XP before exiting
            const xpGained = Math.floor(score / 100);
            addXP(xpGained);
            showNotification(`Gained ${xpGained} XP!`);
            
            // Save the game before exiting
            saveGame(1);
            // Reset game state without incrementing games played
            gameState = 'CLASS_SELECT';
            isPaused = false;
            return;
        }
    }

    // Check save button click in class selection
    if (gameState === 'CLASS_SELECT' && player) {
        const saveBtn = {
            x: canvas.width - 160,
            y: 20,
            width: 140,
            height: 40
        };
        
        if (e.clientX >= saveBtn.x && e.clientX <= saveBtn.x + saveBtn.width &&
            e.clientY >= saveBtn.y && e.clientY <= saveBtn.y + saveBtn.height) {
            saveGame(1); // Save to slot 1 by default
            return;
        }
    }
});

// Add pause button
function drawPauseButton() {
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    // Draw button background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, buttonSize, buttonSize);
    
    // Draw pause icon or play icon
    ctx.fillStyle = '#fff';
    if (!isPaused) {
        // Draw pause bars
        ctx.fillRect(x + buttonSize * 0.3, y + buttonSize * 0.2, buttonSize * 0.15, buttonSize * 0.6);
        ctx.fillRect(x + buttonSize * 0.55, y + buttonSize * 0.2, buttonSize * 0.15, buttonSize * 0.6);
    } else {
        // Draw play triangle
        ctx.beginPath();
        ctx.moveTo(x + buttonSize * 0.3, y + buttonSize * 0.2);
        ctx.lineTo(x + buttonSize * 0.3, y + buttonSize * 0.8);
        ctx.lineTo(x + buttonSize * 0.7, y + buttonSize * 0.5);
        ctx.closePath();
        ctx.fill();
    }
}

// Add pause screen
function drawPauseScreen() {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title with shadow
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2 - 100);
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw resume button
    const resumeBtn = {
        x: canvas.width/2 - 150,
        y: canvas.height/2 - 50,
        width: 300,
        height: 50
    };
    
    ctx.fillStyle = mouse.x >= resumeBtn.x && mouse.x <= resumeBtn.x + resumeBtn.width &&
                   mouse.y >= resumeBtn.y && mouse.y <= resumeBtn.y + resumeBtn.height
                   ? '#5DBE64' : '#4CAF50';
    ctx.beginPath();
    ctx.roundRect(resumeBtn.x, resumeBtn.y, resumeBtn.width, resumeBtn.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Resume Game', canvas.width/2, resumeBtn.y + 32);

    // Draw exit button
    const exitBtn = {
        x: canvas.width/2 - 150,
        y: canvas.height/2 + 20,
        width: 300,
        height: 50
    };
    
    ctx.fillStyle = mouse.x >= exitBtn.x && mouse.x <= exitBtn.x + exitBtn.width &&
                   mouse.y >= exitBtn.y && mouse.y <= exitBtn.y + exitBtn.height
                   ? '#e74c3c' : '#c0392b';
    ctx.beginPath();
    ctx.roundRect(exitBtn.x, exitBtn.y, exitBtn.width, exitBtn.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Exit to Title', canvas.width/2, exitBtn.y + 32);
    
    // Instructions text
    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press P to resume', canvas.width/2, canvas.height/2 + 180);
}

// Add pause key handler
window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        if (gameState !== 'CLASS_SELECT' && gameState !== 'GAME_OVER') {
            if (gameState === 'PLAYING') {
                gameState = 'PAUSED';
                isPaused = true;
            } else if (gameState === 'PAUSED') {
                gameState = 'PLAYING';
                isPaused = false;
            }
        }
    }

    // Debug controls
    if (e.key === 'o' || e.key === 'O') {
        isDebugMode = !isDebugMode;
    }

    if (isDebugMode && player) {
        switch(e.key) {
            case 'k':
            case 'K':
                player.gems += 100;
                break;
            case 'l':
            case 'L':
                player.health = player.maxHealth;
                player.energy = player.maxEnergy;
                break;
            case ';':
                isInvincible = !isInvincible;
                break;
            case 'm':
            case 'M':
                score += 1000;
                break;
            case 'n':
            case 'N':
                // Clear all enemies and advance to next wave
                enemies = [];
                window.enemiesRemainingInWave = 0;
                window.waveTimer = 1; // Set to 1 to trigger immediate wave change
                break;
            case 'c':
            case 'C':
                // Clear all enemies but stay in current wave
                enemies = [];
                break;
        }
    }
});

// Update pause button click handler
canvas.addEventListener('click', (e) => {
    // Check if pause button was clicked
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    if (e.clientX >= x && e.clientX <= x + buttonSize &&
        e.clientY >= y && e.clientY <= y + buttonSize) {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            isPaused = true;
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            isPaused = false;
        }
        return;
    }

    // Handle save slot clicks when paused
    if (gameState === 'PAUSED') {
        for (let i = 1; i <= 3; i++) {
            const btn = {
                x: canvas.width/2 - 150,
                y: canvas.height/2 - 80 + (i - 1) * 60,
                width: 300,
                height: 50
            };
            
            if (e.clientX >= btn.x && e.clientX <= btn.x + btn.width &&
                e.clientY >= btn.y && e.clientY <= btn.y + btn.height) {
                saveGame(i);
                return;
            }
        }
    }
});

// Add after the game state variables
function saveGame(slotNumber = 1) {
    if (!player || gameState !== 'PLAYING') return;

    const gameData = {
        // Player data
        playerState: {
            shipClass: player.shipClass.name,
            x: player.x,
            y: player.y,
            health: player.health,
            maxHealth: player.maxHealth,
            energy: player.energy,
            maxEnergy: player.maxEnergy,
            gems: player.gems,
            upgradeLevel: player.upgradeLevel
        },
        // Game progress
        score: score,
        waveNumber: window.waveNumber,
        enemiesRemainingInWave: window.enemiesRemainingInWave,
        // Save metadata
        savedAt: Date.now(),
        lastPlayedAt: Date.now()
    };

    // Save to specific slot
    localStorage.setItem(`spaceGameSave_${slotNumber}`, JSON.stringify(gameData));
    
    // Update save metadata
    const saveMetadata = getSaveMetadata();
    saveMetadata[slotNumber] = {
        timestamp: Date.now(),
        score: score,
        waveNumber: window.waveNumber,
        shipClass: player.shipClass.name,
        upgradeLevel: player.upgradeLevel
    };
    localStorage.setItem('spaceGameSaveMetadata', JSON.stringify(saveMetadata));
    
    // Visual feedback
    showNotification('Game Saved!');
}

function loadGame(slotNumber = 1) {
    const savedData = localStorage.getItem(`spaceGameSave_${slotNumber}`);
    if (!savedData) {
        console.log('No save data found in slot', slotNumber);
        return false;
    }

    try {
        const gameData = JSON.parse(savedData);
        
        // Update last played timestamp
        gameData.lastPlayedAt = Date.now();
        localStorage.setItem(`spaceGameSave_${slotNumber}`, JSON.stringify(gameData));

        // Create player with saved ship class
        const shipClass = SHIP_CLASSES[Object.keys(SHIP_CLASSES).find(
            key => SHIP_CLASSES[key].name === gameData.playerState.shipClass
        )];
        
        if (!shipClass) {
            console.error('Invalid ship class in save data');
            return false;
        }

        player = new Player(shipClass);

        // Restore player state
        Object.assign(player, gameData.playerState);

        // Restore game progress
        score = gameData.score;
        window.waveNumber = gameData.waveNumber;
        window.enemiesRemainingInWave = gameData.enemiesRemainingInWave;

        // Reset other game objects
        enemies = [];
        asteroids = [];
        healthPacks = [];
        gems = [];
        gameOver = false;

        // Update camera
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;

        console.log('Successfully loaded save from slot', slotNumber);
        return true;
    } catch (error) {
        console.error('Error loading save:', error);
        return false;
    }
}

function getSaveMetadata() {
    const metadata = localStorage.getItem('spaceGameSaveMetadata');
    return metadata ? JSON.parse(metadata) : {};
}

function deleteSave(slotNumber = 1) {
    localStorage.removeItem(`spaceGameSave_${slotNumber}`);
    const saveMetadata = getSaveMetadata();
    delete saveMetadata[slotNumber];
    localStorage.setItem('spaceGameSaveMetadata', JSON.stringify(saveMetadata));
}

// Update showNotification function to support different colors
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = type === 'success' ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontFamily = 'Arial';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
}

// Add auto-save on exit
window.addEventListener('beforeunload', () => {
    if (player && gameState === 'PLAYING') {
        saveGame(1); // Auto-save to slot 1 when closing
    }
});

// Initialize game with auto-load
function initializeGame() {
    // Try to load the save from slot 1
    if (loadGame(1)) {
        gameState = 'CLASS_SELECT';
        showNotification('Game loaded!', 'success');
    } else {
        // No save found, start fresh
        gameState = 'CLASS_SELECT';
        player = null;
    }
}

// Start the game with auto-load
initializeGame();
gameLoop();

function getWavesCleared() {
    const wavesData = localStorage.getItem('spaceGameWavesCleared');
    return wavesData ? JSON.parse(wavesData) : {
        Fighter: 0,
        Tank: 0,
        Speedster: 0
    };
}

function updateWavesCleared(shipClassName, waveNumber) {
    const wavesData = getWavesCleared();
    wavesData[shipClassName] = Math.max(wavesData[shipClassName], waveNumber);
    localStorage.setItem('spaceGameWavesCleared', JSON.stringify(wavesData));
}

function getGamesPlayed() {
    const gamesData = localStorage.getItem('spaceGameGamesPlayed');
    return gamesData ? JSON.parse(gamesData) : {
        Fighter: 0,
        Tank: 0,
        Speedster: 0
    };
}

function incrementGamesPlayed(shipClassName) {
    const gamesData = getGamesPlayed();
    gamesData[shipClassName] = (gamesData[shipClassName] || 0) + 1;
    localStorage.setItem('spaceGameGamesPlayed', JSON.stringify(gamesData));
}

function getXP() {
    const xp = localStorage.getItem('spaceGameXP');
    return xp ? parseInt(xp) : 0;
}

function addXP(amount) {
    const currentXP = getXP();
    localStorage.setItem('spaceGameXP', currentXP + amount);
}

// Add this helper function for ray-casting collision detection
function lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
    // Convert line to vector form
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Calculate vector from line start to circle center
    const fx = x1 - cx;
    const fy = y1 - cy;
    
    // Calculate quadratic equation coefficients
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - r * r;
    
    // Calculate discriminant
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
        // No intersection
        return false;
    }
    
    // Calculate intersection points
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    // Check if intersection occurs within line segment
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

class BomberEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff8800';
        this.speed = 2;
        this.health = 50;
        this.healCooldown = 0;
        this.maxHealCooldown = 120;
        this.healRadius = 150;
        this.healAmount = 10;
        this.healingParticles = [];
    }

    drawShape(x, y) {
        // Draw diamond shape
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y);
        ctx.lineTo(x, y + this.height/4);
        ctx.lineTo(x - this.width/2, y);
        ctx.lineTo(x, y - this.height/4);
        ctx.closePath();
        ctx.fill();
    }

    behavior() {
        // Move in a figure-8 pattern around the player
        const time = Date.now() / 1000;
        const radius = 200;
        const targetX = player.x + Math.cos(time) * radius;
        const targetY = player.y + Math.sin(time * 2) * radius;
        
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.rotation = angle;
        
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
        
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Heal nearby enemies
        if (this.healCooldown <= 0) {
            // Find nearby enemies
            enemies.forEach(enemy => {
                if (enemy !== this) {
                    const dist = distance(this.x, this.y, enemy.x, enemy.y);
                    if (dist < this.healRadius) {
                        enemy.health = Math.min(enemy.maxHealth || 100, enemy.health + this.healAmount);
                        // Add healing particles
                        for (let i = 0; i < 3; i++) {
                            this.healingParticles.push({
                                x: enemy.x,
                                y: enemy.y,
                                angle: Math.random() * Math.PI * 2,
                                speed: 2,
                                life: 20
                            });
                        }
                    }
                }
            });
            this.healCooldown = this.maxHealCooldown;
        } else {
            this.healCooldown--;
        }

        // Update healing particles
        for (let i = this.healingParticles.length - 1; i >= 0; i--) {
            const particle = this.healingParticles[i];
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y += Math.sin(particle.angle) * particle.speed;
            particle.life--;
            if (particle.life <= 0) {
                this.healingParticles.splice(i, 1);
            }
        }
    }

    draw() {
        super.draw();
        
        // Draw heal radius when healing is ready
        if (this.healCooldown <= 20) {
            const screenX = this.x - camera.x;
            const screenY = this.y - camera.y;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.healRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw healing particles
        ctx.fillStyle = '#00ff00';
        this.healingParticles.forEach(particle => {
            const screenX = particle.x - camera.x;
            const screenY = particle.y - camera.y;
            const size = (particle.life / 20) * 5;
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

class SwarmerEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff44ff';
        this.speed = 2;
        this.health = 70;
        this.maxHealth = 70;
        this.shootCooldown = 0;
        this.maxShootCooldown = 420; // Changed to 7 seconds (60 FPS * 7)
        this.missiles = [];
        this.missileSpeed = 8;
        this.missileTurnSpeed = 0.02;
    }

    drawShape(x, y) {
        // Draw hexagon shape
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const px = x + Math.cos(angle) * this.width/2;
            const py = y + Math.sin(angle) * this.width/2;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    behavior() {
        // Rotate to face player
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        this.rotation = angleToPlayer;
        
        // Move like shooter enemy - maintain distance
        const distToPlayer = distance(this.x, this.y, player.x, player.y);
        const idealDistance = 400; // Keep more distance than regular shooter
        const moveSpeed = 2;
        
        if (distToPlayer < idealDistance - 50) {
            // Move away
            this.velocityX = -Math.cos(this.rotation) * moveSpeed;
            this.velocityY = -Math.sin(this.rotation) * moveSpeed;
        } else if (distToPlayer > idealDistance + 50) {
            // Move closer
            this.velocityX = Math.cos(this.rotation) * moveSpeed;
            this.velocityY = Math.sin(this.rotation) * moveSpeed;
        } else {
            this.velocityX *= 0.95;
            this.velocityY *= 0.95;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Shooting logic
        if (this.shootCooldown <= 0) {
            this.shootMissiles();
            this.shootCooldown = this.maxShootCooldown;
        } else {
            this.shootCooldown--;
        }

        // Update missiles
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            
            // Calculate angle to player for homing
            const targetAngle = Math.atan2(player.y - missile.y, player.x - missile.x);
            let angleDiff = targetAngle - missile.rotation;
            
            // Normalize angle difference
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Turn slowly towards player
            missile.rotation += Math.sign(angleDiff) * this.missileTurnSpeed;
            
            // Move in current rotation direction
            missile.velocityX = Math.cos(missile.rotation) * this.missileSpeed;
            missile.velocityY = Math.sin(missile.rotation) * this.missileSpeed;
            
            missile.x += missile.velocityX;
            missile.y += missile.velocityY;
            missile.life--;

            // Check collision with player
            if (distance(missile.x, missile.y, player.x, player.y) < (player.width + missile.width) / 2) {
                player.takeDamage(missile.damage);
                this.missiles.splice(i, 1);
                continue;
            }

            // Remove missile if expired or off screen
            if (missile.life <= 0 || 
                missile.x < 0 || missile.x > WORLD_WIDTH || 
                missile.y < 0 || missile.y > WORLD_HEIGHT) {
                this.missiles.splice(i, 1);
            }
        }
    }

    shootMissiles() {
        // Shoot 3 missiles in spread directions
        for (let i = 0; i < 3; i++) {
            const spreadAngle = this.rotation + (Math.random() - 0.5) * Math.PI; // Random spread within 180 degrees
            const missile = {
                x: this.x + Math.cos(spreadAngle) * this.width,
                y: this.y + Math.sin(spreadAngle) * this.width,
                width: 15,
                height: 15,
                velocityX: Math.cos(spreadAngle) * this.missileSpeed,
                velocityY: Math.sin(spreadAngle) * this.missileSpeed,
                rotation: spreadAngle,
                damage: 20,
                life: 180 // 3 seconds lifetime
            };
            this.missiles.push(missile);
        }
    }

    draw() {
        super.draw();
        
        // Draw missiles
        this.missiles.forEach(missile => {
            const screenX = missile.x - camera.x;
            const screenY = missile.y - camera.y;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(missile.rotation);
            
            // Draw missile body
            ctx.fillStyle = '#ff44ff';
            ctx.beginPath();
            ctx.moveTo(missile.width/2, 0);
            ctx.lineTo(-missile.width/2, missile.height/3);
            ctx.lineTo(-missile.width/2, -missile.height/3);
            ctx.closePath();
            ctx.fill();
            
            // Draw missile trail
            ctx.beginPath();
            ctx.moveTo(-missile.width/2, 0);
            ctx.lineTo(-missile.width, 0);
            const gradient = ctx.createLinearGradient(-missile.width/2, 0, -missile.width, 0);
            gradient.addColorStop(0, '#ff44ff');
            gradient.addColorStop(1, 'rgba(255, 68, 255, 0)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.restore();
        });
    }
}

class SpinnerBoss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff0000';
        this.speed = 1;
        this.health = 100;
        this.rotationSpeed = 0.01;
        this.orbitRadius = 100;
        this.orbitAngle = 0;
        this.lasers = [];
    }

    drawShape(x, y) {
        // Draw a simple circle for the boss
        ctx.beginPath();
        ctx.arc(x, y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }

    behavior() {
        // Rotate around the center
        this.orbitAngle += this.rotationSpeed;
        this.x = player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = player.y + Math.sin(this.orbitAngle) * this.orbitRadius;

        // Shoot lasers
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 60; // 1 second between shots
        } else {
            this.shootCooldown--;
        }

        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.x += laser.velocityX;
            laser.y += laser.velocityY;

            if (laser.x < 0 || laser.x > WORLD_WIDTH || 
                laser.y < 0 || laser.y > WORLD_HEIGHT) {
                this.lasers.splice(i, 1);
            }
        }
    }

    shoot() {
        const laser = {
            x: this.x,
            y: this.y,
            velocityX: Math.cos(this.orbitAngle) * 10,
            velocityY: Math.sin(this.orbitAngle) * 10,
            width: 4,
            height: 4,
            rotation: this.orbitAngle,
            color: '#ff0000',
            damage: 10
        };
        this.lasers.push(laser);
    }

    draw() {
        super.draw();
        
        // Draw orbit circle
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, this.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw lasers
        this.lasers.forEach(laser => {
            const screenX = laser.x - camera.x;
            const screenY = laser.y - camera.y;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(laser.rotation);
            
            // Draw laser beam
            const gradient = ctx.createLinearGradient(0, 0, laser.length, 0);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, -laser.width/2, laser.length, laser.width);
            
            ctx.restore();
        });
    }
}