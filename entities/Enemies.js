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
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.ramInvulnerabilityDuration = 20; // Reduced from 45 to 20 (0.33 seconds at 60 FPS)
        this.lastRamTime = 0; // Track the last time this enemy was rammed
        this.isRamDamage = false; // Flag to track if damage is from ramming
        this.type = 'Enemy'; // Add base type
        this.drops = []; // Array of possible item drops with chances
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

        // Check if mouse is hovering over this enemy
        if (Math.abs(mouse.x - screenX) < this.width/2 && 
            Math.abs(mouse.y - screenY) < this.height/2) {
            this.drawTooltip(screenX, screenY);
        }
    }

    drawShape(x, y) {
        ctx.fillRect(x - this.width/2, y - this.height/2, this.width, this.height);
    }

    drawTooltip(screenX, screenY) {
        // Set up tooltip text
        const tooltipText = `${this.type} - Health: ${Math.ceil(this.health)}`;
        
        // Configure tooltip style
        ctx.font = '14px Arial';
        const textMetrics = ctx.measureText(tooltipText);
        const padding = 5;
        const tooltipWidth = textMetrics.width + padding * 2;
        const tooltipHeight = 20 + padding * 2;
        
        // Position tooltip above enemy
        const tooltipX = screenX - tooltipWidth/2;
        const tooltipY = screenY - this.height/2 - tooltipHeight - 5;
        
        // Draw tooltip background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
        ctx.fill();
        
        // Draw tooltip border
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw tooltip text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tooltipText, screenX, tooltipY + tooltipHeight/2);
    }

    update() {
        // Skip behavior update if frozen
        if (!window.isFrozen) {
            this.behavior();
            
            // Update invulnerability
            if (this.invulnerable) {
                this.invulnerableTime--;
                if (this.invulnerableTime <= 0) {
                    this.invulnerable = false;
                }
            }
            
            // Apply wall collisions for all zones
            if (typeof window.handleWallCollisions === 'function') {
                window.handleWallCollisions(this);
            }
            
            // Update position AFTER wall collision check
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // World boundaries
            this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
            this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
        }

        return this.health <= 0;
    }

    behavior() {
        // Base behavior - do nothing
    }

    takeDamage(amount, isRam = false) {
        const currentTime = Date.now();

        if (isRam) {
            // For ram/collision damage, check invulnerability and cooldown
            if (this.invulnerable || currentTime - this.lastRamTime < 250) {
                return; // Skip damage if invulnerable or hit too recently by ram
            }
            // Apply ram damage and set invulnerability
            this.lastRamTime = currentTime;
            this.invulnerable = true;
            this.invulnerableTime = this.ramInvulnerabilityDuration;
            this.health -= amount;
            
            // Create damage number for ram damage
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            damageNumbers.push(new DamageNumber(this.x + offsetX, this.y + offsetY, amount, '#ff4242'));
        } else {
            // For non-ram damage (like lasers), always apply damage
            this.health -= amount;
            
            // Create damage number for each laser hit
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            damageNumbers.push(new DamageNumber(this.x + offsetX, this.y + offsetY, amount, '#ff0000'));
        }

        // Check if enemy is defeated
        if (this.health <= 0) {
            this.dropItems();
        }
    }

    dropItems() {
        // Process drops based on drop table
        if (this.drops && this.drops.length > 0) {
            for (const drop of this.drops) {
                const roll = Math.random();
                if (roll < drop.chance) {
                    // Create the item
                    if (typeof drop.itemClass === 'function') {
                        // Add small random offset to prevent items from stacking
                        const offsetX = (Math.random() - 0.5) * 20;
                        const offsetY = (Math.random() - 0.5) * 20;
                        
                        // Create and add the item to the game
                        if (typeof window.items !== 'undefined') {
                            window.items.push(new drop.itemClass(this.x + offsetX, this.y + offsetY));
                        } else {
                            // If items array doesn't exist yet, create it
                            window.items = [new drop.itemClass(this.x + offsetX, this.y + offsetY)];
                        }
                    }
                }
            }
        }
    }
}

class ChaserEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff3333';
        this.speed = 3;
        this.health = 20;
        this.type = 'Chaser'; // Add type
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
        
        // Position is updated in the update method after wall collision checks
    }
}

class ShooterEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 30; // Reduced from 40 to 30 (75%)
        this.height = 30; // Reduced from 40 to 30 (75%)
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 10;
        this.shootCooldown = 0;
        this.shootInterval = 90; // 1.5 seconds at 60 FPS
        this.laserSpeed = 6;
        this.laserWidth = 7.5; // Reduced from 10 to 7.5 (75%)
        this.laserHeight = 7.5; // Reduced from 10 to 7.5 (75%)
        this.color = '#ff0000'; // Changed to red
        this.maxSpeed = 2;
        this.aggroRange = 800;
        this.shootRange = 600;
        this.idleSpeed = 0.5;
        this.idleAngle = Math.random() * Math.PI * 2;
        this.idleTimer = 0;
        this.idleChangeInterval = 180;
        this.type = 'Shooter';
    }

    drawShape(x, y) {
        // Draw a simple red square
        ctx.fillRect(x - this.width/2, y - this.height/2, this.width, this.height);
    }

    behavior() {
        if (window.isFrozen) return;

        // Move towards player if in aggro range
        if (player && distance(this.x, this.y, player.x, player.y) < this.aggroRange) {
            // Calculate angle to player
            this.rotation = Math.atan2(player.y - this.y, player.x - this.x);
            
            // Move towards player if not in shoot range
            if (distance(this.x, this.y, player.x, player.y) > this.shootRange) {
                this.velocityX = Math.cos(this.rotation) * this.maxSpeed;
                this.velocityY = Math.sin(this.rotation) * this.maxSpeed;
            } else {
                // Slow down when in shooting range
                this.velocityX *= 0.9;
                this.velocityY *= 0.9;
                
                // Shoot at player
                if (this.shootCooldown <= 0) {
                    this.shoot();
                    this.shootCooldown = this.shootInterval;
                } else {
                    this.shootCooldown--;
                }
            }
        } else {
            // Slow down when not chasing
            this.velocityX *= 0.95;
            this.velocityY *= 0.95;
        }

        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Keep within world bounds
        this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
    }

    shoot() {
        // Create a projectile
        if (!enemyProjectiles) enemyProjectiles = [];
        
        // Calculate velocity based on angle to player
        const velocityX = Math.cos(this.rotation) * this.laserSpeed;
        const velocityY = Math.sin(this.rotation) * this.laserSpeed;
        
        // Create the projectile
        enemyProjectiles.push({
            x: this.x + Math.cos(this.rotation) * (this.width/2 + 5),
            y: this.y + Math.sin(this.rotation) * (this.width/2 + 5),
            width: this.laserWidth,
            height: this.laserWidth, // Using laserWidth to keep bullets square
            velocityX: velocityX,
            velocityY: velocityY,
            damage: this.damage,
            angle: this.rotation,
            color: '#ff0000' // Red color for projectiles
        });
    }

    draw() {
        super.draw();
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
        this.type = 'Dasher'; // Add type
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
        if (window.isFrozen) return;

        // Calculate distance to player
        const distToPlayer = distance(this.x, this.y, player.x, player.y);
        
        // If in dash cooldown, slow down
        if (this.dashCooldown > 0) {
            this.velocityX *= 0.95;
            this.velocityY *= 0.95;
        }
        
        // If player is in range and not in cooldown, dash towards player
        if (distToPlayer < this.dashRange && this.dashCooldown <= 0) {
            // Calculate angle to player
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.rotation = angle;
            
            // Dash towards player
            this.velocityX = Math.cos(angle) * this.dashSpeed;
            this.velocityY = Math.sin(angle) * this.dashSpeed;
            
            // Set dash cooldown
            this.dashCooldown = this.dashCooldownMax;
        } else {
            this.dashCooldown--;
        }

        // Position is updated in the update method after wall collision checks
    }
}

class BomberEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#4287f5'; // Electric blue color
        this.speed = 2;
        this.health = 50;
        this.shootCooldown = 0;
        this.maxShootCooldown = 180; // 3 seconds
        this.orbs = [];
        this.orbSpeed = 3;
        this.orbSize = 20;
        this.orbDamage = 25;
        this.orbRange = 400; // Range before orbs dissipate
        this.orbSpread = Math.PI / 16; // Increased spread (1/16 of PI instead of 1/32)
        this.type = 'Bomber'; // Add type
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

        // Draw cyan circle center
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(x, y, this.width/4, 0, Math.PI * 2);
        ctx.fill();
    }

    behavior() {
        if (window.isFrozen) return;

        // Move in a figure-8 pattern around the player
        const time = Date.now() / 1000;
        const radius = 200;
        const targetX = player.x + Math.cos(time) * radius;
        const targetY = player.y + Math.sin(time * 2) * radius;
        
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.rotation = angle;
        
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
        
        // Position is updated in the update method after wall collision checks

        // Shoot orbs
        if (this.shootCooldown <= 0) {
            this.shootOrbs();
            this.shootCooldown = this.maxShootCooldown;
        } else {
            this.shootCooldown--;
        }
    }

    shootOrbs() {
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        
        // Shoot 3 orbs in a narrow spread
        for (let i = 0; i < 3; i++) {
            const spreadOffset = (i - 1) * this.orbSpread; // -spread, 0, +spread
            const angle = baseAngle + spreadOffset;
            const orb = {
                x: this.x,
                y: this.y,
                velocityX: Math.cos(angle) * this.orbSpeed,
                velocityY: Math.sin(angle) * this.orbSpeed,
                distanceTraveled: 0
            };
            this.orbs.push(orb);
        }
    }

    draw() {
        super.draw();
        
        // Draw orbs and connecting electric lines
        if (this.orbs.length > 0) {
            // Draw electric connections between orbs
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            
            for (let i = 0; i < this.orbs.length - 1; i++) {
                const orb1 = this.orbs[i];
                const orb2 = this.orbs[i + 1];
                
                // Draw lightning effect between orbs
                ctx.beginPath();
                const segments = 4;
                let startX = orb1.x - camera.x;
                let startY = orb1.y - camera.y;
                const endX = orb2.x - camera.x;
                const endY = orb2.y - camera.y;
                
                ctx.moveTo(startX, startY);
                for (let j = 1; j < segments; j++) {
                    const ratio = j / segments;
                    const midX = startX + (endX - startX) * ratio;
                    const midY = startY + (endY - startY) * ratio;
                    const offset = (Math.random() - 0.5) * 8; // Reduced offset from 20 to 8
                    ctx.lineTo(midX + offset, midY + offset);
                }
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }

            // Draw orbs
            ctx.fillStyle = '#4287f5';
            this.orbs.forEach(orb => {
                const screenX = orb.x - camera.x;
                const screenY = orb.y - camera.y;
                
                // Draw glow effect
                const gradient = ctx.createRadialGradient(
                    screenX, screenY, 0,
                    screenX, screenY, this.orbSize
                );
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.5, '#4287f5');
                gradient.addColorStop(1, 'rgba(66, 135, 245, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.orbSize, 0, Math.PI * 2);
                ctx.fill();
            });
        }
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
        this.maxShootCooldown = 420;
        this.missiles = [];
        this.missileSpeed = 8;
        this.missileTurnSpeed = 0.02;
        this.aggroRange = 800; // Match ShooterEnemy
        this.shootRange = 600; // Match ShooterEnemy
        this.idleSpeed = 0.5;
        this.idleAngle = Math.random() * Math.PI * 2;
        this.idleTimer = 0;
        this.idleChangeInterval = 180;
        this.type = 'Swarmer'; // Add type
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
        if (window.isFrozen) return;

        const distToPlayer = distance(this.x, this.y, player.x, player.y);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        this.rotation = angleToPlayer;

        if (distToPlayer < this.aggroRange) {
            // In aggro range - maintain shoot range like ShooterEnemy
            const targetDist = this.shootRange;
            const moveSpeed = this.speed;

            if (distToPlayer < targetDist - 50) {
                // Too close, back away
                this.x -= Math.cos(angleToPlayer) * moveSpeed;
                this.y -= Math.sin(angleToPlayer) * moveSpeed;
            } else if (distToPlayer > targetDist + 50) {
                // Too far, move closer
                this.x += Math.cos(angleToPlayer) * moveSpeed;
                this.y += Math.sin(angleToPlayer) * moveSpeed;
            } else {
                this.velocityX *= 0.95;
                this.velocityY *= 0.95;
            }

            // Shoot if in range
            if (this.shootCooldown <= 0 && distToPlayer < this.shootRange) {
                this.shootMissiles();
                this.shootCooldown = this.maxShootCooldown;
            }
        } else {
            // Outside aggro range - idle movement
            this.idleTimer++;
            if (this.idleTimer >= this.idleChangeInterval) {
                this.idleTimer = 0;
                this.idleAngle = Math.random() * Math.PI * 2;
            }

            // Move in idle direction
            this.x += Math.cos(this.idleAngle) * this.idleSpeed;
            this.y += Math.sin(this.idleAngle) * this.idleSpeed;
        }

        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        // Update missiles
        if (!window.isFrozen) {
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
    }

    shootMissiles() {
        // Shoot 3 missiles in spread directions
        for (let i = 0; i < 3; i++) {
            const spreadAngle = this.rotation + (Math.random() - 0.5) * Math.PI; // Random spread within 180 degrees
            const missile = {
                x: this.x,
                y: this.y,
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

class SentryEnemy extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 60; // Larger than regular enemies
        this.height = 60;
        this.health = 200;
        this.maxHealth = 200;
        this.damage = 30; // High damage
        this.shootCooldown = 0;
        this.shootInterval = 120; // 2 seconds at 60 FPS
        this.laserSpeed = 3; // Slow moving lasers
        this.laserWidth = 15;
        this.laserHeight = 30;
        this.angle = 0; // Angle to face player
    }

    drawShape(x, y) {
        // Draw gray hexagon
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hX = x + this.width/2 * Math.cos(angle);
            const hY = y + this.width/2 * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hX, hY);
            } else {
                ctx.lineTo(hX, hY);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw red triangle pointing at player
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.moveTo(this.width/4, 0);
        ctx.lineTo(-this.width/8, -this.width/8);
        ctx.lineTo(-this.width/8, this.width/8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    behavior() {
        // Don't move, just track player
        if (player) {
            // Calculate angle to player
            this.angle = Math.atan2(player.y - this.y, player.x - this.x);
            
            // Shoot at player on interval
            if (this.shootCooldown <= 0) {
                this.shoot();
                this.shootCooldown = this.shootInterval;
            } else {
                this.shootCooldown--;
            }
        }
    }

    shoot() {
        // Create a projectile
        if (!enemyProjectiles) enemyProjectiles = [];
        
        // Calculate velocity based on angle to player
        const velocityX = Math.cos(this.angle) * this.laserSpeed;
        const velocityY = Math.sin(this.angle) * this.laserSpeed;
        
        // Create the projectile - make it a square
        const size = 20; // Size of the square
        enemyProjectiles.push({
            x: this.x + Math.cos(this.angle) * (this.width/2 + 5),
            y: this.y + Math.sin(this.angle) * (this.width/2 + 5),
            width: size,
            height: size,
            velocityX: velocityX,
            velocityY: velocityY,
            damage: this.damage,
            angle: this.angle,
            color: '#8800ff', // Changed from red to purple
            fromSentry: true // Mark as coming from a Sentry for identification
        });
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Only draw if on screen
        if (screenX + this.width/2 < 0 || screenX - this.width/2 > canvas.width ||
            screenY + this.height/2 < 0 || screenY - this.height/2 > canvas.height) {
            return;
        }
        
        this.drawShape(screenX, screenY);
        
        // Check if mouse is hovering over this enemy
        if (Math.abs(mouse.x - screenX) < this.width/2 && 
            Math.abs(mouse.y - screenY) < this.height/2) {
            if (isDebugMode) {
                this.drawTooltip(screenX, screenY);
            }
        }
    }
}

class AutomatedSentry extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 60; // Increased size (was 40)
        this.height = 60; // Increased size (was 40)
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 40; // High damage
        this.shootCooldown = 0;
        this.shootInterval = 180; // 3 seconds at 60 FPS (very slow)
        this.laserSpeed = 4; // Slower projectiles
        this.laserWidth = 15; // Larger projectiles
        this.laserHeight = 15;
        this.color = '#777777'; // Gray color (was '#8a2be2')
        this.innerColor = '#555555'; // Darker gray for inner hexagon
        this.cannonColor = '#333333'; // Dark gray for cannon
        this.maxSpeed = 0; // Stationary
        this.aggroRange = 800;
        this.shootRange = 700;
        this.type = 'Automated Sentry';
        this.rotationSpeed = 0.01; // Slow rotation
        
        // Set up drops - 50% chance to drop Rusted Plating
        this.drops = [
            { itemClass: RustedPlating, chance: 0.5 }
        ];
    }

    drawShape(x, y) {
        // Draw the outer hexagon (big gray hexagon)
        ctx.beginPath();
        const sides = 6;
        const outerSize = this.width / 2;
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides);
            const px = x + outerSize * Math.cos(angle);
            const py = y + outerSize * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw the inner hexagon (smaller gray hexagon)
        ctx.beginPath();
        const innerSize = outerSize * 0.6; // 60% of the outer size
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides);
            const px = x + innerSize * Math.cos(angle);
            const py = y + innerSize * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
        ctx.closePath();
        ctx.fillStyle = this.innerColor;
        ctx.fill();
        
        // Draw the cannon that aims at the player
        ctx.save();
        ctx.rotate(this.rotation); // Rotate to aim at player
        
        // Cannon base (circle) - BIGGER now
        ctx.beginPath();
        ctx.arc(x, y, innerSize * 0.6, 0, Math.PI * 2); // Increased from 0.4 to 0.6
        ctx.fillStyle = this.cannonColor;
        ctx.fill();
        
        // Cannon barrel - WIDER now
        ctx.beginPath();
        const barrelWidth = 14; // Increased from 8 to 14
        const barrelLength = outerSize * 0.8;
        
        // Draw the barrel as a rectangle
        ctx.fillStyle = this.cannonColor;
        ctx.fillRect(x, y - barrelWidth/2, barrelLength, barrelWidth);
        
        ctx.restore();
    }

    behavior() {
        if (window.isFrozen) return;

        // Only rotate and shoot if player is in range
        if (player && distance(this.x, this.y, player.x, player.y) < this.aggroRange) {
            // Calculate angle to player for rotation
            const targetRotation = Math.atan2(player.y - this.y, player.x - this.x);
            
            // Smoothly rotate towards player
            const angleDiff = normalizeAngle(targetRotation - this.rotation);
            if (Math.abs(angleDiff) > 0.05) {
                this.rotation += Math.sign(angleDiff) * this.rotationSpeed;
            }
            
            // Shoot at player if cooldown is ready and in range
            if (this.shootCooldown <= 0 && distance(this.x, this.y, player.x, player.y) < this.shootRange) {
                this.shoot();
                this.shootCooldown = this.shootInterval;
            }
        } else {
            // Slowly rotate when idle
            this.rotation += this.rotationSpeed / 3;
        }

        // Update shoot cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }

    shoot() {
        // Create a large projectile
        if (!enemyProjectiles) enemyProjectiles = [];
        
        // Calculate velocity based on current rotation (not necessarily pointing at player)
        const velocityX = Math.cos(this.rotation) * this.laserSpeed;
        const velocityY = Math.sin(this.rotation) * this.laserSpeed;
        
        // Create the projectile - now from the end of the cannon
        const barrelLength = this.width/2 * 0.8;
        enemyProjectiles.push({
            x: this.x + Math.cos(this.rotation) * (barrelLength + 10),
            y: this.y + Math.sin(this.rotation) * (barrelLength + 10),
            width: this.laserWidth,
            height: this.laserWidth,
            velocityX: velocityX,
            velocityY: velocityY,
            damage: this.damage,
            angle: this.rotation,
            color: '#555555' // Match the gray color scheme
        });
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
        this.drawShape(0, 0);
        ctx.restore();

        // Check if mouse is hovering over this enemy
        if (Math.abs(mouse.x - screenX) < this.width/2 && 
            Math.abs(mouse.y - screenY) < this.height/2) {
            this.drawTooltip(screenX, screenY);
        }
    }
}

