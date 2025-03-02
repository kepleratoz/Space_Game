// Inventory System
// This file handles the inventory UI and logic

// Inventory slot types
const INVENTORY_SLOT_TYPES = {
    PLATING: 'PLATING',
    WEAPON: 'WEAPON',
    ACCESSORY: 'ACCESSORY'
};

// Inventory UI constants
const INVENTORY_UI = {
    WIDTH: 300, // Narrower width for right side panel
    HEIGHT: 600, // Taller to accommodate vertical layout
    PADDING: 20,
    SLOT_SIZE: 70, // Slightly smaller slots
    SLOT_PADDING: 15,
    TITLE_HEIGHT: 50,
    BACKGROUND_COLOR: 'rgba(80, 80, 80, 0.9)', // More gray panel
    BORDER_COLOR: '#555555', // Gray border
    TITLE_COLOR: '#ffffff',
    SLOT_COLOR: 'rgba(100, 100, 100, 0.8)', // Gray slots
    SLOT_BORDER_COLOR: '#777777', // Gray slot border
    SLOT_HOVER_COLOR: 'rgba(120, 120, 120, 0.8)',
    SLOT_SELECTED_COLOR: 'rgba(140, 140, 140, 0.8)',
    TEXT_COLOR: '#ffffff',
    DESCRIPTION_COLOR: '#cccccc', // Color for item descriptions
    MARGIN_RIGHT: 20, // Margin from right edge of screen
    BORDER_RADIUS: 5 // Less rounded corners
};

// Inventory slots configuration - vertical layout
const INVENTORY_SLOTS = [
    { type: INVENTORY_SLOT_TYPES.PLATING, name: 'Plating', x: 0, y: 0, item: null },
    { type: INVENTORY_SLOT_TYPES.WEAPON, name: 'Weapon', x: 0, y: 1, item: null },
    { type: INVENTORY_SLOT_TYPES.ACCESSORY, name: 'Accessory 1', x: 0, y: 2, item: null },
    { type: INVENTORY_SLOT_TYPES.ACCESSORY, name: 'Accessory 2', x: 0, y: 3, item: null }
];

// Track which slot is currently hovered or selected
let hoveredSlotIndex = -1;
let selectedSlotIndex = -1;

// Drag and drop variables
let isDragging = false;
let draggedItemSlotIndex = -1;
let draggedItemOffsetX = 0;
let draggedItemOffsetY = 0;
let draggedItemX = 0;
let draggedItemY = 0;

/**
 * Draw the inventory UI
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {Object} player - The player object
 */
