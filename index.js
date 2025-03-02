// Main game functions
let lastFrameTime = performance.now();
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let currentFps = 0;
let animationTime = 0;

// Add a global flag for respawn requests
window.respawnRequested = false;

function updateFPS() {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastFpsUpdate;
    
    if (elapsed >= 1000) {
        currentFps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastFpsUpdate = now;
    }
    return currentFps;
}

function initializeGame() {
    // Initialize save system
    initializeSaveSystem();
    
    // Reset game state
    resetGameState();
    
    // Initialize wave system
    initializeWaveSystem();
    
    // Initialize zone tracking
    window.previousZone = window.currentZone || GAME_ZONES.STATION;
}

function gameLoop() {
    // Calculate time since last frame
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    
    // Check for respawn requests
    if (window.respawnRequested) {
        console.log("Respawn request detected in game loop");
        window.respawnRequested = false; // Reset the flag
        
        // Reset game state
        gameOver = false;
        gameState = GAME_STATES.STATION;
        
        // Make sure player exists
        if (player) {
            // Heal player
            player.health = player.maxHealth;
            
            // Reset position
            window.currentZone = GAME_ZONES.STATION;
            player.x = STATION.WIDTH / 2;
            player.y = STATION.HEIGHT / 2;
            
            // Reset camera
            if (camera) {
                camera.x = player.x - canvas.width / 2;
                camera.y = player.y - canvas.height / 2;
            }
            
            // Clear enemies and projectiles
            enemies = [];
            enemyProjectiles = [];
            
            // Show notification
            if (typeof showNotification === 'function') {
                showNotification('Returned to Station');
            }
        }
    }
    
    // Initialize player if not already initialized
    if (!player && gameState === GAME_STATES.PLAYING) {
        console.log("Initializing default player...");
        
        // Create default player with Fighter class
        player = new Player(SHIP_CLASSES.FIGHTER);
        
        // Position player in the center of the station
        player.x = STATION.WIDTH / 2;
        player.y = STATION.HEIGHT / 2;
        
        // Set current zone to station
        window.currentZone = GAME_ZONES.STATION;
        
        // Set camera to follow player
        if (camera) {
            camera.x = player.x - canvas.width/2; // Immediately position camera
            camera.y = player.y - canvas.height/2;
            camera.follow(player);
            console.log("Camera following player at position:", player.x, player.y);
        } else {
            console.error("Camera not initialized!");
        }
        
        console.log("Default player initialized at position:", player.x, player.y);
    }
    
    // Update animation time for visual effects
    animationTime += deltaTime / 1000; // Convert to seconds
    
    // Respect max framerate setting
    const frameTime = 1000 / settings.maxFPS;
    if (deltaTime < frameTime) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Update FPS counter
    fps = updateFPS();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill with black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Handle game states
    if (gameState === GAME_STATES.SETTINGS) {
        drawSettingsMenu();
        lastFrameTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameState === GAME_STATES.CLASS_SELECT) {
        drawClassSelection();
        lastFrameTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameState === GAME_STATES.GAME_OVER || gameOver) {
        drawGameOver();
        lastFrameTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Update camera
    if (camera) {
        camera.update();
    } else {
        console.error("Camera is null in game loop!");
    }
    
    // Debug logging for player and camera position
    if (player && isDebugMode) {
        console.log("Player position:", player.x, player.y, "Camera position:", camera.x, camera.y);
    }
    
    // Draw appropriate background based on zone
    if (window.currentZone === GAME_ZONES.TESTING) {
        drawTestingZoneBackground();
    } else if (window.currentZone === GAME_ZONES.STATION) {
        drawStationBackground();
    } else if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
        drawDebrisFieldBackground();
    } else {
        // Draw regular background for main game
        drawBackground();
    }

    // Handle zone transitions
    if (window.currentZone !== window.previousZone) {
        console.log(`Zone transition: ${window.previousZone} -> ${window.currentZone}`);
        window.previousZone = window.currentZone;
    }

    // Update game objects only if not paused
    if (gameState === GAME_STATES.PLAYING || window.currentZone === GAME_ZONES.STATION) {
        // Update player invincibility from debug mode
        if (isDebugMode && isInvincible) {
            player.invulnerable = true;
            player.invulnerableTime = 2;
        }

        // Update player and game objects
        if (player) {
            if (typeof player.update === 'function') {
                player.update();
            }
            if (typeof player.updateLasers === 'function') {
                player.updateLasers();
            }
            
            // Add collision detection with zone boundaries
            if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
                // Check if player is inside the boundary
                const playerPoint = { x: player.x, y: player.y };
                
                if (!isPointInsidePolygon(playerPoint, DEBRIS_FIELD.WALL_POINTS)) {
                    // Player is outside the boundary - find the closest point on the boundary
                    const closestPoint = findClosestPointOnPolygon(playerPoint, DEBRIS_FIELD.WALL_POINTS);
                    
                    // Calculate direction vector from closest point to player
                    const dirX = playerPoint.x - closestPoint.x;
                    const dirY = playerPoint.y - closestPoint.y;
                    
                    // Calculate distance
                    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
                    
                    if (distance > 0) {
                        // Normalize direction vector
                        const normalizedDirX = dirX / distance;
                        const normalizedDirY = dirY / distance;
                        
                        // Move player inside the boundary with a small buffer
                        const buffer = 5;
                        player.x = closestPoint.x + normalizedDirX * buffer;
                        player.y = closestPoint.y + normalizedDirY * buffer;
                    } else {
                        // Fallback if distance is zero (shouldn't happen)
                        player.x = closestPoint.x;
                        player.y = closestPoint.y;
                    }
                    
                    // Stop player movement
                    player.velocityX = 0;
                    player.velocityY = 0;
                } else {
                    // Player is inside the boundary, but check if they're too close to the wall
                    const closestPoint = findClosestPointOnPolygon(playerPoint, DEBRIS_FIELD.WALL_POINTS);
                    
                    // Calculate distance to the closest point on the boundary
                    const dirX = playerPoint.x - closestPoint.x;
                    const dirY = playerPoint.y - closestPoint.y;
                    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
                    
                    // If player is too close to the wall, push them away slightly
                    const minDistanceFromWall = 10;
                    if (distance < minDistanceFromWall) {
                        // Calculate normalized direction vector
                        const normalizedDirX = dirX / distance;
                        const normalizedDirY = dirY / distance;
                        
                        // Push player away from wall
                        player.x = closestPoint.x + normalizedDirX * minDistanceFromWall;
                        player.y = closestPoint.y + normalizedDirY * minDistanceFromWall;
                        
                        // Reduce player velocity in the direction of the wall
                        const dotProduct = 
                            (player.velocityX * normalizedDirX + player.velocityY * normalizedDirY);
                        
                        if (dotProduct < 0) {
                            player.velocityX -= dotProduct * normalizedDirX;
                            player.velocityY -= dotProduct * normalizedDirY;
                        }
                    }
                }
            }
        }

        // Update gems
        gems.forEach(gem => gem.update());

        // Only spawn and update enemies if not in station
        if (window.currentZone !== GAME_ZONES.STATION) {
            // Spawn and update objects
            spawnObjects();
            enemies = enemies.filter(enemy => !enemy.update());
            asteroids = asteroids.filter(asteroid => !asteroid.update());

            // Handle collisions
            handleCollisions();

            // During wave spawning
            if (window.currentZone === GAME_ZONES.MAIN && enemies.length < 15 && Math.random() < 0.03 && window.enemiesRemainingInWave > 0) {
                spawnEnemy();
                window.enemiesRemainingInWave--;
            }

            // Update enemy projectiles
            if (enemyProjectiles) {
                // Update projectile positions only if not frozen
                if (!window.isFrozen) {
                    enemyProjectiles.forEach(projectile => {
                        projectile.x += projectile.velocityX;
                        projectile.y += projectile.velocityY;
                    });
                }

                // Remove projectiles that are off screen or hit walls
                enemyProjectiles = enemyProjectiles.filter(projectile => {
                    // Check if projectile is off screen
                    const isOnScreen = 
                        projectile.x >= 0 && projectile.x <= WORLD_WIDTH &&
                        projectile.y >= 0 && projectile.y <= WORLD_HEIGHT;
                    
                    if (!isOnScreen) return false;
                    
                    // Check for wall collisions based on current zone
                    if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
                        // Get current zone dimensions
                        const zoneWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : STATION.WIDTH;
                        const zoneHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : STATION.HEIGHT;
                        
                        // Check if projectile hit a wall
                        const hitWall = (
                            projectile.x - projectile.width/2 < WALL_WIDTH ||
                            projectile.x + projectile.width/2 > zoneWidth - WALL_WIDTH ||
                            projectile.y - projectile.height/2 < WALL_WIDTH ||
                            projectile.y + projectile.height/2 > zoneHeight - WALL_WIDTH
                        );
                        
                        return !hitWall;
                    } else if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
                        // For Debris Field, check if projectile is inside the boundary
                        return window.isPointInsidePolygon({ x: projectile.x, y: projectile.y }, DEBRIS_FIELD.WALL_POINTS);
                    }
                    
                    return true;
                });

                // Check for collisions with player
                if (player) {
                    enemyProjectiles.forEach((projectile, index) => {
                        if (distance(projectile.x, projectile.y, player.x, player.y) < (player.width + projectile.width) / 2) {
                            const oldHealth = player.health;
                            player.takeDamage(projectile.damage);
                            const actualDamage = oldHealth - player.health;
                            
                            // Create damage number at player position with slight random offset
                            if (actualDamage > 0) {
                                const offsetX = (Math.random() - 0.5) * 20;
                                const offsetY = (Math.random() - 0.5) * 20;
                                damageNumbers.push(new DamageNumber(
                                    player.x + offsetX, 
                                    player.y + offsetY, 
                                    actualDamage,
                                    projectile.color || '#ff0000'
                                ));
                            }
                            
                            enemyProjectiles.splice(index, 1);
                        }
                    });
                }
            }
        } else {
            // In station: handle laser collisions with walls
            if (player && player.lasers) {
                player.lasers = player.lasers.filter(laser => {
                    const hitWall = (
                        laser.x - laser.width/2 < WALL_WIDTH ||
                        laser.x + laser.width/2 > STATION.WIDTH - WALL_WIDTH ||
                        laser.y - laser.height/2 < WALL_WIDTH ||
                        laser.y + laser.height/2 > STATION.HEIGHT - WALL_WIDTH
                    );
                    return !hitWall;
                });
            }
        }
        
        // Handle laser collisions with Debris Field walls
        if (window.currentZone === GAME_ZONES.DEBRIS_FIELD && player && player.lasers) {
            player.lasers = player.lasers.filter(laser => {
                return isPointInsidePolygon({ x: laser.x, y: laser.y }, DEBRIS_FIELD.WALL_POINTS);
            });
        }
    }
    
    // Draw player
    if (player) {
        if (typeof player.draw === 'function') {
            player.draw();
        }
    }
    
    // Draw all game objects
    if (asteroids && enemies && healthPacks && gems) {
        [...asteroids, ...enemies, ...healthPacks, ...gems].forEach(obj => {
            if (obj) obj.draw();
        });
    }
    
    // Draw enemy projectiles
    if (enemyProjectiles && enemyProjectiles.length > 0) {
        enemyProjectiles.forEach(projectile => {
            const screenX = projectile.x - camera.x;
            const screenY = projectile.y - camera.y;
            
            // Skip if off screen
            if (screenX < -50 || screenX > canvas.width + 50 || 
                screenY < -50 || screenY > canvas.height + 50) {
                return;
            }
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(projectile.angle);
            
            // Draw projectile based on color (Sentry lasers are purple)
            if (projectile.color === '#8800ff') {
                // Sentry laser - simple purple square
                ctx.fillStyle = projectile.color;
                const size = Math.max(projectile.width, projectile.height);
                ctx.fillRect(-size/2, -size/2, size, size);
            } else {
                // Regular enemy projectile (shooter lasers)
                ctx.fillStyle = projectile.color || '#ff00ff'; // Default to magenta if no color specified
                ctx.fillRect(-projectile.width/2, -projectile.height/2, projectile.width, projectile.height);
            }
            
            ctx.restore();
        });
    }
    
    // Draw player lasers
    if (player && typeof player.drawLasers === 'function') {
        player.drawLasers();
    }
    
    // Update and draw damage numbers
    damageNumbers = damageNumbers.filter(number => {
        const shouldRemove = number.update();
        if (!shouldRemove) {
            number.draw(); // Draw the damage number if it's still active
        }
        return !shouldRemove; // Keep numbers that should NOT be removed
    });
    
    // Draw station UI elements if in station zone
    if (window.currentZone === GAME_ZONES.STATION) {
        drawStationUI();
    }
    
    // Draw UI elements LAST to ensure they're always on top
    if (window.currentZone === GAME_ZONES.STATION) {
        // Only draw game UI elements, station UI elements are already drawn
        drawGameUI();
    } else {
        drawGameUI();
    }
    
    // Draw FPS counter if enabled
    if (settings.showFPS) {
        const fpsText = `FPS: ${fps}`;
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.fillText(fpsText, canvas.width - 10, canvas.height - 8);
    }
    
    // Draw pause screen if paused
    if (gameState === GAME_STATES.PAUSED) {
        drawPauseScreen();
    }
    
    // Handle interactions based on current zone
    if (window.currentZone === GAME_ZONES.STATION) {
        handleStationInteractions();
    } else if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
        handleDebrisFieldInteractions();
    }

    // Use setTimeout for more precise timing at high framerates
    setTimeout(() => requestAnimationFrame(gameLoop), 0);
}

