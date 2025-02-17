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
        // Use setTimeout for more precise timing at high framerates
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

    // Draw background
    drawBackground();

    // Update camera
    camera.update();

    // Update and draw game objects only if not paused
    if (gameState === GAME_STATES.PLAYING) {
        // Update player invincibility from debug mode
        if (isDebugMode && isInvincible) {
            player.invulnerable = true;
            player.invulnerableTime = 2;
        }

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
    }

    // Always draw game objects
    [...asteroids, ...enemies, ...healthPacks, ...gems].forEach(obj => obj.draw());
    player.drawLasers();
    player.draw();

    // Draw UI elements
    drawMinimap();
    drawStatusBars();
    drawDebugInfo();
    drawPauseButton();

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

// Start the game
initializeGame();
gameLoop();