function drawInventory(ctx, player) {
    if (!player || !player.inventory) return;
    
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    // Calculate inventory position (right side of screen)
    const inventoryX = canvasWidth - INVENTORY_UI.WIDTH - INVENTORY_UI.MARGIN_RIGHT;
    const inventoryY = (canvasHeight - INVENTORY_UI.HEIGHT) / 2;
    
    // Draw inventory background
    ctx.fillStyle = INVENTORY_UI.BACKGROUND_COLOR;
    ctx.strokeStyle = INVENTORY_UI.BORDER_COLOR;
    ctx.lineWidth = 3;
    roundRect(ctx, inventoryX, inventoryY, INVENTORY_UI.WIDTH, INVENTORY_UI.HEIGHT, INVENTORY_UI.BORDER_RADIUS, true, true);
    
    // Draw inventory title
    ctx.fillStyle = INVENTORY_UI.TITLE_COLOR;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Inventory', inventoryX + INVENTORY_UI.WIDTH / 2, inventoryY + 35);
    
    // Draw inventory slots
    const slotStartX = inventoryX + INVENTORY_UI.PADDING;
    const slotStartY = inventoryY + INVENTORY_UI.TITLE_HEIGHT + INVENTORY_UI.PADDING;
    
    player.inventory.slots.forEach((slot, index) => {
        // Skip drawing the item if it's being dragged
        const isBeingDragged = isDragging && index === draggedItemSlotIndex;
        
        const slotX = slotStartX + (slot.x * (INVENTORY_UI.SLOT_SIZE + INVENTORY_UI.SLOT_PADDING * 2));
        const slotY = slotStartY + (slot.y * (INVENTORY_UI.SLOT_SIZE + INVENTORY_UI.SLOT_PADDING * 2));
        
        // Determine slot color based on hover/selected state
        let slotColor = INVENTORY_UI.SLOT_COLOR;
        if (index === hoveredSlotIndex) {
            slotColor = INVENTORY_UI.SLOT_HOVER_COLOR;
        }
        if (index === selectedSlotIndex) {
            slotColor = INVENTORY_UI.SLOT_SELECTED_COLOR;
        }
        
        // Draw slot background
        ctx.fillStyle = slotColor;
        ctx.strokeStyle = INVENTORY_UI.SLOT_BORDER_COLOR;
        ctx.lineWidth = 2;
        roundRect(ctx, slotX, slotY, INVENTORY_UI.SLOT_SIZE, INVENTORY_UI.SLOT_SIZE, INVENTORY_UI.BORDER_RADIUS, true, true);
        
        // Draw slot name with a small background for better readability
        const labelY = slotY + INVENTORY_UI.SLOT_SIZE + 20;
        const labelWidth = ctx.measureText(slot.name).width + 20;
        const labelHeight = 20;
        
        ctx.fillStyle = 'rgba(60, 60, 60, 0.7)';
        roundRect(ctx, slotX + (INVENTORY_UI.SLOT_SIZE - labelWidth) / 2, labelY - 15, labelWidth, labelHeight, INVENTORY_UI.BORDER_RADIUS - 2, true, false);
        
        ctx.fillStyle = INVENTORY_UI.TEXT_COLOR;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(slot.name, slotX + INVENTORY_UI.SLOT_SIZE / 2, labelY);
        
        // Draw item if slot has one and it's not being dragged
        if (slot.item && !isBeingDragged) {
            // Draw item icon
            ctx.fillStyle = slot.item.color || '#ffffff';
            ctx.beginPath();
            ctx.arc(
                slotX + INVENTORY_UI.SLOT_SIZE / 2,
                slotY + INVENTORY_UI.SLOT_SIZE / 2,
                INVENTORY_UI.SLOT_SIZE / 3,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Draw item name inside the slot
            ctx.fillStyle = INVENTORY_UI.TEXT_COLOR;
            ctx.font = '12px Arial';
            ctx.fillText(slot.item.name, slotX + INVENTORY_UI.SLOT_SIZE / 2, slotY + INVENTORY_UI.SLOT_SIZE / 2 + 30);
        } else if (!slot.item) {
            // Draw "Empty" text for empty slots
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.font = 'italic 12px Arial';
            ctx.fillText('Empty', slotX + INVENTORY_UI.SLOT_SIZE / 2, slotY + INVENTORY_UI.SLOT_SIZE / 2);
        }
    });
    
    // Draw description panel for selected item
    if (selectedSlotIndex !== -1) {
        const selectedSlot = player.inventory.slots[selectedSlotIndex];
        const descPanelX = inventoryX + INVENTORY_UI.PADDING;
        const descPanelY = slotStartY + (4 * (INVENTORY_UI.SLOT_SIZE + INVENTORY_UI.SLOT_PADDING * 2)) + 10;
        const descPanelWidth = INVENTORY_UI.WIDTH - (INVENTORY_UI.PADDING * 2);
        const descPanelHeight = 120;
        
        // Draw description background
        ctx.fillStyle = 'rgba(70, 70, 70, 0.8)';
        roundRect(ctx, descPanelX, descPanelY, descPanelWidth, descPanelHeight, INVENTORY_UI.BORDER_RADIUS, true, false);
        
        // Draw item details
        ctx.textAlign = 'left';
        ctx.fillStyle = INVENTORY_UI.TITLE_COLOR;
        ctx.font = 'bold 16px Arial';
        
        if (selectedSlot.item) {
            ctx.fillText(selectedSlot.item.name, descPanelX + 10, descPanelY + 25);
            
            // Draw item stats
            ctx.font = '14px Arial';
            ctx.fillStyle = INVENTORY_UI.DESCRIPTION_COLOR;
            ctx.fillText(`Type: ${selectedSlot.type}`, descPanelX + 10, descPanelY + 50);
            
            // Show item description
            const description = selectedSlot.item.description || 'No description available.';
            
            // Word wrap the description
            const maxWidth = descPanelWidth - 20;
            const words = description.split(' ');
            let line = '';
            let y = descPanelY + 75;
            
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && i > 0) {
                    ctx.fillText(line, descPanelX + 10, y);
                    line = words[i] + ' ';
                    y += 20;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, descPanelX + 10, y);
            
            // Show stats if available
            if (selectedSlot.item.stats) {
                y += 25;
                for (const [key, value] of Object.entries(selectedSlot.item.stats)) {
                    // Format the key for display (camelCase to Title Case with spaces)
                    const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    
                    ctx.fillText(`${formattedKey}: +${value}`, descPanelX + 10, y);
                    y += 20;
                }
            }
        } else {
            ctx.fillText(`Empty ${selectedSlot.type} Slot`, descPanelX + 10, descPanelY + 25);
            ctx.font = '14px Arial';
            ctx.fillStyle = INVENTORY_UI.DESCRIPTION_COLOR;
            ctx.fillText('No item equipped', descPanelX + 10, descPanelY + 50);
            ctx.fillText('Find items during your journey', descPanelX + 10, descPanelY + 75);
        }
    }
    
    // Draw dragged item if dragging
    if (isDragging && draggedItemSlotIndex !== -1 && player.inventory.slots[draggedItemSlotIndex].item) {
        const item = player.inventory.slots[draggedItemSlotIndex].item;
        
        // Draw item icon at mouse position
        ctx.fillStyle = item.color || '#ffffff';
        ctx.beginPath();
        ctx.arc(
            draggedItemX,
            draggedItemY,
            INVENTORY_UI.SLOT_SIZE / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw item name below the icon
        ctx.fillStyle = INVENTORY_UI.TEXT_COLOR;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, draggedItemX, draggedItemY + 30);
    }
    
    // Draw instructions at the bottom
    const instructionsY = inventoryY + INVENTORY_UI.HEIGHT - 30;
    ctx.textAlign = 'center';
    ctx.fillStyle = INVENTORY_UI.DESCRIPTION_COLOR;
    ctx.font = '14px Arial';
    ctx.fillText('Press E to close inventory', inventoryX + INVENTORY_UI.WIDTH / 2, instructionsY);
}