// Draw the station background
function drawStationBackground() {
    // Fill the entire visible area with black first, accounting for camera position
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width + Math.abs(camera.x), canvas.height + Math.abs(camera.y));
    
    // Additional black rectangles to ensure coverage
    ctx.fillRect(camera.x, camera.y, STATION.WIDTH + Math.abs(camera.x), STATION.HEIGHT + Math.abs(camera.y));
    ctx.fillRect(-Math.abs(camera.x), -Math.abs(camera.y), 
                 STATION.WIDTH + Math.abs(camera.x) * 2, 
                 STATION.HEIGHT + Math.abs(camera.y) * 2);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // Draw walls with same color as testing zone
    ctx.fillStyle = '#d8d8d8';
    
    // Top wall
    ctx.fillRect(0, 0, STATION.WIDTH, WALL_WIDTH);
    // Right wall (with opening for ship selection)
    ctx.fillRect(STATION.WIDTH - WALL_WIDTH, 0, WALL_WIDTH, STATION.HEIGHT / 2 - 50);
    ctx.fillRect(STATION.WIDTH - WALL_WIDTH, STATION.HEIGHT / 2 + 50, WALL_WIDTH, STATION.HEIGHT / 2 - 50);
    // Bottom wall
    ctx.fillRect(0, STATION.HEIGHT - WALL_WIDTH, STATION.WIDTH, WALL_WIDTH);
    // Left wall
    ctx.fillRect(0, 0, WALL_WIDTH, STATION.HEIGHT);

    // Add texture to walls
    addWallTexture();
    
    // Create a clipping region for the station interior
    ctx.beginPath();
    ctx.rect(WALL_WIDTH, WALL_WIDTH, 
             STATION.WIDTH - WALL_WIDTH * 2, STATION.HEIGHT - WALL_WIDTH * 2);
    ctx.clip();

    // Fill light gray background matching testing zone
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(WALL_WIDTH, WALL_WIDTH, 
                STATION.WIDTH - WALL_WIDTH * 2, STATION.HEIGHT - WALL_WIDTH * 2);
    
    // Draw decorative lines similar to testing zone
    ctx.strokeStyle = '#4287f5'; // Light blue
    ctx.lineWidth = 3; // Line width
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Define station decorative lines (simplified version of testing zone lines)
    const stationLines = [
        {
            points: [
                { x: WALL_WIDTH * 2, y: WALL_WIDTH * 2 },
                { x: STATION.WIDTH - WALL_WIDTH * 2, y: WALL_WIDTH * 2 },
                { x: STATION.WIDTH - WALL_WIDTH * 2, y: STATION.HEIGHT - WALL_WIDTH * 2 },
                { x: WALL_WIDTH * 2, y: STATION.HEIGHT - WALL_WIDTH * 2 },
                { x: WALL_WIDTH * 2, y: WALL_WIDTH * 2 }
            ]
        },
        {
            points: [
                { x: STATION.WIDTH / 2, y: WALL_WIDTH * 2 },
                { x: STATION.WIDTH / 2, y: STATION.HEIGHT - WALL_WIDTH * 2 }
            ]
        },
        {
            points: [
                { x: WALL_WIDTH * 2, y: STATION.HEIGHT / 2 },
                { x: STATION.WIDTH - WALL_WIDTH * 2, y: STATION.HEIGHT / 2 }
            ]
        }
    ];
    
    // Draw the lines
    stationLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        
        for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.stroke();
        
        // Draw hollow circles at start and end points
        ctx.fillStyle = '#d0d0d0'; // Same as background color
        ctx.strokeStyle = '#4287f5';
        line.points.forEach((point, idx) => {
            if (idx === 0 || idx === line.points.length - 1) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 8, 0, Math.PI * 2); // Circle radius of 8
                ctx.fill();
                ctx.stroke();
            }
        });
    });
    
    ctx.restore();
    
    // Draw wall outlines
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, STATION.WIDTH, STATION.HEIGHT);
    
    // Store the opening position and dimensions for collision detection
    const openingY = STATION.HEIGHT / 2;
    const openingHeight = 100;
    
    STATION.SHIP_OPENING = {
        x: STATION.WIDTH - WALL_WIDTH,
        y: openingY - openingHeight / 2,
        width: WALL_WIDTH,
        height: openingHeight
    };
    
    // Create a clipping region for the station interior to draw the glow effect
    // This ensures the glow is only visible from inside the station
    ctx.save();
    ctx.beginPath();
    ctx.rect(WALL_WIDTH, WALL_WIDTH, 
             STATION.WIDTH - WALL_WIDTH * 2, STATION.HEIGHT - WALL_WIDTH * 2);
    ctx.clip();
    
    // Draw a glowing effect around the opening (only visible from inside)
    const gradient = ctx.createRadialGradient(
        STATION.WIDTH - WALL_WIDTH, openingY, 10,
        STATION.WIDTH - WALL_WIDTH, openingY, 80
    );
    gradient.addColorStop(0, 'rgba(66, 135, 245, 0.8)'); // Bright blue
    gradient.addColorStop(1, 'rgba(66, 135, 245, 0)');   // Transparent
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
        STATION.WIDTH - WALL_WIDTH, 
        openingY, 
        70, 
        openingHeight / 2, 
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw "SHIP SELECTION" text inside the station, near the opening
    // Add a background for better visibility
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(STATION.WIDTH - WALL_WIDTH - 200, STATION.HEIGHT / 2 - 20, 200, 40);
    
    // Draw text with glow effect
    ctx.shadowColor = '#4287f5';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP SELECTION', STATION.WIDTH - WALL_WIDTH - 100, STATION.HEIGHT / 2 + 7);
    ctx.shadowBlur = 0; // Reset shadow
    
    // After drawing the glow effect and text, add an animated arrow
    // Draw an animated arrow pointing to the opening
    const arrowX = STATION.WIDTH - WALL_WIDTH - 40;
    const arrowY = STATION.HEIGHT / 2;
    const arrowSize = 15;
    const arrowOffset = Math.sin(animationTime * 4) * 10; // Oscillate with time
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(arrowX + arrowOffset, arrowY - arrowSize);
    ctx.lineTo(arrowX + arrowOffset + arrowSize, arrowY);
    ctx.lineTo(arrowX + arrowOffset, arrowY + arrowSize);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0; // Reset shadow
    
    ctx.restore(); // Restore from the clipping for the glow effect
    
    ctx.restore(); // Restore from the main translation
}

