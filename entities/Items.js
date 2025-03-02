class Gem {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.amount = amount;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = (Math.random() - 0.5) * 4;
        this.friction = 0.98;
        this.attractionRadius = 250; // Increased from 150
        this.maxAttractionSpeed = 12; // Increased from 8
        this.attractionStrengthBase = 1.0; // Increased from 0.5
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        ctx.fillStyle = '#f0f';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - this.height/2);
        ctx.lineTo(screenX + this.width/2, screenY);
        ctx.lineTo(screenX, screenY + this.height/2);
        ctx.lineTo(screenX - this.width/2, screenY);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        // Check if player exists and gem is within attraction radius
        if (player) {
            const distToPlayer = distance(this.x, this.y, player.x, player.y);
            if (distToPlayer < this.attractionRadius) {
                // Calculate direction to player
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                
                // Stronger attraction force that increases more quickly as gem gets closer
                const attractionStrength = this.attractionStrengthBase * Math.pow(1 - distToPlayer / this.attractionRadius, 2);
                
                // Apply attraction force
                this.velocityX += Math.cos(angle) * attractionStrength;
                this.velocityY += Math.sin(angle) * attractionStrength;
                
                // Limit attraction speed
                const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                if (speed > this.maxAttractionSpeed) {
                    const ratio = this.maxAttractionSpeed / speed;
                    this.velocityX *= ratio;
                    this.velocityY *= ratio;
                }
            }
        }

        // Apply existing physics
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Bounce off world boundaries
        if (this.x < 0 || this.x > WORLD_WIDTH) {
            this.velocityX *= -BOUNCE;
            this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        }
        if (this.y < 0 || this.y > WORLD_HEIGHT) {
            this.velocityY *= -BOUNCE;
            this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
        }
    }
}

// Base Item class for all inventory items
class Item {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.width = options.width || 20;
        this.height = options.height || 20;
        this.name = options.name || 'Unknown Item';
        this.description = options.description || 'A mysterious item.';
        this.type = options.type || INVENTORY_SLOT_TYPES.ACCESSORY;
        this.color = options.color || '#ffffff';
        this.stats = options.stats || {};
        this.velocityX = (Math.random() - 0.5) * 3;
        this.velocityY = (Math.random() - 0.5) * 3;
        this.friction = 0.98;
        this.attractionRadius = 200;
        this.maxAttractionSpeed = 10;
        this.attractionStrengthBase = 0.8;
        this.collected = false;
    }

    draw() {
        if (this.collected) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        // Draw item background (circle)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw item border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw item icon or symbol based on type
        if (this.type === INVENTORY_SLOT_TYPES.PLATING) {
            // Draw shield/plating icon
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.width / 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === INVENTORY_SLOT_TYPES.WEAPON) {
            // Draw weapon icon (crosshair)
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX - 5, screenY);
            ctx.lineTo(screenX + 5, screenY);
            ctx.moveTo(screenX, screenY - 5);
            ctx.lineTo(screenX, screenY + 5);
            ctx.stroke();
        } else {
            // Draw accessory icon (star)
            ctx.fillStyle = '#333333';
            const starSize = this.width / 4;
            drawStar(screenX, screenY, 5, starSize, starSize / 2);
        }

        // Draw item name when mouse is hovering
        const mouseDistance = Math.sqrt(
            Math.pow(mouse.x - screenX, 2) + 
            Math.pow(mouse.y - screenY, 2)
        );
        
        if (mouseDistance < this.width) {
            // Draw tooltip
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = '14px Arial';
            const textWidth = ctx.measureText(this.name).width;
            const padding = 5;
            
            ctx.fillRect(
                screenX - textWidth / 2 - padding,
                screenY - this.height - 20,
                textWidth + padding * 2,
                20
            );
            
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, screenX, screenY - this.height - 8);
        }
    }

    update() {
        if (this.collected) return true;

        // Check if player exists and item is within attraction radius
        if (player) {
            const distToPlayer = distance(this.x, this.y, player.x, player.y);
            
            // Check for collection
            if (distToPlayer < player.radius + this.width / 2) {
                this.collected = true;
                this.collectItem();
                return true;
            }
            
            // Apply attraction when close
            if (distToPlayer < this.attractionRadius) {
                // Calculate direction to player
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                
                // Stronger attraction force that increases as item gets closer
                const attractionStrength = this.attractionStrengthBase * 
                    Math.pow(1 - distToPlayer / this.attractionRadius, 2);
                
                // Apply attraction force
                this.velocityX += Math.cos(angle) * attractionStrength;
                this.velocityY += Math.sin(angle) * attractionStrength;
                
                // Limit attraction speed
                const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
                if (speed > this.maxAttractionSpeed) {
                    const ratio = this.maxAttractionSpeed / speed;
                    this.velocityX *= ratio;
                    this.velocityY *= ratio;
                }
            }
        }

        // Apply physics
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Bounce off world boundaries
        if (this.x < 0 || this.x > WORLD_WIDTH) {
            this.velocityX *= -0.8;
            this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        }
        if (this.y < 0 || this.y > WORLD_HEIGHT) {
            this.velocityY *= -0.8;
            this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
        }

        return false;
    }

    collectItem() {
        // Add item to player's inventory
        if (player && player.inventory) {
            // Find first empty slot of matching type
            const matchingEmptySlot = player.inventory.slots.find(
                slot => slot.type === this.type && !slot.item
            );
            
            if (matchingEmptySlot) {
                matchingEmptySlot.item = {
                    name: this.name,
                    description: this.description,
                    type: this.type,
                    color: this.color,
                    stats: this.stats
                };
                
                // Show notification
                if (typeof showNotification === 'function') {
                    showNotification(`Collected: ${this.name}`);
                }
            } else {
                // No empty slot found
                if (typeof showNotification === 'function') {
                    showNotification(`No empty ${this.type} slot available`);
                }
            }
        }
    }
}

// Rusted Plating item
class RustedPlating extends Item {
    constructor(x, y) {
        super(x, y, {
            name: 'Rusted Plating',
            description: 'Old ship plating that provides minimal protection. Increases max health by 15.',
            type: INVENTORY_SLOT_TYPES.PLATING,
            color: '#8B4513', // Brown/rust color
            stats: {
                healthBonus: 15
            }
        });
    }
}

// Helper function to draw a star shape
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// Make classes globally available
window.Gem = Gem;
window.Item = Item;
window.RustedPlating = RustedPlating;