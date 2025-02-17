function drawClassSelection() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Space Game', canvas.width/2, 60);
    
    // Draw XP counter
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`XP: ${getXP()}`, canvas.width/2, 100);
    
    // Draw wipe save button in top left
    const wipeBtn = {
        x: 20,
        y: 20,
        width: 140,
        height: 40
    };
    
    ctx.fillStyle = mouse.x >= wipeBtn.x && mouse.x <= wipeBtn.x + wipeBtn.width &&
                   mouse.y >= wipeBtn.y && mouse.y <= wipeBtn.y + wipeBtn.height
                   ? '#e74c3c' : '#c0392b';
    ctx.beginPath();
    ctx.roundRect(wipeBtn.x, wipeBtn.y, wipeBtn.width, wipeBtn.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Wipe Save', wipeBtn.x + wipeBtn.width/2, wipeBtn.y + 28);
    
    // Draw save button if game is in progress
    if (player) {
        const saveBtn = {
            x: canvas.width - 160,
            y: 20,
            width: 140,
            height: 40
        };
        
        ctx.fillStyle = mouse.x >= saveBtn.x && mouse.x <= saveBtn.x + saveBtn.width &&
                       mouse.y >= saveBtn.y && mouse.y <= saveBtn.y + saveBtn.height
                       ? '#5DBE64' : '#4CAF50';
        ctx.beginPath();
        ctx.roundRect(saveBtn.x, saveBtn.y, saveBtn.width, saveBtn.height, 8);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.fillText('Save Game', saveBtn.x + saveBtn.width/2, saveBtn.y + 28);
    }
    
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.fillText('Select Your Ship', canvas.width/2, 150);
    
    const classes = Object.entries(SHIP_CLASSES);
    const spacing = canvas.width / (classes.length + 1);
    const wavesCleared = getWavesCleared();
    const currentXP = getXP();
    
    classes.forEach(([key, shipClass], index) => {
        const x = spacing * (index + 1);
        const y = canvas.height/2;
        const width = 100;
        const height = 100;
        
        const isLocked = currentXP < shipClass.xpRequired;
        
        // Draw selection box
        ctx.strokeStyle = isLocked ? '#444' : 
                         (mouse.x > x - width/2 && 
                         mouse.x < x + width/2 && 
                         mouse.y > y - height/2 && 
                         mouse.y < y + height/2)
                         ? shipClass.color 
                         : '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - width/2, y - height/2, width, height);
        
        // Draw ship preview
        ctx.fillStyle = isLocked ? '#444' : shipClass.color;
        ctx.beginPath();
        ctx.moveTo(x + width/4, y);
        ctx.lineTo(x - width/4, y + height/4);
        ctx.lineTo(x - width/4, y - height/4);
        ctx.closePath();
        ctx.fill();
        
        // Draw ship name and stats
        ctx.fillStyle = isLocked ? '#666' : '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(shipClass.name, x, y + height);
        ctx.font = '16px Arial';
        
        if (isLocked) {
            ctx.fillText(`Requires ${shipClass.xpRequired} XP`, x, y + height + 25);
        } else {
            ctx.fillText(`Health: ${shipClass.health}`, x, y + height + 25);
            ctx.fillText(`Speed: ${shipClass.maxSpeed}`, x, y + height + 45);
            
            // Draw waves cleared
            const wavesCount = wavesCleared[shipClass.name] || 0;
            ctx.fillStyle = '#ffd700';
            ctx.fillText(`Best Wave: ${wavesCount}`, x, y + height + 65);
        }
    });
    
    ctx.textAlign = 'left';
}