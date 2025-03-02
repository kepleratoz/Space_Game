window.addEventListener('mousemove', (e) => {
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    // Handle inventory mouse movement if in inventory state
    if ((gameState === GAME_STATES.INVENTORY || gameState === GAME_STATES.INVENTORY_OVERLAY) && player) {
        handleInventoryMouseMove(mouse.x, mouse.y, player);
    }
});

window.addEventListener('mousedown', (e) => {
    switch(e.button) {
        case 0: // Left click
            mouse.isDown = true;
            
            // Handle inventory mouse down if in inventory state
            if ((gameState === GAME_STATES.INVENTORY || gameState === GAME_STATES.INVENTORY_OVERLAY) && player) {
                handleInventoryMouseDown(mouse.x, mouse.y, player);
            }
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
                if (typeof player.handleRightClick === 'function') {
                    player.handleRightClick();
                }
            }
            e.preventDefault(); // Prevent context menu
            break;
    }
});

window.addEventListener('mouseup', (e) => {
    switch(e.button) {
        case 0: // Left click
            mouse.isDown = false;
            
            // Handle inventory mouse up if in inventory state
            if ((gameState === GAME_STATES.INVENTORY || gameState === GAME_STATES.INVENTORY_OVERLAY) && player) {
                handleInventoryMouseUp(mouse.x, mouse.y, player);
            }
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
    
    // Prevent default behavior for arrow keys and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    // Toggle inventory with E key
    if ((e.key === 'e' || e.key === 'E') && player && (gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.INVENTORY || gameState === GAME_STATES.INVENTORY_OVERLAY)) {
        toggleInventory();
        return;
    }
    
    // Handle player abilities
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
                    if (gameState !== GAME_STATES.CLASS_SELECT && gameState !== GAME_STATES.GAME_OVER && gameState !== GAME_STATES.STATION) {
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
            case 'j':
            case 'J':
                window.enemiesKilledInTestingZone = (window.enemiesKilledInTestingZone || 0) + 2;
                showNotification('+2 Kills');
                break;
        }
    }

    // Add respawn shortcut for game over screen
    if (gameState === GAME_STATES.GAME_OVER && (e.key === 'r' || e.key === 'R')) {
        console.log("Respawn key pressed");
        window.respawnToStation();
        return;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('click', (e) => {
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Handle inventory clicks if in inventory state
    if (gameState === GAME_STATES.INVENTORY && player) {
        handleInventoryClick(mouseX, mouseY, player);
        return;
    }
    
    // Handle clicks based on game state
    if (gameState === GAME_STATES.CLASS_SELECT) {
        // Check if we're showing the ability unlock screen
        if (showingAbilityUnlockScreen && selectedShipForAbilities) {
            handleAbilityUnlockClick(mouseX, mouseY);
            return;
        }
        
        // Check if click is on start game button
        if (typeof window.startGameBtn !== 'undefined' && window.startGameBtn && 
            typeof window.startGameBtn.x !== 'undefined' && 
            typeof window.startGameBtn.width !== 'undefined' && 
            typeof window.startGameBtn.y !== 'undefined' && 
            typeof window.startGameBtn.height !== 'undefined') {
            if (mouseX >= window.startGameBtn.x && 
                mouseX <= window.startGameBtn.x + window.startGameBtn.width &&
                mouseY >= window.startGameBtn.y && 
                mouseY <= window.startGameBtn.y + window.startGameBtn.height) {
                startGame(selectedShipClass || 'FIGHTER');
                return;
            }
        }
        
        // Check if click is on return to station button
        if (typeof window.returnToStationBtn !== 'undefined' && window.returnToStationBtn && 
            typeof window.returnToStationBtn.x !== 'undefined' && 
            typeof window.returnToStationBtn.width !== 'undefined' &&
            typeof window.returnToStationBtn.y !== 'undefined' && 
            typeof window.returnToStationBtn.height !== 'undefined') {
            if (mouseX >= window.returnToStationBtn.x && 
                mouseX <= window.returnToStationBtn.x + window.returnToStationBtn.width &&
                mouseY >= window.returnToStationBtn.y && 
                mouseY <= window.returnToStationBtn.y + window.returnToStationBtn.height) {
                // Return to station without changing ship
                gameState = GAME_STATES.PLAYING;
                return;
            }
        }
        
        // Handle ship selection clicks
        handleClassSelectionClick(mouseX, mouseY);
        return;
    }
    
    // Handle clicks in settings menu
    if (gameState === GAME_STATES.SETTINGS) {
        handleSettingsClick(mouseX, mouseY);
        return;
    }
    
    // Handle clicks in game over screen
    if (gameState === GAME_STATES.GAME_OVER) {
        // Check if click is on respawn button
        if (window.respawnBtn && 
            mouseX >= window.respawnBtn.x && 
            mouseX <= window.respawnBtn.x + window.respawnBtn.width && 
            mouseY >= window.respawnBtn.y && 
            mouseY <= window.respawnBtn.y + window.respawnBtn.height) {
            
            console.log("Respawn button clicked in main event listener!");
            window.respawnToStation();
        }
        return;
    }
    
    // Handle clicks in pause screen
    if (gameState === GAME_STATES.PAUSED) {
        handlePauseScreenClick(mouseX, mouseY);
        return;
    }
    
    // Handle clicks in the main game
    if (gameState === GAME_STATES.PLAYING) {
        // Check if click is on settings button
        if (isClickOnSettingsButton(mouseX, mouseY)) {
            gameState = GAME_STATES.SETTINGS;
            return;
        }
        
        // Handle player shooting
        if (player && typeof player.canShoot === 'function' && player.canShoot()) {
            player.shoot();
        }
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
            // Use the same handler for right-clicks, just pass isRightClick as true
            handleClassSelectionClick(e.clientX, e.clientY, true);
            e.preventDefault(); // Prevent context menu
        } else if (gameState === GAME_STATES.PLAYING && player) {
            // Handle Rammer's charged dash
            if (typeof player.handleRightClick === 'function') {
                player.handleRightClick();
            }
            e.preventDefault();
        }
    }
});

// Add the missing isClickOnSettingsButton function
function isClickOnSettingsButton(mouseX, mouseY) {
    // Settings button is typically in the top-right corner
    const buttonSize = 30;
    const margin = 10;
    const x = canvas.width - buttonSize - margin;
    const y = margin;
    
    return mouseX >= x && mouseX <= x + buttonSize &&
           mouseY >= y && mouseY <= y + buttonSize;
}

// Add the missing handlePauseScreenClick function
function handlePauseScreenClick(mouseX, mouseY) {
    // Get the resume button dimensions from the drawPauseScreen function
    const resumeBtn = {
        x: canvas.width/2 - 150,
        y: canvas.height/2 - 50,
        width: 300,
        height: 50
    };
    
    // Check if click is on resume button
    if (mouseX >= resumeBtn.x && mouseX <= resumeBtn.x + resumeBtn.width &&
        mouseY >= resumeBtn.y && mouseY <= resumeBtn.y + resumeBtn.height) {
        // Resume the game
        gameState = GAME_STATES.PLAYING;
        isPaused = false;
        return;
    }
    
    // Get the exit button dimensions from the drawPauseScreen function
    const exitBtn = {
        x: canvas.width/2 - 150,
        y: canvas.height/2 + 20,
        width: 300,
        height: 50
    };
    
    // Check if click is on exit button
    if (mouseX >= exitBtn.x && mouseX <= exitBtn.x + exitBtn.width &&
        mouseY >= exitBtn.y && mouseY <= exitBtn.y + exitBtn.height) {
        // Return to main menu or station
        gameState = GAME_STATES.STATION;
        isPaused = false;
        
        // If player exists, position them in the station
        if (player) {
            window.currentZone = GAME_ZONES.STATION;
            player.x = STATION.WIDTH / 2;
            player.y = STATION.HEIGHT / 2;
        }
        return;
    }
}

// Handle game over click
const handleGameOverClick = (mouseX, mouseY) => {
    console.log("Game over click at:", mouseX, mouseY);
    
    // Check if click is on respawn button
    if (window.respawnBtn && 
        mouseX >= window.respawnBtn.x && 
        mouseX <= window.respawnBtn.x + window.respawnBtn.width && 
        mouseY >= window.respawnBtn.y && 
        mouseY <= window.respawnBtn.y + window.respawnBtn.height) {
        
        console.log("Respawn button clicked!");
        window.respawnToStation();
    }
};