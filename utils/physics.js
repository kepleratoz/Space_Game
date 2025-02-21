const FRICTION = 0.98;
const BOUNCE = 0.7;

class DamageNumber {
    constructor(x, y, amount, color = '#ff0000') {
        this.x = x;
        this.y = y;
        this.amount = Math.round(amount);
        this.color = color;
        this.life = 30; // 0.5 seconds at 60 FPS
        this.velocityY = -2; // Float upward
        this.alpha = 1;
    }

    update() {
        this.y += this.velocityY;
        this.life--;
        this.alpha = this.life / 30;
        return this.life <= 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
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
                const oldHealth = enemy.health;
                enemy.takeDamage(damage, true);
                const actualDamage = oldHealth - enemy.health;
                if (actualDamage > 0) {
                    damageNumbers.push(new DamageNumber(enemy.x, enemy.y, actualDamage));
                }
            }
        });
    });

    // Check laser hits with ray-casting
    player.lasers.forEach((laser, laserIndex) => {
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
        
        // Check enemies with ray tracing
        let hitSomething = false;
        let closestHit = Infinity;
        let hitEnemy = null;
        let hitEnemyIndex = -1;

        enemies.forEach((enemy, enemyIndex) => {
            // Vector from ray origin to circle center
            const toCircleX = enemy.x - rayOriginX;
            const toCircleY = enemy.y - rayOriginY;
            
            // Project vector onto ray direction to find closest point
            const dot = toCircleX * normalizedRayDirX + toCircleY * normalizedRayDirY;
            
            // Only process hits in front of the ray origin
            if (dot >= 0) {
                // Find closest point on ray to circle center
                const closestX = rayOriginX + normalizedRayDirX * dot;
                const closestY = rayOriginY + normalizedRayDirY * dot;
                
                // Distance from closest point to circle center
                const distX = closestX - enemy.x;
                const distY = closestY - enemy.y;
                const distSquared = distX * distX + distY * distY;
                
                // Check if ray hits circle
                if (distSquared <= (enemy.width/2) * (enemy.width/2)) {
                    // Calculate actual intersection point
                    const distToIntersection = dot - Math.sqrt((enemy.width/2) * (enemy.width/2) - distSquared);
                    
                    // Check if this is the closest hit so far
                    if (distToIntersection < closestHit && distToIntersection <= rayLength) {
                        closestHit = distToIntersection;
                        hitEnemy = enemy;
                        hitEnemyIndex = enemyIndex;
                    }
                }
            }
        });

        // Handle the closest hit
        if (hitEnemy) {
            hitSomething = true;
            const oldHealth = hitEnemy.health;
            hitEnemy.takeDamage(laser.damage);
            const actualDamage = oldHealth - hitEnemy.health;
            if (actualDamage > 0) {
                damageNumbers.push(new DamageNumber(hitEnemy.x, hitEnemy.y, actualDamage));
            }
            if (hitEnemy.health <= 0) {
                // Drop gems when enemy is destroyed
                const gemCount = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < gemCount; i++) {
                    gems.push(new Gem(hitEnemy.x, hitEnemy.y, 10));
                }
                enemies.splice(hitEnemyIndex, 1);
                score += 100;
            }
            
            // Set laser position to hit point for visual feedback
            laser.x = rayOriginX + normalizedRayDirX * closestHit;
            laser.y = rayOriginY + normalizedRayDirY * closestHit;
        }

        // Check asteroids with ray tracing
        asteroids.forEach((asteroid, asteroidIndex) => {
            // Vector from ray origin to circle center
            const toCircleX = asteroid.x - rayOriginX;
            const toCircleY = asteroid.y - rayOriginY;
            
            // Project vector onto ray direction to find closest point
            const dot = toCircleX * normalizedRayDirX + toCircleY * normalizedRayDirY;
            
            // If behind ray origin, no hit possible
            if (dot < 0) return;
            
            // Find closest point on ray to circle center
            const closestX = rayOriginX + normalizedRayDirX * dot;
            const closestY = rayOriginY + normalizedRayDirY * dot;
            
            // Distance from closest point to circle center
            const distX = closestX - asteroid.x;
            const distY = closestY - asteroid.y;
            const distSquared = distX * distX + distY * distY;
            
            // Check if ray hits circle
            if (distSquared <= (asteroid.width/2) * (asteroid.width/2)) {
                // Calculate actual intersection point
                const distToIntersection = dot - Math.sqrt((asteroid.width/2) * (asteroid.width/2) - distSquared);
                
                // Check if this is a valid hit
                if (distToIntersection <= rayLength) {
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
                    
                    // Set laser position to hit point for visual feedback
                    laser.x = rayOriginX + normalizedRayDirX * distToIntersection;
                    laser.y = rayOriginY + normalizedRayDirY * distToIntersection;
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

                // Deal damage to player
                const impactDamage = Math.min(20, Math.max(5, relativeSpeed * 2));
                const oldPlayerHealth = player.health;
                player.takeDamage(impactDamage, true); // Asteroid collisions count as ram damage
                const actualPlayerDamage = oldPlayerHealth - player.health;
                if (actualPlayerDamage > 0) {
                    damageNumbers.push(new DamageNumber(player.x, player.y, actualPlayerDamage));
                }

                // If player is Rammer, apply contact damage to asteroid
                if (player.shipClass.name === 'Rammer') {
                    const contactDamage = player.calculateContactDamage();
                    const oldAsteroidHealth = object.health;
                    // Asteroids take double damage from ramming to make them more satisfying to destroy
                    object.health -= contactDamage * 2;
                    const actualDamage = oldAsteroidHealth - object.health;
                    if (actualDamage > 0) {
                        damageNumbers.push(new DamageNumber(object.x, object.y, actualDamage, '#ff4242')); // Rammer damage in red
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
                const finalDamage = baseDamage * speedMultiplier;
                
                const isRamming = player.shipClass.name === 'Rammer' && (player.isDashing || velocityMagnitude > player.maxSpeed * 0.5);
                const oldPlayerHealth = player.health;
                player.takeDamage(finalDamage, isRamming);
                const actualPlayerDamage = oldPlayerHealth - player.health;
                if (actualPlayerDamage > 0) {
                    damageNumbers.push(new DamageNumber(player.x, player.y, actualPlayerDamage));
                }

                // If player is Rammer, apply contact damage to enemy
                if (player.shipClass.name === 'Rammer') {
                    const contactDamage = player.calculateContactDamage();
                    const oldEnemyHealth = object.health;
                    object.takeDamage(contactDamage, true);
                    const actualEnemyDamage = oldEnemyHealth - object.health;
                    if (actualEnemyDamage > 0) {
                        damageNumbers.push(new DamageNumber(object.x, object.y, actualEnemyDamage, '#ff4242')); // Rammer damage in red
                    }
                    
                    // Check if enemy was destroyed and drop gems
                    if (object.health <= 0) {
                        // Drop gems when enemy is destroyed
                        const gemCount = Math.floor(Math.random() * 3) + 1;
                        for (let i = 0; i < gemCount; i++) {
                            gems.push(new Gem(object.x, object.y, 10));
                        }
                        score += 100;
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
            if (distance(projectile.x, projectile.y, player.x, player.y) < playerRadius + projectile.width/2) {
                const oldHealth = player.health;
                player.takeDamage(projectile.damage);
                const actualDamage = oldHealth - player.health;
                if (actualDamage > 0) {
                    damageNumbers.push(new DamageNumber(player.x, player.y, actualDamage));
                }
                return false;
            }
            return true;
        });
    }
}