function drawPauseButton() {
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    // Draw button background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, buttonSize, buttonSize);
    
    // Draw pause icon or play icon
    ctx.fillStyle = '#fff';
    if (!isPaused) {
        // Draw pause bars
        ctx.fillRect(x + buttonSize * 0.3, y + buttonSize * 0.2, buttonSize * 0.15, buttonSize * 0.6);
        ctx.fillRect(x + buttonSize * 0.55, y + buttonSize * 0.2, buttonSize * 0.15, buttonSize * 0.6);
    } else {
        // Draw play triangle
        ctx.beginPath();
        ctx.moveTo(x + buttonSize * 0.3, y + buttonSize * 0.2);
        ctx.lineTo(x + buttonSize * 0.3, y + buttonSize * 0.8);
        ctx.lineTo(x + buttonSize * 0.7, y + buttonSize * 0.5);
        ctx.closePath();
        ctx.fill();
    }
}

function drawPauseScreen() {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title with shadow
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2 - 100);
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw resume button
    const resumeBtn = {
        x: canvas.width/2 - 150,
        y: canvas.height/2 - 50,
        width: 300,
        height: 50
    };
    
    ctx.fillStyle = mouse.x >= resumeBtn.x && mouse.x <= resumeBtn.x + resumeBtn.width &&
                   mouse.y >= resumeBtn.y && mouse.y <= resumeBtn.y + resumeBtn.height
                   ? '#5DBE64' : '#4CAF50';
    ctx.beginPath();
    ctx.roundRect(resumeBtn.x, resumeBtn.y, resumeBtn.width, resumeBtn.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Resume Game', canvas.width/2, resumeBtn.y + 32);

    // Draw exit button
    const exitBtn = {
        x: canvas.width/2 - 150,
        y: canvas.height/2 + 20,
        width: 300,
        height: 50
    };
    
    ctx.fillStyle = mouse.x >= exitBtn.x && mouse.x <= exitBtn.x + exitBtn.width &&
                   mouse.y >= exitBtn.y && mouse.y <= exitBtn.y + exitBtn.height
                   ? '#e74c3c' : '#c0392b';
    ctx.beginPath();
    ctx.roundRect(exitBtn.x, exitBtn.y, exitBtn.width, exitBtn.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Exit to Title', canvas.width/2, exitBtn.y + 32);
    
    // Instructions text
    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press P to resume', canvas.width/2, canvas.height/2 + 180);
}
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = type === 'success' ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontFamily = 'Arial';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
}