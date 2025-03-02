// GAME_ZONES is imported from constants.js

// Store decorative lines for testing zone
let testingZoneLines = [];
let wallLines = [];

// Wall constants
const WALL_WIDTH = 40;

// Add wall collision detection
function handleWallCollisions(entity) {
    // Handle different zones
    if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
        const margin = 5; // Small margin to prevent sticking
        
        // Get current zone dimensions
        const zoneWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : STATION.WIDTH;
        const zoneHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : STATION.HEIGHT;
        
        // Left wall
        if (entity.x - entity.width/2 < WALL_WIDTH) {
            entity.x = WALL_WIDTH + entity.width/2 + margin;
            entity.velocityX = Math.abs(entity.velocityX) * 0.5; // Bounce with reduced velocity
        }
        // Right wall
        if (entity.x + entity.width/2 > zoneWidth - WALL_WIDTH) {
            entity.x = zoneWidth - WALL_WIDTH - entity.width/2 - margin;
            entity.velocityX = -Math.abs(entity.velocityX) * 0.5;
        }
        // Top wall
        if (entity.y - entity.height/2 < WALL_WIDTH) {
            entity.y = WALL_WIDTH + entity.height/2 + margin;
            entity.velocityY = Math.abs(entity.velocityY) * 0.5;
        }
        // Bottom wall
        if (entity.y + entity.height/2 > zoneHeight - WALL_WIDTH) {
            entity.y = zoneHeight - WALL_WIDTH - entity.height/2 - margin;
            entity.velocityY = -Math.abs(entity.velocityY) * 0.5;
        }
    } 
    else if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
        // For Debris Field, check if entity is inside the boundary
        const entityPoint = { x: entity.x, y: entity.y };
        
        if (!window.isPointInsidePolygon(entityPoint, DEBRIS_FIELD.WALL_POINTS)) {
            // Entity is outside the boundary - find the closest point on the boundary
            const closestPoint = window.findClosestPointOnPolygon(entityPoint, DEBRIS_FIELD.WALL_POINTS);
            
            // Calculate direction vector from closest point to entity
            const dirX = entityPoint.x - closestPoint.x;
            const dirY = entityPoint.y - closestPoint.y;
            
            // Calculate distance
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);
            
            // Initialize normalized direction variables
            let normalizedDirX = 0;
            let normalizedDirY = 0;
            
            if (distance > 0) {
                // Normalize direction vector
                normalizedDirX = dirX / distance;
                normalizedDirY = dirY / distance;
                
                // Move entity inside the boundary with a small buffer
                const buffer = 5;
                entity.x = closestPoint.x + normalizedDirX * buffer;
                entity.y = closestPoint.y + normalizedDirY * buffer;
            } else {
                // Fallback if distance is zero (shouldn't happen)
                entity.x = closestPoint.x;
                entity.y = closestPoint.y;
            }
            
            // Reverse velocity (bounce off wall)
            const dotProduct = (entity.velocityX * normalizedDirX + entity.velocityY * normalizedDirY);
            if (dotProduct < 0) {
                entity.velocityX -= 2 * dotProduct * normalizedDirX;
                entity.velocityY -= 2 * dotProduct * normalizedDirY;
                
                // Reduce velocity (friction)
                entity.velocityX *= 0.5;
                entity.velocityY *= 0.5;
            }
        }
    }
}

// Make handleWallCollisions available globally
window.handleWallCollisions = handleWallCollisions;

// Generate wall decorations
function generateWallLines() {
    wallLines = [];
    const wallWidth = 40;
    
    // One line for each wall
    // Top wall
    wallLines.push({
        points: [
            { x: TESTING_ZONE.WIDTH * 0.3, y: wallWidth/2 },
            { x: TESTING_ZONE.WIDTH * 0.7, y: wallWidth/2 }
        ]
    });
    
    // Right wall
    wallLines.push({
        points: [
            { x: TESTING_ZONE.WIDTH - wallWidth/2, y: TESTING_ZONE.HEIGHT * 0.3 },
            { x: TESTING_ZONE.WIDTH - wallWidth/2, y: TESTING_ZONE.HEIGHT * 0.7 }
        ]
    });
    
    // Bottom wall
    wallLines.push({
        points: [
            { x: TESTING_ZONE.WIDTH * 0.7, y: TESTING_ZONE.HEIGHT - wallWidth/2 },
            { x: TESTING_ZONE.WIDTH * 0.3, y: TESTING_ZONE.HEIGHT - wallWidth/2 }
        ]
    });
    
    // Left wall
    wallLines.push({
        points: [
            { x: wallWidth/2, y: TESTING_ZONE.HEIGHT * 0.7 },
            { x: wallWidth/2, y: TESTING_ZONE.HEIGHT * 0.3 }
        ]
    });
}

