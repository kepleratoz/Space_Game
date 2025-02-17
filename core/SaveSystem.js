function wipeSaveData() {
    localStorage.removeItem('spaceGameSave_1');
    localStorage.removeItem('spaceGameSaveMetadata');
    localStorage.removeItem('spaceGameWavesCleared');
    localStorage.removeItem('spaceGameGamesPlayed');
    showNotification('All save data wiped!', 'warning');
    player = null;
}

function saveGame(slotNumber = 1) {
    if (!player || gameState !== 'PLAYING') return;

    const gameData = {
        // Player data
        playerState: {
            shipClass: player.shipClass.name,
            x: player.x,
            y: player.y,
            health: player.health,
            maxHealth: player.maxHealth,
            energy: player.energy,
            maxEnergy: player.maxEnergy,
            gems: player.gems,
            upgradeLevel: player.upgradeLevel
        },
        // Game progress
        score: score,
        waveNumber: window.waveNumber,
        enemiesRemainingInWave: window.enemiesRemainingInWave,
        // Save metadata
        savedAt: Date.now(),
        lastPlayedAt: Date.now()
    };

    // Save to specific slot
    localStorage.setItem(`spaceGameSave_${slotNumber}`, JSON.stringify(gameData));
    
    // Update save metadata
    const saveMetadata = getSaveMetadata();
    saveMetadata[slotNumber] = {
        timestamp: Date.now(),
        score: score,
        waveNumber: window.waveNumber,
        shipClass: player.shipClass.name,
        upgradeLevel: player.upgradeLevel
    };
    localStorage.setItem('spaceGameSaveMetadata', JSON.stringify(saveMetadata));
    
    // Visual feedback
    showNotification('Game Saved!');
}

function loadGame(slotNumber = 1) {
    const savedData = localStorage.getItem(`spaceGameSave_${slotNumber}`);
    if (!savedData) {
        console.log('No save data found in slot', slotNumber);
        return false;
    }

    try {
        const gameData = JSON.parse(savedData);
        
        // Update last played timestamp
        gameData.lastPlayedAt = Date.now();
        localStorage.setItem(`spaceGameSave_${slotNumber}`, JSON.stringify(gameData));

        // Create player with saved ship class
        const shipClass = SHIP_CLASSES[Object.keys(SHIP_CLASSES).find(
            key => SHIP_CLASSES[key].name === gameData.playerState.shipClass
        )];
        
        if (!shipClass) {
            console.error('Invalid ship class in save data');
            return false;
        }

        player = new Player(shipClass);

        // Restore player state
        Object.assign(player, gameData.playerState);

        // Restore game progress
        score = gameData.score;
        window.waveNumber = gameData.waveNumber;
        window.enemiesRemainingInWave = gameData.enemiesRemainingInWave;

        // Reset other game objects
        enemies = [];
        asteroids = [];
        healthPacks = [];
        gems = [];
        gameOver = false;

        // Update camera
        camera.x = player.x - canvas.width / 2;
        camera.y = player.y - canvas.height / 2;

        console.log('Successfully loaded save from slot', slotNumber);
        return true;
    } catch (error) {
        console.error('Error loading save:', error);
        return false;
    }
}

function getSaveMetadata() {
    const metadata = localStorage.getItem('spaceGameSaveMetadata');
    return metadata ? JSON.parse(metadata) : {};
}

function deleteSave(slotNumber = 1) {
    localStorage.removeItem(`spaceGameSave_${slotNumber}`);
    const saveMetadata = getSaveMetadata();
    delete saveMetadata[slotNumber];
    localStorage.setItem('spaceGameSaveMetadata', JSON.stringify(saveMetadata));
}

window.addEventListener('beforeunload', () => {
    if (player && gameState === 'PLAYING') {
        saveGame(1); // Auto-save to slot 1 when closing
    }
});

function initializeSaveSystem() {
    // Try to load the save from slot 1
    if (loadGame(1)) {
        gameState = GAME_STATES.CLASS_SELECT;
        showNotification('Game loaded!', 'success');
    } else {
        // No save found, start fresh
        gameState = GAME_STATES.CLASS_SELECT;
        player = null;
    }
}

function getGamesPlayed() {
    const gamesData = localStorage.getItem('spaceGameGamesPlayed');
    return gamesData ? JSON.parse(gamesData) : {
        Fighter: 0,
        Tank: 0,
        Speedster: 0
    };
}

function incrementGamesPlayed(shipClassName) {
    const gamesData = getGamesPlayed();
    gamesData[shipClassName] = (gamesData[shipClassName] || 0) + 1;
    localStorage.setItem('spaceGameGamesPlayed', JSON.stringify(gamesData));
}

function getXP() {
    const xp = localStorage.getItem('spaceGameXP');
    return xp ? parseInt(xp) : 0;
}

function addXP(amount) {
    const currentXP = getXP();
    localStorage.setItem('spaceGameXP', currentXP + amount);
}
