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

    // Add right-click instruction text
    ctx.font = '16px Arial';
    ctx.fillStyle = '#3498db';
    ctx.fillText('Right-click to view abilities', canvas.width/2, 180);

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
        
        ctx.font = '16px Arial';
        const statsWidth = isUnlocked ? Math.max(
            ctx.measureText(`Health: ${stats.health}`).width,
            ctx.measureText(`Speed: ${stats.maxSpeed}`).width,
            ctx.measureText(`Energy: ${stats.maxEnergy}`).width
        ) : ctx.measureText(`${stats.xpRequired} XP`).width;

        ctx.font = '14px Arial';
        const rightClickTextWidth = ctx.measureText('Right-click to view abilities').width;
        
        const cardWidth = Math.max(nameWidth, statsWidth, rightClickTextWidth) + 40; // Add padding
        const cardHeight = isUnlocked ? 140 : 100; // Reduced height since we removed right-click text

        // Draw card background
        ctx.fillStyle = isUnlocked ? 
            (selectedShipClass === className ? '#2c3e50' : '#34495e') : 
            '#2c3e50';
        ctx.fillRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight);  // Changed to fillRect

        // Draw gray outline
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight);  // Changed to strokeRect

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
        } else {
            // Draw unlock button for locked ships
            const unlockBtnWidth = Math.min(cardWidth - 20, 80);
            const unlockBtnHeight = 30;
            const btnX = x - unlockBtnWidth/2;
            const btnY = y + 10;
            
            const canAfford = getXP() >= stats.xpRequired;
            ctx.fillStyle = canAfford ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(btnX, btnY, unlockBtnWidth, unlockBtnHeight);  // Changed to fillRect
            ctx.strokeStyle = '#95a5a6';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, unlockBtnWidth, unlockBtnHeight);  // Added outline
            
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
    ctx.fillRect(startGameBtn.x, startGameBtn.y, startGameBtn.width, startGameBtn.height);  // Changed to fillRect

    // Draw gray outline
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.strokeRect(startGameBtn.x, startGameBtn.y, startGameBtn.width, startGameBtn.height);  // Changed to strokeRect

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
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';  // Reduced from 48px
    ctx.textAlign = 'center';
    ctx.fillText('Ship Evolution Tree', canvas.width/4, 60);  // Moved up from 80
    ctx.fillText('Ship Abilities', canvas.width * 3/4, 60);

    // Draw back button
    const backBtn = {
        x: 20,
        y: 20,
        width: 80,
        height: 35
    };
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);  // Changed to fillRect
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.strokeRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);  // Added outline
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Back', backBtn.x + backBtn.width/2, backBtn.y + backBtn.height/2 + 6);

    const shipClass = SHIP_CLASSES[selectedShipForAbilities];
    if (!shipClass) return;

    // Left side - Archetype Tree
    const archetypeWidth = 280;  // Reduced from 350
    const archetypeHeight = 200;  // Reduced from 250
    const verticalSpacing = 60;  // Reduced from 100

    // Position base class card at the top of left side
    const startX = canvas.width/4 - archetypeWidth/2;
    const startY = 100;  // Reduced from 140

    // Draw base class card
    drawArchetypeCard(shipClass, startX, startY, archetypeWidth, archetypeHeight, true);

    // Draw connecting line from base to archetype
    if (shipClass.archetypes && shipClass.archetypes.ASSAULT) {
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 3;  // Reduced from 4
        ctx.beginPath();
        ctx.moveTo(startX + archetypeWidth/2, startY + archetypeHeight);
        ctx.lineTo(startX + archetypeWidth/2, startY + archetypeHeight + verticalSpacing);
        ctx.stroke();

        // Draw arrow at the end of the line
        const arrowSize = 10;  // Reduced from 15
        ctx.beginPath();
        ctx.moveTo(startX + archetypeWidth/2, startY + archetypeHeight + verticalSpacing);
        ctx.lineTo(startX + archetypeWidth/2 - arrowSize, startY + archetypeHeight + verticalSpacing - arrowSize);
        ctx.lineTo(startX + archetypeWidth/2 + arrowSize, startY + archetypeHeight + verticalSpacing - arrowSize);
        ctx.closePath();
        ctx.fillStyle = '#95a5a6';
        ctx.fill();

        // Draw assault archetype card below
        drawArchetypeCard(
            shipClass.archetypes.ASSAULT,
            startX,
            startY + archetypeHeight + verticalSpacing,
            archetypeWidth,
            archetypeHeight
        );
    }

    // Right side - Abilities
    const abilityWidth = 280;  // Reduced from 350
    const abilityHeight = 160;  // Reduced from 200
    const abilitySpacing = 40;  // Reduced from 60

    // Get ship abilities
    const shipAbilities = new Player(SHIP_CLASSES[selectedShipForAbilities]).abilities;

    // Draw ability 1 card
    const ability1X = canvas.width * 3/4 - abilityWidth/2;
    const ability1Y = 100;  // Reduced from 140
    drawAbilityCard(shipAbilities.ability1, ability1X, ability1Y, abilityWidth, abilityHeight, 1);

    // Draw ability 2 card
    const ability2X = canvas.width * 3/4 - abilityWidth/2;
    const ability2Y = ability1Y + abilityHeight + abilitySpacing;
    drawAbilityCard(shipAbilities.ability2, ability2X, ability2Y, abilityWidth, abilityHeight, 2);
}

