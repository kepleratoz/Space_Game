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
    // Get or create notifications container
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.style.backgroundColor = type === 'success' ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontFamily = 'Arial';
    notification.style.transition = 'all 0.3s ease-in-out';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.textContent = message;

    // Add to container at the top
    container.insertBefore(notification, container.firstChild);

    // Trigger animation to slide in and fade in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    // Start fade out and slide down after 4.5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 4700);
}

function drawGameOver() {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title with shadow
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff0000';
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 150);
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Calculate time played
    const timePlayedSeconds = Math.floor((Date.now() - window.waveStartTime) / 1000);
    const minutes = Math.floor(timePlayedSeconds / 60);
    const seconds = timePlayedSeconds % 60;
    
    // Calculate XP gained
    const xpGained = Math.floor(score / 100);
    
    // Draw stats
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    const statsY = canvas.height/2 - 50;
    const lineSpacing = 35;
    
    ctx.fillText(`Ship: ${player.shipClass.name}`, canvas.width/2, statsY);
    ctx.fillText(`Waves Cleared: ${window.waveNumber - 1}`, canvas.width/2, statsY + lineSpacing);
    ctx.fillText(`Time Played: ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width/2, statsY + lineSpacing * 2);
    ctx.fillText(`Score: ${score}`, canvas.width/2, statsY + lineSpacing * 3);
    
    // Draw XP gained with gold color
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`XP Gained: ${xpGained}`, canvas.width/2, statsY + lineSpacing * 4);

    // Draw exit button
    const exitBtn = {
        x: canvas.width/2 - 150,
        y: statsY + lineSpacing * 5,
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
    ctx.fillText('Return to Title', canvas.width/2, exitBtn.y + 32);
}

function drawSettingsButton() {
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin + buttonSize + 10; // Position below pause button
    
    // Draw button background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, buttonSize, buttonSize);
    
    // Draw settings gear icon
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const centerX = x + buttonSize/2;
    const centerY = y + buttonSize/2;
    const radius = buttonSize/3;
    
    // Draw gear teeth
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const outerX = centerX + Math.cos(angle) * (radius + 4);
        const outerY = centerY + Math.sin(angle) * (radius + 4);
        const innerX = centerX + Math.cos(angle) * radius;
        const innerY = centerY + Math.sin(angle) * radius;
        
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
    }
    
    // Draw center circle
    ctx.moveTo(centerX + radius/2, centerY);
    ctx.arc(centerX, centerY, radius/2, 0, Math.PI * 2);
    ctx.stroke();
}

function drawSettingsMenu() {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title with shadow
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SETTINGS', canvas.width/2, canvas.height/2 - 100);
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // FPS options
    const fpsOptions = [30, 60, 120, 144, 240];
    const buttonSpacing = 70;
    const buttonWidth = 60;
    const buttonHeight = 40;
    const startX = canvas.width/2 - (fpsOptions.length * buttonWidth + (fpsOptions.length - 1) * 10)/2;
    const y = canvas.height/2;

    // FPS label
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Max Framerate:', canvas.width/2, y - 40);

    // Draw FPS buttons
    fpsOptions.forEach((fps, index) => {
        const x = startX + index * (buttonWidth + 10);
        const isSelected = settings.maxFPS === fps;
        
        // Button background
        ctx.fillStyle = isSelected ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(x, y, buttonWidth, buttonHeight, 8);
        ctx.fill();
        
        // Button text
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(fps, x + buttonWidth/2, y + 25);
    });

    // Draw back button
    const backBtn = {
        x: canvas.width/2 - 150,
        y: canvas.height/2 + 100,
        width: 300,
        height: 50
    };
    
    ctx.fillStyle = mouse.x >= backBtn.x && mouse.x <= backBtn.x + backBtn.width &&
                   mouse.y >= backBtn.y && mouse.y <= backBtn.y + backBtn.height
                   ? '#5DBE64' : '#4CAF50';
    ctx.beginPath();
    ctx.roundRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height, 8);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Back', canvas.width/2, backBtn.y + 32);
}

function drawShipClassDisplay() {
    if (!player || gameState !== GAME_STATES.PLAYING) return;

    const margin = 10;
    const padding = 10;
    const boxWidth = 150;
    const boxHeight = 60;
    const x = margin;
    const y = canvas.height - boxHeight - margin;

    // Draw background box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 8);
    ctx.fill();

    // Draw ship class name
    ctx.fillStyle = player.shipClass.color || '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(player.shipClass.name, x + padding, y + padding + 20);

    // Draw archetype if it's an archetype
    if (player.shipClass.name.includes('Assault')) {
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText('Archetype: Assault', x + padding, y + padding + 45);
    } else {
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText('Base Class', x + padding, y + padding + 45);
    }
}

function drawGameUI() {
    drawMinimap();
    player.drawStatusBars();
    drawDebugInfo();
    drawPauseButton();
    drawShipClassDisplay();
}