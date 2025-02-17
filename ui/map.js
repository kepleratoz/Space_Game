function drawMinimap() {
    const mapSize = Math.min(150, Math.min(canvas.width, canvas.height) * 0.2);
    const mapX = canvas.width - mapSize - 10;
    const mapY = 10;
    const mapScale = mapSize / WORLD_WIDTH;

    // Draw map background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
        mapX + player.x * mapScale - 2,
        mapY + player.y * mapScale - 2,
        4, 4
    );

    // Draw enemies
    ctx.fillStyle = '#ff0000';
    enemies.forEach(enemy => {
        ctx.fillRect(
            mapX + enemy.x * mapScale - 1,
            mapY + enemy.y * mapScale - 1,
            2, 2
        );
    });

    // Draw asteroids
    ctx.fillStyle = '#808080';
    asteroids.forEach(asteroid => {
        ctx.fillRect(
            mapX + asteroid.x * mapScale - 1,
            mapY + asteroid.y * mapScale - 1,
            2, 2
        );
    });

    // Draw health packs
    ctx.fillStyle = '#00ff00';
    healthPacks.forEach(pack => {
        ctx.fillRect(
            mapX + pack.x * mapScale - 1,
            mapY + pack.y * mapScale - 1,
            2, 2
        );
    });

    // Draw gems
    ctx.fillStyle = '#f0f';
    gems.forEach(gem => {
        ctx.fillRect(
            mapX + gem.x * mapScale - 1,
            mapY + gem.y * mapScale - 1,
            2, 2
        );
    });

    // Draw viewport rectangle
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(
        mapX + camera.x * mapScale,
        mapY + camera.y * mapScale,
        canvas.width * mapScale,
        canvas.height * mapScale
    );
}