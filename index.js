// Main game functions
let lastFrameTime = performance.now();
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let currentFps = 0;

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
}

function gameLoop() {
    // Calculate time since last frame
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    
    // Respect max framerate setting
    const frameTime = 1000 / settings.maxFPS;
    if (deltaTime < frameTime) {
        setTimeout(() => requestAnimationFrame(gameLoop), 0);
        return;
    }
    
    // Update FPS counter
    fps = updateFPS();
    lastFrameTime = currentTime;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === GAME_STATES.CLASS_SELECT) {
        drawClassSelection();
        drawSettingsButton();
        if (showingAbilityUnlockScreen && selectedShipForAbilities) {
            drawAbilityUnlockScreen();
        }
        setTimeout(() => requestAnimationFrame(gameLoop), 0);
        return;
    }
    
    if (gameState === GAME_STATES.SETTINGS) {
        drawSettingsMenu();
        setTimeout(() => requestAnimationFrame(gameLoop), 0);
        return;
    }
    
    if (gameState === GAME_STATES.GAME_OVER || gameOver) {
        drawGameOver();
        setTimeout(() => requestAnimationFrame(gameLoop), 0);
        return;
    }

    // Draw appropriate background based on zone
    if (window.currentZone === GAME_ZONES.TESTING) {
        drawTestingZoneBackground();
    } else if (window.currentZone === GAME_ZONES.STATION) {
        drawStationBackground();
    } else {
        // Draw regular background for main game
        drawBackground();
    }

    // Update camera
    camera.update();

    // Update and draw game objects only if not paused
    if (gameState === GAME_STATES.PLAYING || window.currentZone === GAME_ZONES.STATION) {
        // Update player invincibility from debug mode
        if (isDebugMode && isInvincible) {
            player.invulnerable = true;
            player.invulnerableTime = 2;
        }

        // Update player
        player.update();
        player.updateLasers();

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
            if (enemies.length < 15 && Math.random() < 0.03 && window.enemiesRemainingInWave > 0) {
                spawnEnemy();
                window.enemiesRemainingInWave--;
            }

            // Update and handle enemy projectiles
            if (enemyProjectiles) {
                // Update projectile positions only if not frozen
                if (!window.isFrozen) {
                    enemyProjectiles.forEach(projectile => {
                        projectile.x += projectile.velocityX;
                        projectile.y += projectile.velocityY;
                    });
                }

                // Remove projectiles that are off screen
                enemyProjectiles = enemyProjectiles.filter(projectile => 
                    projectile.x >= 0 && projectile.x <= WORLD_WIDTH &&
                    projectile.y >= 0 && projectile.y <= WORLD_HEIGHT
                );

                // Check for collisions with player
                if (player) {
                    enemyProjectiles.forEach((projectile, index) => {
                        if (distance(projectile.x, projectile.y, player.x, player.y) < (player.width + projectile.width) / 2) {
                            player.takeDamage(projectile.damage);
                            enemyProjectiles.splice(index, 1);
                        }
                    });
                }
            }
        }
    }

    // Always draw game objects
    [...asteroids, ...enemies, ...healthPacks, ...gems].forEach(obj => obj.draw());
    
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
    
    // Draw arrow pointing to Sentry if one exists
    if (player && enemies.length > 0) {
        // Find Sentry enemy if it exists
        const sentry = enemies.find(enemy => enemy instanceof SentryEnemy);
        if (sentry) {
            // Calculate angle from player to sentry
            const angle = Math.atan2(sentry.y - player.y, sentry.x - player.x);
            
            // Draw arrow at edge of player's view
            const arrowDistance = 150; // Distance from player
            const arrowX = player.x + Math.cos(angle) * arrowDistance;
            const arrowY = player.y + Math.sin(angle) * arrowDistance;
            
            // Convert to screen coordinates
            const screenX = arrowX - camera.x;
            const screenY = arrowY - camera.y;
            
            // Draw the arrow
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(angle);
            
            // Arrow shape
            ctx.fillStyle = '#8800ff'; // Purple to match sentry projectile
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-5, 10);
            ctx.lineTo(-5, -10);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    player.drawLasers();
    player.draw();

    // Update and draw damage numbers
    damageNumbers = damageNumbers.filter(number => !number.update());
    damageNumbers.forEach(number => number.draw());

    // Draw UI elements
    drawGameUI();

    // Display current zone at the top of the screen
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    const zoneName = window.currentZone === GAME_ZONES.TESTING ? 'Testing Zone' : 
                     window.currentZone === GAME_ZONES.STATION ? 'Space Station' : 'Main Game';
    ctx.fillText(zoneName, canvas.width / 2, 30);
    
    // If in testing zone, show enemies killed counter
    if (window.currentZone === GAME_ZONES.TESTING) {
        ctx.font = '20px Arial';
        ctx.fillText(`Enemies Killed: ${window.enemiesKilledInTestingZone}/20`, canvas.width / 2, 60);
    }
    
    // If in station zone, draw station UI
    if (window.currentZone === GAME_ZONES.STATION) {
        drawStationUI();
    }

    // Draw FPS counter
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${fps}`, canvas.width - 10, canvas.height - 10);

    // Draw pause screen if paused
    if (gameState === GAME_STATES.PAUSED) {
        drawPauseScreen();
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
    
    // Draw walls with more visible color
    ctx.fillStyle = '#d8d8d8';
    // Top wall
    ctx.fillRect(0, 0, STATION.WIDTH, WALL_WIDTH);
    // Right wall
    ctx.fillRect(STATION.WIDTH - WALL_WIDTH, 0, WALL_WIDTH, STATION.HEIGHT);
    // Bottom wall
    ctx.fillRect(0, STATION.HEIGHT - WALL_WIDTH, STATION.WIDTH, WALL_WIDTH);
    // Left wall
    ctx.fillRect(0, 0, WALL_WIDTH, STATION.HEIGHT);

    // Create a clipping region for the station interior
    ctx.beginPath();
    ctx.rect(WALL_WIDTH, WALL_WIDTH, 
             STATION.WIDTH - WALL_WIDTH * 2, STATION.HEIGHT - WALL_WIDTH * 2);
    ctx.clip();

    // Fill light gray background for playable area
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(WALL_WIDTH, WALL_WIDTH, 
                STATION.WIDTH - WALL_WIDTH * 2, STATION.HEIGHT - WALL_WIDTH * 2);
    
    ctx.restore();
    
    // Draw wall outlines
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, STATION.WIDTH, STATION.HEIGHT);
    ctx.restore();
    
    // Draw station title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Space Station', canvas.width / 2, 60);
}

// Draw the station UI with interactive elements
function drawStationUI() {
    // Place interactable objects in the corners
    // Top-left: Heal Station
    STATION.HEAL_POSITION = { 
        x: WALL_WIDTH + 100, 
        y: WALL_WIDTH + 100 
    };
    
    // Top-right: Ship Selection
    STATION.SHIP_POSITION = { 
        x: STATION.WIDTH - WALL_WIDTH - 100, 
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
    
    // Draw the station elements
    const screenHealX = STATION.HEAL_POSITION.x - camera.x;
    const screenHealY = STATION.HEAL_POSITION.y - camera.y;
    drawStationElement(screenHealX, screenHealY, '#44ff44', 'Heal Station', isPlayerNearPosition(STATION.HEAL_POSITION));
    
    const screenShipX = STATION.SHIP_POSITION.x - camera.x;
    const screenShipY = STATION.SHIP_POSITION.y - camera.y;
    drawStationElement(screenShipX, screenShipY, '#4488ff', 'Ship Selection', isPlayerNearPosition(STATION.SHIP_POSITION));
    
    const screenShopX = STATION.SHOP_POSITION.x - camera.x;
    const screenShopY = STATION.SHOP_POSITION.y - camera.y;
    drawStationElement(screenShopX, screenShopY, '#ffcc44', 'Shop', isPlayerNearPosition(STATION.SHOP_POSITION));
    
    const screenExitX = exitX - camera.x;
    const screenExitY = exitY - camera.y;
    drawExitPortal(screenExitX, screenExitY, isPlayerNearExit(exitX, exitY));
    
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
    ctx.fillText('Exit to Main Game', x, y + 70);
    
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
        } else if (isPlayerNearPosition(STATION.SHIP_POSITION)) {
            // Switch to ship selection
            gameState = GAME_STATES.CLASS_SELECT;
            // Store current ship data to preserve levels
            storeShipData();
        } else if (isPlayerNearPosition(STATION.SHOP_POSITION)) {
            // Show shop notification (placeholder for now)
            showNotification('Shop coming soon!');
        } else if (isPlayerNearExit(exitX, exitY)) {
            // Exit to main game
            window.currentZone = GAME_ZONES.MAIN;
            gameState = GAME_STATES.PLAYING;
            window.waveNumber = 1;
            window.enemiesRemainingInWave = 7 + (window.waveNumber - 1) * 2;
            window.waveStartTime = Date.now();
            showNotification('Entering Main Game - Wave 1');
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

// Start the game
initializeGame();
gameLoop();

// Make functions globally available
window.drawStationBackground = drawStationBackground;
window.drawStationUI = drawStationUI;