/**
 * Handle mouse movement over the inventory
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @param {Object} player - The player object
 */
function handleInventoryMouseMove(mouseX, mouseY, player) {
    if (!player || !player.inventory) return;
    
    // Only process if in inventory state or inventory overlay state
    if (gameState !== GAME_STATES.INVENTORY && gameState !== GAME_STATES.INVENTORY_OVERLAY) return;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate inventory position (right side)
    const inventoryX = canvasWidth - INVENTORY_UI.WIDTH - INVENTORY_UI.MARGIN_RIGHT;
    const inventoryY = (canvasHeight - INVENTORY_UI.HEIGHT) / 2;
    
    // Calculate slot positions
    const slotStartX = inventoryX + INVENTORY_UI.PADDING;
    const slotStartY = inventoryY + INVENTORY_UI.TITLE_HEIGHT + INVENTORY_UI.PADDING;
    
    // Update dragged item position if dragging
    if (isDragging) {
        draggedItemX = mouseX;
        draggedItemY = mouseY;
    }
    
    // Check if mouse is over any slot
    hoveredSlotIndex = -1;
    
    player.inventory.slots.forEach((slot, index) => {
        const slotX = slotStartX + (slot.x * (INVENTORY_UI.SLOT_SIZE + INVENTORY_UI.SLOT_PADDING * 2));
        const slotY = slotStartY + (slot.y * (INVENTORY_UI.SLOT_SIZE + INVENTORY_UI.SLOT_PADDING * 2));
        
        if (
            mouseX >= slotX &&
            mouseX <= slotX + INVENTORY_UI.SLOT_SIZE &&
            mouseY >= slotY &&
            mouseY <= slotY + INVENTORY_UI.SLOT_SIZE
        ) {
            hoveredSlotIndex = index;
        }
    });
}

/**
 * Handle mouse down on the inventory
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @param {Object} player - The player object
 */
function handleInventoryMouseDown(mouseX, mouseY, player) {
    if (!player || !player.inventory) return;
    
    // Only process if in inventory state or inventory overlay state
    if (gameState !== GAME_STATES.INVENTORY && gameState !== GAME_STATES.INVENTORY_OVERLAY) return;
    
    // If a slot is hovered and it has an item, start dragging
    if (hoveredSlotIndex !== -1 && player.inventory.slots[hoveredSlotIndex].item) {
        isDragging = true;
        draggedItemSlotIndex = hoveredSlotIndex;
        draggedItemX = mouseX;
        draggedItemY = mouseY;
        
        // Select the slot
        selectedSlotIndex = hoveredSlotIndex;
    } else if (hoveredSlotIndex !== -1) {
        // If slot is empty, just select it
        selectedSlotIndex = hoveredSlotIndex;
    }
}

