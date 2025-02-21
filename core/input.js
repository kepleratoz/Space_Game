window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mousedown', (e) => {
    switch(e.button) {
        case 0: // Left click
            mouse.isDown = true;
            break;
        case 1: // Middle click
            mouse.middleDown = true;
            break;
        case 2: // Right click
            mouse.rightDown = true;
            if (gameState === GAME_STATES.CLASS_SELECT) {
                const classes = Object.entries(SHIP_CLASSES);
                const spacing = canvas.width / (classes.length + 1);
                
                classes.forEach(([key, shipClass], index) => {
                    const x = spacing * (index + 1);
                    const y = canvas.height/2;
                    const width = 100;
                    const height = 100;
                    
                    if (e.clientX > x - width/2 && 
                        e.clientX < x + width/2 && 
                        e.clientY > y - height/2 && 
                        e.clientY < y + height/2) {
                        if (isShipUnlocked(shipClass.name)) {
                            selectedShipClass = key;
                            selectedShipForAbilities = key;
                            showingAbilityUnlockScreen = true;
                        }
                    }
                });
            } else if (gameState === GAME_STATES.PLAYING && player) {
                // Handle Rammer's charged dash
                player.handleRightClick();
            }
            e.preventDefault(); // Prevent context menu
            break;
    }
});
window.addEventListener('mouseup', (e) => {
    switch(e.button) {
        case 0: // Left click
            mouse.isDown = false;
            break;
        case 1: // Middle click
            mouse.middleDown = false;
            break;
        case 2: // Right click
            mouse.rightDown = false;
            break;
    }
});