// Generate organized grid-like lines for testing zone
function generateTestingZoneLines() {
    testingZoneLines = [];
    generateWallLines();
    
    // Create a finer grid for lines to follow
    const gridSize = TESTING_ZONE.WIDTH / 8; // 8x8 grid for more granular paths
    
    // Generate one line per major cell (4x4)
    const cellSize = TESTING_ZONE.WIDTH / 4;
    
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const line = {
                points: [],
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0
            };
            
            // Start point is on a grid intersection
            const startGridX = col * 2; // Convert to fine grid coordinates
            const startGridY = row * 2;
            line.startX = startGridX * gridSize + gridSize;
            line.startY = startGridY * gridSize + gridSize;
            
            // Create path with 1-2 turns
            let currentX = line.startX;
            let currentY = line.startY;
            line.points.push({x: currentX, y: currentY});
            
            // Randomly decide if we make one or two turns
            const turns = Math.random() < 0.5 ? 1 : 2;
            
            for (let turn = 0; turn < turns; turn++) {
                // Decide direction: 0 = horizontal, 1 = vertical
                const direction = Math.random() < 0.5 ? 0 : 1;
                
                // Calculate how far we can move in this direction
                let moveDistance;
                if (direction === 0) { // horizontal
                    // Move 1-3 grid cells
                    moveDistance = gridSize * (1 + Math.floor(Math.random() * 3));
                    // Randomly decide to go left or right
                    if (Math.random() < 0.5) moveDistance *= -1;
                    currentX += moveDistance;
                } else { // vertical
                    // Move 1-3 grid cells
                    moveDistance = gridSize * (1 + Math.floor(Math.random() * 3));
                    // Randomly decide to go up or down
                    if (Math.random() < 0.5) moveDistance *= -1;
                    currentY += moveDistance;
                }
                
                // Keep within bounds (with margin for walls)
                const wallMargin = 50;
                currentX = Math.max(wallMargin, Math.min(TESTING_ZONE.WIDTH - wallMargin, currentX));
                currentY = Math.max(wallMargin, Math.min(TESTING_ZONE.HEIGHT - wallMargin, currentY));
                
                // Add turn point
                line.points.push({x: currentX, y: currentY});
            }
            
            // Set end point
            line.endX = currentX;
            line.endY = currentY;
            
            testingZoneLines.push(line);
        }
    }
}

// Draw testing zone background
function drawTestingZoneBackground() {
    // Fill the entire visible area with black first, accounting for camera position
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width + Math.abs(camera.x), canvas.height + Math.abs(camera.y));
    
    // Additional black rectangles to ensure coverage
    ctx.fillRect(camera.x, camera.y, TESTING_ZONE.WIDTH + Math.abs(camera.x), TESTING_ZONE.HEIGHT + Math.abs(camera.y));
    ctx.fillRect(-Math.abs(camera.x), -Math.abs(camera.y), 
                 TESTING_ZONE.WIDTH + Math.abs(camera.x) * 2, 
                 TESTING_ZONE.HEIGHT + Math.abs(camera.y) * 2);

    // Draw the testing zone area
    ctx.save();
    
    // Move to camera position
    ctx.translate(-camera.x, -camera.y);
    
    // Draw walls with more gray color
    ctx.fillStyle = '#d8d8d8';
    // Top wall
    ctx.fillRect(0, 0, TESTING_ZONE.WIDTH, WALL_WIDTH);
    // Right wall
    ctx.fillRect(TESTING_ZONE.WIDTH - WALL_WIDTH, 0, WALL_WIDTH, TESTING_ZONE.HEIGHT);
    // Bottom wall
    ctx.fillRect(0, TESTING_ZONE.HEIGHT - WALL_WIDTH, TESTING_ZONE.WIDTH, WALL_WIDTH);
    // Left wall
    ctx.fillRect(0, 0, WALL_WIDTH, TESTING_ZONE.HEIGHT);

    // Create a clipping region for the testing zone interior
    ctx.beginPath();
    ctx.rect(WALL_WIDTH, WALL_WIDTH, 
             TESTING_ZONE.WIDTH - WALL_WIDTH * 2, TESTING_ZONE.HEIGHT - WALL_WIDTH * 2);
    ctx.clip();

    // Fill light gray background
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(WALL_WIDTH, WALL_WIDTH, 
                TESTING_ZONE.WIDTH - WALL_WIDTH * 2, TESTING_ZONE.HEIGHT - WALL_WIDTH * 2);

    // Draw decorative lines
    ctx.strokeStyle = '#4287f5'; // Light blue
    ctx.lineWidth = TESTING_ZONE.LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    testingZoneLines.forEach(line => {
        // Draw straight line segments
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        
        // Draw each segment
        for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.stroke();

        // Draw hollow circles at start and end
        ctx.fillStyle = '#d0d0d0'; // Same as background color
        ctx.strokeStyle = '#4287f5';
        line.points.forEach((point, idx) => {
            if (idx === 0 || idx === line.points.length - 1) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, TESTING_ZONE.CIRCLE_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        });
    });

    ctx.restore();
    
    // Draw wall outlines
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, TESTING_ZONE.WIDTH, TESTING_ZONE.HEIGHT);
    
    // Draw decorative lines on walls
    ctx.strokeStyle = '#4287f5';
    ctx.lineWidth = TESTING_ZONE.LINE_WIDTH;
    ctx.lineCap = 'round';
    
    wallLines.forEach(line => {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        ctx.lineTo(line.points[1].x, line.points[1].y);
        ctx.stroke();

        // Draw hollow circles at ends
        ctx.fillStyle = '#d8d8d8'; // Same as wall color
        ctx.strokeStyle = '#4287f5';
        line.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, TESTING_ZONE.CIRCLE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    });
    ctx.restore();
}

