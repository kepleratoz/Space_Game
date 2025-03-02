function drawMinimap() {
    const mapSize = Math.min(150, Math.min(canvas.width, canvas.height) * 0.2);
    const mapX = canvas.width - mapSize - 10;
    const mapY = 10;
    const mapScale = mapSize / WORLD_WIDTH;

    // Draw map background with completely opaque gray color
    ctx.fillStyle = '#333333'; // Solid dark gray background
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    
    // Add a border for better visibility
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Check if player is in Debris Field
    if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
        // Display radar malfunction message
        ctx.fillStyle = '#ff3333'; // Red text for warning
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add a flashing effect
        const flashRate = 0.5; // Flash rate in seconds
        const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 1000 * Math.PI * flashRate);
        ctx.globalAlpha = alpha;
        
        // Draw the warning text
        ctx.fillText('RADAR', mapX + mapSize / 2, mapY + mapSize / 2 - 10);
        ctx.fillText('MALFUNCTION', mapX + mapSize / 2, mapY + mapSize / 2);
        ctx.fillText('DETECTED', mapX + mapSize / 2, mapY + mapSize / 2 + 10);
        
        // Add some static noise effect to the map
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 100; i++) {
            const noiseX = mapX + Math.random() * mapSize;
            const noiseY = mapY + Math.random() * mapSize;
            const noiseSize = 1 + Math.random() * 2;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#888888';
            ctx.fillRect(noiseX, noiseY, noiseSize, noiseSize);
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
        return;
    }

    // Draw player if it exists
    if (player) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(
            mapX + player.x * mapScale - 2,
            mapY + player.y * mapScale - 2,
            4, 4
        );
    }

    // Draw enemies
    ctx.fillStyle = '#ff0000';
    if (enemies && enemies.length > 0) {
        enemies.forEach(enemy => {
            ctx.fillRect(
                mapX + enemy.x * mapScale - 1,
                mapY + enemy.y * mapScale - 1,
                2, 2
            );
        });
    }

    // Draw asteroids
    ctx.fillStyle = '#808080';
    if (asteroids && asteroids.length > 0) {
        asteroids.forEach(asteroid => {
            ctx.fillRect(
                mapX + asteroid.x * mapScale - 1,
                mapY + asteroid.y * mapScale - 1,
                2, 2
            );
        });
    }

    // Draw health packs
    ctx.fillStyle = '#00ff00';
    if (healthPacks && healthPacks.length > 0) {
        healthPacks.forEach(pack => {
            ctx.fillRect(
                mapX + pack.x * mapScale - 1,
                mapY + pack.y * mapScale - 1,
                2, 2
            );
        });
    }

    // Draw gems
    ctx.fillStyle = '#f0f';
    if (gems && gems.length > 0) {
        gems.forEach(gem => {
            ctx.fillRect(
                mapX + gem.x * mapScale - 1,
                mapY + gem.y * mapScale - 1,
                2, 2
            );
        });
    }

    // Draw viewport rectangle
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(
        mapX + camera.x * mapScale,
        mapY + camera.y * mapScale,
        canvas.width * mapScale,
        canvas.height * mapScale
    );
}