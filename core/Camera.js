class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.target = null;
    }

    follow(target) {
        this.target = target;
    }

    update() {
        if (this.target) {
            // Smoothly follow the target
            this.x += (this.target.x - canvas.width/2 - this.x) * 0.1;
            this.y += (this.target.y - canvas.height/2 - this.y) * 0.1;
            
            // Keep camera within world bounds
            this.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, this.x));
            this.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, this.y));
        }
    }
}

// Create camera instance
const camera = new Camera();

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}