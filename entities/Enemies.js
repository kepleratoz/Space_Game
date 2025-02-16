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