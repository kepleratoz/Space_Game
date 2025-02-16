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
        this.attractionRadius = 150; // Radius within which gems are attracted to player
        this.maxAttractionSpeed = 8; // Maximum speed when being attracted
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
                
                // Attraction force increases as gem gets closer to player
                const attractionStrength = 0.5 * (1 - distToPlayer / this.attractionRadius);
                
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