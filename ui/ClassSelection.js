// Initialize state variables at the top of the file
window.selectedClass = null;
window.selectedShipClass = null;
window.selectedShipForAbilities = null;
window.showingAbilityUnlockScreen = false;

// Initialize global button variables at the top of the file
let startGameBtn = null;
let returnToStationBtn = null;

// Class selection UI functions
function drawClassSelection() {
    // Add a semi-transparent dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Select Your Ship', canvas.width/2, 100);

    // Draw XP
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`XP: ${window.getXP()}`, canvas.width/2, 150);

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
        const isUnlocked = window.isShipUnlocked(stats.name);
        
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

        // Draw white outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight);

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
            
            const canAfford = window.getXP() >= stats.xpRequired;
            ctx.fillStyle = canAfford ? '#2ecc71' : '#e74c3c';
            ctx.fillRect(btnX, btnY, unlockBtnWidth, unlockBtnHeight);  // Changed to fillRect
            ctx.strokeStyle = '#ffffff';
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

    // Draw a smaller button lower on the screen
    startGameBtn = {
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

    // Draw white outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(startGameBtn.x, startGameBtn.y, startGameBtn.width, startGameBtn.height);  // Changed to strokeRect

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT SHIP', startGameBtn.x + startGameBtn.width/2, startGameBtn.y + 33);

    // Draw selected ship name or default text above button
    ctx.font = '20px Arial';
    const displayText = selectedClass ? `Selected: ${selectedClass.name}` : 'Default: Fighter';
    ctx.fillText(displayText, startGameBtn.x + startGameBtn.width/2, startGameBtn.y - 20);

    // Draw "Return to Station" button at the bottom
    returnToStationBtn = {
        x: canvas.width/2 - 100,
        y: canvas.height - 80,
        width: 200,
        height: 40
    };

    // Draw button background with hover effect
    ctx.fillStyle = mouse.x >= returnToStationBtn.x && 
                   mouse.x <= returnToStationBtn.x + returnToStationBtn.width &&
                   mouse.y >= returnToStationBtn.y && 
                   mouse.y <= returnToStationBtn.y + returnToStationBtn.height
                   ? '#e74c3c' : '#c0392b';  // Lighter red on hover
    ctx.fillRect(returnToStationBtn.x, returnToStationBtn.y, returnToStationBtn.width, returnToStationBtn.height);

    // Draw white outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(returnToStationBtn.x, returnToStationBtn.y, returnToStationBtn.width, returnToStationBtn.height);

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RETURN TO STATION', returnToStationBtn.x + returnToStationBtn.width/2, returnToStationBtn.y + 25);

    window.startGameBtn = startGameBtn; // Store button coordinates globally
    window.returnToStationBtn = returnToStationBtn; // Store return button coordinates
}

function drawArchetypeCard(ship, x, y, isBase = false) {
    const circleRadius = 40;
    
    // Draw circle background
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x + circleRadius, y + circleRadius, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw white outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw ship preview
    ctx.fillStyle = ship.color;
    ctx.save();
    ctx.translate(x + circleRadius, y + circleRadius);
    
    // Draw ship shape (slightly larger than before)
    ctx.beginPath();
    ctx.moveTo(30, 0);  // Tip of ship
    ctx.lineTo(-30, 20); // Bottom wing
    ctx.lineTo(-15, 0);  // Back center
    ctx.lineTo(-30, -20); // Top wing
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // If mouse is hovering over this circle, show info card
    if (Math.hypot(mouse.x - (x + circleRadius), mouse.y - (y + circleRadius)) <= circleRadius) {
        // Draw info card next to the circle
        const cardWidth = 200;
        const cardHeight = 160;
        const cardX = x + circleRadius * 2 + 20; // Position to the right of circle
        const cardY = y;
        
        // Info card background
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        
        // Info card border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        
        // Ship name
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(ship.name, cardX + 10, cardY + 30);
        
        // Stats
        ctx.font = '16px Arial';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText(`Health: ${ship.health}`, cardX + 10, cardY + 60);
        ctx.fillText(`Speed: ${ship.maxSpeed}`, cardX + 10, cardY + 85);
        ctx.fillText(`Energy: ${ship.maxEnergy}`, cardX + 10, cardY + 110);
        
        // Selection text
        ctx.fillStyle = '#3498db';
        ctx.font = '14px Arial';
        ctx.fillText(isBase ? 'Current' : 'Click to select', cardX + 10, cardY + 140);
    }
}

