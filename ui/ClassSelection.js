// Class selection UI functions
function drawClassSelection() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select Your Ship', canvas.width/2, 100);

    // Draw XP
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`XP: ${getXP()}`, canvas.width/2, 150);

    // Draw ship classes
    const shipWidth = 200;
    const shipHeight = 200;
    const spacing = 50;
    const startX = canvas.width/2 - (Object.keys(SHIP_CLASSES).length * (shipWidth + spacing))/2;
    const startY = 200;

    Object.entries(SHIP_CLASSES).forEach(([className, stats], index) => {
        const x = startX + index * (shipWidth + spacing);
        const y = startY;
        const isUnlocked = isShipUnlocked(stats.name);
        
        // Draw ship card
        ctx.fillStyle = isUnlocked ? 
            (selectedShipClass === className ? '#2c3e50' : '#34495e') : 
            '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(x, y, shipWidth, shipHeight, 8);
        ctx.fill();

        // Draw ship name and stats
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(stats.name, x + shipWidth/2, y + 40);

        if (isUnlocked) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#bdc3c7';
            ctx.fillText(`Health: ${stats.health}`, x + shipWidth/2, y + 70);
            ctx.fillText(`Speed: ${stats.maxSpeed}`, x + shipWidth/2, y + 90);
            ctx.fillText(`Energy: ${stats.maxEnergy}`, x + shipWidth/2, y + 110);
            
            // Add "Right-click to view abilities" text
            ctx.fillStyle = '#3498db';
            ctx.font = '14px Arial';
            ctx.fillText('Right-click to view abilities', x + shipWidth/2, y + 140);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '20px Arial';
            ctx.fillText('Locked', x + shipWidth/2, y + 90);
        }
    });

    // Draw ability unlock screen if showing
    if (showingAbilityUnlockScreen && selectedShipForAbilities) {
        drawAbilityUnlockScreen();
    }
}

function handleClassSelectionClick(e) {
    // Check ability unlock screen first
    if (showingAbilityUnlockScreen) {
        handleAbilityUnlockClick(e.clientX, e.clientY);
        return;
    }

    // Handle right-click for abilities
    if (e.button === 2) {
        const shipWidth = 200;
        const shipHeight = 200;
        const spacing = 50;
        const startX = canvas.width/2 - (Object.keys(SHIP_CLASSES).length * (shipWidth + spacing))/2;
        const startY = 200;

        Object.keys(SHIP_CLASSES).forEach((className, index) => {
            const x = startX + index * (shipWidth + spacing);
            const y = startY;

            if (e.clientX >= x && e.clientX <= x + shipWidth &&
                e.clientY >= y && e.clientY <= y + shipHeight) {
                if (isShipUnlocked(className)) {
                    selectedShipClass = className;
                    selectedShipForAbilities = className;
                    showingAbilityUnlockScreen = true;
                }
            }
        });
        return;
    }

    // Handle left-click for ship selection
    if (e.button === 0) {
        const shipWidth = 200;
        const shipHeight = 200;
        const spacing = 50;
        const startX = canvas.width/2 - (Object.keys(SHIP_CLASSES).length * (shipWidth + spacing))/2;
        const startY = 200;

        Object.keys(SHIP_CLASSES).forEach((className, index) => {
            const x = startX + index * (shipWidth + spacing);
            const y = startY;

            if (e.clientX >= x && e.clientX <= x + shipWidth &&
                e.clientY >= y && e.clientY <= y + shipHeight) {
                if (isShipUnlocked(className)) {
                    if (selectedClass) {
                        // If we have a selected archetype, preserve it
                        const archetype = selectedClass;
                        startGame(className, archetype);
                    } else {
                        selectedShipClass = className;
                        selectedClass = SHIP_CLASSES[className];
                        startGame(className);
                    }
                }
            }
        });
    }
}

