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
        color: '#00ff00'
    },
    TANK: {
        name: 'Tank',
        description: 'High health and damage, but slow',
        health: 150,
        maxSpeed: 7,
        acceleration: 0.3,
        rotationalAcceleration: 0.02,
        shootCost: 15,
        color: '#00aaff'
    },
    SPEEDSTER: {
        name: 'Speedster',
        description: 'Fast and agile, but fragile',
        health: 70,
        maxSpeed: 13,
        acceleration: 0.5,
        rotationalAcceleration: 0.04,
        shootCost: 8,
        color: '#ff00ff'
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
        this.upgradeLevel = 0; // Start at level 0 (basic ship)
        
        // Apply ship class stats
        this.maxHealth = shipClass.health; // No initial health bonus
        this.health = this.maxHealth;
        this.maxSpeed = shipClass.maxSpeed;
        this.acceleration = shipClass.acceleration;
        this.rotationalAcceleration = shipClass.rotationalAcceleration;
        this.shootCost = shipClass.shootCost;
        this.color = shipClass.color;
        
        this.lasers = [];
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyRegen = 0.2;
        this.gems = 0; // Start with 0 gems
        this.maxGems = UPGRADE_LEVELS.LEVEL1.gems; // Target level 1 (100 gems)
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
        
        // Draw ship based on class and upgrade level
        ctx.fillStyle = this.invulnerable ? this.color + '88' : this.color;
        
        if (this.upgradeLevel === 0) {
            // Basic ship shape
            ctx.beginPath();
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.lineTo(-this.width / 2, -this.height / 2);
            ctx.closePath();
            ctx.fill();
        } else if (this.upgradeLevel === 1) {
            // Level 1 upgrade - more angular design
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
            // Level 2 upgrade - double wing design
            ctx.beginPath();
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(0, this.height / 2);
            ctx.lineTo(-this.width / 3, this.height / 2);
            ctx.lineTo(-this.width / 2, 0);
            ctx.lineTo(-this.width / 3, -this.height / 2);
            ctx.lineTo(0, -this.height / 2);
            ctx.closePath();
            ctx.fill();
        } else {
            // Level 3 upgrade - advanced ship design
            ctx.beginPath();
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(this.width / 4, this.height / 3);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.lineTo(-this.width / 3, 0);
            ctx.lineTo(-this.width / 2, -this.height / 2);
            ctx.lineTo(this.width / 4, -this.height / 3);
            ctx.closePath();
            ctx.fill();
            
            // Add glowing effect
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
        this.drawStatusBars(screenX, screenY);
    }

    drawStatusBars(screenX, screenY) {
        const barWidth = 50;
        const barHeight = 4;
        const barSpacing = 6;
        const barY = screenY - 40;

        // Health bar (red)
        const healthPercentage = this.health / this.maxHealth;
        ctx.fillStyle = '#400';
        ctx.fillRect(screenX - barWidth/2, barY, barWidth, barHeight);
        ctx.fillStyle = '#f00';
        ctx.fillRect(screenX - barWidth/2, barY, barWidth * healthPercentage, barHeight);

        // Energy bar (blue)
        const energyPercentage = this.energy / this.maxEnergy;
        ctx.fillStyle = '#004';
        ctx.fillRect(screenX - barWidth/2, barY + barSpacing, barWidth, barHeight);
        ctx.fillStyle = this.shootCooldown > 0 ? '#0066aa' : '#0af';
        ctx.fillRect(screenX - barWidth/2, barY + barSpacing, barWidth * energyPercentage, barHeight);

        // Gem progress bar (purple)
        let nextUpgradeGems = UPGRADE_LEVELS.LEVEL1.gems;
        if (this.upgradeLevel >= 1) nextUpgradeGems = UPGRADE_LEVELS.LEVEL2.gems;
        if (this.upgradeLevel >= 2) nextUpgradeGems = UPGRADE_LEVELS.LEVEL3.gems;
        if (this.upgradeLevel >= 3) nextUpgradeGems = UPGRADE_LEVELS.LEVEL4.gems;
        
        const gemPercentage = Math.min(1, this.gems / nextUpgradeGems);
        ctx.fillStyle = '#404';
        ctx.fillRect(screenX - barWidth/2, barY + barSpacing * 2, barWidth, barHeight);
        ctx.fillStyle = '#f0f';
        ctx.fillRect(screenX - barWidth/2, barY + barSpacing * 2, barWidth * gemPercentage, barHeight);

        // Draw gem count
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        if (this.upgradeLevel < 4) {
            ctx.fillText(`${this.gems}/${nextUpgradeGems}`, screenX, barY + barSpacing * 2 + barHeight + 10);
        } else {
            ctx.fillText(`${this.gems}`, screenX, barY + barSpacing * 2 + barHeight + 10);
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
        if (this.gems >= UPGRADE_LEVELS.LEVEL4.gems && this.upgradeLevel < 4) {
            this.upgradeLevel = 4;
            this.maxHealth += 50;
            this.health = this.maxHealth;
            this.maxGems = UPGRADE_LEVELS.LEVEL4.gems;
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL3.gems && this.upgradeLevel < 3) {
            this.upgradeLevel = 3;
            this.maxHealth += 40;
            this.health = this.maxHealth;
            this.maxGems = UPGRADE_LEVELS.LEVEL3.gems;
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL2.gems && this.upgradeLevel < 2) {
            this.upgradeLevel = 2;
            this.maxHealth += 30;
            this.health = this.maxHealth;
            this.maxGems = UPGRADE_LEVELS.LEVEL2.gems;
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL1.gems && this.upgradeLevel < 1) {
            this.upgradeLevel = 1;
            this.maxHealth += 20;
            this.health = this.maxHealth;
            this.maxGems = UPGRADE_LEVELS.LEVEL1.gems;
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
        
        this.energy -= this.shootCost;
        this.shootCooldown = this.maxShootCooldown;
        
        // Different shot patterns based on upgrade level
        switch(this.upgradeLevel) {
            case 0: // Basic single shot
                this.createLaser(this.rotation);
                break;
            case 1: // Two cannons slightly spread
                this.createLaser(this.rotation - 0.15);
                this.createLaser(this.rotation + 0.15);
                break;
            case 2: // Three cannons
                this.createLaser(this.rotation);
                this.createLaser(this.rotation - 0.2);
                this.createLaser(this.rotation + 0.2);
                break;
            case 3: // Four cannons
                this.createLaser(this.rotation - 0.1);
                this.createLaser(this.rotation + 0.1);
                this.createLaser(this.rotation - 0.3);
                this.createLaser(this.rotation + 0.3);
                break;
            case 4: // Five cannons with better spread
                this.createLaser(this.rotation);
                this.createLaser(this.rotation - 0.2);
                this.createLaser(this.rotation + 0.2);
                this.createLaser(this.rotation - 0.4);
                this.createLaser(this.rotation + 0.4);
                break;
        }
    }

    createLaser(angle) {
        const laser = {
            x: this.x + Math.cos(angle) * this.width,
            y: this.y + Math.sin(angle) * this.width,
            velocityX: Math.cos(angle) * 10 + this.velocityX,
            velocityY: Math.sin(angle) * 10 + this.velocityY,
            width: 4,
            height: 4,
            rotation: angle,
            color: this.upgradeLevel >= 2 ? this.color : '#ff0000'
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
        this.invulnerableTime = 60; // 1 second at 60fps
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    collectGems(amount) {
        this.gems = Math.min(this.maxGems, this.gems + amount);
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
        this.velocityX = (Math.random() - 0.5) * 2;
        this.velocityY = (Math.random() - 0.5) * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.health = 50;
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
        ctx.restore();
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;

        // Bounce off world boundaries
        if (this.x < 0 || this.x > WORLD_WIDTH) {
            this.velocityX *= -BOUNCE;
            this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        }
        if (this.y < 0 || this.y > WORLD_HEIGHT) {
            this.velocityY *= -BOUNCE;
            this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
        }

        return this.health <= 0;
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
        window.enemiesRemainingInWave = 0;
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
        // Mid waves: Balanced
        if (rand < 0.4) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.7) {
            enemies.push(new ShooterEnemy(x, y));
        } else {
            enemies.push(new DasherEnemy(x, y));
        }
    } else {
        // Later waves: More shooters and dashers
        if (rand < 0.3) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.7) {
            enemies.push(new ShooterEnemy(x, y));
        } else {
            enemies.push(new DasherEnemy(x, y));
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

    // Check laser hits
    player.lasers.forEach((laser, laserIndex) => {
        // Check enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (distance(laser.x, laser.y, enemy.x, enemy.y) < enemy.width) {
                enemy.takeDamage(10);
                player.lasers.splice(laserIndex, 1);
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

        // Check asteroids
        asteroids.forEach((asteroid, asteroidIndex) => {
            if (distance(laser.x, laser.y, asteroid.x, asteroid.y) < asteroid.width/2) {
                asteroid.health -= 10;
                player.lasers.splice(laserIndex, 1);
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
    });

    // Check player collisions with enemies and asteroids
    [...enemies, ...asteroids].forEach(object => {
        const objectRadius = object.width / 2;
        const dist = distance(player.x, player.y, object.x, object.y);
        
        if (dist < playerRadius + objectRadius) {
            // Collision response
            const angle = Math.atan2(player.y - object.y, player.x - object.x);
            const overlap = (playerRadius + objectRadius) - dist;
            
            // Push objects apart but maintain player control
            object.x -= Math.cos(angle) * overlap;
            object.y -= Math.sin(angle) * overlap;
            
            // Add impact velocity to the object
            object.velocityX = (player.velocityX * 0.5) + (Math.cos(angle) * 5);
            object.velocityY = (player.velocityY * 0.5) + (Math.sin(angle) * 5);
            
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

    // Only run game logic if we're playing and have a player
    if (gameState === 'PLAYING' && player) {
        // Draw background
        drawBackground();

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

        // Draw everything
        [...asteroids, ...enemies, ...healthPacks, ...gems].forEach(obj => obj.draw());
        player.drawLasers();
        player.draw();

        // Draw minimap
        drawMinimap();

        // Draw status bars at the top of the screen
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
        ctx.fillRect(barX, barY, barWidth * (player.gems / player.maxGems), barHeight);
        ctx.fillText(`Gems: ${player.gems}/${player.maxGems}`, barX + 5, barY + 15);

        // Draw score
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, barX, barY + 40);
    }

    requestAnimationFrame(gameLoop);
}

// Add class selection screen rendering
function drawClassSelection() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.fillText('Select Your Ship', canvas.width/2 - 150, 100);
    
    const classes = Object.entries(SHIP_CLASSES);
    const spacing = canvas.width / (classes.length + 1);
    
    classes.forEach(([key, shipClass], index) => {
        const x = spacing * (index + 1);
        const y = canvas.height / 2;
        const width = 100;
        const height = 100;
        
        // Draw selection box
        ctx.strokeStyle = mouse.x > x - width/2 && 
                         mouse.x < x + width/2 && 
                         mouse.y > y - height/2 && 
                         mouse.y < y + height/2 
                         ? shipClass.color 
                         : '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - width/2, y - height/2, width, height);
        
        // Draw ship preview
        ctx.fillStyle = shipClass.color;
        ctx.beginPath();
        ctx.moveTo(x + width/4, y);
        ctx.lineTo(x - width/4, y + height/4);
        ctx.lineTo(x - width/4, y - height/4);
        ctx.closePath();
        ctx.fill();
        
        // Draw ship name and stats
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(shipClass.name, x - width/2, y + height);
        ctx.font = '16px Arial';
        ctx.fillText(`Health: ${shipClass.health}`, x - width/2, y + height + 30);
        ctx.fillText(`Speed: ${shipClass.maxSpeed}`, x - width/2, y + height + 50);
    });
    
    ctx.font = '24px Arial';
    ctx.fillText('Click to select', canvas.width/2 - 70, canvas.height - 100);
}

// Add click handler for class selection
canvas.addEventListener('click', (e) => {
    if (gameState !== 'CLASS_SELECT') return;
    
    const classes = Object.entries(SHIP_CLASSES);
    const spacing = canvas.width / (classes.length + 1);
    
    classes.forEach(([key, shipClass], index) => {
        const x = spacing * (index + 1);
        const y = canvas.height / 2;
        const width = 100;
        const height = 100;
        
        if (e.clientX > x - width/2 && 
            e.clientX < x + width/2 && 
            e.clientY > y - height/2 && 
            e.clientY < y + height/2) {
            console.log('Selected ship:', shipClass.name);
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
            window.enemiesRemainingInWave = 0;
            window.waveTimer = 0;
            
            gameState = 'PLAYING';
        }
    });
});

// Start the game
// Initialize player as null since we'll create it after class selection
gameLoop(); 