function drawArchetypeCard(ship, x, y, width, height, isBase = false) {
    // Calculate text dimensions
    ctx.font = '24px Arial';  // Reduced from 32px
    const nameWidth = ctx.measureText(ship.name).width;
    
    ctx.font = '16px Arial';  // Reduced from 20px
    const statsWidth = Math.max(
        ctx.measureText(`Health: ${ship.health}`).width,
        ctx.measureText(`Speed: ${ship.maxSpeed}`).width,
        ctx.measureText(`Energy: ${ship.maxEnergy}`).width
    );

    ctx.font = '14px Arial';  // Reduced from 18px
    const rightClickTextWidth = ctx.measureText('Right-click to view abilities').width;

    // Calculate card dimensions based on content
    const padding = 25;  // Reduced from 40
    const verticalSpacing = 25;  // Reduced from 35
    const shipPreviewHeight = 50;  // Reduced from 70
    const cardWidth = Math.max(nameWidth, statsWidth, rightClickTextWidth) + (padding * 2);
    const cardHeight = (
        padding + // Top padding
        30 + // Name height (reduced from 40)
        shipPreviewHeight + // Ship preview
        (verticalSpacing * 3) + // Stats spacing
        verticalSpacing + // Extra spacing before selection text
        20 + // Selection text (reduced from 25)
        padding // Bottom padding
    );

    // Card background
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x, y, cardWidth, cardHeight);  // Changed to fillRect

    // Gray outline
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardWidth, cardHeight);  // Changed to strokeRect

    // Draw ship preview (triangle shape)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    const shipY = y + padding + 30 + (shipPreviewHeight/2);
    ctx.moveTo(x + cardWidth/2 + 30, shipY);  // Reduced from 40
    ctx.lineTo(x + cardWidth/2 - 30, shipY + 20);  // Reduced from 40/25
    ctx.lineTo(x + cardWidth/2 - 30, shipY - 20);
    ctx.closePath();
    ctx.fill();

    // Ship name
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';  // Reduced from 32px
    ctx.textAlign = 'center';
    ctx.fillText(ship.name, x + cardWidth/2, y + padding + 24);  // Adjusted for smaller font

    // Stats
    ctx.font = '16px Arial';  // Reduced from 20px
    ctx.fillStyle = '#bdc3c7';
    const statsY = y + padding + 30 + shipPreviewHeight + verticalSpacing;
    ctx.fillText(`Health: ${ship.health}`, x + cardWidth/2, statsY);
    ctx.fillText(`Speed: ${ship.maxSpeed}`, x + cardWidth/2, statsY + verticalSpacing);
    ctx.fillText(`Energy: ${ship.maxEnergy}`, x + cardWidth/2, statsY + (verticalSpacing * 2));

    // Selection text
    ctx.fillStyle = '#3498db';
    ctx.font = '14px Arial';  // Reduced from 18px
    const selectionY = statsY + (verticalSpacing * 3);
    ctx.fillText(isBase ? 'Current' : 'Click to select', x + cardWidth/2, selectionY);
}