function drawAbilityUnlockScreen() {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${SHIP_CLASSES[selectedShipForAbilities].name} Archetypes and Abilities`, canvas.width/2, 100);

    const shipClass = SHIP_CLASSES[selectedShipForAbilities];
    
    // Draw base ship
    const archetypeWidth = 200;
    const archetypeHeight = 200;
    const spacing = 50;
    const startX = canvas.width/2 - archetypeWidth - spacing/2;
    const startY = 150; // Move archetypes up

    // Draw "Archetypes" section title
    ctx.fillStyle = '#3498db';
    ctx.font = '24px Arial';
    ctx.fillText('Archetypes', canvas.width/2, startY - 10);

    // Draw base ship card
    drawArchetypeCard(shipClass, startX, startY, archetypeWidth, archetypeHeight, true);

    // Draw arrow
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX + archetypeWidth + 10, startY + archetypeHeight/2);
    ctx.lineTo(startX + archetypeWidth + spacing - 10, startY + archetypeHeight/2);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(startX + archetypeWidth + spacing - 5, startY + archetypeHeight/2);
    ctx.lineTo(startX + archetypeWidth + spacing - 15, startY + archetypeHeight/2 - 5);
    ctx.lineTo(startX + archetypeWidth + spacing - 15, startY + archetypeHeight/2 + 5);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Draw assault archetype if it exists
    if (shipClass.archetypes && shipClass.archetypes.ASSAULT) {
        drawArchetypeCard(
            shipClass.archetypes.ASSAULT,
            startX + archetypeWidth + spacing,
            startY,
            archetypeWidth,
            archetypeHeight,
            false
        );
    }

    // Draw "Abilities" section title
    ctx.fillStyle = '#3498db';
    ctx.font = '24px Arial';
    ctx.fillText('Abilities', canvas.width/2, startY + archetypeHeight + 40);

    // Draw abilities section
    const shipAbilities = new Player(SHIP_CLASSES[selectedShipForAbilities]).abilities;
    const abilityWidth = 300;
    const abilityHeight = 150;
    const abilityStartX = canvas.width/2 - abilityWidth - spacing/2;
    const abilityStartY = startY + archetypeHeight + 60;

    // Draw ability 1
    drawAbilityCard(
        shipAbilities.ability1,
        abilityStartX,
        abilityStartY,
        abilityWidth,
        abilityHeight,
        false // isAbility2 = false
    );

    // Draw ability 2
    drawAbilityCard(
        shipAbilities.ability2,
        abilityStartX + abilityWidth + spacing,
        abilityStartY,
        abilityWidth,
        abilityHeight,
        true // isAbility2 = true
    );

    // Draw close button
    const closeBtn = {
        x: canvas.width/2 - 100,
        y: canvas.height - 100,
        width: 200,
        height: 40
    };

    ctx.fillStyle = mouse.x >= closeBtn.x && mouse.x <= closeBtn.x + closeBtn.width &&
                   mouse.y >= closeBtn.y && mouse.y <= closeBtn.y + closeBtn.height
                   ? '#444' : '#333';
    ctx.beginPath();
    ctx.roundRect(closeBtn.x, closeBtn.y, closeBtn.width, closeBtn.height, 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Close', canvas.width/2, closeBtn.y + 28);
}

function drawArchetypeCard(ship, x, y, width, height, isBase = false) {
    // Card background
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();

    // Draw ship preview (triangle shape)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(x + width/2 + 30, y + height/2);
    ctx.lineTo(x + width/2 - 30, y + height/2 + 20);
    ctx.lineTo(x + width/2 - 30, y + height/2 - 20);
    ctx.closePath();
    ctx.fill();

    // Ship name
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(ship.name, x + width/2, y + 40);

    // Stats
    ctx.font = '16px Arial';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText(`Health: ${ship.health}`, x + width/2, y + height - 80);
    ctx.fillText(`Speed: ${ship.maxSpeed}`, x + width/2, y + height - 60);
    ctx.fillText(`Energy: ${ship.maxEnergy}`, x + width/2, y + height - 40);

    // Selection text
    ctx.fillStyle = '#3498db';
    ctx.font = '14px Arial';
    ctx.fillText(isBase ? 'Current' : 'Click to select', x + width/2, y + height - 10);
}

function drawAbilityCard(ability, x, y, width, height, isAbility2 = false) {
    // Card background
    const isUnlocked = isAbilityUnlocked(selectedShipForAbilities, ability.name);
    ctx.fillStyle = isUnlocked ? '#2c3e50' : '#34495e';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();

    // Ability name
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    // Measure and resize ability name if needed
    let nameSize = 24;
    while (ctx.measureText(ability.name).width > width - 40 && nameSize > 12) {
        nameSize--;
        ctx.font = `${nameSize}px Arial`;
    }
    ctx.fillText(ability.name, x + width/2, y + 40);

    // Description
    ctx.font = '16px Arial';
    ctx.fillStyle = '#bdc3c7';
    // Split description into words and create lines that fit
    const words = ability.description.split(' ');
    const lines = [];
    let currentLine = words[0];
    let descSize = 16;

    // Find the largest font size that allows text to fit in 2-3 lines
    while (descSize > 10) {
        ctx.font = `${descSize}px Arial`;
        lines.length = 0;
        currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            if (ctx.measureText(testLine).width <= width - 40) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);

        if (lines.length <= 3) break;
        descSize--;
    }

    // Draw description lines
    const lineHeight = descSize * 1.2;
    lines.forEach((line, index) => {
        ctx.fillText(line, x + width/2, y + 70 + (index * lineHeight));
    });

    // Cost or status
    if (isUnlocked) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '20px Arial';
        ctx.fillText('Unlocked', x + width/2, y + height - 30);
    } else {
        // Draw unlock button
        const btnWidth = 200;
        const btnHeight = 40;
        const btnX = x + width/2 - btnWidth/2;
        const btnY = y + height - btnHeight - 20;
        const xpCost = isAbility2 ? 1200 : 750;

        const canAfford = getXP() >= xpCost;
        ctx.fillStyle = canAfford ? 
            (mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
             mouse.y >= btnY && mouse.y <= btnY + btnHeight ? '#27ae60' : '#2ecc71') :
            '#c0392b';

        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
        ctx.fill();

        // Measure and resize unlock button text if needed
        const unlockText = `Unlock (${xpCost} XP)`;
        let btnTextSize = 20;
        ctx.font = `${btnTextSize}px Arial`;
        while (ctx.measureText(unlockText).width > btnWidth - 20 && btnTextSize > 12) {
            btnTextSize--;
            ctx.font = `${btnTextSize}px Arial`;
        }
        ctx.fillStyle = '#fff';
        ctx.fillText(unlockText, x + width/2, btnY + btnHeight/2 + btnTextSize/3);
    }
}

function handleAbilityUnlockClick(mouseX, mouseY) {
    const shipClass = SHIP_CLASSES[selectedShipForAbilities];
    
    // Check close button
    const closeBtn = {
        x: canvas.width/2 - 100,
        y: canvas.height - 100,
        width: 200,
        height: 40
    };

    if (mouseX >= closeBtn.x && mouseX <= closeBtn.x + closeBtn.width &&
        mouseY >= closeBtn.y && mouseY <= closeBtn.y + closeBtn.height) {
        showingAbilityUnlockScreen = false;
        selectedShipForAbilities = null;
        return;
    }

    // Check archetype clicks
    const archetypeWidth = 200;
    const archetypeHeight = 200;
    const spacing = 50;
    const startX = canvas.width/2 - archetypeWidth - spacing/2;
    const startY = 150; // Match the drawing position

    // Check base class click
    if (mouseX >= startX && mouseX <= startX + archetypeWidth &&
        mouseY >= startY && mouseY <= startY + archetypeHeight) {
        // Start game directly with base class
        startGame(selectedShipForAbilities);
        showingAbilityUnlockScreen = false;
        selectedShipForAbilities = null;
        return;
    }

    // Check assault archetype click
    if (shipClass.archetypes && shipClass.archetypes.ASSAULT) {
        const assaultX = startX + archetypeWidth + spacing;
        if (mouseX >= assaultX && mouseX <= assaultX + archetypeWidth &&
            mouseY >= startY && mouseY <= startY + archetypeHeight) {
            // Create archetype configuration
            const archetype = {
                ...shipClass.archetypes.ASSAULT,
                abilities: shipClass.abilities // Preserve abilities from base class
            };
            // Start game directly with archetype
            startGame(selectedShipForAbilities, archetype);
            showingAbilityUnlockScreen = false;
            selectedShipForAbilities = null;
            showNotification('Starting game as Assault Fighter!', 'success');
            return;
        }
    }

    // Check ability unlock buttons
    const abilityWidth = 300;
    const abilityHeight = 150;
    const abilityStartX = canvas.width/2 - abilityWidth - spacing/2;
    const abilityStartY = startY + archetypeHeight + 60;

    // Get ship abilities
    const shipAbilities = new Player(SHIP_CLASSES[selectedShipForAbilities]).abilities;

    // Check ability 1 unlock button
    if (!isAbilityUnlocked(selectedShipForAbilities, shipAbilities.ability1.name)) {
        const btn1 = {
            x: abilityStartX + abilityWidth/2 - 100,
            y: abilityStartY + abilityHeight - 60,
            width: 200,
            height: 40
        };

        if (mouseX >= btn1.x && mouseX <= btn1.x + btn1.width &&
            mouseY >= btn1.y && mouseY <= btn1.y + btn1.height) {
            tryUnlockAbility(shipAbilities.ability1, false);
            return;
        }
    }

    // Check ability 2 unlock button
    if (!isAbilityUnlocked(selectedShipForAbilities, shipAbilities.ability2.name)) {
        const btn2 = {
            x: abilityStartX + abilityWidth + spacing + abilityWidth/2 - 100,
            y: abilityStartY + abilityHeight - 60,
            width: 200,
            height: 40
        };

        if (mouseX >= btn2.x && mouseX <= btn2.x + btn2.width &&
            mouseY >= btn2.y && mouseY <= btn2.y + btn2.height) {
            tryUnlockAbility(shipAbilities.ability2, true);
            return;
        }
    }
}

function tryUnlockAbility(ability, isAbility2 = false) {
    const xpCost = isAbility2 ? 1200 : 750; // Fixed XP costs
    const currentXP = getXP();
    
    if (currentXP < xpCost) {
        showNotification(`Need ${xpCost} XP to unlock ${ability.name}!`, 'warning');
        return;
    }

    // Spend XP
    const remainingXP = currentXP - xpCost;
    localStorage.setItem('spaceGameXP', String(remainingXP));
    
    // Unlock ability
    unlockAbility(selectedShipForAbilities, ability.name);
    showNotification(`${ability.name} unlocked!`, 'success');
}

// Make all functions globally available
window.drawClassSelection = drawClassSelection;
window.drawAbilityUnlockScreen = drawAbilityUnlockScreen;
window.handleAbilityUnlockClick = handleAbilityUnlockClick;
window.drawArchetypeCard = drawArchetypeCard;

// Update the click handler in input.js to use the correct case
window.addEventListener('mousedown', (e) => {
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

// Add startGame function at the end of the file
function startGame(className, archetype = null) {
    // Use the archetype if provided, otherwise use stored selectedClass or base class
    const baseClass = SHIP_CLASSES[className];
    const shipConfig = archetype || selectedClass || baseClass;
    
    // Log the ship configuration for debugging
    console.log('Starting game with ship config:', shipConfig);
    
    // Reset game state
    player = new Player({
        ...baseClass, // Start with base class properties
        ...shipConfig, // Override with archetype properties if provided
        // Ensure we have the correct name
        name: archetype ? 'Assault Fighter' : baseClass.name,
        // Preserve abilities
        abilities: baseClass.abilities
    });
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
    incrementGamesPlayed(shipConfig.name);
    
    // Reset the stored archetype
    selectedClass = null;
}

// Make startGame globally available
window.startGame = startGame; 