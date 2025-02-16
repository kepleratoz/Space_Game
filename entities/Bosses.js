class SpinnerBoss extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.color = '#ff0000';
        this.speed = 1;
        this.health = 100;
        this.rotationSpeed = 0.01;
        this.orbitRadius = 100;
        this.orbitAngle = 0;
        this.lasers = [];
    }

    drawShape(x, y) {
        // Draw a simple circle for the boss
        ctx.beginPath();
        ctx.arc(x, y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
    }

    behavior() {
        // Rotate around the center
        this.orbitAngle += this.rotationSpeed;
        this.x = player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = player.y + Math.sin(this.orbitAngle) * this.orbitRadius;

        // Shoot lasers
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = 60; // 1 second between shots
        } else {
            this.shootCooldown--;
        }

        // Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.x += laser.velocityX;
            laser.y += laser.velocityY;

            if (laser.x < 0 || laser.x > WORLD_WIDTH || 
                laser.y < 0 || laser.y > WORLD_HEIGHT) {
                this.lasers.splice(i, 1);
            }
        }
    }

    shoot() {
        const laser = {
            x: this.x,
            y: this.y,
            velocityX: Math.cos(this.orbitAngle) * 10,
            velocityY: Math.sin(this.orbitAngle) * 10,
            width: 4,
            height: 4,
            rotation: this.orbitAngle,
            color: '#ff0000',
            damage: 10
        };
        this.lasers.push(laser);
    }

    draw() {
        super.draw();
        
        // Draw orbit circle
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, this.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw lasers
        this.lasers.forEach(laser => {
            const screenX = laser.x - camera.x;
            const screenY = laser.y - camera.y;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(laser.rotation);
            
            // Draw laser beam
            const gradient = ctx.createLinearGradient(0, 0, laser.length, 0);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, -laser.width/2, laser.length, laser.width);
            
            ctx.restore();
        });
    }
}