// Current zone tracker
if (typeof window.currentZone === 'undefined') {
    window.currentZone = GAME_ZONES.TESTING;
    generateTestingZoneLines(); // Generate initial lines
    window.lastSpawnTime = Date.now(); // Track last spawn time
    window.enemiesKilledInTestingZone = 0; // Track enemies killed in testing zone
}

function spawnObjects() {
    // Handle wall collisions for all entities in testing zone or station
    if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
        if (player) handleWallCollisions(player);
        enemies.forEach(enemy => handleWallCollisions(enemy));
        if (player) {
            // Get current zone dimensions
            const zoneWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : STATION.WIDTH;
            const zoneHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : STATION.HEIGHT;
            
            // Handle laser collisions with walls
            player.lasers = player.lasers.filter(laser => {
                const hitWall = (
                    laser.x - laser.width/2 < WALL_WIDTH ||
                    laser.x + laser.width/2 > zoneWidth - WALL_WIDTH ||
                    laser.y - laser.height/2 < WALL_WIDTH ||
                    laser.y + laser.height/2 > zoneHeight - WALL_WIDTH
                );
                return !hitWall;
            });
            
            // Handle enemy projectile collisions with walls
            enemies.forEach(enemy => {
                if (enemy.projectiles) {
                    enemy.projectiles = enemy.projectiles.filter(projectile => {
                        const hitWall = (
                            projectile.x - projectile.width/2 < WALL_WIDTH ||
                            projectile.x + projectile.width/2 > zoneWidth - WALL_WIDTH ||
                            projectile.y - projectile.height/2 < WALL_WIDTH ||
                            projectile.y + projectile.height/2 > zoneHeight - WALL_WIDTH
                        );
                        return !hitWall;
                    });
                }
            });
        }
    } else if (window.currentZone === GAME_ZONES.DEBRIS_FIELD && player) {
        // For Debris Field, check if player's lasers and enemy projectiles are inside the boundary
        player.lasers = player.lasers.filter(laser => {
            return window.isPointInsidePolygon({ x: laser.x, y: laser.y }, DEBRIS_FIELD.WALL_POINTS);
        });
        
        // Handle enemy projectile collisions with Debris Field walls
        enemies.forEach(enemy => {
            if (enemy.projectiles) {
                enemy.projectiles = enemy.projectiles.filter(projectile => {
                    return window.isPointInsidePolygon({ x: projectile.x, y: projectile.y }, DEBRIS_FIELD.WALL_POINTS);
                });
            }
        });
    }

    // Testing Zone spawn logic
    if (window.currentZone === GAME_ZONES.TESTING) {
        const currentTime = Date.now();
        const timeSinceLastSpawn = currentTime - window.lastSpawnTime;
        
        // Check if there's a Sentry enemy
        const hasSentry = enemies.some(enemy => enemy instanceof SentryEnemy);
        
        // Only spawn if no Sentry is present
        if (!hasSentry) {
            // Randomly decide to spawn a Sentry (10% chance) or regular enemies
            const shouldSpawnSentry = Math.random() < 0.1 && timeSinceLastSpawn >= 7000 && enemies.length < 15;
            
            if (shouldSpawnSentry) {
                spawnSentry();
                window.lastSpawnTime = currentTime;
            } 
            // Regular enemy spawn logic (only if no Sentry)
            else if (timeSinceLastSpawn >= 7000 && enemies.length < 15) {
                spawnEnemy();
                window.lastSpawnTime = currentTime;
            }
        }
        
        // Check if we've killed enough enemies to transition to main game
        if (window.enemiesKilledInTestingZone >= 20) {
            window.currentZone = GAME_ZONES.STATION;
            showNotification('Testing Zone Complete! Entering Station...');
            
            // Reset player position for station
            player.x = STATION.WIDTH / 2;
            player.y = STATION.HEIGHT / 2;
            
            // Change game state to station
            gameState = GAME_STATES.STATION;
        }
        return;
    }

    // Wave system variables
    if (typeof window.waveNumber === 'undefined') {
        window.waveNumber = 1;
        window.enemiesRemainingInWave = window.currentZone === GAME_ZONES.TESTING ? 10 : 7 + (window.waveNumber - 1) * 2;
        window.waveStartTime = Date.now();
        window.waveTimer = 0;
    }

    // If we're in testing zone and completed it, transition to main game
    if (window.currentZone === GAME_ZONES.TESTING && window.enemiesRemainingInWave <= 0 && enemies.length === 0) {
        window.currentZone = GAME_ZONES.MAIN;
        window.waveNumber = 1;
        window.enemiesRemainingInWave = 7 + (window.waveNumber - 1) * 2;
        window.waveStartTime = Date.now();
        window.waveTimer = 300; // 5 seconds before first main game wave
        showNotification('Testing Zone Complete! Starting Main Game...');
        
        // Reset player position for main game
        player.x = WORLD_WIDTH / 2;
        player.y = WORLD_HEIGHT / 2;
        return;
    }

    // Calculate wave timeout (1.5 minutes * wave number) - only for main game
    const waveTimeout = window.currentZone === GAME_ZONES.MAIN ? 1.5 * 60 * 1000 * window.waveNumber : Infinity;
    const timeElapsed = Date.now() - window.waveStartTime;

    // If we're between waves (only applies to main game)
    if (window.currentZone === GAME_ZONES.MAIN && window.enemiesRemainingInWave <= 0 && enemies.length === 0) {
        if (window.waveTimer > 0) {
            window.waveTimer--;
            
            // Display wave and zone information
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
        window.enemiesRemainingInWave = 7 + (window.waveNumber - 1) * 2;
        window.waveTimer = 300; // 5 seconds between waves
        window.waveStartTime = Date.now();
        
        // Spawn initial wave enemies
        const baseEnemies = Math.floor(window.waveNumber/2);
        for (let i = 0; i < baseEnemies; i++) {
            spawnEnemy();
        }
        
        // Spawn some asteroids with each wave
        const asteroidsToSpawn = Math.min(3 + Math.floor(window.waveNumber/2), 8);
        while (asteroids.length < asteroidsToSpawn) {
            asteroids.push(new Asteroid());
        }
    } else if (window.currentZone === GAME_ZONES.MAIN && timeElapsed > waveTimeout) {
        // Force next wave if time limit exceeded (main game only)
        window.enemiesRemainingInWave = 0;
        enemies = [];
        return;
    }

    // During wave spawning
    if (Math.random() < 0.03 && window.enemiesRemainingInWave > 0) {
        spawnEnemy();
        window.enemiesRemainingInWave--;
    }

    // Health packs spawn more frequently in higher waves (main game only)
    if (window.currentZone === GAME_ZONES.MAIN && healthPacks.length < 3 && Math.random() < (0.005 + (window.waveNumber * 0.001)) / 8) {
        healthPacks.push(new HealthPack());
    }

    // Display current wave, zone, and time remaining
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const margin = 10;
    const bottomMargin = 30;
    
    // Draw wave, zone, and level info at bottom left
    ctx.fillText(`Zone: ${window.currentZone}`, margin, canvas.height - bottomMargin);
    ctx.fillText(`Wave ${window.waveNumber}`, margin, canvas.height - bottomMargin * 2);
    ctx.fillText(`Level ${player.upgradeLevel}`, margin, canvas.height - bottomMargin * 3);
    
    // Only show time remaining in main game
    if (window.currentZone === GAME_ZONES.MAIN) {
        const timeRemaining = Math.max(0, Math.ceil((waveTimeout - timeElapsed) / 1000));
        if (timeRemaining < 30) {
            ctx.fillStyle = '#ff0000';
        }
        ctx.fillText(`Time: ${Math.floor(timeRemaining/60)}:${(timeRemaining%60).toString().padStart(2, '0')}`, margin, canvas.height - bottomMargin * 4);
    }
}

