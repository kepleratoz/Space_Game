function drawDebugInfo() {
    if (!isDebugMode) return;
    
    ctx.fillStyle = '#ff0';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('DEBUG MODE', canvas.width - 10, canvas.height - 160);
    ctx.fillText('K: Add 100 gems', canvas.width - 10, canvas.height - 140);
    ctx.fillText('L: Fill health/energy', canvas.width - 10, canvas.height - 120);
    ctx.fillText('M: Add 1000 score', canvas.width - 10, canvas.height - 100);
    ctx.fillText(';: Toggle invincibility' + (isInvincible ? ' (ON)' : ' (OFF)'), canvas.width - 10, canvas.height - 80);
    ctx.fillText('N: Clear & next wave', canvas.width - 10, canvas.height - 60);
    ctx.fillText('C: Clear all enemies', canvas.width - 10, canvas.height - 40);
    
    // Show additional debug info
    ctx.fillText(`X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}`, canvas.width - 10, canvas.height - 20);
    ctx.fillText(`Enemies: ${enemies.length}, Asteroids: ${asteroids.length}`, canvas.width - 10, canvas.height - 0);
    ctx.textAlign = 'left';
}