function drawAbilityCard(ability, x, y, width, height, isAbility2 = false) {
    // Calculate text dimensions
    ctx.font = '24px Arial';  // Reduced from 32px
    const nameWidth = ctx.measureText(ability.name).width;
    
    // Calculate description lines and width
    ctx.font = '16px Arial';  // Reduced from 20px
    const maxLineWidth = width - 40;  // Reduced from 60
    const descriptionLines = wrapText(ability.description, maxLineWidth);
    const descriptionHeight = descriptionLines.length * 25;  // Reduced line height from 30

    // Calculate card dimensions
    const padding = 20;  // Reduced from 30
    const verticalSpacing = 20;  // Reduced from 25
    const buttonHeight = 35;  // Reduced from 50
    const cardWidth = Math.max(nameWidth + (padding * 2), width);
    const cardHeight = (
        padding +
        30 + // Name height (reduced from 40)
        verticalSpacing +
        descriptionHeight +
        verticalSpacing +
        buttonHeight +
        padding
    );

    // Card background
    const isUnlocked = isAbilityUnlocked(selectedShipForAbilities, ability.name);
    ctx.fillStyle = isUnlocked ? '#2c3e50' : '#34495e';
    ctx.fillRect(x, y, cardWidth, cardHeight);  // Changed to fillRect

    // Gray outline
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardWidth, cardHeight);  // Changed to strokeRect

    // Ability name
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';  // Reduced from 32px
    ctx.textAlign = 'center';
    ctx.fillText(ability.name, x + cardWidth/2, y + padding + 24);  // Adjusted for smaller font

    // Description
    ctx.font = '16px Arial';  // Reduced from 20px
    ctx.fillStyle = '#bdc3c7';
    descriptionLines.forEach((line, index) => {
        ctx.fillText(line, x + cardWidth/2, y + padding + 35 + verticalSpacing + (index * 25));
    });

    // Status or unlock button
    if (isUnlocked) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '18px Arial';
        ctx.fillText('Unlocked', x + cardWidth/2, y + cardHeight - padding - 10);
    } else {
        const btnWidth = Math.min(cardWidth - 40, 180);
        const btnX = x + cardWidth/2 - btnWidth/2;
        const btnY = y + cardHeight - padding - buttonHeight;
        const xpCost = isAbility2 ? 1200 : 750;

        const canAfford = getXP() >= xpCost;
        ctx.fillStyle = canAfford ? 
            (mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
             mouse.y >= btnY && mouse.y <= btnY + buttonHeight ? '#27ae60' : '#2ecc71') :
            '#c0392b';

        // Draw button as rectangle
        ctx.fillRect(btnX, btnY, btnWidth, buttonHeight);  // Changed to fillRect
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnWidth, buttonHeight);  // Added outline

        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.fillText(`Unlock (${xpCost} XP)`, x + cardWidth/2, btnY + 24);
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

// Add this function to calculate card dimensions consistently
function calculateCardDimensions(ship, isUnlocked = true) {
    // Calculate text dimensions exactly as in drawClassSelection
    ctx.font = '24px Arial';
    const nameWidth = ctx.measureText(ship.name).width;
    
    ctx.font = '16px Arial';
    const statsWidth = isUnlocked ? Math.max(
        ctx.measureText(`Health: ${ship.health}`).width,
        ctx.measureText(`Speed: ${ship.maxSpeed}`).width,
        ctx.measureText(`Energy: ${ship.maxEnergy}`).width
    ) : ctx.measureText(`${ship.xpRequired} XP`).width;

    ctx.font = '14px Arial';
    const rightClickTextWidth = ctx.measureText('Right-click to view abilities').width;
    
    // Calculate unlock button width if ship is locked
    const unlockBtnWidth = !isUnlocked ? Math.min(80, Math.max(nameWidth, statsWidth) + 40) : 0;
    
    // Calculate the maximum width needed for all content
    const contentWidth = Math.max(nameWidth, statsWidth, rightClickTextWidth, unlockBtnWidth);
    
    // Add padding to both sides (40px total padding, 20px each side)
    const cardWidth = contentWidth + 40;
    
    // Height remains the same as it was correct
    const cardHeight = isUnlocked ? 140 : 100;

    return { cardWidth, cardHeight };
}

// Update the click handler for class selection
function handleClassSelectionClick(mouseX, mouseY, isRightClick = false) {
    const classes = Object.entries(SHIP_CLASSES);
    const spacing = canvas.width / (classes.length + 1);
    const startY = canvas.height/2 - 100;

    // Check each class card
    classes.forEach(([className, stats], index) => {
        const x = spacing * (index + 1);
        const y = startY;
        const isUnlocked = isShipUnlocked(stats.name);
        
        // Calculate card dimensions exactly as in drawClassSelection
        ctx.font = '24px Arial';
        const nameWidth = ctx.measureText(stats.name).width;
        
        ctx.font = '16px Arial';
        const statsWidth = isUnlocked ? Math.max(
            ctx.measureText(`Health: ${stats.health}`).width,
            ctx.measureText(`Speed: ${stats.maxSpeed}`).width,
            ctx.measureText(`Energy: ${stats.maxEnergy}`).width
        ) : ctx.measureText(`${stats.xpRequired} XP`).width;

        ctx.font = '14px Arial';
        const rightClickTextWidth = ctx.measureText('Right-click to view abilities').width;
        
        // Calculate card dimensions exactly as in drawClassSelection
        const cardWidth = Math.max(nameWidth, statsWidth, rightClickTextWidth) + 40;
        const cardHeight = isUnlocked ? 140 : 100;
        
        // Use the exact same coordinates as in drawClassSelection
        const cardLeft = x - cardWidth/2;
        const cardTop = y - cardHeight/2;
        
        // Check if click is within card bounds using the exact same area as drawn
        if (mouseX >= cardLeft && mouseX <= cardLeft + cardWidth &&
            mouseY >= cardTop && mouseY <= cardTop + cardHeight) {
            
            if (isRightClick && isUnlocked) {
                // Handle right-click to view abilities
                selectedShipForAbilities = className;
                showingAbilityUnlockScreen = true;
            } else if (!isUnlocked) {
                // Check if click is on unlock button
                const unlockBtnWidth = Math.min(cardWidth - 20, 80);
                const unlockBtnHeight = 30;
                const btnX = x - unlockBtnWidth/2;
                const btnY = y + 10;
                
                if (mouseX >= btnX && mouseX <= btnX + unlockBtnWidth &&
                    mouseY >= btnY && mouseY <= btnY + unlockBtnHeight) {
                    tryUnlockShip(className);
                }
            } else {
                // Handle ship selection
                selectedClass = stats;
                selectedShipClass = className;
                showNotification(`Selected ${stats.name}`, 'success');
            }
            return;
        }
    });

    // Check start game button click
    if (startGameBtn && !isRightClick) {
        if (mouseX >= startGameBtn.x && mouseX <= startGameBtn.x + startGameBtn.width &&
            mouseY >= startGameBtn.y && mouseY <= startGameBtn.y + startGameBtn.height) {
            startGame(selectedShipClass || 'FIGHTER');
        }
    }
}