function spawnEnemy() {
    // Spawn enemies away from the player
    let x, y;
    const currentWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : WORLD_WIDTH;
    const currentHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : WORLD_HEIGHT;
    const wallWidth = window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION ? WALL_WIDTH : 0;
    let validPosition = false;

    // Maximum attempts to find a valid position
    const maxAttempts = 50;
    let attempts = 0;

    do {
        attempts++;
        validPosition = false;
        
        // Generate random position
        x = Math.random() * currentWidth;
        y = Math.random() * currentHeight;
        
        // Check if position is away from player
        const awayFromPlayer = distance(x, y, player.x, player.y) >= 400;
        
        // Check if position is inside boundaries based on current zone
        let insideBoundaries = true;
        
        if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
            // For Debris Field, use polygon check
            insideBoundaries = window.isPointInsidePolygon({ x, y }, DEBRIS_FIELD.WALL_POINTS);
        } else if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
            // For Testing Zone and Station, check rectangular boundaries
            insideBoundaries = (
                x >= wallWidth + 20 && 
                x <= currentWidth - wallWidth - 20 && 
                y >= wallWidth + 20 && 
                y <= currentHeight - wallWidth - 20
            );
        }
        
        validPosition = awayFromPlayer && insideBoundaries;
        
        // If we've tried too many times, just use the last position
        if (attempts >= maxAttempts) {
            console.log("Warning: Could not find valid enemy spawn position after " + maxAttempts + " attempts");
            break;
        }
    } while (!validPosition);

    // Testing Zone only spawns Chasers and Shooters
    if (window.currentZone === GAME_ZONES.TESTING) {
        const rand = Math.random();
        if (rand < 0.6) {
            enemies.push(new ChaserEnemy(x, y));
        } else {
            enemies.push(new ShooterEnemy(x, y));
        }
        return;
    }
    
    // Debris Field spawns Rogue Drones and Rogue Fighters instead of Chasers and Dashers
    if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
        const rand = Math.random();
        if (rand < 0.4) {
            enemies.push(new RogueDrone(x, y));
        } else if (rand < 0.7) {
            enemies.push(new RogueFighter(x, y));
        } else if (rand < 0.85) {
            enemies.push(new ShooterEnemy(x, y));
        } else {
            enemies.push(new BomberEnemy(x, y));
        }
        return;
    }

    // Main game enemy spawning
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