function drawAbilityUnlockScreen() {
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Ship Evolution Tree', canvas.width/4, 60);
    ctx.fillText('Ship Abilities', canvas.width * 3/4, 60);

    // Draw back button
    const backBtn = {
        x: 20,
        y: 20,
        width: 80,
        height: 35
    };
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(backBtn.x, backBtn.y, backBtn.width, backBtn.height);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Back', backBtn.x + backBtn.width/2, backBtn.y + backBtn.height/2 + 6);

    const shipClass = SHIP_CLASSES[selectedShipForAbilities];
    if (!shipClass) return;

    // Left side - Archetype Tree
    const circleRadius = 40;
    const verticalSpacing = 80;

    // Position base class circle
    const startX = canvas.width/4 - circleRadius;
    const startY = 100;

    // Draw base class circle
    drawArchetypeCard(shipClass, startX, startY, true);

    // Draw connecting line from base to archetype
    if (shipClass.archetypes && shipClass.archetypes.ASSAULT) {
        // Draw simple white line connecting the circles
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX + circleRadius, startY + circleRadius * 2);
        ctx.lineTo(startX + circleRadius, startY + circleRadius * 2 + verticalSpacing);
        ctx.stroke();

        // Draw assault archetype circle below
        drawArchetypeCard(
            shipClass.archetypes.ASSAULT,
            startX,
            startY + circleRadius * 2 + verticalSpacing
        );
    }

    // Right side - Abilities
    const abilityWidth = 280;
    const abilityHeight = 160;
    const abilitySpacing = 40;

    // Get ship abilities
    const shipAbilities = new Player(SHIP_CLASSES[selectedShipForAbilities]).abilities;

    // Draw ability 1 card
    const ability1X = canvas.width * 3/4 - abilityWidth/2;
    const ability1Y = 100;
    drawAbilityCard(shipAbilities.ability1, ability1X, ability1Y, abilityWidth, abilityHeight, 1);

    // Draw ability 2 card
    const ability2X = canvas.width * 3/4 - abilityWidth/2;
    const ability2Y = ability1Y + abilityHeight + abilitySpacing;
    drawAbilityCard(shipAbilities.ability2, ability2X, ability2Y, abilityWidth, abilityHeight, 2);
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
    const isUnlocked = window.isAbilityUnlocked(selectedShipForAbilities, ability.name);
    ctx.fillStyle = isUnlocked ? '#2c3e50' : '#34495e';
    ctx.fillRect(x, y, cardWidth, cardHeight);  // Changed to fillRect

    // Gray outline
    ctx.strokeStyle = '#ffffff';
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

        const canAfford = window.getXP() >= xpCost;
        ctx.fillStyle = canAfford ? 
            (mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
             mouse.y >= btnY && mouse.y <= btnY + buttonHeight ? '#27ae60' : '#2ecc71') :
            '#c0392b';

        // Draw button as rectangle
        ctx.fillRect(btnX, btnY, btnWidth, buttonHeight);  // Changed to fillRect
        ctx.strokeStyle = '#ffffff';
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