// Function to add texture to the station walls
function addWallTexture() {
    // Set texture style
    ctx.strokeStyle = '#c0c0c0'; // Slightly darker than the wall color
    ctx.lineWidth = 1;
    
    // Texture pattern spacing
    const spacing = 15;
    
    // Add texture to top wall
    for (let x = spacing; x < STATION.WIDTH; x += spacing) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WALL_WIDTH);
        ctx.stroke();
        
        // Add some horizontal lines for a grid pattern
        if (x % (spacing * 2) === 0) {
            ctx.beginPath();
            ctx.moveTo(x - spacing, WALL_WIDTH / 2);
            ctx.lineTo(x + spacing, WALL_WIDTH / 2);
            ctx.stroke();
        }
    }
    
    // Add texture to bottom wall
    for (let x = spacing; x < STATION.WIDTH; x += spacing) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x, STATION.HEIGHT - WALL_WIDTH);
        ctx.lineTo(x, STATION.HEIGHT);
        ctx.stroke();
        
        // Add some horizontal lines for a grid pattern
        if (x % (spacing * 2) === 0) {
            ctx.beginPath();
            ctx.moveTo(x - spacing, STATION.HEIGHT - WALL_WIDTH / 2);
            ctx.lineTo(x + spacing, STATION.HEIGHT - WALL_WIDTH / 2);
            ctx.stroke();
        }
    }
    
    // Add texture to left wall
    for (let y = spacing; y < STATION.HEIGHT; y += spacing) {
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WALL_WIDTH, y);
        ctx.stroke();
        
        // Add some vertical lines for a grid pattern
        if (y % (spacing * 2) === 0) {
            ctx.beginPath();
            ctx.moveTo(WALL_WIDTH / 2, y - spacing);
            ctx.lineTo(WALL_WIDTH / 2, y + spacing);
            ctx.stroke();
        }
    }
    
    // Add texture to right wall (skip the opening area)
    const openingY = STATION.HEIGHT / 2;
    const openingHeight = 100;
    
    for (let y = spacing; y < STATION.HEIGHT; y += spacing) {
        // Skip the opening area
        if (y > openingY - openingHeight / 2 && y < openingY + openingHeight / 2) {
            continue;
        }
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(STATION.WIDTH - WALL_WIDTH, y);
        ctx.lineTo(STATION.WIDTH, y);
        ctx.stroke();
        
        // Add some vertical lines for a grid pattern
        if (y % (spacing * 2) === 0) {
            ctx.beginPath();
            ctx.moveTo(STATION.WIDTH - WALL_WIDTH / 2, y - spacing);
            ctx.lineTo(STATION.WIDTH - WALL_WIDTH / 2, y + spacing);
            ctx.stroke();
        }
    }
    
    // Add some accent details to the walls
    const accentColor = '#a0a0a0';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    
    // Add corner accents
    const cornerSize = 30;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(0, cornerSize);
    ctx.lineTo(cornerSize, 0);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(STATION.WIDTH - cornerSize, 0);
    ctx.lineTo(STATION.WIDTH, cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(0, STATION.HEIGHT - cornerSize);
    ctx.lineTo(cornerSize, STATION.HEIGHT);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(STATION.WIDTH - cornerSize, STATION.HEIGHT);
    ctx.lineTo(STATION.WIDTH, STATION.HEIGHT - cornerSize);
    ctx.stroke();
    
    // Add some bolts/rivets along the walls
    ctx.fillStyle = '#b0b0b0';
    const boltSpacing = 50;
    const boltRadius = 3;
    
    // Top and bottom walls
    for (let x = boltSpacing; x < STATION.WIDTH; x += boltSpacing) {
        // Top wall bolts
        ctx.beginPath();
        ctx.arc(x, WALL_WIDTH / 4, boltRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, WALL_WIDTH * 3/4, boltRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bottom wall bolts
        ctx.beginPath();
        ctx.arc(x, STATION.HEIGHT - WALL_WIDTH / 4, boltRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, STATION.HEIGHT - WALL_WIDTH * 3/4, boltRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Left and right walls (skip the opening area for right wall)
    for (let y = boltSpacing; y < STATION.HEIGHT; y += boltSpacing) {
        // Left wall bolts
        ctx.beginPath();
        ctx.arc(WALL_WIDTH / 4, y, boltRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(WALL_WIDTH * 3/4, y, boltRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Right wall bolts (skip the opening area)
        if (y < openingY - openingHeight / 2 || y > openingY + openingHeight / 2) {
            ctx.beginPath();
            ctx.arc(STATION.WIDTH - WALL_WIDTH / 4, y, boltRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(STATION.WIDTH - WALL_WIDTH * 3/4, y, boltRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw the station UI with interactive elements
function drawStationUI() {
    // Place interactable objects in the corners
    // Top-left: Heal Station
    STATION.HEAL_POSITION = { 
        x: WALL_WIDTH + 100, 
        y: WALL_WIDTH + 100 
    };
    
    // Bottom-left: Shop
    STATION.SHOP_POSITION = { 
        x: WALL_WIDTH + 100, 
        y: STATION.HEIGHT - WALL_WIDTH - 100 
    };
    
    // Bottom-right: Exit Portal
    const exitX = STATION.WIDTH - WALL_WIDTH - 100;
    const exitY = STATION.HEIGHT - WALL_WIDTH - 100;
    
    // Middle-left: Testing Zone Portal
    STATION.TESTING_POSITION = {
        x: WALL_WIDTH + 100,
        y: STATION.HEIGHT / 2
    };
    
    // Draw the station elements
    const screenHealX = STATION.HEAL_POSITION.x - camera.x;
    const screenHealY = STATION.HEAL_POSITION.y - camera.y;
    drawStationElement(screenHealX, screenHealY, '#44ff44', 'Heal Station', isPlayerNearPosition(STATION.HEAL_POSITION));
    
    const screenShopX = STATION.SHOP_POSITION.x - camera.x;
    const screenShopY = STATION.SHOP_POSITION.y - camera.y;
    drawStationElement(screenShopX, screenShopY, '#ffcc44', 'Shop', isPlayerNearPosition(STATION.SHOP_POSITION));
    
    // Draw testing zone portal
    const screenTestingX = STATION.TESTING_POSITION.x - camera.x;
    const screenTestingY = STATION.TESTING_POSITION.y - camera.y;
    drawStationElement(screenTestingX, screenTestingY, '#ff4444', 'Testing Zone', isPlayerNearPosition(STATION.TESTING_POSITION));
    
    const screenExitX = exitX - camera.x;
    const screenExitY = exitY - camera.y;
    drawExitPortal(screenExitX, screenExitY, isPlayerNearExit(exitX, exitY));
    
    // Check if player is near the ship selection opening
    isPlayerNearShipOpening();
    
    // Check for interaction key press
    handleStationInteractions();
}

// Draw a station element (heal, ship selection, or shop)
function drawStationElement(x, y, color, label, isNearby) {
    ctx.save();
    
    // Draw the station element
    ctx.fillStyle = color;
    ctx.strokeStyle = isNearby ? '#ffffff' : '#888888';
    ctx.lineWidth = isNearby ? 3 : 1;
    
    // Draw station as a circle
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.font = isNearby ? 'bold 16px Arial' : '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 70);
    
    // Draw interaction prompt if nearby
    if (isNearby) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText('Press E to interact', x, y + 90);
    }
    
    ctx.restore();
}

// Draw the exit portal to the main game
function drawExitPortal(x, y, isNearby) {
    ctx.save();
    
    // Draw portal in the same style as station elements
    ctx.fillStyle = '#ff00ff'; // Purple
    ctx.strokeStyle = isNearby ? '#ffffff' : '#888888';
    ctx.lineWidth = isNearby ? 3 : 1;
    
    // Draw portal as a circle
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.font = isNearby ? 'bold 16px Arial' : '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Exit to Debris Field', x, y + 70);
    
    // Draw interaction prompt if nearby
    if (isNearby) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText('Press E to exit', x, y + 90);
    }
    
    ctx.restore();
}

// Check if player is near a station position
function isPlayerNearPosition(position) {
    const dx = player.x - position.x;
    const dy = player.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < STATION.INTERACTION_RADIUS;
}

// Check if player is near the exit portal
function isPlayerNearExit(x, y) {
    const dx = player.x - x;
    const dy = player.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < STATION.INTERACTION_RADIUS;
}

// Check if player is near the ship selection opening
function isPlayerNearShipOpening() {
    if (!STATION.SHIP_OPENING || !player) return false;
    
    // Calculate the distance from the player to the opening
    // Use the closest point on the opening rectangle to the player
    const openingLeft = STATION.SHIP_OPENING.x;
    const openingRight = STATION.SHIP_OPENING.x + STATION.SHIP_OPENING.width;
    const openingTop = STATION.SHIP_OPENING.y;
    const openingBottom = STATION.SHIP_OPENING.y + STATION.SHIP_OPENING.height;
    
    // Find the closest point on the opening rectangle to the player
    const closestX = Math.max(openingLeft, Math.min(player.x, openingRight));
    const closestY = Math.max(openingTop, Math.min(player.y, openingBottom));
    
    // Calculate distance from player to this closest point
    const dx = player.x - closestX;
    const dy = player.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Debug - show distance in console
    // console.log("Distance to opening:", distance);
    
    // If player is very close to the opening, automatically open the ship selection screen
    // Use a larger threshold to make it more reliable
    if (distance < 30) {
        // Only trigger once when entering the area
        if (!player.isInShipOpeningArea) {
            player.isInShipOpeningArea = true;
            // Switch to ship selection
            gameState = GAME_STATES.CLASS_SELECT;
            // Store current ship data to preserve levels
            storeShipData();
            // Show notification
            showNotification('Ship Selection');
        }
    } else {
        // Reset the flag when player moves away
        player.isInShipOpeningArea = false;
    }
    
    return distance < STATION.INTERACTION_RADIUS;
}

// Handle player interactions with station elements
function handleStationInteractions() {
    // Exit portal position
    const exitX = STATION.WIDTH - WALL_WIDTH - 100;
    const exitY = STATION.HEIGHT - WALL_WIDTH - 100;
    
    // Check for E key press
    if (keys['e'] || keys['E']) {
        // Clear the key press to prevent multiple activations
        keys['e'] = false;
        keys['E'] = false;
        
        // Check which station the player is near
        if (isPlayerNearPosition(STATION.HEAL_POSITION)) {
            // Heal the player
            player.health = player.maxHealth;
            player.energy = player.maxEnergy;
            showNotification('Health and Energy Restored!');
        } else if (isPlayerNearPosition(STATION.SHOP_POSITION)) {
            // Show shop notification (placeholder for now)
            showNotification('Shop coming soon!');
        } else if (isPlayerNearPosition(STATION.TESTING_POSITION)) {
            // Enter testing zone
            window.currentZone = GAME_ZONES.TESTING;
            gameState = GAME_STATES.PLAYING;
            
            // Reset testing zone variables
            window.enemiesKilledInTestingZone = 0;
            window.enemiesRemainingInWave = 20; // Set number of enemies for testing zone
            window.waveStartTime = Date.now();
            
            // Generate testing zone lines if the function is available
            if (typeof window.generateTestingZoneLines === 'function') {
                window.generateTestingZoneLines();
            }
            
            // Position player in center of testing zone
            player.x = TESTING_ZONE.WIDTH / 2;
            player.y = TESTING_ZONE.HEIGHT / 2;
            
            // Clear any existing enemies
            enemies = [];
            enemyProjectiles = [];
            
            showNotification('Entering Testing Zone');
        } else if (isPlayerNearExit(exitX, exitY)) {
            // Clear all enemies when exiting from testing zone
            if (window.currentZone === GAME_ZONES.TESTING) {
                enemies = [];
                enemyProjectiles = [];
                showNotification('Testing complete - Enemies cleared');
            }
            
            // Exit to Debris Field instead of main game
            window.currentZone = GAME_ZONES.DEBRIS_FIELD;
            gameState = GAME_STATES.PLAYING;
            
            // Position player at the entrance of the Debris Field
            player.x = 200;
            player.y = 200;
            
            // Spawn enemies in the Debris Field
            enemies = [
                new AutomatedSentry(1000, 1000),
                new RogueDrone(800, 600),
                new RogueFighter(1200, 800)
            ];
            
            showNotification('Entering Debris Field - Watch out for Automated Sentries and Rogue Drones!');
        }
    }
}

// Store ship data to preserve levels when switching ships
function storeShipData() {
    if (!window.shipLevels) {
        window.shipLevels = {};
    }
    
    // Store current ship's level
    window.shipLevels[player.shipClass.name] = {
        upgradeLevel: player.upgradeLevel,
        gems: player.gems
    };
}

// Initialize debris particles with persistent positions if they don't exist
if (!window.debrisParticles) {
    window.debrisParticles = [];
    for (let i = 0; i < 50; i++) {
        // Assign a random color from the new color palette
        const colorType = Math.random();
        let particleColor;
        if (colorType < 0.4) {
            particleColor = '#3A3D42'; // Updated color
        } else if (colorType < 0.7) {
            particleColor = '#6B5B4A'; // Updated color
        } else {
            particleColor = '#5A7184'; // Updated color
        }
        
        // Choose a random direction for consistent movement
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.0; // Medium speed between 0.5 and 1.5
        
        // Use rectangles with fixed width and height
        const width = 5 + Math.random() * 15;
        const height = 5 + Math.random() * 15;
        
        window.debrisParticles.push({
            x: Math.random() * DEBRIS_FIELD.WIDTH,
            y: Math.random() * DEBRIS_FIELD.HEIGHT,
            width: width,     // Fixed width
            height: height,   // Fixed height
            speedX: Math.cos(angle) * speed, // Consistent direction with medium speed
            speedY: Math.sin(angle) * speed, // Consistent direction with medium speed
            color: particleColor
        });
    }
}

// Initialize explosions array if it doesn't exist
if (!window.explosions) {
    window.explosions = [];
}

// Function to create an explosion effect at a specific position
window.createExplosion = function(x, y, color = '#FF6600', particleCount = 20) {
    // Create particles that expand outward from the explosion point
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const size = 3 + Math.random() * 5;
        const lifetime = 30 + Math.random() * 20; // Frames the particle will live
        
        window.explosions.push({
            x: x,
            y: y,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            size: size,
            color: color,
            lifetime: lifetime,
            age: 0
        });
    }
};

// Initialize asteroid shapes with persistent positions if they don't exist
if (!window.asteroidShapes) {
    window.asteroidShapes = [];
    for (let i = 0; i < 20; i++) {
        // Assign a random color from the new color palette
        const colorType = Math.random();
        let asteroidColor;
        if (colorType < 0.4) {
            asteroidColor = '#3A3D42'; // Updated color
        } else if (colorType < 0.7) {
            asteroidColor = '#6B5B4A'; // Updated color
        } else {
            asteroidColor = '#5A7184'; // Updated color
        }
        
        window.asteroidShapes.push({
            x: Math.random() * DEBRIS_FIELD.WIDTH,
            y: Math.random() * DEBRIS_FIELD.HEIGHT,
            size: 15 + Math.random() * 30, // Slightly smaller
            sides: 5 + Math.floor(Math.random() * 3),
            angleOffset: Math.random() * Math.PI * 2,
            speedX: (Math.random() - 0.5) * 0.2, // Slow horizontal movement
            speedY: (Math.random() - 0.5) * 0.2, // Slow vertical movement
            rotationSpeed: (Math.random() - 0.5) * 0.01, // Slow rotation
            color: asteroidColor
        });
    }
}

// Draw the Debris Field background
function drawDebrisFieldBackground() {
    // Create the gradient pattern for both the walls and outside area
    const debrisGradient = ctx.createLinearGradient(0, 0, DEBRIS_FIELD.WIDTH, DEBRIS_FIELD.HEIGHT);
    debrisGradient.addColorStop(0, '#3A3D42');    // Dark gray
    debrisGradient.addColorStop(0.3, '#6B5B4A');  // Brown/tan
    debrisGradient.addColorStop(0.6, '#5A7184');  // Slate blue
    debrisGradient.addColorStop(1, '#3A3D42');    // Back to dark gray
    
    // Fill the entire visible area with the same gradient as the walls
    ctx.fillStyle = debrisGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // Draw the irregular boundary walls with the same gradient pattern
    ctx.fillStyle = debrisGradient;
    ctx.beginPath();
    
    // Draw outer boundary
    ctx.moveTo(DEBRIS_FIELD.WALL_POINTS[0].x, DEBRIS_FIELD.WALL_POINTS[0].y);
    for (let i = 1; i < DEBRIS_FIELD.WALL_POINTS.length; i++) {
        ctx.lineTo(DEBRIS_FIELD.WALL_POINTS[i].x, DEBRIS_FIELD.WALL_POINTS[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Create a clipping region for the inner area
    ctx.beginPath();
    // Create a smaller inner path by scaling the outer path towards the center
    const centerX = DEBRIS_FIELD.WIDTH / 2;
    const centerY = DEBRIS_FIELD.HEIGHT / 2;
    const scale = 0.95; // Scale factor to create inner wall
    
    ctx.moveTo(
        centerX + (DEBRIS_FIELD.WALL_POINTS[0].x - centerX) * scale,
        centerY + (DEBRIS_FIELD.WALL_POINTS[0].y - centerY) * scale
    );
    
    for (let i = 1; i < DEBRIS_FIELD.WALL_POINTS.length; i++) {
        ctx.lineTo(
            centerX + (DEBRIS_FIELD.WALL_POINTS[i].x - centerX) * scale,
            centerY + (DEBRIS_FIELD.WALL_POINTS[i].y - centerY) * scale
        );
    }
    
    ctx.closePath();
    ctx.clip();
    
    // Fill the inner area with the background color
    ctx.fillStyle = '#2A2C2F'; // Dark Charcoal for the playable area
    ctx.fillRect(0, 0, DEBRIS_FIELD.WIDTH, DEBRIS_FIELD.HEIGHT);

    // Add some subtle texture to the background
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * DEBRIS_FIELD.WIDTH;
        const y = Math.random() * DEBRIS_FIELD.HEIGHT;
        const size = 1 + Math.random() * 3;
        
        // Random color from our palette
        const colorType = Math.random();
        if (colorType < 0.4) {
            ctx.fillStyle = '#3A3D42'; // Dark gray
        } else if (colorType < 0.7) {
            ctx.fillStyle = '#6B5B4A'; // Brown/tan
        } else {
            ctx.fillStyle = '#5A7184'; // Slate blue
        }
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Update and draw debris particles
    window.debrisParticles.forEach(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around if out of bounds
        if (particle.x < 0) particle.x = DEBRIS_FIELD.WIDTH;
        if (particle.x > DEBRIS_FIELD.WIDTH) particle.x = 0;
        if (particle.y < 0) particle.y = DEBRIS_FIELD.HEIGHT;
        if (particle.y > DEBRIS_FIELD.HEIGHT) particle.y = 0;
        
        // Draw particle as a rectangle with fixed dimensions
        ctx.fillStyle = particle.color;
        ctx.fillRect(
            particle.x - particle.width/2, 
            particle.y - particle.height/2, 
            particle.width, 
            particle.height
        );
    });
    
    // Update and draw explosion particles
    for (let i = window.explosions.length - 1; i >= 0; i--) {
        const particle = window.explosions[i];
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Age the particle
        particle.age++;
        
        // Remove if it's too old
        if (particle.age >= particle.lifetime) {
            window.explosions.splice(i, 1);
            continue;
        }
        
        // Calculate fade based on age
        const fade = 1 - (particle.age / particle.lifetime);
        
        // Draw particle
        ctx.globalAlpha = fade;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * fade, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Update and draw asteroid shapes
    window.asteroidShapes.forEach(asteroid => {
        // Update position
        asteroid.x += asteroid.speedX;
        asteroid.y += asteroid.speedY;
        asteroid.angleOffset += asteroid.rotationSpeed;
        
        // Wrap around if out of bounds
        if (asteroid.x < 0) asteroid.x = DEBRIS_FIELD.WIDTH;
        if (asteroid.x > DEBRIS_FIELD.WIDTH) asteroid.x = 0;
        if (asteroid.y < 0) asteroid.y = DEBRIS_FIELD.HEIGHT;
        if (asteroid.y > DEBRIS_FIELD.HEIGHT) asteroid.y = 0;
        
        // Draw asteroid with its color
        ctx.fillStyle = asteroid.color;
        ctx.beginPath();
        for (let j = 0; j < asteroid.sides; j++) {
            const angle = asteroid.angleOffset + j * 2 * Math.PI / asteroid.sides;
            const radius = asteroid.size * (0.8 + Math.random() * 0.4);
            const px = asteroid.x + radius * Math.cos(angle);
            const py = asteroid.y + radius * Math.sin(angle);
            
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    });
    
    // Draw return portal to station
    const returnX = 100;
    const returnY = 100;
    drawReturnPortal(returnX, returnY, isPlayerNearReturnPortal(returnX, returnY));
    
    ctx.restore();
}

// Draw return portal to station
function drawReturnPortal(x, y, isNearby) {
    ctx.save();
    
    // Draw portal in the same style as station elements
    ctx.fillStyle = '#00ffff'; // Cyan
    ctx.strokeStyle = isNearby ? '#ffffff' : '#888888';
    ctx.lineWidth = isNearby ? 3 : 1;
    
    // Draw portal as a circle
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Add a glowing effect
    const gradient = ctx.createRadialGradient(x, y, 20, x, y, 60);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.font = isNearby ? 'bold 16px Arial' : '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Return to Station', x, y + 70);
    
    // Draw interaction prompt if nearby
    if (isNearby) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText('Press E to return', x, y + 90);
    }
    
    ctx.restore();
}

// Check if player is near return portal
function isPlayerNearReturnPortal(portalX, portalY) {
    const distance = Math.sqrt(
        Math.pow(player.x - portalX, 2) + 
        Math.pow(player.y - portalY, 2)
    );
    return distance < 80; // Interaction radius
}

// Check for collisions
function checkCollisions() {
    // ... existing code ...
    
    // Check for collisions with zone boundaries
    if (window.currentZone === GAME_ZONES.TESTING) {
        // Testing zone boundary collision
        if (player.x - player.radius < 0) player.x = player.radius;
        if (player.x + player.radius > TESTING_ZONE.WIDTH) player.x = TESTING_ZONE.WIDTH - player.radius;
        if (player.y - player.radius < 0) player.y = player.radius;
        if (player.y + player.radius > TESTING_ZONE.HEIGHT) player.y = TESTING_ZONE.HEIGHT - player.radius;
    } else if (window.currentZone === GAME_ZONES.STATION) {
        // Station boundary collision
        if (player.x - player.radius < WALL_WIDTH) player.x = WALL_WIDTH + player.radius;
        if (player.x + player.radius > STATION.WIDTH - WALL_WIDTH) {
            // Check if player is at the ship selection opening
            if (player.y > STATION.SHIP_OPENING.y && player.y < STATION.SHIP_OPENING.y + STATION.SHIP_OPENING.height) {
                // Allow player to enter the ship selection area
                if (player.x + player.radius > STATION.WIDTH - WALL_WIDTH + 10) {
                    // Automatically open ship selection when player touches the opening
                    gameState = GAME_STATES.CLASS_SELECTION;
                    player.x = STATION.WIDTH - WALL_WIDTH - player.radius - 5;
                }
            } else {
                player.x = STATION.WIDTH - WALL_WIDTH - player.radius;
            }
        }
        if (player.y - player.radius < WALL_WIDTH) player.y = WALL_WIDTH + player.radius;
        if (player.y + player.radius > STATION.HEIGHT - WALL_WIDTH) player.y = STATION.HEIGHT - WALL_WIDTH - player.radius;
    }
    // Debris Field collision is now handled in the main game loop for more responsive collision detection
    
    // ... existing code ...
}

// Helper function to check if a point is inside a polygon
function isPointInsidePolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Helper function to find the closest point on a polygon to a given point
function findClosestPointOnPolygon(point, polygon) {
    let closestPoint = { x: 0, y: 0 };
    let minDistance = Number.MAX_VALUE;
    
    // Check each edge of the polygon
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const edge = {
            x1: polygon[j].x,
            y1: polygon[j].y,
            x2: polygon[i].x,
            y2: polygon[i].y
        };
        
        const closest = closestPointOnLine(point, edge);
        const dx = closest.x - point.x;
        const dy = closest.y - point.y;
        const distance = dx * dx + dy * dy;
        
        if (distance < minDistance) {
            minDistance = distance;
            closestPoint = closest;
        }
    }
    
    return closestPoint;
}

// Helper function to find the closest point on a line segment to a given point
function closestPointOnLine(point, line) {
    const A = point.x - line.x1;
    const B = point.y - line.y1;
    const C = line.x2 - line.x1;
    const D = line.y2 - line.y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
        param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = line.x1;
        yy = line.y1;
    } else if (param > 1) {
        xx = line.x2;
        yy = line.y2;
    } else {
        xx = line.x1 + param * C;
        yy = line.y1 + param * D;
    }
    
    return { x: xx, y: yy };
}

// Make the helper functions available globally
window.isPointInsidePolygon = isPointInsidePolygon;
window.findClosestPointOnPolygon = findClosestPointOnPolygon;
window.closestPointOnLine = closestPointOnLine;

// Handle interactions in the Debris Field
function handleDebrisFieldInteractions() {
    // Return portal position
    const returnX = 100;
    const returnY = 100;
    
    // Check for 'E' key press near the return portal
    if (keys['KeyE'] && isPlayerNearReturnPortal(returnX, returnY)) {
        // Clear the key to prevent multiple triggers
        keys['KeyE'] = false;
        
        // Return to station
        window.currentZone = GAME_ZONES.STATION;
        gameState = GAME_STATES.PLAYING;
        
        // Position player near the exit in the station
        player.x = STATION.WIDTH - WALL_WIDTH - 150;
        player.y = STATION.HEIGHT - WALL_WIDTH - 150;
        
        // Clear enemies and projectiles
        enemies = [];
        enemyProjectiles = [];
        
        showNotification('Returned to Station');
    }
}

// Start the game
initializeGame();
gameLoop();

// Make functions globally available
window.drawStationBackground = drawStationBackground;
window.drawStationUI = drawStationUI;
window.drawDebrisFieldBackground = drawDebrisFieldBackground;
window.drawReturnPortal = drawReturnPortal;
window.isPlayerNearReturnPortal = isPlayerNearReturnPortal;
window.handleDebrisFieldInteractions = handleDebrisFieldInteractions;