// Add this function to track enemy kills in testing zone
function trackEnemyKill() {
    if (window.currentZone === GAME_ZONES.TESTING) {
        window.enemiesKilledInTestingZone = (window.enemiesKilledInTestingZone || 0) + 1;
    }
}

// Function to spawn a Sentry enemy
function spawnSentry() {
    // Spawn Sentry away from the player
    let x, y;
    const currentWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : WORLD_WIDTH;
    const currentHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : WORLD_HEIGHT;
    const wallWidth = window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION ? WALL_WIDTH : 0;
    let validPosition = false;

    // Maximum attempts to find a valid position
    const maxAttempts = 50;
    let attempts = 0;

    do {
        attempts++;
        validPosition = false;
        
        // Generate random position
        x = Math.random() * currentWidth;
        y = Math.random() * currentHeight;
        
        // Check if position is away from player
        const awayFromPlayer = distance(x, y, player.x, player.y) >= 500;
        
        // Check if position is inside boundaries based on current zone
        let insideBoundaries = true;
        
        if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
            // For Debris Field, use polygon check
            insideBoundaries = window.isPointInsidePolygon({ x, y }, DEBRIS_FIELD.WALL_POINTS);
        } else if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
            // For Testing Zone and Station, check rectangular boundaries
            insideBoundaries = (
                x >= wallWidth + 20 && 
                x <= currentWidth - wallWidth - 20 && 
                y >= wallWidth + 20 && 
                y <= currentHeight - wallWidth - 20
            );
        }
        
        validPosition = awayFromPlayer && insideBoundaries;
        
        // If we've tried too many times, just use the last position
        if (attempts >= maxAttempts) {
            console.log("Warning: Could not find valid sentry spawn position after " + maxAttempts + " attempts");
            break;
        }
    } while (!validPosition);

    // Create the Sentry enemy
    enemies.push(new SentryEnemy(x, y));
    
    // Show notification
    showNotification('Sentry has appeared!');
}

// Make functions globally available
window.generateTestingZoneLines = generateTestingZoneLines;
window.drawTestingZoneBackground = drawTestingZoneBackground;
window.trackEnemyKill = trackEnemyKill;