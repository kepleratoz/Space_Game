// Main game functions
function initializeGame() {
    // Initialize save system
    initializeSaveSystem();
    
    // Reset game state
    resetGameState();
    
    // Initialize wave system
    initializeWaveSystem();
}

function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === GAME_STATES.CLASS_SELECT) {
        drawClassSelection();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameState === GAME_STATES.GAME_OVER || gameOver) {
        drawGameOver();
        requestAnimationFrame(gameLoop);
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

    // Draw pause screen if paused
    if (gameState === GAME_STATES.PAUSED) {
        drawPauseScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Start the game
initializeGame();
gameLoop();