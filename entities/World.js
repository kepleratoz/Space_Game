// Remove duplicate declarations and start with Asteroid class
class Asteroid {
    constructor() {
        this.width = 50;
        this.height = 50;
        
        // Initialize position
        this.x = 0;
        this.y = 0;
        
        // Set position based on current zone
        this.setValidPosition();
        
        // Increase initial velocity for more momentum
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.health = 50;
        this.mass = 5; // Add mass property for collision calculations
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.ramInvulnerabilityDuration = 20; // Same as enemies
        this.lastRamTime = 0;
    }
    
    // Find a valid position inside the current zone boundaries
    setValidPosition() {
        const currentWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : WORLD_WIDTH;
        const currentHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : WORLD_HEIGHT;
        const wallWidth = window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION ? WALL_WIDTH : 0;
        
        // Maximum attempts to find a valid position
        const maxAttempts = 50;
        let attempts = 0;
        let validPosition = false;
        
        do {
            attempts++;
            
            // Generate random position
            this.x = Math.random() * currentWidth;
            this.y = Math.random() * currentHeight;
            
            // Check if position is inside boundaries based on current zone
            if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
                // For Debris Field, use polygon check
                validPosition = window.isPointInsidePolygon({ x: this.x, y: this.y }, DEBRIS_FIELD.WALL_POINTS);
            } else if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
                // For Testing Zone and Station, check rectangular boundaries
                validPosition = (
                    this.x >= wallWidth + this.width/2 && 
                    this.x <= currentWidth - wallWidth - this.width/2 && 
                    this.y >= wallWidth + this.height/2 && 
                    this.y <= currentHeight - wallWidth - this.height/2
                );
            } else {
                // For main game, any position is valid
                validPosition = true;
            }
            
            // If we've tried too many times, just use the last position
            if (attempts >= maxAttempts) {
                console.log("Warning: Could not find valid asteroid position after " + maxAttempts + " attempts");
                break;
            }
        } while (!validPosition);
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some surface detail
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(5, 5, this.width/4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-10, -10, this.width/6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    update() {
        // Apply constant velocity with minimal friction
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Bounce off world boundaries with high conservation of momentum
        if (this.x < 0 || this.x > WORLD_WIDTH) {
            this.velocityX *= -0.95; // Only lose 5% velocity on bounce
            this.x = Math.max(0, Math.min(WORLD_WIDTH, this.x));
        }
        if (this.y < 0 || this.y > WORLD_HEIGHT) {
            this.velocityY *= -0.95; // Only lose 5% velocity on bounce
            this.y = Math.max(0, Math.min(WORLD_HEIGHT, this.y));
        }

        return this.health <= 0;
    }

    // Add method to handle collision response
    handleCollision(otherObject, overlap, angle) {
        // Calculate mass ratio for collision response
        const otherMass = otherObject.mass || 1;
        const totalMass = this.mass + otherMass;
        const thisRatio = this.mass / totalMass;
        const otherRatio = otherMass / totalMass;

        // Move objects apart based on mass
        this.x -= Math.cos(angle) * overlap * otherRatio;
        this.y -= Math.sin(angle) * overlap * otherRatio;
        otherObject.x += Math.cos(angle) * overlap * thisRatio;
        otherObject.y += Math.sin(angle) * overlap * thisRatio;

        // Transfer some momentum
        const relativeSpeed = Math.sqrt(
            Math.pow(this.velocityX - otherObject.velocityX, 2) +
            Math.pow(this.velocityY - otherObject.velocityY, 2)
        );

        // Heavy objects maintain more of their velocity
        const thisSpeedLoss = 0.1; // Asteroid loses very little speed
        const otherSpeedGain = 0.8; // Other object gets pushed significantly

        otherObject.velocityX = this.velocityX * otherSpeedGain;
        otherObject.velocityY = this.velocityY * otherSpeedGain;
        
        // Slightly adjust asteroid velocity
        this.velocityX *= (1 - thisSpeedLoss);
        this.velocityY *= (1 - thisSpeedLoss);
    }

    // Add method to handle taking damage
    takeDamage(amount, isRam = false) {
        const currentTime = Date.now();

        if (isRam) {
            // For ram damage, check if enough time has passed since last ram
            if (currentTime - this.lastRamTime < 250) { // 250ms minimum between ram hits
                return;
            }
            this.lastRamTime = currentTime;
        }

        if (!this.invulnerable) {
            this.health -= amount;
            this.invulnerable = true;
            this.invulnerableTime = this.ramInvulnerabilityDuration;
        }
    }
}

class HealthPack {
    constructor() {
        this.width = 20;
        this.height = 20;
        
        // Initialize position
        this.x = 0;
        this.y = 0;
        
        // Set position based on current zone
        this.setValidPosition();
        
        this.healAmount = 30;
        this.collected = false;
    }
    
    // Find a valid position inside the current zone boundaries
    setValidPosition() {
        const currentWidth = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.WIDTH : WORLD_WIDTH;
        const currentHeight = window.currentZone === GAME_ZONES.TESTING ? TESTING_ZONE.HEIGHT : WORLD_HEIGHT;
        const wallWidth = window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION ? WALL_WIDTH : 0;
        
        // Maximum attempts to find a valid position
        const maxAttempts = 50;
        let attempts = 0;
        let validPosition = false;
        
        do {
            attempts++;
            
            // Generate random position
            this.x = Math.random() * currentWidth;
            this.y = Math.random() * currentHeight;
            
            // Check if position is inside boundaries based on current zone
            if (window.currentZone === GAME_ZONES.DEBRIS_FIELD) {
                // For Debris Field, use polygon check
                validPosition = window.isPointInsidePolygon({ x: this.x, y: this.y }, DEBRIS_FIELD.WALL_POINTS);
            } else if (window.currentZone === GAME_ZONES.TESTING || window.currentZone === GAME_ZONES.STATION) {
                // For Testing Zone and Station, check rectangular boundaries
                validPosition = (
                    this.x >= wallWidth + this.width/2 && 
                    this.x <= currentWidth - wallWidth - this.width/2 && 
                    this.y >= wallWidth + this.height/2 && 
                    this.y <= currentHeight - wallWidth - this.height/2
                );
            } else {
                // For main game, any position is valid
                validPosition = true;
            }
            
            // If we've tried too many times, just use the last position
            if (attempts >= maxAttempts) {
                console.log("Warning: Could not find valid health pack position after " + maxAttempts + " attempts");
                break;
            }
        } while (!validPosition);
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if on screen
        if (screenX + this.width < 0 || screenX - this.width > canvas.width ||
            screenY + this.height < 0 || screenY - this.height > canvas.height) {
            return;
        }

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(screenX - this.width/2, screenY - this.height/2, this.width, this.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - this.height/4);
        ctx.lineTo(screenX, screenY + this.height/4);
        ctx.moveTo(screenX - this.width/4, screenY);
        ctx.lineTo(screenX + this.width/4, screenY);
        ctx.stroke();
    }
}
function drawBackground() {
    // Draw a grid pattern for better spatial awareness
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    const gridSize = 100;
    const offsetX = camera.x % gridSize;
    const offsetY = camera.y % gridSize;
    
    for (let x = -offsetX; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = -offsetY; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}