// Add this function before handleClassSelectionClick
function tryUnlockShip(className) {
    // Get the ship class using the className key
    const shipClass = SHIP_CLASSES[className];
    
    if (!shipClass) {
        console.error(`Ship class not found: ${className}`);
        return;
    }
    
    // Get the required XP from the ship class
    const requiredXP = shipClass.xpRequired;
    const currentXP = window.getXP();
    
    if (currentXP >= requiredXP) {
        // Deduct XP and unlock the ship
        window.addXP(-requiredXP);
        window.unlockShip(shipClass.name);
        showNotification(`Unlocked ${shipClass.name}!`, 'success');
    } else {
        // Not enough XP
        showNotification(`Need ${requiredXP - currentXP} more XP to unlock ${shipClass.name}`, 'warning');
    }
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
        const isUnlocked = window.isShipUnlocked(stats.name);
        
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

    // Circle dimensions
    const circleRadius = 40;
    const verticalSpacing = 80;

    // Left side - Archetype Tree
    const startX = canvas.width/4 - circleRadius;
    const startY = 100;

    // Check base class circle click
    if (Math.hypot(mouseX - (startX + circleRadius), mouseY - (startY + circleRadius)) <= circleRadius) {
        selectedClass = shipClass;
        selectedShipClass = selectedShipForAbilities;
        selectedClass.archetype = null;
        showingAbilityUnlockScreen = false;
        selectedShipForAbilities = null;
        showNotification(`Selected ${shipClass.name}`, 'success');
        return;
    }

    // Check assault archetype circle click
    if (shipClass.archetypes && shipClass.archetypes.ASSAULT) {
        const assaultY = startY + circleRadius * 2 + verticalSpacing;
        if (Math.hypot(mouseX - (startX + circleRadius), mouseY - (assaultY + circleRadius)) <= circleRadius) {
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

    // Right side - Abilities (keep existing ability card click handling)
    const abilityWidth = 280;
    const abilityHeight = 160;
    const abilitySpacing = 40;

    const ability1X = canvas.width * 3/4 - abilityWidth/2;
    const ability1Y = 100;
    if (mouseX >= ability1X && mouseX <= ability1X + abilityWidth &&
        mouseY >= ability1Y && mouseY <= ability1Y + abilityHeight) {
        const shipAbilities = new Player(SHIP_CLASSES[selectedShipForAbilities]).abilities;
        tryUnlockAbility(shipAbilities.ability1, false);
        return;
    }

    const ability2X = canvas.width * 3/4 - abilityWidth/2;
    const ability2Y = ability1Y + abilityHeight + abilitySpacing;
    if (mouseX >= ability2X && mouseX <= ability2X + abilityWidth &&
        mouseY >= ability2Y && mouseY <= ability2Y + abilityHeight) {
        const shipAbilities = new Player(SHIP_CLASSES[selectedShipForAbilities]).abilities;
        tryUnlockAbility(shipAbilities.ability2, true);
        return;
    }
}

function tryUnlockAbility(ability, isAbility2 = false) {
    const xpCost = isAbility2 ? 1200 : 750; // Fixed XP costs
    const currentXP = window.getXP();
    
    if (currentXP < xpCost) {
        showNotification(`Need ${xpCost} XP to unlock ${ability.name}!`, 'warning');
        return;
    }

    // Spend XP
    const remainingXP = currentXP - xpCost;
    localStorage.setItem('spaceGameXP', String(remainingXP));
    
    // Unlock ability
    window.unlockAbility(selectedShipForAbilities, ability.name);
    showNotification(`${ability.name} unlocked!`, 'success');
}

// Make all functions globally available
window.drawClassSelection = drawClassSelection;
window.drawAbilityUnlockScreen = drawAbilityUnlockScreen;
window.handleAbilityUnlockClick = handleAbilityUnlockClick;
window.drawArchetypeCard = drawArchetypeCard;

// Add startGame function at the end of the file
function startGame(className, archetype = null) {
    // Create player with selected ship class
    const shipClass = SHIP_CLASSES[className];
    
    // Check if we're coming from the station and have stored ship levels
    if (window.currentZone === GAME_ZONES.STATION && window.shipLevels && window.shipLevels[shipClass.name]) {
        // Create player with the stored level
        player = new Player(shipClass);
        player.upgradeLevel = window.shipLevels[shipClass.name].upgradeLevel;
        player.gems = window.shipLevels[shipClass.name].gems;
        
        // Position player just outside the ship selection portal
        // Calculate position based on STATION.SHIP_OPENING
        const portalX = STATION.WIDTH - WALL_WIDTH;
        const portalY = STATION.HEIGHT / 2;
        
        // Position player 50 pixels to the left of the portal
        player.x = portalX - 50;
        player.y = portalY;
        
        // Return to station
        window.currentZone = GAME_ZONES.STATION;
        gameState = GAME_STATES.PLAYING;
        
        // Set camera to follow player
        camera.follow(player);
        
        showNotification(`Switched to ${shipClass.name} ship!`);
        return;
    } else {
        // Reset game state first
        if (typeof window.resetGameState === 'function') {
            window.resetGameState();
        } else {
            // Fallback if resetGameState is not available
            enemies = [];
            asteroids = [];
            healthPacks = [];
            gems = [];
            enemyProjectiles = [];
            gameOver = false;
            isPaused = false;
            score = 0;
        }
        
        // Normal game start - create player after reset
        player = new Player(shipClass);
        
        // Apply archetype if selected
        if (archetype && shipClass.archetypes && shipClass.archetypes[archetype]) {
            player.applyArchetype(shipClass.archetypes[archetype]);
        }
        
        // Start in station instead of testing zone
        window.currentZone = GAME_ZONES.STATION;
        
        // Position player just outside the ship selection portal for new games too
        const portalX = STATION.WIDTH - WALL_WIDTH;
        const portalY = STATION.HEIGHT / 2;
        
        // Position player 50 pixels to the left of the portal
        player.x = portalX - 50;
        player.y = portalY;
        
        // Set camera to follow player
        camera.follow(player);
        
        // Change game state to playing
        gameState = GAME_STATES.PLAYING;
        
        showNotification(`Starting game with ${shipClass.name} ship!`);
    }
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