// Update the archetype click handler to use the exact same coordinates
function handleAbilityUnlockClick(mouseX, mouseY) {
    // Back button check
    const backBtn = {
        x: 20,
        y: 20,
        width: 80,
        height: 35
    };
    if (mouseX >= backBtn.x && mouseX <= backBtn.x + backBtn.width && 
        mouseY >= backBtn.y && mouseY <= backBtn.y + backBtn.height) {
        showingAbilityUnlockScreen = false;
        selectedShipForAbilities = null;
        return;
    }

    const shipClass = SHIP_CLASSES[selectedShipForAbilities];
    if (!shipClass) return;

    // Calculate archetype card dimensions exactly as drawn
    const archetypeWidth = 280;  // Same as in drawArchetypeCard
    const archetypeHeight = 200;  // Same as in drawArchetypeCard
    const verticalSpacing = 60;

    // Left side - Archetype Tree (use exact same coordinates as drawing)
    const startX = canvas.width/4 - archetypeWidth/2;
    const startY = 100;

    // Check base class click using exact same area as drawn
    if (mouseX >= startX && mouseX <= startX + archetypeWidth &&
        mouseY >= startY && mouseY <= startY + archetypeHeight) {
        selectedClass = shipClass;
        selectedShipClass = selectedShipForAbilities;
        selectedClass.archetype = null;
        showingAbilityUnlockScreen = false;
        selectedShipForAbilities = null;
        showNotification(`Selected ${shipClass.name}`, 'success');
        return;
    }

    // Check assault archetype click using exact same area as drawn
    if (shipClass.archetypes && shipClass.archetypes.ASSAULT) {
        const assaultY = startY + archetypeHeight + verticalSpacing;
        if (mouseX >= startX && mouseX <= startX + archetypeWidth &&
            mouseY >= assaultY && mouseY <= assaultY + archetypeHeight) {
            const archetype = {
                ...shipClass.archetypes.ASSAULT,
                abilities: shipClass.abilities,
                energyScaling: shipClass.energyScaling,
                healthRegen: shipClass.healthRegen || 0.08,
                maxShootCooldown: 10,
                health: 50,
                shootCost: shipClass.shootCost * 2
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

    // Right side - Abilities (use exact same dimensions as drawn)
    const abilityWidth = 280;
    const abilityHeight = 160;
    const abilitySpacing = 40;

    // Get ship abilities
    const shipAbilities = new Player(SHIP_CLASSES[selectedShipForAbilities]).abilities;

    // Check ability 1 click using exact same area as drawn
    const ability1X = canvas.width * 3/4 - abilityWidth/2;
    const ability1Y = 100;
    if (mouseX >= ability1X && mouseX <= ability1X + abilityWidth &&
        mouseY >= ability1Y && mouseY <= ability1Y + abilityHeight) {
        handleAbilityUnlock(shipClass.name, 1);
        return;
    }

    // Check ability 2 click using exact same area as drawn
    const ability2X = canvas.width * 3/4 - abilityWidth/2;
    const ability2Y = ability1Y + abilityHeight + abilitySpacing;
    if (mouseX >= ability2X && mouseX <= ability2X + abilityWidth &&
        mouseY >= ability2Y && mouseY <= ability2Y + abilityHeight) {
        handleAbilityUnlock(shipClass.name, 2);
        return;
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
window.handleClassSelectionClick = handleClassSelectionClick; 