// Simple respawn function
function respawnToStation() {
    console.log("=== RESPAWN FUNCTION CALLED ===");
    console.log("Current game state:", gameState);
    console.log("Game over flag:", gameOver);
    
    try {
        // Set the respawn request flag for the game loop to handle
        window.respawnRequested = true;
        console.log("Set respawnRequested flag to true");
        
        // The actual respawn logic is now handled in the game loop
        // This ensures it happens at the right time in the game cycle
        
        console.log("=== RESPAWN REQUEST SENT SUCCESSFULLY ===");
    } catch (error) {
        console.error("ERROR IN RESPAWN FUNCTION:", error);
    }
}

// Make the function globally available
window.respawnToStation = respawnToStation;

// Add a direct event listener for debugging
window.addEventListener('load', function() {
    console.log("Adding direct respawn button click listener");
    
    // Wait a bit to ensure canvas and other elements are loaded
    setTimeout(function() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }
        
        console.log("Canvas found, adding direct click listener");
        
        canvas.addEventListener('click', function(e) {
            console.log("Canvas clicked at", e.clientX, e.clientY);
            
            // Only process if in game over state
            if (gameState === GAME_STATES.GAME_OVER) {
                console.log("Game is in GAME_OVER state");
                
                // Get mouse position relative to canvas
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                console.log("Adjusted click position:", mouseX, mouseY);
                console.log("Respawn button:", window.respawnBtn);
                
                // Check if click is on respawn button
                if (window.respawnBtn && 
                    mouseX >= window.respawnBtn.x && 
                    mouseX <= window.respawnBtn.x + window.respawnBtn.width && 
                    mouseY >= window.respawnBtn.y && 
                    mouseY <= window.respawnBtn.y + window.respawnBtn.height) {
                    
                    console.log("DIRECT RESPAWN BUTTON CLICK DETECTED!");
                    window.respawnToStation();
                }
            }
        });
        
        console.log("Direct click listener added successfully");
    }, 1000);
}); 