class RogueDrone extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 25;
        this.height = 25;
        this.color = '#5F6642'; // Dull Olive color (was '#00ffaa')
        this.speed = 12; // Extreme speed
        this.health = 5;
        this.maxHealth = 5;
        this.damage = 35; // High damage on contact
        this.type = 'Rogue Drone';
        this.markedForRemoval = false; // Flag to mark for immediate removal
        this.hasCollidedWithPlayer = false; // Track if this drone has already collided with player
    }

    drawShape(x, y) {
        // Draw a diamond shape with military/industrial colors
        ctx.beginPath();
        ctx.moveTo(x, y - this.height/2); // Top
        ctx.lineTo(x + this.width/2, y); // Right
        ctx.lineTo(x, y + this.height/2); // Bottom
        ctx.lineTo(x - this.width/2, y); // Left
        ctx.closePath();
        ctx.fill();
        
        // Draw a rusty brown inner diamond
        ctx.fillStyle = '#8C5A3B'; // Rusty Brown
        ctx.beginPath();
        const innerSize = 0.7; // 70% of the original size
        ctx.moveTo(x, y - this.height/2 * innerSize); // Top
        ctx.lineTo(x + this.width/2 * innerSize, y); // Right
        ctx.lineTo(x, y + this.height/2 * innerSize); // Bottom
        ctx.lineTo(x - this.width/2 * innerSize, y); // Left
        ctx.closePath();
        ctx.fill();
        
        // Draw a gunmetal gray center
        ctx.fillStyle = '#4B4F56'; // Gunmetal Gray
        ctx.beginPath();
        ctx.arc(x, y, this.width/5, 0, Math.PI * 2);
        ctx.fill();
    }

    behavior() {
        if (window.isFrozen || this.hasCollidedWithPlayer) return;

        // Calculate angle to player
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.rotation = angle;
        
        // Move directly towards player at high speed
        this.velocityX = Math.cos(angle) * this.speed;
        this.velocityY = Math.sin(angle) * this.speed;
        
        // Check for collision with player
        if (distance(this.x, this.y, player.x, player.y) < (this.width + player.width) / 2) {
            // Mark that we've collided to prevent multiple damage applications
            this.hasCollidedWithPlayer = true;
            
            // Deal damage to player
            player.takeDamage(this.damage);
            
            // Die immediately
            this.health = 0;
            this.markedForRemoval = true; // Mark for immediate removal
            
            // Create explosion effect
            if (typeof window.createExplosion === 'function') {
                window.createExplosion(this.x, this.y, '#8C5A3B', 15);
            }
            
            // Stop movement
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }
    
    update() {
        // If marked for removal, return true to remove immediately
        if (this.markedForRemoval) {
            return true;
        }
        
        // Otherwise use the standard update method
        return super.update();
    }
}

