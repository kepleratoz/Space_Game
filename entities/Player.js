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

        // Add ability system
        this.abilities = {
            ability1: {
                name: '',
                cooldown: 0,
                maxCooldown: 0,
                duration: 0,
                remainingDuration: 0,
                active: false
            },
            ability2: {
                name: '',
                cooldown: 0,
                maxCooldown: 0,
                duration: 0,
                remainingDuration: 0,
                active: false
            }
        };

        // Set up class-specific abilities
        switch(shipClass.name) {
            case 'Fighter':
                this.abilities.ability1 = {
                    name: 'Reload',
                    cooldown: 0,
                    maxCooldown: 15 * 60, // 15 seconds at 60 FPS
                    duration: 0,
                    remainingDuration: 0,
                    active: false
                };
                this.abilities.ability2 = {
                    name: 'Boost',
                    cooldown: 0,
                    maxCooldown: 30 * 60,
                    duration: 5 * 60,
                    remainingDuration: 0,
                    active: false
                };
                break;
            case 'Tank':
                this.abilities.ability1 = {
                    name: 'Sentry',
                    cooldown: 0,
                    maxCooldown: 25 * 60,
                    duration: 5 * 60,
                    remainingDuration: 0,
                    active: false
                };
                this.abilities.ability2 = {
                    name: 'Storm',
                    cooldown: 0,
                    maxCooldown: 35 * 60,
                    duration: 1,
                    remainingDuration: 0,
                    active: false
                };
                break;
            case 'Speedster':
                this.abilities.ability1 = {
                    name: 'Absolute Control',
                    cooldown: 0,
                    maxCooldown: 20 * 60,
                    duration: 5 * 60,
                    remainingDuration: 0,
                    active: false
                };
                this.abilities.ability2 = {
                    name: 'Squadron',
                    cooldown: 0,
                    maxCooldown: 35 * 60,
                    duration: 10 * 60,
                    remainingDuration: 0,
                    active: false,
                    clones: []
                };
                break;
            case 'Sniper':
                this.abilities.ability1 = {
                    name: 'Warp Drive',
                    cooldown: 0,
                    maxCooldown: 10 * 60,
                    duration: 3 * 60,
                    remainingDuration: 0,
                    active: false,
                    targetX: 0,
                    targetY: 0
                };
                this.abilities.ability2 = {
                    name: 'Deathray',
                    cooldown: 0,
                    maxCooldown: 40 * 60,
                    duration: 5 * 60,
                    remainingDuration: 0,
                    active: false,
                    shotsRemaining: 0
                };
                break;
        }
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
        // Constants for bar positioning and size
        const margin = 10;
        const barWidth = 200;
        const barHeight = 20;
        const barSpacing = 25; // Reduced spacing between bars
        const x = margin + barWidth/2;
        
        // Draw health bar and caption
        const healthY = margin;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, healthY, barWidth, barHeight);
        ctx.fillStyle = '#f00';
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillRect(x - barWidth/2, healthY, healthWidth, barHeight);
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Health: ${Math.ceil(this.health)}/${this.maxHealth}`, x, healthY + 15);
        
        // Draw energy bar and caption
        const energyY = healthY + barSpacing;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, energyY, barWidth, barHeight);
        ctx.fillStyle = '#0af';
        const energyWidth = (this.energy / this.maxEnergy) * barWidth;
        ctx.fillRect(x - barWidth/2, energyY, energyWidth, barHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Energy: ${Math.ceil(this.energy)}/${this.maxEnergy}`, x, energyY + 15);
        
        // Draw gem bar and caption
        const gemY = energyY + barSpacing;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, gemY, barWidth, barHeight);
        ctx.fillStyle = '#f0f';
        
        if (this.upgradeLevel >= 4) {
            // At max level, show full bar and just gem count
            ctx.fillRect(x - barWidth/2, gemY, barWidth, barHeight);
            ctx.fillStyle = '#fff';
            ctx.fillText(`Gems: ${this.gems}`, x, gemY + 15);
        } else {
            // Show progress to next level
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
            const gemWidth = (this.gems / nextUpgradeGems) * barWidth;
            ctx.fillRect(x - barWidth/2, gemY, gemWidth, barHeight);
            ctx.fillStyle = '#fff';
            ctx.fillText(`Gems: ${this.gems}/${nextUpgradeGems}`, x, gemY + 15);
        }
        
        // Score caption below the bars
        ctx.fillStyle = '#fff';
        ctx.fillText(`Score: ${score}`, x, gemY + barSpacing + 10);
        
        // Reset text align
        ctx.textAlign = 'left';

        // Draw ability cooldowns
        this.drawAbilityCooldowns();
    }

    drawAbilityCooldowns() {
        const size = 40; // Reduced from 50
        const spacing = 45; // Reduced from 60
        const margin = 10;
        const x = margin; // Align to left margin
        
        // Calculate y position based on the gem bar and score position
        const barSpacing = 25;
        const healthY = margin;
        const energyY = healthY + barSpacing;
        const gemY = energyY + barSpacing;
        const scoreY = gemY + barSpacing + 10;
        const y = scoreY + 15; // Reduced spacing after score
        
        // Draw ability 1
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, size, size);
        
        // Cooldown overlay
        if (this.abilities.ability1.cooldown > 0) {
            const progress = this.abilities.ability1.cooldown / this.abilities.ability1.maxCooldown;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y + size * (1 - progress), size, size * progress);
        }
        
        // Active effect duration
        if (this.abilities.ability1.active && this.abilities.ability1.remainingDuration > 0) {
            const progress = this.abilities.ability1.remainingDuration / this.abilities.ability1.duration;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(x, y + size * (1 - progress), size, size * progress);
        }
        
        // Key binding
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial'; // Reduced from 20px
        ctx.textAlign = 'center';
        ctx.fillText('1', x + size/2, y + 25); // Adjusted for smaller size
        
        // Ability name
        ctx.font = '12px Arial'; // Reduced from 14px
        ctx.fillText(this.abilities.ability1.name, x + size/2, y + size + 15); // Reduced spacing
        
        // Draw ability 2
        const x2 = x + size + spacing;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x2, y, size, size);
        
        // Cooldown overlay
        if (this.abilities.ability2.cooldown > 0) {
            const progress = this.abilities.ability2.cooldown / this.abilities.ability2.maxCooldown;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x2, y + size * (1 - progress), size, size * progress);
        }
        
        // Active effect duration
        if (this.abilities.ability2.active && this.abilities.ability2.remainingDuration > 0) {
            const progress = this.abilities.ability2.remainingDuration / this.abilities.ability2.duration;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(x2, y + size * (1 - progress), size, size * progress);
        }
        
        // Key binding
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial'; // Reduced from 20px
        ctx.fillText('2', x2 + size/2, y + 25); // Adjusted for smaller size
        
        // Ability name
        ctx.font = '12px Arial'; // Reduced from 14px
        ctx.fillText(this.abilities.ability2.name, x2 + size/2, y + size + 15); // Reduced spacing

        // Draw squadron clones if active
        if (this.abilities.ability2.name === 'Squadron' && this.abilities.ability2.clones.length > 0) {
            this.abilities.ability2.clones.forEach(clone => {
                const screenX = clone.x - camera.x;
                const screenY = clone.y - camera.y;

                // Only draw if on screen
                if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
                    screenY + this.height < 0 || screenY - this.height > canvas.height) {
                    return;
                }

                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(clone.rotation);
                
                // Draw clone with speedster level 1 design
                ctx.fillStyle = SHIP_CLASSES.SPEEDSTER.color + '88'; // Semi-transparent
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 4);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(0, -this.height / 4);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            });
        }
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

        // Update abilities
        this.updateAbilities();
    }

    updateAbilities() {
        // Update cooldowns
        for (const ability of [this.abilities.ability1, this.abilities.ability2]) {
            if (ability.cooldown > 0) {
                ability.cooldown--;
            }
            if (ability.active && ability.remainingDuration > 0) {
                ability.remainingDuration--;
                if (ability.remainingDuration <= 0) {
                    this.deactivateAbility(ability);
                }
            }
        }

        // Handle active ability effects
        if (this.abilities.ability1.active) {
            switch(this.abilities.ability1.name) {
                case 'Absolute Control':
                    this.rotationalAcceleration = this.shipClass.rotationalAcceleration * 10;
                    this.acceleration = this.shipClass.acceleration * 10;
                    break;
                case 'Sentry':
                    this.maxSpeed = this.shipClass.maxSpeed * 0.5;
                    this.energyRegen = this.shipClass.energyRegen * 1.5;
                    break;
                case 'Warp Drive':
                    // Effect handled in activation
                    break;
            }
        }

        if (this.abilities.ability2.active) {
            switch(this.abilities.ability2.name) {
                case 'Deathray':
                    this.rotationalAcceleration = this.shipClass.rotationalAcceleration * 0.5;
                    this.energyRegen = this.shipClass.energyRegen * 10;
                    if (this.energy >= this.maxEnergy && this.abilities.ability2.shotsRemaining > 0) {
                        // Shoot in a line pattern
                        const spreadAngle = 0.05; // Angle between shots
                        const startAngle = this.rotation - (spreadAngle * 7); // Start from left
                        this.createLaser(startAngle + (spreadAngle * (16 - this.abilities.ability2.shotsRemaining)), 2, 8);
                        this.abilities.ability2.shotsRemaining--;
                        this.energy = 0;
                    }
                    break;
                case 'Squadron':
                    // Update clone positions and behaviors
                    if (this.abilities.ability2.clones.length > 0) {
                        const FORMATION_DISTANCE = 80; // Distance from player when in formation

                        this.abilities.ability2.clones.forEach((clone, index) => {
                            // Calculate formation position
                            const formationAngle = this.rotation + (index === 0 ? -Math.PI/2 : Math.PI/2);
                            const targetX = this.x + Math.cos(formationAngle) * FORMATION_DISTANCE;
                            const targetY = this.y + Math.sin(formationAngle) * FORMATION_DISTANCE;

                            // Move towards formation position
                            const angleToTarget = Math.atan2(targetY - clone.y, targetX - clone.x);
                            const distToTarget = distance(clone.x, clone.y, targetX, targetY);
                            
                            // Adjust speed based on distance to target
                            const speedMultiplier = Math.min(distToTarget / 100, 1);
                            clone.x += Math.cos(angleToTarget) * clone.maxSpeed * speedMultiplier;
                            clone.y += Math.sin(angleToTarget) * clone.maxSpeed * speedMultiplier;
                            
                            // Match player's rotation
                            clone.rotation = this.rotation;
                            
                            // Regenerate energy
                            clone.energy = Math.min(clone.maxEnergy, clone.energy + clone.energyRegen);
                            
                            // Update shoot cooldown
                            if (clone.shootCooldown > 0) {
                                clone.shootCooldown--;
                            }
                            
                            // Shoot when player shoots
                            if ((keys[' '] || mouse.isDown) && clone.energy >= clone.shootCost && clone.shootCooldown <= 0) {
                                this.createLaser(clone.rotation, 0.8, 1, clone.x, clone.y);
                                clone.energy -= clone.shootCost;
                                clone.shootCooldown = clone.maxShootCooldown;
                            }
                        });
                    }
                    break;
            }
        }
    }

    activateAbility(abilityNum) {
        const ability = abilityNum === 1 ? this.abilities.ability1 : this.abilities.ability2;
        
        if (ability.cooldown > 0) {
            showNotification(`${ability.name} is on cooldown!`, 'warning');
            return;
        }

        ability.active = true;
        ability.cooldown = ability.maxCooldown;
        ability.remainingDuration = ability.duration;

        switch(ability.name) {
            case 'Reload':
                this.energy = Math.min(this.maxEnergy, this.energy + 100);
                ability.active = false; // Instant effect
                showNotification('Energy Restored!');
                break;
            case 'Boost':
                showNotification('Damage Boosted!');
                break;
            case 'Sentry':
                showNotification('Sentry Mode Activated!');
                break;
            case 'Storm':
                // Shoot 16 lasers in a circle
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    this.createLaser(angle, 2, 4);
                }
                ability.active = false; // Instant effect
                showNotification('Storm Released!');
                break;
            case 'Absolute Control':
                showNotification('Absolute Control Activated!');
                break;
            case 'Squadron':
                // Create two clones with level 1 speedster stats
                this.abilities.ability2.clones = [
                    {
                        x: this.x - 50,
                        y: this.y,
                        rotation: this.rotation,
                        health: SHIP_CLASSES.SPEEDSTER.health,
                        maxSpeed: SHIP_CLASSES.SPEEDSTER.maxSpeed,
                        acceleration: SHIP_CLASSES.SPEEDSTER.acceleration,
                        shootCost: SHIP_CLASSES.SPEEDSTER.shootCost,
                        maxEnergy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energyRegen: SHIP_CLASSES.SPEEDSTER.energyRegen,
                        shootCooldown: 0,
                        maxShootCooldown: 30 // Add shoot cooldown for clones (half second at 60 FPS)
                    },
                    {
                        x: this.x + 50,
                        y: this.y,
                        rotation: this.rotation,
                        health: SHIP_CLASSES.SPEEDSTER.health,
                        maxSpeed: SHIP_CLASSES.SPEEDSTER.maxSpeed,
                        acceleration: SHIP_CLASSES.SPEEDSTER.acceleration,
                        shootCost: SHIP_CLASSES.SPEEDSTER.shootCost,
                        maxEnergy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energyRegen: SHIP_CLASSES.SPEEDSTER.energyRegen,
                        shootCooldown: 0,
                        maxShootCooldown: 30
                    }
                ];
                showNotification('Squadron Deployed!');
                break;
            case 'Warp Drive':
                // Store target location
                ability.targetX = mouse.x + camera.x;
                ability.targetY = mouse.y + camera.y;
                // Teleport
                this.x = ability.targetX;
                this.y = ability.targetY;
                showNotification('Warped!');
                break;
            case 'Deathray':
                ability.shotsRemaining = 16;
                showNotification('Deathray Charging!');
                break;
        }
    }

    deactivateAbility(ability) {
        ability.active = false;
        
        // Reset any temporary stat changes
        switch(ability.name) {
            case 'Absolute Control':
                this.rotationalAcceleration = this.shipClass.rotationalAcceleration;
                this.acceleration = this.shipClass.acceleration;
                break;
            case 'Sentry':
                this.maxSpeed = this.shipClass.maxSpeed;
                this.energyRegen = this.shipClass.energyRegen;
                break;
            case 'Deathray':
                this.rotationalAcceleration = this.shipClass.rotationalAcceleration;
                this.energyRegen = this.shipClass.energyRegen;
                ability.shotsRemaining = 0;
                break;
            case 'Squadron':
                this.abilities.ability2.clones = [];
                break;
        }
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

    createLaser(angle, sizeMultiplier = 1, speedMultiplier = 1, startX = this.x, startY = this.y) {
        const laser = {
            x: startX,
            y: startY,
            velocityX: Math.cos(angle) * (10 * speedMultiplier) + this.velocityX,
            velocityY: Math.sin(angle) * (10 * speedMultiplier) + this.velocityY,
            width: 4 * sizeMultiplier,
            height: 4 * sizeMultiplier,
            rotation: angle,
            color: this.upgradeLevel >= 2 ? this.color : '#ff0000',
            damage: this.shipClass.name === 'Sniper' ? 25 * sizeMultiplier : 10 * sizeMultiplier
        };

        // Apply ability damage modifiers
        if ((this.abilities.ability1.active && this.abilities.ability1.name === 'Warp Drive') ||
            (this.abilities.ability2.active && this.abilities.ability2.name === 'Deathray')) {
            laser.damage *= 2;
        }
        if (this.abilities.ability1.active && this.abilities.ability1.name === 'Sentry') {
            laser.damage *= 2;
        }
        if (this.abilities.ability2.active && this.abilities.ability2.name === 'Storm') {
            laser.knockback = true;
        }

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