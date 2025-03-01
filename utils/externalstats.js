function drawDebugInfo() {
    if (!isDebugMode) return;
    
    const margin = 10;
    const padding = 5; // Reduced padding
    const lineHeight = 20;
    const numLines = 9; // Number of lines in the debug info
    const panelWidth = 200;
    const panelHeight = numLines * lineHeight + padding * 2;
    const x = canvas.width - panelWidth - margin;
    const y = canvas.height - panelHeight - margin;
    
    // Remove background panel
    // No background box, just draw the debug info text directly
    
    ctx.fillStyle = '#ff0';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    
    // Calculate text positions
    const textX = canvas.width - margin - padding;
    let textY = y + padding + lineHeight;
    
    // Draw debug info text
    ctx.fillText('DEBUG MODE', textX, textY);
    textY += lineHeight;
    ctx.fillText('K: Add 100 gems', textX, textY);
    textY += lineHeight;
    ctx.fillText('L: Fill health/energy', textX, textY);
    textY += lineHeight;
    ctx.fillText('M: Add 1000 score', textX, textY);
    textY += lineHeight;
    ctx.fillText(';: Toggle invincibility' + (isInvincible ? ' (ON)' : ' (OFF)'), textX, textY);
    textY += lineHeight;
    ctx.fillText('N: Clear & next wave', textX, textY);
    textY += lineHeight;
    ctx.fillText('C: Clear all enemies', textX, textY);
    textY += lineHeight;
    
    // Show additional debug info if player exists
    if (player) {
        ctx.fillText(`X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}`, textX, textY);
        textY += lineHeight;
    } else {
        ctx.fillText(`Player: null`, textX, textY);
        textY += lineHeight;
    }
    
    ctx.fillText(`Enemies: ${enemies ? enemies.length : 0}, Asteroids: ${asteroids ? asteroids.length : 0}`, textX, textY);
    
    ctx.textAlign = 'left';
}