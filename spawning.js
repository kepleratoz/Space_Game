function spawnObjects() {
    // Wave system variables
    if (typeof window.waveNumber === 'undefined') {
        window.waveNumber = 1;
        window.enemiesRemainingInWave = Math.min(5 + window.waveNumber * 2, 25);
        window.waveStartTime = Date.now();
        window.waveTimer = 0;
    }

    // Calculate wave timeout (1.5 minutes * wave number)
    const waveTimeout = 1.5 * 60 * 1000 * window.waveNumber;
    const timeElapsed = Date.now() - window.waveStartTime;

    // If we're between waves
    if (window.enemiesRemainingInWave <= 0 && enemies.length === 0) {
        if (window.waveTimer > 0) {
            window.waveTimer--;
            
            // Display wave information
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.fillText(`Wave ${window.waveNumber} Complete!`, canvas.width/2 - 150, canvas.height/2 - 30);
            ctx.fillText(`Next Wave in ${Math.ceil(window.waveTimer/60)}...`, canvas.width/2 - 120, canvas.height/2 + 30);
            
            // Update waves cleared when completing a wave
            if (window.waveTimer === 299) { // Just completed a wave (first frame of timer)
                updateWavesCleared(player.shipClass.name, window.waveNumber);
            }
            
            return;
        }

        // Start new wave
        window.waveNumber++;
        window.enemiesRemainingInWave = Math.min(5 + window.waveNumber * 2, 25);
        window.waveTimer = 300; // 5 seconds between waves
        window.waveStartTime = Date.now();
        
        // Spawn initial wave enemies
        const baseEnemies = Math.floor(window.waveNumber/2);
        for (let i = 0; i < baseEnemies && enemies.length < 15; i++) {
            spawnEnemy();
        }
        
        // Spawn some asteroids with each wave
        const asteroidsToSpawn = Math.min(3 + Math.floor(window.waveNumber/2), 8);
        while (asteroids.length < asteroidsToSpawn) {
            asteroids.push(new Asteroid());
        }
    } else if (timeElapsed > waveTimeout) {
        // Force next wave if time limit exceeded
        window.enemiesRemainingInWave = 0;
        enemies = [];
        return;
    }

    // During wave spawning
    if (enemies.length < 15 && Math.random() < 0.03 && window.enemiesRemainingInWave > 0) {
        spawnEnemy();
        window.enemiesRemainingInWave--;
    }

    // Health packs spawn more frequently in higher waves
    if (healthPacks.length < 3 && Math.random() < 0.005 + (window.waveNumber * 0.001)) {
        healthPacks.push(new HealthPack());
    }

    // Display current wave and time remaining
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Wave ${window.waveNumber}`, 10, canvas.height - 60);
    ctx.fillText(`Level ${player.upgradeLevel}`, 10, canvas.height - 30);
    
    const timeRemaining = Math.max(0, Math.ceil((waveTimeout - timeElapsed) / 1000));
    if (timeRemaining < 30) {
        ctx.fillStyle = '#ff0000';
    }
    ctx.fillText(`Time Remaining: ${Math.floor(timeRemaining/60)}:${(timeRemaining%60).toString().padStart(2, '0')}`, 10, canvas.height - 90);
}
function spawnEnemy() {
    // Spawn enemies away from the player
    let x, y;
    do {
        x = Math.random() * WORLD_WIDTH;
        y = Math.random() * WORLD_HEIGHT;
    } while (distance(x, y, player.x, player.y) < 400); // Minimum spawn distance from player

    // Enemy type probability changes with waves
    const rand = Math.random();
    if (window.waveNumber < 3) {
        // Early waves: More chasers
        if (rand < 0.7) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.9) {
            enemies.push(new ShooterEnemy(x, y));
        } else {
            enemies.push(new DasherEnemy(x, y));
        }
    } else if (window.waveNumber < 6) {
        // Mid waves: Balanced mix
        if (rand < 0.3) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.6) {
            enemies.push(new ShooterEnemy(x, y));
        } else if (rand < 0.8) {
            enemies.push(new DasherEnemy(x, y));
        } else if (rand < 0.9) {
            enemies.push(new BomberEnemy(x, y));
        } else {
            enemies.push(new SwarmerEnemy(x, y));
        }
    } else {
        // Later waves: More advanced enemies
        if (rand < 0.2) {
            enemies.push(new ChaserEnemy(x, y));
        } else if (rand < 0.4) {
            enemies.push(new ShooterEnemy(x, y));
        } else if (rand < 0.6) {
            enemies.push(new DasherEnemy(x, y));
        } else if (rand < 0.8) {
            enemies.push(new BomberEnemy(x, y));
        } else {
            enemies.push(new SwarmerEnemy(x, y));
        }
    }
}

function getWavesCleared() {
    const wavesData = localStorage.getItem('spaceGameWavesCleared');
    return wavesData ? JSON.parse(wavesData) : {
        Fighter: 0,
        Tank: 0,
        Speedster: 0
    };
}

function updateWavesCleared(shipClassName, waveNumber) {
    const wavesData = getWavesCleared();
    wavesData[shipClassName] = Math.max(wavesData[shipClassName], waveNumber);
    localStorage.setItem('spaceGameWavesCleared', JSON.stringify(wavesData));
}