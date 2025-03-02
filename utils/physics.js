const FRICTION = 0.98;
const BOUNCE = 0.7;

class DamageNumber {
    constructor(x, y, amount, color = '#ff0000') {
        this.x = x;
        this.y = y;
        this.amount = Math.round(amount);
        this.color = color;
        this.life = 45; // Increased from 30 to 45 (0.75 seconds at 60 FPS)
        this.velocityY = -1.5; // Slightly slower upward movement
        this.alpha = 1;
        
        // Scale based on damage amount - larger damage = larger text
        // Base size is 1.0, with a bonus of up to 0.5 for high damage
        const damageScale = Math.min(0.5, this.amount / 50); // Cap at 50 damage for max size
        this.scale = 1.0 + damageScale;
    }

    update() {
        this.y += this.velocityY;
        this.life--;
        this.alpha = this.life / 45;
        
        // Scale down slightly as it fades
        if (this.life < 15) {
            this.scale = Math.max(0.8, this.scale - 0.02);
        }
        
        return this.life <= 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Add text shadow/outline for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Use color based on damage amount
        ctx.fillStyle = this.color;
        
        // Font size based on scale
        const fontSize = Math.floor(16 * this.scale);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.amount, screenX, screenY);
        ctx.restore();
    }
}

// Initialize damage numbers array at the top
let damageNumbers = [];

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
                enemy.takeDamage(damage, true);
            }
        });
    });

    // Check laser hits with ray-casting
    for (let laserIndex = player.lasers.length - 1; laserIndex >= 0; laserIndex--) {
        const laser = player.lasers[laserIndex];
        // Store the previous position
        const prevX = laser.x - laser.velocityX;
        const prevY = laser.y - laser.velocityY;
        
        // Ray tracing parameters
        const rayOriginX = prevX;
        const rayOriginY = prevY;
        const rayDirX = laser.velocityX;
        const rayDirY = laser.velocityY;
        const rayLength = Math.sqrt(rayDirX * rayDirX + rayDirY * rayDirY);
        const normalizedRayDirX = rayDirX / rayLength;
        const normalizedRayDirY = rayDirY / rayLength;
        
        // Track if we should remove the laser
        let shouldRemoveLaser = false;
        
        // Check enemies with ray tracing
        for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
            const enemy = enemies[enemyIndex];
            // Skip if this enemy was already hit by this piercing laser
            if (laser.pierceCount > 0 && laser.hitEnemies && laser.hitEnemies.has(enemy)) {
                continue;
            }

            // Vector from ray origin to circle center
            const toCircleX = enemy.x - rayOriginX;
            const toCircleY = enemy.y - rayOriginY;
            
            // Project vector onto ray direction to find closest point
            const dot = toCircleX * normalizedRayDirX + toCircleY * normalizedRayDirY;
            
            // Only process hits in front of the ray origin
            if (dot >= 0 && dot <= rayLength) {
                // Find closest point on ray to circle center
                const closestX = rayOriginX + normalizedRayDirX * dot;
                const closestY = rayOriginY + normalizedRayDirY * dot;
                
                // Distance from closest point to circle center
                const distX = closestX - enemy.x;
                const distY = closestY - enemy.y;
                const distSquared = distX * distX + distY * distY;
                
                // Check if ray hits circle
                if (distSquared <= (enemy.width/2) * (enemy.width/2)) {
                    // Apply damage from this laser
                    enemy.takeDamage(laser.damage);
                    
                    // Track this enemy as hit if it's a piercing laser
                    if (laser.pierceCount > 0) {
                        if (!laser.hitEnemies) {
                            laser.hitEnemies = new Set();
                        }
                        laser.hitEnemies.add(enemy);
                        laser.pierceCount--;
                        if (laser.pierceCount <= 0) {
                            shouldRemoveLaser = true;
                        }
                    } else {
                        shouldRemoveLaser = true;
                    }
                    
                    if (enemy.health <= 0) {
                        // Drop gems when enemy is destroyed
                        const gemCount = Math.floor(Math.random() * 3) + 1;
                        for (let i = 0; i < gemCount; i++) {
                            gems.push(new Gem(enemy.x, enemy.y, 10));
                        }
                        enemies.splice(enemyIndex, 1);
                        score += 100;
                        
                        // Track enemy kill for testing zone progression
                        if (typeof trackEnemyKill === 'function' && !(enemy instanceof Asteroid)) {
                            trackEnemyKill();
                        }
                    }
                }
            }
        }

        // Check asteroids with ray tracing
        asteroids.forEach((asteroid, asteroidIndex) => {
            // Vector from ray origin to circle center
            const toCircleX = asteroid.x - rayOriginX;
            const toCircleY = asteroid.y - rayOriginY;
            
            // Project vector onto ray direction to find closest point
            const dot = toCircleX * normalizedRayDirX + toCircleY * normalizedRayDirY;
            
            // If behind ray origin, no hit possible
            if (dot < 0 || dot > rayLength) return;
            
            // Find closest point on ray to circle center
            const closestX = rayOriginX + normalizedRayDirX * dot;
            const closestY = rayOriginY + normalizedRayDirY * dot;
            
            // Distance from closest point to circle center
            const distX = closestX - asteroid.x;
            const distY = closestY - asteroid.y;
            const distSquared = distX * distX + distY * distY;
            
            // Check if ray hits circle
            if (distSquared <= (asteroid.width/2) * (asteroid.width/2)) {
                const oldHealth = asteroid.health;
                asteroid.takeDamage(laser.damage);
                const actualDamage = oldHealth - asteroid.health;
                
                if (actualDamage > 0) {
                    if (laser.pierceCount > 0) {
                        laser.pierceCount--;
                    } else {
                        shouldRemoveLaser = true;
                    }
                    
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
            }
        });

        // Remove laser if it hit something (and has no pierces left) or is off screen
        if (shouldRemoveLaser || 
            laser.x < 0 || laser.x > WORLD_WIDTH || 
            laser.y < 0 || laser.y > WORLD_HEIGHT) {
            player.lasers.splice(laserIndex, 1);
        }
    }

    // Check player collisions with enemies and asteroids
    [...enemies, ...asteroids].forEach(object => {
        const objectRadius = object.width / 2;
        const dist = distance(player.x, player.y, object.x, object.y);
        
        if (dist < playerRadius + objectRadius) {
            // Special handling for RogueDrone - they handle their own collision in behavior()
            if (object instanceof RogueDrone) {
                // The drone will handle its own collision in its behavior method
                // This prevents double-processing the collision
                return;
            }
            
            // Collision response for other objects
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

                // Deal damage to player
                const impactDamage = Math.min(20, Math.max(5, relativeSpeed * 2));
                const oldPlayerHealth = player.health;
                player.takeDamage(impactDamage, true); // Asteroid collisions count as ram damage
                const actualPlayerDamage = oldPlayerHealth - player.health;
                if (actualPlayerDamage > 0) {
                    damageNumbers.push(new DamageNumber(player.x, player.y, actualPlayerDamage));
                }

                // If player is Rammer, apply contact damage to asteroid
                if (player.shipClass && player.shipClass.name === 'Rammer') {
                    if (typeof player.calculateContactDamage === 'function') {
                        const contactDamage = player.calculateContactDamage();
                        const oldAsteroidHealth = object.health;
                        // Asteroids take double damage from ramming to make them more satisfying to destroy
                        object.health -= contactDamage * 2;
                        const actualDamage = oldAsteroidHealth - object.health;
                        if (actualDamage > 0) {
                            damageNumbers.push(new DamageNumber(object.x, object.y, actualDamage, '#ff4242')); // Rammer damage in red
                        }
                    }
                    
                    // Check if asteroid was destroyed
                    if (object.health <= 0) {
                        // Drop gems when asteroid is destroyed
                        const gemCount = Math.floor(Math.random() * 2) + 1;
                        for (let i = 0; i < gemCount; i++) {
                            gems.push(new Gem(object.x, object.y, 5));
                        }
                        score += 50;
                    }
                }
            } else {
                // For enemies, keep existing behavior
                object.x -= Math.cos(angle) * overlap;
                object.y -= Math.sin(angle) * overlap;
                
                // Calculate push force based on player's velocity and whether they're dashing
                const pushForce = player.isDashing ? 5 : 2;
                const velocityMagnitude = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
                const normalizedVelocity = {
                    x: player.velocityX / velocityMagnitude,
                    y: player.velocityY / velocityMagnitude
                };
                
                // Apply push force to enemy with additional mass factor for Rammer
                const massFactor = player.shipClass.name === 'Rammer' ? 1.5 : 1;
                object.velocityX = normalizedVelocity.x * velocityMagnitude * pushForce * massFactor;
                object.velocityY = normalizedVelocity.y * velocityMagnitude * pushForce * massFactor;

                // Deal damage to both player and enemy
                const baseDamage = 5; // Base contact damage
                const relativeSpeed = Math.sqrt(
                    Math.pow(player.velocityX - object.velocityX, 2) +
                    Math.pow(player.velocityY - object.velocityY, 2)
                );
                
                // Scale damage based on relative speed, capped at 2x
                const speedMultiplier = Math.min(2, 1 + (relativeSpeed / player.maxSpeed));
                const finalDamage = Math.max(1, Math.round(baseDamage * speedMultiplier));
                
                const isRamming = player.shipClass.name === 'Rammer' && (player.isDashing || velocityMagnitude > player.maxSpeed * 0.5);
                const oldPlayerHealth = player.health;
                player.takeDamage(finalDamage, isRamming);
                const actualPlayerDamage = oldPlayerHealth - player.health;
                if (actualPlayerDamage > 0) {
                    damageNumbers.push(new DamageNumber(player.x, player.y, actualPlayerDamage));
                }

                // If player is Rammer, apply contact damage to enemy
                if (player.shipClass && player.shipClass.name === 'Rammer') {
                    if (typeof player.calculateContactDamage === 'function') {
                        const contactDamage = player.calculateContactDamage();
                        const oldEnemyHealth = object.health;
                        object.takeDamage(contactDamage, true);
                        const actualEnemyDamage = oldEnemyHealth - object.health;
                        if (actualEnemyDamage > 0) {
                            damageNumbers.push(new DamageNumber(object.x, object.y, actualEnemyDamage, '#ff4242')); // Rammer damage in red
                        }
                    }
                    
                    // Check if enemy was destroyed and drop gems
                    if (object.health <= 0) {
                        // Drop gems when enemy is destroyed
                        const gemCount = Math.floor(Math.random() * 3) + 1;
                        for (let i = 0; i < gemCount; i++) {
                            gems.push(new Gem(object.x, object.y, 10));
                        }
                        score += 100;
                        
                        // Track enemy kill for testing zone progression
                        if (typeof trackEnemyKill === 'function' && !(object instanceof Asteroid)) {
                            trackEnemyKill();
                        }
                    }
                }
            }
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

    // Check enemy projectile hits on player
    if (enemyProjectiles && player) {
        enemyProjectiles = enemyProjectiles.filter(projectile => {
            // Check for wall collisions in testing zone or station
            if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
                // Get current zone dimensions
                const zoneWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : STATION.WIDTH;
                const zoneHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : STATION.HEIGHT;
                
                const hitWall = (
                    projectile.x - projectile.width/2 < WALL_WIDTH ||
                    projectile.x + projectile.width/2 > zoneWidth - WALL_WIDTH ||
                    projectile.y - projectile.height/2 < WALL_WIDTH ||
                    projectile.y + projectile.height/2 > zoneHeight - WALL_WIDTH
                );
                if (hitWall) return false;
            }
            
            // Check for player hit
            if (distance(projectile.x, projectile.y, player.x, player.y) < playerRadius + Math.max(projectile.width, projectile.height)/2) {
                const oldHealth = player.health;
                player.takeDamage(projectile.damage);
                const actualDamage = oldHealth - player.health;
                if (actualDamage > 0) {
                    // Create damage number at player position
                    damageNumbers.push(new DamageNumber(
                        player.x, 
                        player.y, 
                        actualDamage,
                        projectile.fromSentry ? '#8800ff' : '#ff00ff' // Purple for Sentry, magenta for others
                    ));
                }
                return false;
            }
            return true;
        });
    }
}