// Prevent context menu on right click
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Handle key events for remapping and general key controls
window.addEventListener('keydown', (e) => {
    // Handle key remapping
    if (isRemappingKey) {
        if (e.key === 'Escape') {
            isRemappingKey = false;
            currentRemappingAction = null;
            return;
        }
        
        // Update the keybind
        settings.keybinds[currentRemappingAction] = e.key;
        saveSettings();
        
        isRemappingKey = false;
        currentRemappingAction = null;
        return;
    }

    // Close ability unlock screen with escape
    if (e.key === 'Escape' && showingAbilityUnlockScreen) {
        showingAbilityUnlockScreen = false;
        selectedShipForAbilities = null;
        // Keep the selected archetype configuration
        return;
    }

    // Normal key handling
    keys[e.key] = true;
    
    // Handle ability activation
    if (gameState === GAME_STATES.PLAYING && player) {
        if (e.key === '1') {
            player.activateAbility(1);
        } else if (e.key === '2') {
            player.activateAbility(2);
        }
    }
    
    // Check if it matches any of our keybinds
    for (const [action, key] of Object.entries(settings.keybinds)) {
        if (e.key.toLowerCase() === key.toLowerCase()) {
            // Handle the action
            switch(action) {
                case 'pause':
                    if (gameState !== GAME_STATES.CLASS_SELECT && gameState !== GAME_STATES.GAME_OVER) {
                        gameState = gameState === GAME_STATES.PLAYING ? GAME_STATES.PAUSED : GAME_STATES.PLAYING;
                        isPaused = gameState === GAME_STATES.PAUSED;
                    }
                    break;
                case 'debug':
                    isDebugMode = !isDebugMode;
                    showNotification(isDebugMode ? 'Debug Mode Enabled' : 'Debug Mode Disabled');
                    break;
            }
        }
    }

    // Debug controls
    if (isDebugMode && player) {
        switch(e.key) {
            case 'k':
            case 'K':
                player.gems += 100;
                showNotification('+100 Gems');
                break;
            case 'l':
            case 'L':
                player.health = player.maxHealth;
                player.energy = player.maxEnergy;
                // Reset ability cooldowns
                if (player.abilities.ability1) {
                    player.abilities.ability1.cooldown = 0;
                }
                if (player.abilities.ability2) {
                    player.abilities.ability2.cooldown = 0;
                }
                showNotification('Health, Energy, and Ability Cooldowns Restored');
                break;
            case ';':
                isInvincible = !isInvincible;
                showNotification(isInvincible ? 'Invincibility Enabled' : 'Invincibility Disabled');
                break;
            case 'm':
            case 'M':
                score += 1000;
                showNotification('+1000 Score');
                break;
            case 'n':
            case 'N':
                // Clear all enemies and advance to next wave
                enemies = [];
                window.enemiesRemainingInWave = 0;
                window.waveTimer = 1; // Set to 1 to trigger immediate wave change
                showNotification('Advancing to Next Wave');
                break;
            case 'c':
            case 'C':
                // Clear all enemies but stay in current wave
                enemies = [];
                showNotification('Cleared All Enemies');
                break;
            case 'f':
            case 'F':
                window.isFrozen = !window.isFrozen;
                showNotification(window.isFrozen ? 'Enemies Frozen' : 'Enemies Unfrozen');
                break;
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('click', (e) => {
    // Check pause button click
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    if (e.clientX >= x && e.clientX <= x + buttonSize &&
        e.clientY >= y && e.clientY <= y + buttonSize) {
        if (gameState === GAME_STATES.PLAYING) {
            gameState = GAME_STATES.PAUSED;
            isPaused = true;
        } else if (gameState === GAME_STATES.PAUSED) {
            gameState = GAME_STATES.PLAYING;
            isPaused = false;
        }
        return;
    }

    if (gameState === GAME_STATES.CLASS_SELECT) {
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

        // Handle ability unlock screen clicks if it's showing
        if (showingAbilityUnlockScreen) {
            handleAbilityUnlockClick(e.clientX, e.clientY);
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
                
                const currentXP = getXP();
                
                // If ship is already unlocked, allow selection without XP check
                if (isShipUnlocked(shipClass.name)) {
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
                    
                    gameState = GAME_STATES.PLAYING;
                    isPaused = false;
                    
                    // Increment games played when starting a new game
                    incrementGamesPlayed(shipClass.name);
                    return;
                }
                
                // Check if ship is locked and player has enough XP
                if (currentXP < shipClass.xpRequired) {
                    showNotification(`Need ${shipClass.xpRequired} XP to unlock ${shipClass.name}`, 'warning');
                    return;
                }
                
                // If ship requires XP and hasn't been unlocked yet, spend the XP
                if (shipClass.xpRequired > 0 && !isShipUnlocked(shipClass.name)) {
                    // Spend XP to unlock
                    const remainingXP = currentXP - shipClass.xpRequired;
                    localStorage.setItem('spaceGameXP', remainingXP);
                    showNotification(`Unlocked ${shipClass.name}!`, 'success');
                    unlockShip(shipClass.name);
                    return; // Return here to prevent automatically starting game
                }
            }
        });

        // Check if settings button was clicked
        const settingsX = canvas.width - buttonSize - margin;
        const settingsY = margin + buttonSize + 10;
        
        if (e.clientX >= settingsX && e.clientX <= settingsX + buttonSize &&
            e.clientY >= settingsY && e.clientY <= settingsY + buttonSize) {
            gameState = GAME_STATES.SETTINGS;
            return;
        }

        return;
    }

    // Handle pause menu clicks
    if (gameState === GAME_STATES.PAUSED) {
        // Resume button
        const resumeBtn = {
            x: canvas.width/2 - 150,
            y: canvas.height/2 - 50,
            width: 300,
            height: 50
        };
        
        if (e.clientX >= resumeBtn.x && e.clientX <= resumeBtn.x + resumeBtn.width &&
            e.clientY >= resumeBtn.y && e.clientY <= resumeBtn.y + resumeBtn.height) {
            gameState = GAME_STATES.PLAYING;
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
            gameState = GAME_STATES.CLASS_SELECT;
            isPaused = false;
            return;
        }
    }

    // Check save button click in class selection
    if (gameState === GAME_STATES.CLASS_SELECT && player) {
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

    // Handle save slot clicks when paused
    if (gameState === GAME_STATES.PAUSED) {
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

    // Handle game over screen exit button
    if (gameState === GAME_STATES.GAME_OVER || gameOver) {
        const statsY = canvas.height/2 - 50;
        const lineSpacing = 35;
        const exitBtn = {
            x: canvas.width/2 - 150,
            y: statsY + lineSpacing * 5,
            width: 300,
            height: 50
        };
        
        if (e.clientX >= exitBtn.x && e.clientX <= exitBtn.x + exitBtn.width &&
            e.clientY >= exitBtn.y && e.clientY <= exitBtn.y + exitBtn.height) {
            // Add XP before exiting
            const xpGained = Math.floor(score / 100);
            addXP(xpGained);
            
            // Reset game state
            gameState = GAME_STATES.CLASS_SELECT;
            gameOver = false;
            player = null;
            return;
        }
    }

    // Handle settings menu clicks
    if (gameState === GAME_STATES.SETTINGS) {
        // FPS options
        const fpsOptions = [30, 60, 120, 144, 240];
        const buttonWidth = 60;
        const buttonHeight = 40;
        const startX = canvas.width/2 - (fpsOptions.length * buttonWidth + (fpsOptions.length - 1) * 10)/2;
        const y = canvas.height/2;

        // Check FPS button clicks
        fpsOptions.forEach((fps, index) => {
            const x = startX + index * (buttonWidth + 10);
            if (e.clientX >= x && e.clientX <= x + buttonWidth &&
                e.clientY >= y && e.clientY <= y + buttonHeight) {
                settings.maxFPS = fps;
                saveSettings();
                return;
            }
        });

        // Check back button click
        const backBtn = {
            x: canvas.width/2 - 150,
            y: canvas.height/2 + 100,
            width: 300,
            height: 50
        };
        
        if (e.clientX >= backBtn.x && e.clientX <= backBtn.x + backBtn.width &&
            e.clientY >= backBtn.y && e.clientY <= backBtn.y + backBtn.height) {
            gameState = GAME_STATES.CLASS_SELECT;
            return;
        }
    }

    // Remove ability unlock screen click handler for gameplay
    if (gameState === GAME_STATES.PLAYING && player) {
        return;
    }
});

// Prevent default right-click menu
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Handle right-click
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right click
        if (gameState === GAME_STATES.CLASS_SELECT) {
            const classes = Object.entries(SHIP_CLASSES);
            const spacing = canvas.width / (classes.length + 1);
            
            classes.forEach(([key, shipClass], index) => {
                const x = spacing * (index + 1);
                const y = canvas.height/2;
                const width = 100;
                const height = 100;
                
                if (e.clientX > x - width/2 && 
                    e.clientX < x + width/2 && 
                    e.clientY > y - height/2 && 
                    e.clientY < y + height/2) {
                    if (isShipUnlocked(shipClass.name)) {
                        selectedShipClass = key;
                        selectedShipForAbilities = key;
                        showingAbilityUnlockScreen = true;
                    }
                }
            });
        }
    }
});