class RogueFighter extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.width = 35;
        this.height = 35;
        this.color = '#ff6600'; // Orange color
        this.health = 40;
        this.maxHealth = 40;
        this.speed = 4;
        this.damage = 5; // Damage per bullet
        this.type = 'Rogue Fighter';
        
        // AI state
        this.state = 'retreat'; // States: retreat, aim, pause, shoot
        this.targetDistance = 500; // Safe distance to maintain
        this.pauseTimer = 0;
        this.pauseDuration = 120; // 2 seconds at 60 FPS
        this.bulletsFired = 0;
        this.maxBullets = 3;
        this.bulletCooldown = 0;
        this.bulletCooldownDuration = 10; // Time between bullets
        this.retreatTimer = 0;
        this.retreatDuration = 180; // 3 seconds before next attack sequence
        this.destroyed = false; // Track if we've already created the explosion
    }

    drawShape(x, y) {
        // Draw a triangular fighter shape
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y); // Nose
        ctx.lineTo(x - this.width/2, y + this.height/3); // Bottom right
        ctx.lineTo(x - this.width/3, y); // Back center
        ctx.lineTo(x - this.width/2, y - this.height/3); // Top right
        ctx.closePath();
        ctx.fill();
        
        // Draw engine glow based on state
        ctx.fillStyle = this.state === 'retreat' ? '#ff9900' : '#666666';
        ctx.beginPath();
        ctx.arc(x - this.width/3, y, this.width/6, 0, Math.PI * 2);
        ctx.fill();
    }

    behavior() {
        if (window.isFrozen) return;

        const distToPlayer = distance(this.x, this.y, player.x, player.y);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        
        // State machine for fighter behavior
        switch (this.state) {
            case 'retreat':
                // Move away from player to safe distance
                if (distToPlayer < this.targetDistance) {
                    // Calculate angle away from player
                    const retreatAngle = Math.atan2(this.y - player.y, this.x - player.x);
                    this.rotation = retreatAngle;
                    this.velocityX = Math.cos(retreatAngle) * this.speed;
                    this.velocityY = Math.sin(retreatAngle) * this.speed;
                } else {
                    // At safe distance, transition to aim state
                    this.velocityX *= 0.9;
                    this.velocityY *= 0.9;
                    this.state = 'aim';
                }
                break;
                
            case 'aim':
                // Aim at player
                this.rotation = angleToPlayer;
                this.velocityX *= 0.9;
                this.velocityY *= 0.9;
                
                // Transition to pause state
                this.state = 'pause';
                this.pauseTimer = this.pauseDuration;
                break;
                
            case 'pause':
                // Hold position and continue aiming
                this.rotation = angleToPlayer;
                this.velocityX *= 0.9;
                this.velocityY *= 0.9;
                
                // Count down pause timer
                this.pauseTimer--;
                if (this.pauseTimer <= 0) {
                    // Transition to shoot state
                    this.state = 'shoot';
                    this.bulletsFired = 0;
                    this.bulletCooldown = 0;
                }
                break;
                
            case 'shoot':
                // Continue aiming while shooting
                this.rotation = angleToPlayer;
                this.velocityX *= 0.9;
                this.velocityY *= 0.9;
                
                // Fire bullets with cooldown
                if (this.bulletCooldown <= 0) {
                    if (this.bulletsFired < this.maxBullets) {
                        this.shootBullet();
                        this.bulletsFired++;
                        this.bulletCooldown = this.bulletCooldownDuration;
                    } else {
                        // After firing all bullets, go back to retreat
                        this.state = 'retreat';
                        this.retreatTimer = this.retreatDuration;
                    }
                } else {
                    this.bulletCooldown--;
                }
                break;
        }
        
        // If in retreat cooldown, count it down
        if (this.retreatTimer > 0) {
            this.retreatTimer--;
        }
    }
    
    shootBullet() {
        // Create a high-speed bullet
        if (!enemyProjectiles) enemyProjectiles = [];
        
        const bulletSpeed = 10; // High speed
        const velocityX = Math.cos(this.rotation) * bulletSpeed;
        const velocityY = Math.sin(this.rotation) * bulletSpeed;
        
        // Create the projectile
        enemyProjectiles.push({
            x: this.x + Math.cos(this.rotation) * (this.width/2 + 5),
            y: this.y + Math.sin(this.rotation) * (this.width/2 + 5),
            width: 8,
            height: 8,
            velocityX: velocityX,
            velocityY: velocityY,
            damage: this.damage,
            angle: this.rotation,
            color: '#ff9900' // Orange bullet
        });
    }

    update() {
        // Check if health is zero and create explosion effect
        if (this.health <= 0 && !this.destroyed && typeof window.createExplosion === 'function') {
            window.createExplosion(this.x, this.y, '#ff9900', 25);
            this.destroyed = true;
        }
        
        return super.update();
    }
}

// Helper function to normalize angle between -PI and PI
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

// Make all enemy classes available globally
window.Enemy = Enemy;
window.ChaserEnemy = ChaserEnemy;
window.ShooterEnemy = ShooterEnemy;
window.DasherEnemy = DasherEnemy;
window.BomberEnemy = BomberEnemy;
window.SwarmerEnemy = SwarmerEnemy;
window.SentryEnemy = SentryEnemy;
window.AutomatedSentry = AutomatedSentry;
window.RogueDrone = RogueDrone;
window.RogueFighter = RogueFighter;