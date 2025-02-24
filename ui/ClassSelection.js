// Initialize state variables at the top of the file
window.selectedClass = null;
window.selectedShipClass = null;
window.selectedShipForAbilities = null;
window.showingAbilityUnlockScreen = false;

// Class selection UI functions
function drawClassSelection() {
    // Clear the screen first
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
    const classes = Object.entries(SHIP_CLASSES);
    const spacing = canvas.width / (classes.length + 1);
    const startY = canvas.height/2 - 100;

    classes.forEach(([className, stats], index) => {
        const x = spacing * (index + 1);
        const y = startY;
        const isUnlocked = isShipUnlocked(stats.name);
        
        // Calculate card dimensions based on content
        ctx.font = '24px Arial';
        const nameWidth = ctx.measureText(stats.name).width;
        const statsWidth = isUnlocked ? Math.max(
            ctx.measureText(`Health: ${stats.health}`).width,
            ctx.measureText(`Speed: ${stats.maxSpeed}`).width,
            ctx.measureText(`Energy: ${stats.maxEnergy}`).width
        ) : ctx.measureText(`${stats.xpRequired} XP`).width;
        const cardWidth = Math.max(nameWidth, statsWidth) + 40; // Add padding
        const cardHeight = isUnlocked ? 140 : 100; // Height based on content

        // Draw card background
        ctx.fillStyle = isUnlocked ? 
            (selectedShipClass === className ? '#2c3e50' : '#34495e') : 
            '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 8);
        ctx.fill();

        // Draw simple gray outline
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw ship preview in the center of the card
        if (isUnlocked) {
            ctx.fillStyle = stats.color;
            ctx.save();
            ctx.translate(x, y - 10);
            
            // Draw ship shape
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(-20, 15);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-20, -15);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }

        // Draw ship name and stats
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stats.name, x, y - cardHeight/2 + 30);

        if (isUnlocked) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#bdc3c7';
            ctx.fillText(`Health: ${stats.health}`, x, y + 20);
            ctx.fillText(`Speed: ${stats.maxSpeed}`, x, y + 40);
            ctx.fillText(`Energy: ${stats.maxEnergy}`, x, y + 60);
            
            // Add "Right-click to view abilities" text
            ctx.fillStyle = '#3498db';
            ctx.font = '14px Arial';
            ctx.fillText('Right-click to view abilities', x, y + cardHeight/2 - 10);
        } else {
            // Draw unlock button for locked ships
            const unlockBtnWidth = Math.min(cardWidth - 20, 80);
            const unlockBtnHeight = 30;
            const btnX = x - unlockBtnWidth/2;
            const btnY = y + 10;
            
            const canAfford = getXP() >= stats.xpRequired;
            ctx.fillStyle = canAfford ? '#2ecc71' : '#e74c3c';
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, unlockBtnWidth, unlockBtnHeight, 8);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText(`${stats.xpRequired} XP`, x, btnY + 20);
        }
    });

    // Draw ability unlock screen if showing
    if (showingAbilityUnlockScreen && selectedShipForAbilities) {
        drawAbilityUnlockScreen();
        return;
    }

    console.log('Drawing start game button...');
    
    // Draw a smaller button lower on the screen
    const startGameBtn = {
        x: canvas.width/2 - 100,
        y: canvas.height - 150,
        width: 200,
        height: 50
    };

    // Draw button background with hover effect
    ctx.fillStyle = mouse.x >= startGameBtn.x && 
                   mouse.x <= startGameBtn.x + startGameBtn.width &&
                   mouse.y >= startGameBtn.y && 
                   mouse.y <= startGameBtn.y + startGameBtn.height
                   ? '#2ecc71' : '#27ae60';  // Lighter green on hover
    ctx.beginPath();
    ctx.roundRect(startGameBtn.x, startGameBtn.y, startGameBtn.width, startGameBtn.height, 8);
    ctx.fill();

    // Draw white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('START GAME', startGameBtn.x + startGameBtn.width/2, startGameBtn.y + 33);

    // Draw selected ship name or default text above button
    ctx.font = '20px Arial';
    const displayText = selectedClass ? `Selected: ${selectedClass.name}` : 'Default: Fighter';
    ctx.fillText(displayText, startGameBtn.x + startGameBtn.width/2, startGameBtn.y - 20);

    window.startGameBtn = startGameBtn; // Store button coordinates globally
    console.log('Button drawn at:', startGameBtn);
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
    // Calculate card dimensions based on content
    ctx.font = '24px Arial';
    const nameWidth = ctx.measureText(ship.name).width;
    const statsWidth = Math.max(
        ctx.measureText(`Health: ${ship.health}`).width,
        ctx.measureText(`Speed: ${ship.maxSpeed}`).width,
        ctx.measureText(`Energy: ${ship.maxEnergy}`).width
    );
    const cardWidth = Math.max(nameWidth, statsWidth) + 60;
    const cardHeight = 180;

    // Card background
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 8);
    ctx.fill();

    // Simple gray outline
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw ship preview (triangle shape)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(x + cardWidth/2 + 30, y + cardHeight/2 - 20);
    ctx.lineTo(x + cardWidth/2 - 30, y + cardHeight/2);
    ctx.lineTo(x + cardWidth/2 - 30, y + cardHeight/2 - 40);
    ctx.closePath();
    ctx.fill();

    // Ship name
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(ship.name, x + cardWidth/2, y + 40);

    // Stats
    ctx.font = '16px Arial';
    ctx.fillStyle = '#bdc3c7';
    ctx.fillText(`Health: ${ship.health}`, x + cardWidth/2, y + cardHeight - 80);
    ctx.fillText(`Speed: ${ship.maxSpeed}`, x + cardWidth/2, y + cardHeight - 60);
    ctx.fillText(`Energy: ${ship.maxEnergy}`, x + cardWidth/2, y + cardHeight - 40);

    // Selection text
    ctx.fillStyle = '#3498db';
    ctx.font = '14px Arial';
    ctx.fillText(isBase ? 'Current' : 'Click to select', x + cardWidth/2, y + cardHeight - 10);
}

