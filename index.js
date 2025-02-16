function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'CLASS_SELECT') {
        drawClassSelection();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    if (gameState === 'GAME_OVER' || gameOver) {
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.min(48, canvas.width * 0.1)}px Arial`;
        ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
        ctx.font = `${Math.min(24, canvas.width * 0.05)}px Arial`;
        ctx.fillText(`Score: ${score}`, canvas.width/2 - 50, canvas.height/2 + 40);
        requestAnimationFrame(gameLoop);
        return;
    }

    // Draw background
    drawBackground();

    // Update and draw game objects only if not paused
    if (gameState === 'PLAYING') {
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
    if (gameState === 'PAUSED') {
        drawPauseScreen();
    }

    requestAnimationFrame(gameLoop);
}

initializeGame();
gameLoop();