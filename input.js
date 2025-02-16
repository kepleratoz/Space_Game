const mouse = {
    x: 0,
    y: 0,
    isDown: false
};
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        mouse.isDown = true;
    }
});
window.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left click
        mouse.isDown = false;
    }
});
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
canvas.addEventListener('click', (e) => {
    // Check pause button click
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    if (e.clientX >= x && e.clientX <= x + buttonSize &&
        e.clientY >= y && e.clientY <= y + buttonSize) {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            isPaused = true;
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            isPaused = false;
        }
        return;
    }

    if (gameState === 'CLASS_SELECT') {
        // Check wipe save button
        const wipeBtn = {
            x: 20,
            y: 20,
            width: 140,
            height: 40
        };
        
        if (e.clientX >= wipeBtn.x && e.clientX <= wipeBtn.x + wipeBtn.width &&
            e.clientY >= wipeBtn.y && e.clientY <= wipeBtn.y + wipeBtn.height) {
            wipeSaveData();
            return;
        }

        // Check save button click if game is in progress
        if (player) {
            const saveBtn = {
                x: canvas.width - 160,
                y: 20,
                width: 140,
                height: 40
            };
            
            if (e.clientX >= saveBtn.x && e.clientX <= saveBtn.x + saveBtn.width &&
                e.clientY >= saveBtn.y && e.clientY <= saveBtn.y + saveBtn.height) {
                saveGame(1); // Save to slot 1 by default
                return;
            }
        }
        
        // Check ship class selection
        const classes = Object.entries(SHIP_CLASSES);
        const spacing = canvas.width / (classes.length + 1);
        
        classes.forEach(([key, shipClass], index) => {
            const x = spacing * (index + 1);
            const y = canvas.height/2;  // This is where ships are actually drawn
            const width = 100;
            const height = 100;
            
            if (e.clientX > x - width/2 && 
                e.clientX < x + width/2 && 
                e.clientY > y - height/2 && 
                e.clientY < y + height/2) {
                
                // Check if ship is locked
                if (getXP() < shipClass.xpRequired) {
                    showNotification(`Need ${shipClass.xpRequired} XP to unlock ${shipClass.name}`, 'warning');
                    return;
                }
                
                selectedClass = shipClass;
                
                // Reset game state
                player = new Player(shipClass);
                enemies = [];
                asteroids = [];
                healthPacks = [];
                gems = [];
                gameOver = false;
                score = 0;
                
                // Reset camera
                camera.x = player.x - canvas.width / 2;
                camera.y = player.y - canvas.height / 2;
                
                // Initialize wave system
                window.waveNumber = 1;
                window.enemiesRemainingInWave = Math.min(5 + window.waveNumber * 2, 25);
                window.waveStartTime = Date.now();
                window.waveTimer = 0;
                
                gameState = 'PLAYING';
                isPaused = false;
                
                // Increment games played when starting a new game
                incrementGamesPlayed(shipClass.name);
            }
        });
        return;
    }

    // Handle pause menu clicks
    if (gameState === 'PAUSED') {
        // Resume button
        const resumeBtn = {
            x: canvas.width/2 - 150,
            y: canvas.height/2 - 50,
            width: 300,
            height: 50
        };
        
        if (e.clientX >= resumeBtn.x && e.clientX <= resumeBtn.x + resumeBtn.width &&
            e.clientY >= resumeBtn.y && e.clientY <= resumeBtn.y + resumeBtn.height) {
            gameState = 'PLAYING';
            isPaused = false;
            return;
        }

        // Exit button
        const exitBtn = {
            x: canvas.width/2 - 150,
            y: canvas.height/2 + 20,
            width: 300,
            height: 50
        };
        
        if (e.clientX >= exitBtn.x && e.clientX <= exitBtn.x + exitBtn.width &&
            e.clientY >= exitBtn.y && e.clientY <= exitBtn.y + exitBtn.height) {
            // Add XP before exiting
            const xpGained = Math.floor(score / 100);
            addXP(xpGained);
            showNotification(`Gained ${xpGained} XP!`);
            
            // Save the game before exiting
            saveGame(1);
            // Reset game state without incrementing games played
            gameState = 'CLASS_SELECT';
            isPaused = false;
            return;
        }
    }

    // Check save button click in class selection
    if (gameState === 'CLASS_SELECT' && player) {
        const saveBtn = {
            x: canvas.width - 160,
            y: 20,
            width: 140,
            height: 40
        };
        
        if (e.clientX >= saveBtn.x && e.clientX <= saveBtn.x + saveBtn.width &&
            e.clientY >= saveBtn.y && e.clientY <= saveBtn.y + saveBtn.height) {
            saveGame(1); // Save to slot 1 by default
            return;
        }
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        if (gameState !== 'CLASS_SELECT' && gameState !== 'GAME_OVER') {
            if (gameState === 'PLAYING') {
                gameState = 'PAUSED';
                isPaused = true;
            } else if (gameState === 'PAUSED') {
                gameState = 'PLAYING';
                isPaused = false;
            }
        }
    }

    // Debug controls
    if (e.key === 'o' || e.key === 'O') {
        isDebugMode = !isDebugMode;
    }

    if (isDebugMode && player) {
        switch(e.key) {
            case 'k':
            case 'K':
                player.gems += 100;
                break;
            case 'l':
            case 'L':
                player.health = player.maxHealth;
                player.energy = player.maxEnergy;
                break;
            case ';':
                isInvincible = !isInvincible;
                break;
            case 'm':
            case 'M':
                score += 1000;
                break;
            case 'n':
            case 'N':
                // Clear all enemies and advance to next wave
                enemies = [];
                window.enemiesRemainingInWave = 0;
                window.waveTimer = 1; // Set to 1 to trigger immediate wave change
                break;
            case 'c':
            case 'C':
                // Clear all enemies but stay in current wave
                enemies = [];
                break;
        }
    }
});

canvas.addEventListener('click', (e) => {
    // Check if pause button was clicked
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    if (e.clientX >= x && e.clientX <= x + buttonSize &&
        e.clientY >= y && e.clientY <= y + buttonSize) {
        if (gameState === 'PLAYING') {
            gameState = 'PAUSED';
            isPaused = true;
        } else if (gameState === 'PAUSED') {
            gameState = 'PLAYING';
            isPaused = false;
        }
        return;
    }

    // Handle save slot clicks when paused
    if (gameState === 'PAUSED') {
        for (let i = 1; i <= 3; i++) {
            const btn = {
                x: canvas.width/2 - 150,
                y: canvas.height/2 - 80 + (i - 1) * 60,
                width: 300,
                height: 50
            };
            
            if (e.clientX >= btn.x && e.clientX <= btn.x + btn.width &&
                e.clientY >= btn.y && e.clientY <= btn.y + btn.height) {
                saveGame(i);
                return;
            }
        }
    }
});