/**
 * Handle mouse up on the inventory
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @param {Object} player - The player object
 */
function handleInventoryMouseUp(mouseX, mouseY, player) {
    if (!player || !player.inventory) return;
    
    // Only process if in inventory state or inventory overlay state
    if (gameState !== GAME_STATES.INVENTORY && gameState !== GAME_STATES.INVENTORY_OVERLAY) return;
    
    // If dragging and hovering over a slot, try to drop the item
    if (isDragging && hoveredSlotIndex !== -1) {
        const sourceSlot = player.inventory.slots[draggedItemSlotIndex];
        const targetSlot = player.inventory.slots[hoveredSlotIndex];
        
        // Check if the target slot can accept this item type
        if (sourceSlot.item.type === targetSlot.type) {
            // Swap items between slots
            const tempItem = targetSlot.item;
            targetSlot.item = sourceSlot.item;
            sourceSlot.item = tempItem;
            
            // Apply item effects
            applyItemEffects(player);
            
            // Show notification
            if (typeof showNotification === 'function') {
                showNotification(`Equipped: ${targetSlot.item.name}`);
            }
        } else {
            // Show notification about incompatible slot
            if (typeof showNotification === 'function') {
                showNotification(`Cannot equip ${sourceSlot.item.name} in ${targetSlot.name} slot`);
            }
        }
    }
    
    // Reset dragging state
    isDragging = false;
    draggedItemSlotIndex = -1;
}

/**
 * Handle mouse click on the inventory
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @param {Object} player - The player object
 */
function handleInventoryClick(mouseX, mouseY, player) {
    if (!player || !player.inventory) return;
    
    // Only process if in inventory state or inventory overlay state
    if (gameState !== GAME_STATES.INVENTORY && gameState !== GAME_STATES.INVENTORY_OVERLAY) return;
    
    // If a slot is hovered, select it
    if (hoveredSlotIndex !== -1) {
        selectedSlotIndex = hoveredSlotIndex;
    }
}

/**
 * Apply effects from equipped items to the player
 * @param {Object} player - The player object
 */
function applyItemEffects(player) {
    if (!player || !player.inventory) return;
    
    // Reset player to base stats
    player.resetToBaseStats();
    
    // Apply effects from all equipped items
    player.inventory.slots.forEach(slot => {
        if (slot.item && slot.item.stats) {
            // Apply health bonus
            if (slot.item.stats.healthBonus) {
                player.maxHealth += slot.item.stats.healthBonus;
                // Heal player to new max health
                player.health = player.maxHealth;
            }
            
            // Apply other stat bonuses as needed
            // For example: speed, damage, energy, etc.
        }
    });
}

/**
 * Initialize the player's inventory
 * @param {Object} player - The player object
 */
function initializeInventory(player) {
    if (!player) return;
    
    // Create inventory object if it doesn't exist
    if (!player.inventory) {
        player.inventory = {
            slots: JSON.parse(JSON.stringify(INVENTORY_SLOTS)) // Deep copy of slots
        };
    }
}

/**
 * Toggle the inventory open/closed
 */
function toggleInventory() {
    if (gameState === GAME_STATES.PLAYING) {
        // Use the INVENTORY_OVERLAY state which doesn't pause the game
        gameState = GAME_STATES.INVENTORY_OVERLAY;
        // Reset hover and selection state
        hoveredSlotIndex = -1;
        selectedSlotIndex = -1;
    } else if (gameState === GAME_STATES.INVENTORY || gameState === GAME_STATES.INVENTORY_OVERLAY) {
        gameState = GAME_STATES.PLAYING;
    }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

// Make functions globally available
window.drawInventory = drawInventory;
window.handleInventoryMouseMove = handleInventoryMouseMove;
window.handleInventoryMouseDown = handleInventoryMouseDown;
window.handleInventoryMouseUp = handleInventoryMouseUp;
window.handleInventoryClick = handleInventoryClick;
window.initializeInventory = initializeInventory;
window.toggleInventory = toggleInventory;
window.applyItemEffects = applyItemEffects; 