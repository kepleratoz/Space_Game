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