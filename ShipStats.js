function drawStatusBars() {
    const barWidth = 200;
    const barHeight = 20;
    const barSpacing = 30;
    const barX = 10;
    let barY = 10;

    // Health bar
    ctx.fillStyle = '#400';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#f00';
    ctx.fillRect(barX, barY, barWidth * (player.health / player.maxHealth), barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Health: ${Math.ceil(player.health)}/${player.maxHealth}`, barX + 5, barY + 15);

    // Energy bar
    barY += barSpacing;
    ctx.fillStyle = '#004';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = player.shootCooldown > 0 ? '#0066aa' : '#0af';
    ctx.fillRect(barX, barY, barWidth * (player.energy / player.maxEnergy), barHeight);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Energy: ${Math.ceil(player.energy)}/${player.maxEnergy}${player.shootCooldown > 0 ? ' (Cooling)' : ''}`, barX + 5, barY + 15);

    // Gem bar
    barY += barSpacing;
    ctx.fillStyle = '#404';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#f0f';
    
    if (player.upgradeLevel >= 4) {
        // At max level, show full bar and just gem count
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Gems: ${player.gems}`, barX + 5, barY + 15);
    } else {
        // Show progress to next level
        let nextUpgradeGems;
        switch(player.upgradeLevel) {
            case 0:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL1.gems;
                break;
            case 1:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL2.gems;
                break;
            case 2:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL3.gems;
                break;
            case 3:
                nextUpgradeGems = UPGRADE_LEVELS.LEVEL4.gems;
                break;
        }
        ctx.fillRect(barX, barY, barWidth * (player.gems / nextUpgradeGems), barHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Gems: ${player.gems}/${nextUpgradeGems}`, barX + 5, barY + 15);
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, barX, barY + 40);
}