function drawAbilityCard(ability, x, y, width, height, isAbility2 = false) {
    // Calculate card dimensions based on content
    ctx.font = '24px Arial';
    const nameWidth = ctx.measureText(ability.name).width;
    const descriptionLines = wrapText(ability.description, width - 40);
    const cardWidth = Math.max(nameWidth, width) + 40;
    const cardHeight = 120 + (descriptionLines.length * 20);

    // Card background
    const isUnlocked = isAbilityUnlocked(selectedShipForAbilities, ability.name);
    ctx.fillStyle = isUnlocked ? '#2c3e50' : '#34495e';
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 8);
    ctx.fill();

    // Simple gray outline
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ability name
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(ability.name, x + cardWidth/2, y + 40);

    // Description
    ctx.font = '16px Arial';
    ctx.fillStyle = '#bdc3c7';
    descriptionLines.forEach((line, index) => {
        ctx.fillText(line, x + cardWidth/2, y + 70 + (index * 20));
    });

    // Status or unlock button
    if (isUnlocked) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '20px Arial';
        ctx.fillText('Unlocked', x + cardWidth/2, y + cardHeight - 20);
    } else {
        const btnWidth = Math.min(cardWidth - 20, 200);
        const btnHeight = 40;
        const btnX = x + cardWidth/2 - btnWidth/2;
        const btnY = y + cardHeight - btnHeight - 10;
        const xpCost = isAbility2 ? 1200 : 750;

        const canAfford = getXP() >= xpCost;
        ctx.fillStyle = canAfford ? 
            (mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
             mouse.y >= btnY && mouse.y <= btnY + btnHeight ? '#27ae60' : '#2ecc71') :
            '#c0392b';

        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Unlock (${xpCost} XP)`, x + cardWidth/2, btnY + 25);
    }
}

// Helper function to wrap text
function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    ctx.font = '16px Arial';
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width <= maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
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
    const startY = 150;

    // Check base class click
    if (mouseX >= startX && mouseX <= startX + archetypeWidth &&
        mouseY >= startY && mouseY <= startY + archetypeHeight) {
        // Just select the base class
        selectedClass = shipClass;
        selectedShipClass = selectedShipForAbilities;
        selectedClass.archetype = null;
        showingAbilityUnlockScreen = false;
        selectedShipForAbilities = null;
        showNotification('Selected Fighter', 'success');
        return;
    }

    // Check assault archetype click
    if (shipClass.archetypes && shipClass.archetypes.ASSAULT) {
        const assaultX = startX + archetypeWidth + spacing;
        if (mouseX >= assaultX && mouseX <= assaultX + archetypeWidth &&
            mouseY >= startY && mouseY <= startY + archetypeHeight) {
            // Create archetype configuration but don't start game
            const archetype = {
                ...shipClass.archetypes.ASSAULT,  // Start with the base archetype properties
                abilities: shipClass.abilities,  // Preserve abilities from base class
                energyScaling: shipClass.energyScaling,  // Preserve energy scaling
                healthRegen: shipClass.healthRegen || 0.08,  // Use base class health regen or default
                maxShootCooldown: 10,  // Faster shooting for Assault Fighter
                health: 50,  // Increased base health from 25 to 50
                shootCost: shipClass.shootCost * 2  // Double energy consumption
            };
            
            selectedClass = shipClass;
            selectedShipClass = selectedShipForAbilities;
            selectedClass.archetype = archetype;
            showingAbilityUnlockScreen = false;
            selectedShipForAbilities = null;
            showNotification('Selected Assault Fighter', 'success');
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

// Add startGame function at the end of the file
function startGame(className, archetype = null) {
    // Convert className to uppercase to match SHIP_CLASSES keys
    const classKey = className.toUpperCase();
    
    // Get the base class configuration
    const baseClass = SHIP_CLASSES[classKey];
    if (!baseClass) {
        console.error('Invalid ship class:', className);
        return;
    }
    
    // Create the final ship configuration
    let finalShipConfig;
    if (archetype) {
        finalShipConfig = {
            ...baseClass,  // Start with all base class properties
            ...archetype,  // Override with archetype properties
            // Ensure critical properties are set
            name: archetype.name || baseClass.name,
            abilities: baseClass.abilities,
            energyScaling: baseClass.energyScaling,
            healthRegen: archetype.healthRegen || baseClass.healthRegen || 0.08,
            rotationalAcceleration: archetype.rotationalAcceleration || baseClass.rotationalAcceleration,
            shootCost: archetype.shootCost || baseClass.shootCost,
            maxShootCooldown: archetype.maxShootCooldown || baseClass.maxShootCooldown,
            color: archetype.color || baseClass.color,
            // Add any missing properties
            width: baseClass.width || 30,
            height: baseClass.height || 30
        };
    } else {
        finalShipConfig = { ...baseClass };
    }
    
    // Log the ship configuration for debugging
    console.log('Starting game with ship config:', finalShipConfig);
    
    // Initialize game state
    player = null; // Clear existing player first
    enemies = [];
    asteroids = [];
    healthPacks = [];
    gems = [];
    enemyProjectiles = [];
    gameOver = false;
    score = 0;
    
    // Reset mouse state instead of reassigning
    mouse.x = 0;
    mouse.y = 0;
    mouse.isDown = false;
    mouse.rightDown = false;
    mouse.middleDown = false;
    
    // Reset keys
    Object.keys(keys).forEach(key => delete keys[key]);
    
    // Create new player with the configuration
    player = new Player(finalShipConfig);
    
    // Initialize camera
    camera.follow(player);
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    
    // Initialize wave system
    window.waveNumber = 1;
    window.enemiesRemainingInWave = Math.min(5 + window.waveNumber * 2, 25);
    window.waveStartTime = Date.now();
    window.waveTimer = 0;
    
    // Set game state AFTER initializing everything
    gameState = GAME_STATES.PLAYING;
    isPaused = false;
    
    // Increment games played when starting a new game
    incrementGamesPlayed(finalShipConfig.name);
    
    // Reset selection state
    selectedClass = null;
    selectedShipClass = null;
    selectedShipForAbilities = null;
    showingAbilityUnlockScreen = false;
}

// Make startGame globally available
window.startGame = startGame;

// Export necessary functions
window.drawClassSelection = drawClassSelection;
window.drawAbilityUnlockScreen = drawAbilityUnlockScreen;
window.handleAbilityUnlockClick = handleAbilityUnlockClick;
window.drawArchetypeCard = drawArchetypeCard;
window.startGame = startGame; 