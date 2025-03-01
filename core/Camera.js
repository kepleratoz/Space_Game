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
        if (!this.target) return; // Exit early if no target
        
        // Smoothly follow the target
        this.x += (this.target.x - canvas.width/2 - this.x) * 0.1;
        this.y += (this.target.y - canvas.height/2 - this.y) * 0.1;
        
        // Check if window.currentZone is defined
        if (typeof window.currentZone === 'undefined') {
            // Default to main game world boundaries if zone is not defined
            this.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, this.x));
            this.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, this.y));
            return;
        }
        
        // Keep camera within world bounds based on current zone
        if (window.currentZone === GAME_ZONES.TESTING) {
            // Testing zone boundaries
            this.x = Math.max(0, Math.min(TESTING_ZONE.WIDTH - canvas.width, this.x));
            this.y = Math.max(0, Math.min(TESTING_ZONE.HEIGHT - canvas.height, this.y));
        } else if (window.currentZone === GAME_ZONES.STATION) {
            // Station zone boundaries
            this.x = Math.max(0, Math.min(STATION.WIDTH - canvas.width, this.x));
            this.y = Math.max(0, Math.min(STATION.HEIGHT - canvas.height, this.y));
        } else {
            // Main game world boundaries
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