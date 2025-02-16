
const FRICTION = 0.98;
const BOUNCE = 0.7;
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