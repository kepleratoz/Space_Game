class Player {
    constructor(shipClass) {
        this.width = 40;
        this.height = 40;
        this.x = WORLD_WIDTH / 2;
        this.y = WORLD_HEIGHT / 2;
        this.rotation = 0;
        this.rotationalVelocity = 0;
        this.rotationalFriction = 0.85;
        this.maxRotationalVelocity = 0.2;
        this.shipClass = shipClass;
        this.upgradeLevel = 0;
        
        // Apply ship class stats
        this.maxHealth = shipClass.health;
        this.health = this.maxHealth;
        this.maxSpeed = shipClass.maxSpeed;
        this.acceleration = shipClass.acceleration;
        this.rotationalAcceleration = shipClass.rotationalAcceleration;
        this.shootCost = shipClass.shootCost;
        this.color = shipClass.color;
        
        // Add health regeneration rates
        this.healthRegen = shipClass.healthRegen || 0.01;
        
        this.lasers = [];
        this.energy = shipClass.maxEnergy;
        this.maxEnergy = shipClass.maxEnergy;
        this.energyRegen = shipClass.energyRegen;
        this.gems = 0;
        this.maxGems = UPGRADE_LEVELS.LEVEL1.gems;
        this.shootCooldown = 0;
        this.maxShootCooldown = shipClass.maxShootCooldown || 15;
        this.velocityX = 0;
        this.velocityY = 0;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.regularInvulnerabilityDuration = 8;
        this.ramInvulnerabilityDuration = 20;
        this.lastHitTime = 0;
        this.mouseControls = true;
        this.damageMultiplier = 1;

        // Add ability system
        this.abilities = {
            ability1: {
                name: '',
                cooldown: 0,
                maxCooldown: 0,
                duration: 0,
                remainingDuration: 0,
                active: false,
                unlocked: false,
                description: ''
            },
            ability2: {
                name: '',
                cooldown: 0,
                maxCooldown: 0,
                duration: 0,
                remainingDuration: 0,
                active: false,
                unlocked: false,
                description: ''
            }
        };

        // Set up class-specific abilities
        const abilities = {
            Fighter: {
                ability1: {
                    name: 'Reload',
                    maxCooldown: 15 * 60,
                    duration: 0,
                    description: 'Instantly restore energy'
                },
                ability2: {
                    name: 'Boost',
                    maxCooldown: 30 * 60,
                    duration: 5 * 60,
                    description: 'Increase damage output'
                }
            },
            Tank: {
                ability1: {
                    name: 'Sentry',
                    maxCooldown: 25 * 60,
                    duration: 5 * 60,
                    description: 'Reduce speed but increase damage and energy regen'
                },
                ability2: {
                    name: 'Storm',
                    maxCooldown: 35 * 60,
                    duration: 1,
                    description: 'Release a devastating circular barrage'
                }
            },
            Speedster: {
                ability1: {
                    name: 'Absolute Control',
                    maxCooldown: 20 * 60,
                    duration: 5 * 60,
                    description: 'Greatly increase maneuverability'
                },
                ability2: {
                    name: 'Squadron',
                    maxCooldown: 35 * 60,
                    duration: 10 * 60,
                    description: 'Deploy two wingman clones'
                }
            },
            Sniper: {
                ability1: {
                    name: 'Warp Drive',
                    maxCooldown: 10 * 60,
                    duration: 3 * 60,
                    description: 'Teleport to cursor location'
                },
                ability2: {
                    name: 'Deathray',
                    maxCooldown: 40 * 60,
                    duration: 5 * 60,
                    description: 'Fire a devastating beam of concentrated energy'
                }
            },
            Rammer: {
                ability1: {
                    name: 'Charge Up',
                    maxCooldown: 600,
                    duration: 0,
                    description: 'Gain 3 dash charges for powerful ramming attacks'
                },
                ability2: {
                    name: 'Fortify',
                    maxCooldown: 300,
                    duration: 300,
                    description: 'Gain 45% damage reduction and double contact damage'
                }
            }
        };

        // Apply class-specific abilities
        if (abilities[shipClass.name]) {
            const classAbilities = abilities[shipClass.name];
            
            // Set ability 1
            Object.assign(this.abilities.ability1, classAbilities.ability1, {
                unlocked: isAbilityUnlocked(shipClass.name.toUpperCase(), classAbilities.ability1.name),
                cooldown: 0,
                remainingDuration: 0,
                active: false
            });
            
            // Set ability 2
            Object.assign(this.abilities.ability2, classAbilities.ability2, {
                unlocked: isAbilityUnlocked(shipClass.name.toUpperCase(), classAbilities.ability2.name),
                cooldown: 0,
                remainingDuration: 0,
                active: false
            });
        }

        // Add Rammer-specific properties
        if (shipClass.name === 'Rammer') {
            this.dashCharges = 0;
            this.maxDashCharges = 3;
            this.isDashing = false;
            this.dashDuration = 0;
            this.maxDashDuration = 25;
            this.chargedDashSpeed = 20;
            this.chargedDashDamage = 60;
            this.contactDamageMultiplier = 1;
            this.damageReduction = 0;
        }

        // Add Sniper-specific properties
        if (shipClass.name === 'Sniper') {
            this.isViewportMode = false;
            this.viewportEnergyCost = 5/60; // 5 energy per second (divided by 60 for per-frame cost)
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = this.invulnerable ? this.color + '88' : this.color;
        
        // Check if this is the Assault Fighter archetype
        if (this.shipClass.name === 'Assault Fighter') {
            // Assault Fighter design - aggressive and compact
            ctx.beginPath();
            ctx.moveTo(this.width / 2, 0);
            ctx.lineTo(-this.width / 4, this.height / 3);
            ctx.lineTo(-this.width / 3, 0);
            ctx.lineTo(-this.width / 4, -this.height / 3);
            ctx.closePath();
            ctx.fill();
        }
        // Class-specific ship designs based on upgrade level
        else if (this.shipClass.name === 'Fighter') {
            if (this.upgradeLevel === 0) {
                // Basic fighter - sleek and pointed
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - dual wing design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 3);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(0, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - quad wing design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 3);
                ctx.lineTo(-this.width / 3, this.height / 2);
                ctx.lineTo(-this.width / 2, 0);
                ctx.lineTo(-this.width / 3, -this.height / 2);
                ctx.lineTo(this.width / 4, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - advanced fighter with multiple cannons
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 3);
                ctx.lineTo(0, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(0, -this.height / 2);
                ctx.lineTo(this.width / 3, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            }
        } else if (this.shipClass.name === 'Tank') {
            if (this.upgradeLevel === 0) {
                // Basic tank - wide and sturdy
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 4, -this.height / 2);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - reinforced hull
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 3, -this.height / 2);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - heavy armor
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 2, -this.height / 2);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - fortress design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, this.height / 2);
                ctx.lineTo(-this.width / 2, -this.height / 2);
                ctx.lineTo(this.width / 2, -this.height / 2);
                ctx.closePath();
                ctx.fill();
                
                // Add armor plates
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        } else if (this.shipClass.name === 'Speedster') {
            if (this.upgradeLevel === 0) {
                // Basic speedster - small and agile
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - streamlined design
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 4);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(0, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - aerodynamic form
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 4);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.lineTo(this.width / 4, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - high-tech racer
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 4);
                ctx.lineTo(0, this.height / 3);
                ctx.lineTo(-this.width / 2, this.height / 4);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 4);
                ctx.lineTo(0, -this.height / 3);
                ctx.lineTo(this.width / 3, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            }
        } else if (this.shipClass.name === 'Sniper') {
            if (this.upgradeLevel === 0) {
                // Basic sniper - slow and powerful
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - improved accuracy
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 4);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(0, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - enhanced range
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 4);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.lineTo(this.width / 4, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - master sniper
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 4);
                ctx.lineTo(0, this.height / 3);
                ctx.lineTo(-this.width / 2, this.height / 4);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 4);
                ctx.lineTo(0, -this.height / 3);
                ctx.lineTo(this.width / 3, -this.height / 4);
                ctx.closePath();
                ctx.fill();
            }
        } else if (this.shipClass.name === 'Rammer') {
            if (this.upgradeLevel === 0) {
                // Basic rammer - sharp and aggressive
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(0, this.height / 3);
                ctx.lineTo(-this.width / 4, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 4, -this.height / 3);
                ctx.lineTo(0, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 1) {
                // Level 1 - reinforced ram
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 4, this.height / 3);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.lineTo(this.width / 4, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else if (this.upgradeLevel === 2) {
                // Level 2 - armored ram
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, 0);
                ctx.lineTo(-this.width / 2, -this.height / 3);
                ctx.lineTo(this.width / 3, -this.height / 3);
                ctx.closePath();
                ctx.fill();
            } else {
                // Level 3+ - ultimate ram
                ctx.beginPath();
                ctx.moveTo(this.width / 2, 0);
                ctx.lineTo(this.width / 2, this.height / 3);
                ctx.lineTo(-this.width / 3, this.height / 3);
                ctx.lineTo(-this.width / 4, 0);
                ctx.lineTo(-this.width / 3, -this.height / 3);
                ctx.lineTo(this.width / 2, -this.height / 3);
                ctx.closePath();
                ctx.fill();
                
                // Add reinforcement details
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        ctx.restore();
        this.drawStatusBars(screenX, screenY);
    }

    drawStatusBars(screenX, screenY) {
        // Constants for bar positioning and size
        const margin = 10;
        const barWidth = 200;
        const barHeight = 20;
        const barSpacing = 25; // Reduced spacing between bars
        const x = margin + barWidth/2;
        
        // Draw health bar and caption
        const healthY = margin;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, healthY, barWidth, barHeight);
        ctx.fillStyle = '#f00';
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        ctx.fillRect(x - barWidth/2, healthY, healthWidth, barHeight);
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Health: ${Math.ceil(this.health)}/${this.maxHealth}`, x, healthY + 15);
        
        // Draw energy bar and caption
        const energyY = healthY + barSpacing;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, energyY, barWidth, barHeight);
        ctx.fillStyle = '#0af';
        const energyWidth = (this.energy / this.maxEnergy) * barWidth;
        ctx.fillRect(x - barWidth/2, energyY, energyWidth, barHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Energy: ${Math.ceil(this.energy)}/${this.maxEnergy}`, x, energyY + 15);
        
        // Draw gem bar and caption
        const gemY = energyY + barSpacing;
        ctx.fillStyle = '#333';
        ctx.fillRect(x - barWidth/2, gemY, barWidth, barHeight);
        ctx.fillStyle = '#f0f';
        
        if (this.upgradeLevel >= 4) {
            // At max level, show full bar and just gem count
            ctx.fillRect(x - barWidth/2, gemY, barWidth, barHeight);
            ctx.fillStyle = '#fff';
            ctx.fillText(`Gems: ${this.gems}`, x, gemY + 15);
        } else {
            // Show progress to next level
            let nextUpgradeGems;
            switch(this.upgradeLevel) {
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
            const gemWidth = (this.gems / nextUpgradeGems) * barWidth;
            ctx.fillRect(x - barWidth/2, gemY, gemWidth, barHeight);
            ctx.fillStyle = '#fff';
            ctx.fillText(`Gems: ${this.gems}/${nextUpgradeGems}`, x, gemY + 15);
        }
        
        // Draw dash charges for Rammer
        if (this.shipClass.name === 'Rammer') {
            const chargeWidth = 30;
            const chargeHeight = 10;
            const chargeSpacing = 5;
            const startX = canvas.width/2 - ((chargeWidth + chargeSpacing) * this.maxDashCharges)/2;
            const chargeY = canvas.height - 40;

            for (let i = 0; i < this.maxDashCharges; i++) {
                const chargeX = startX + i * (chargeWidth + chargeSpacing);
                ctx.fillStyle = i < this.dashCharges ? '#ff4242' : 'rgba(255, 66, 66, 0.3)';
                ctx.fillRect(chargeX, chargeY, chargeWidth, chargeHeight);
            }
        }
        
        // Draw charge indicator for Sniper
        if (this.shipClass.name === 'Sniper') {
            const chargeWidth = 30;
            const chargeHeight = 10;
            const chargeSpacing = 5;
            const startX = canvas.width/2 - ((chargeWidth + chargeSpacing) * this.maxCharges)/2;
            const chargeY = canvas.height - 40;

            // Draw charge slots
            for (let i = 0; i < this.maxCharges; i++) {
                const chargeX = startX + i * (chargeWidth + chargeSpacing);
                ctx.fillStyle = i < this.charges ? '#4242ff' : 'rgba(66, 66, 255, 0.3)';
                ctx.fillRect(chargeX, chargeY, chargeWidth, chargeHeight);
            }

            // Draw charging progress if currently charging
            if (this.isCharging) {
                const progressWidth = (this.chargeTime / this.maxChargeTime) * chargeWidth;
                const progressX = startX + this.charges * (chargeWidth + chargeSpacing);
                ctx.fillStyle = 'rgba(66, 66, 255, 0.5)';
                ctx.fillRect(progressX, chargeY, progressWidth, chargeHeight);
            }
        }
        
        // Score caption below the bars
        ctx.fillStyle = '#fff';
        ctx.fillText(`Score: ${score}`, x, gemY + barSpacing + 10);
        
        // Reset text align
        ctx.textAlign = 'left';

        // Draw ability cooldowns
        this.drawAbilityCooldowns();
    }

    drawAbilityCooldowns() {
        const size = 40;
        const spacing = 45;
        const margin = 10;
        const x = margin;
        
        // Calculate y position based on the gem bar and score position
        const barSpacing = 25;
        const healthY = margin;
        const energyY = healthY + barSpacing;
        const gemY = energyY + barSpacing;
        const scoreY = gemY + barSpacing + 10;
        const y = scoreY + 15;
        
        // Only draw unlocked abilities
        let currentX = x;
        let abilitiesDrawn = 0;

        // Draw ability 1 if unlocked
        if (this.abilities.ability1.unlocked) {
            ctx.fillStyle = '#333';
            ctx.fillRect(currentX, y, size, size);
            
            if (this.abilities.ability1.cooldown > 0) {
                const progress = this.abilities.ability1.cooldown / this.abilities.ability1.maxCooldown;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(currentX, y + size * (1 - progress), size, size * progress);
            }
            
            if (this.abilities.ability1.active && this.abilities.ability1.remainingDuration > 0) {
                const progress = this.abilities.ability1.remainingDuration / this.abilities.ability1.duration;
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.fillRect(currentX, y + size * (1 - progress), size, size * progress);
            }
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('1', currentX + size/2, y + 25);
            
            ctx.font = '12px Arial';
            ctx.fillText(this.abilities.ability1.name, currentX + size/2, y + size + 15);
            
            abilitiesDrawn++;
            currentX += size + spacing;
        }

        // Draw ability 2 if unlocked
        if (this.abilities.ability2.unlocked) {
            ctx.fillStyle = '#333';
            ctx.fillRect(currentX, y, size, size);
            
            if (this.abilities.ability2.cooldown > 0) {
                const progress = this.abilities.ability2.cooldown / this.abilities.ability2.maxCooldown;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(currentX, y + size * (1 - progress), size, size * progress);
            }
            
            if (this.abilities.ability2.active && this.abilities.ability2.remainingDuration > 0) {
                const progress = this.abilities.ability2.remainingDuration / this.abilities.ability2.duration;
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.fillRect(currentX, y + size * (1 - progress), size, size * progress);
            }
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText('2', currentX + size/2, y + 25);
            
            ctx.font = '12px Arial';
            ctx.fillText(this.abilities.ability2.name, currentX + size/2, y + size + 15);
        }

        // Draw ability tooltips on hover
        const mouseX = mouse.x;
        const mouseY = mouse.y;

        if (this.abilities.ability1.unlocked && mouseX >= x && mouseX <= x + size && mouseY >= y && mouseY <= y + size) {
            this.drawAbilityTooltip(this.abilities.ability1, mouseX, mouseY);
        }
        else if (this.abilities.ability2.unlocked && mouseX >= x + size + spacing && mouseX <= x + 2 * size + spacing && mouseY >= y && mouseY <= y + size) {
            this.drawAbilityTooltip(this.abilities.ability2, mouseX, mouseY);
        }

        // Draw right-click hint if no abilities are unlocked
        if (abilitiesDrawn === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Right-click to unlock abilities', x, y + size/2);
        }
    }

    drawAbilityTooltip(ability, x, y) {
        const padding = 10;
        const tooltipWidth = 200;
        const tooltipHeight = 60;
        
        // Draw tooltip background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y - tooltipHeight, tooltipWidth, tooltipHeight);
        
        // Draw ability name
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(ability.name, x + padding, y - tooltipHeight + padding + 14);
        
        // Draw description
        ctx.font = '12px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText(ability.description, x + padding, y - tooltipHeight + padding + 32);
    }

    move() {
        // Handle rotation with physics
        if (this.mouseControls) {
            // Calculate angle to mouse
            const screenX = this.x - camera.x;
            const screenY = this.y - camera.y;
            let targetRotation;
            
            if (this.shipClass.name === 'Sniper' && this.isViewportMode) {
                // In viewport mode, use world coordinates for rotation
                const mouseWorldX = mouse.x + camera.x;
                const mouseWorldY = mouse.y + camera.y;
                targetRotation = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
            } else {
                // Normal rotation calculation for other cases
                targetRotation = Math.atan2(mouse.y - screenY, mouse.x - screenX);
            }
            
            // Calculate the shortest rotation direction
            let rotationDiff = targetRotation - this.rotation;
            while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
            while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
            
            // Apply rotational acceleration towards target
            this.rotationalVelocity += rotationDiff * this.rotationalAcceleration;
        } else {
            if (keys['ArrowLeft']) this.rotationalVelocity -= this.rotationalAcceleration;
            if (keys['ArrowRight']) this.rotationalVelocity += this.rotationalAcceleration;
        }

        // Apply rotational physics
        this.rotationalVelocity *= this.rotationalFriction;
        
        // Limit rotational velocity
        this.rotationalVelocity = Math.max(-this.maxRotationalVelocity, 
            Math.min(this.maxRotationalVelocity, this.rotationalVelocity));
        
        // Apply rotation
        this.rotation += this.rotationalVelocity;
        
        // Forward movement with either W or ArrowUp
        if (keys['w'] || keys['W'] || keys['ArrowUp']) {
            this.velocityX += Math.cos(this.rotation) * this.acceleration;
            this.velocityY += Math.sin(this.rotation) * this.acceleration;
        }

        // Apply physics
        this.velocityX *= FRICTION;
        this.velocityY *= FRICTION;

        // Limit speed
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > this.maxSpeed) {
            const ratio = this.maxSpeed / speed;
            this.velocityX *= ratio;
            this.velocityY *= ratio;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // World boundaries with smoother collision
        if (this.x < 0) {
            this.x = 0;
            this.velocityX *= -0.5;
        } else if (this.x > WORLD_WIDTH) {
            this.x = WORLD_WIDTH;
            this.velocityX *= -0.5;
        }
        
        if (this.y < 0) {
            this.y = 0;
            this.velocityY *= -0.5;
        } else if (this.y > WORLD_HEIGHT) {
            this.y = WORLD_HEIGHT;
            this.velocityY *= -0.5;
        }

        // Update camera to follow player smoothly (with less padding)
        const targetCameraX = this.x - canvas.width / 2;
        const targetCameraY = this.y - canvas.height / 2;
        
        camera.x += (targetCameraX - camera.x) * 0.2; // Increased from 0.1 to 0.2
        camera.y += (targetCameraY - camera.y) * 0.2;
        
        // Camera bounds
        camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));
        camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camera.y));

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Handle Rammer's dash
        if (this.isDashing) {
            if (this.dashDuration > 0) {
                this.dashDuration--;
            } else {
                this.isDashing = false;
                this.velocityX *= 0.5;
                this.velocityY *= 0.5;
            }
        }
    }

    update() {
        // Check for upgrades
        if (this.gems >= UPGRADE_LEVELS.LEVEL4.gems && this.upgradeLevel === 3) {
            this.upgradeLevel = 4;
            this.maxHealth += 50;
            this.health = this.maxHealth;
            this.gems = 0;
            // Increase Rammer stats with level
            if (this.shipClass.name === 'Rammer') {
                this.maxSpeed += 1;
                this.acceleration += 0.1;
                this.rotationalAcceleration += 0.002;
                // Scale energy values
                this.maxEnergy += this.shipClass.energyScaling.maxEnergyPerLevel;
                this.energyRegen += this.shipClass.energyScaling.regenPerLevel;
                this.shootCost += this.shipClass.energyScaling.costPerLevel;
            }
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL3.gems && this.upgradeLevel === 2) {
            this.upgradeLevel = 3;
            this.maxHealth += 40;
            this.health = this.maxHealth;
            this.gems = 0;
            if (this.shipClass.name === 'Rammer') {
                this.maxSpeed += 1;
                this.acceleration += 0.1;
                this.rotationalAcceleration += 0.002;
                // Scale energy values
                this.maxEnergy += this.shipClass.energyScaling.maxEnergyPerLevel;
                this.energyRegen += this.shipClass.energyScaling.regenPerLevel;
                this.shootCost += this.shipClass.energyScaling.costPerLevel;
            }
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL2.gems && this.upgradeLevel === 1) {
            this.upgradeLevel = 2;
            this.maxHealth += 30;
            this.health = this.maxHealth;
            this.gems = 0;
            if (this.shipClass.name === 'Rammer') {
                this.maxSpeed += 1;
                this.acceleration += 0.1;
                this.rotationalAcceleration += 0.002;
                // Scale energy values
                this.maxEnergy += this.shipClass.energyScaling.maxEnergyPerLevel;
                this.energyRegen += this.shipClass.energyScaling.regenPerLevel;
                this.shootCost += this.shipClass.energyScaling.costPerLevel;
            }
        } else if (this.gems >= UPGRADE_LEVELS.LEVEL1.gems && this.upgradeLevel === 0) {
            this.upgradeLevel = 1;
            this.maxHealth += 20;
            this.health = this.maxHealth;
            this.gems = 0;
            if (this.shipClass.name === 'Rammer') {
                this.maxSpeed += 1;
                this.acceleration += 0.1;
                this.rotationalAcceleration += 0.002;
                // Scale energy values
                this.maxEnergy += this.shipClass.energyScaling.maxEnergyPerLevel;
                this.energyRegen += this.shipClass.energyScaling.regenPerLevel;
                this.shootCost += this.shipClass.energyScaling.costPerLevel;
            }
        }
        
        // Apply health regeneration if not at full health and not recently damaged
        if (this.health < this.maxHealth && !this.invulnerable) {
            // Increase regeneration rate based on upgrade level
            const regenMultiplier = 1 + (this.upgradeLevel * 0.2); // 20% increase per level
            this.health = Math.min(this.maxHealth, this.health + (this.healthRegen * regenMultiplier));
        }
        
        // Existing update code
        this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegen);
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // Only shoot if in PLAYING state and mouse is down or space is pressed
        if (gameState === GAME_STATES.PLAYING && (mouse.isDown || keys[' ']) && this.shootCooldown <= 0) {
            this.shoot();
        }
        
        this.move();
        this.updateAbilities();

        // Handle Sniper viewport mechanics
        if (this.shipClass.name === 'Sniper') {
            if (mouse.rightDown && this.energy >= this.viewportEnergyCost) {
                if (!this.isViewportMode) {
                    // Store initial cursor position when entering viewport mode
                    this.viewportCursorX = mouse.x + camera.x;
                    this.viewportCursorY = mouse.y + camera.y;
                }
                
                this.isViewportMode = true;
                this.energy -= this.viewportEnergyCost;
                
                // Calculate distance from player to stored cursor position
                const distToCursor = distance(this.x, this.y, this.viewportCursorX, this.viewportCursorY);
                
                // Calculate maximum view range (2.5 times the current view)
                const maxViewRange = Math.max(canvas.width, canvas.height) * 1.25; // 2.5/2 = 1.25 (radius)
                
                // If cursor is within range, move camera to cursor
                if (distToCursor <= maxViewRange) {
                    const targetCameraX = this.viewportCursorX - canvas.width/2;
                    const targetCameraY = this.viewportCursorY - canvas.height/2;
                    
                    camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, targetCameraX));
                    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, targetCameraY));
                } else {
                    // If cursor is out of range, move camera to maximum allowed distance in that direction
                    const angle = Math.atan2(this.viewportCursorY - this.y, this.viewportCursorX - this.x);
                    const limitedX = this.x + Math.cos(angle) * maxViewRange;
                    const limitedY = this.y + Math.sin(angle) * maxViewRange;
                    
                    const targetCameraX = limitedX - canvas.width/2;
                    const targetCameraY = limitedY - canvas.height/2;
                    
                    camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, targetCameraX));
                    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, targetCameraY));
                }
            } else if (this.isViewportMode) {
                // When releasing right-click, smoothly return to the player
                const targetCameraX = this.x - canvas.width/2;
                const targetCameraY = this.y - canvas.height/2;
                
                camera.x += (targetCameraX - camera.x) * 0.1;
                camera.y += (targetCameraY - camera.y) * 0.1;
                
                // Keep camera within bounds
                camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, camera.x));
                camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, camera.y));
                
                // Check if we're close enough to the target to end viewport mode
                const distToTarget = distance(camera.x, camera.y, targetCameraX, targetCameraY);
                if (distToTarget < 1) {
                    this.isViewportMode = false;
                }
            }
        }
    }

    updateAbilities() {
        // Update cooldowns
        for (const ability of [this.abilities.ability1, this.abilities.ability2]) {
            if (ability.cooldown > 0) {
                ability.cooldown--;
            }
            if (ability.active && ability.remainingDuration > 0) {
                ability.remainingDuration--;
                if (ability.remainingDuration <= 0) {
                    this.deactivateAbility(ability);
                }
            }
        }

        // Handle active ability effects
        if (this.abilities.ability1.active) {
            switch(this.abilities.ability1.name) {
                case 'Absolute Control':
                    this.rotationalAcceleration = this.shipClass.rotationalAcceleration * 10;
                    this.acceleration = this.shipClass.acceleration * 10;
                    break;
                case 'Sentry':
                    this.maxSpeed = this.shipClass.maxSpeed * 0.5;
                    this.energyRegen = this.shipClass.energyRegen * 1.5;
                    this.damageMultiplier = 2;
                    break;
                case 'Warp Drive':
                    // Effect handled in activation
                    break;
            }
        }

        if (this.abilities.ability2.active) {
            switch(this.abilities.ability2.name) {
                case 'Boost':
                    this.damageMultiplier = 1.75;
                    break;
                case 'Deathray':
                    this.rotationalAcceleration = this.shipClass.rotationalAcceleration * 0.5;
                    this.energyRegen = this.shipClass.energyRegen * 10;
                    if (this.energy >= this.maxEnergy && this.abilities.ability2.shotsRemaining > 0) {
                        // Shoot 16 lasers in a circle
                        for (let i = 0; i < 16; i++) {
                            const angle = (i / 16) * Math.PI * 2;
                            this.createLaser(angle, 2, 4);
                        }
                        this.abilities.ability2.shotsRemaining--;
                        this.energy = 0;
                    }
                    break;
                case 'Squadron':
                    // Update clone positions and behaviors
                    if (this.abilities.ability2.clones.length > 0) {
                        const FORMATION_DISTANCE = 80; // Distance from player when in formation

                        this.abilities.ability2.clones.forEach((clone, index) => {
                            // Calculate formation position
                            const formationAngle = this.rotation + (index === 0 ? -Math.PI/2 : Math.PI/2);
                            const targetX = this.x + Math.cos(formationAngle) * FORMATION_DISTANCE;
                            const targetY = this.y + Math.sin(formationAngle) * FORMATION_DISTANCE;

                            // Move towards formation position
                            const angleToTarget = Math.atan2(targetY - clone.y, targetX - clone.x);
                            const distToTarget = distance(clone.x, clone.y, targetX, targetY);
                            
                            // Adjust speed based on distance to target
                            const speedMultiplier = Math.min(distToTarget / 100, 1);
                            clone.x += Math.cos(angleToTarget) * clone.maxSpeed * speedMultiplier;
                            clone.y += Math.sin(angleToTarget) * clone.maxSpeed * speedMultiplier;
                            
                            // Match player's rotation
                            clone.rotation = this.rotation;
                            
                            // Regenerate energy
                            clone.energy = Math.min(clone.maxEnergy, clone.energy + clone.energyRegen);
                            
                            // Update shoot cooldown
                            if (clone.shootCooldown > 0) {
                                clone.shootCooldown--;
                            }
                            
                            // Shoot when player shoots
                            if ((keys[' '] || mouse.isDown) && clone.energy >= clone.shootCost && clone.shootCooldown <= 0) {
                                this.createLaser(clone.rotation, 0.8, 1, clone.x, clone.y);
                                clone.energy -= clone.shootCost;
                                clone.shootCooldown = clone.maxShootCooldown;
                            }
                        });
                    }
                    break;
                case 'Fortify':
                    this.damageReduction = 0.45;
                    this.contactDamageMultiplier = 2;
                    break;
            }
        }
    }

    activateAbility(abilityNum) {
        const ability = abilityNum === 1 ? this.abilities.ability1 : this.abilities.ability2;
        
        if (!ability.unlocked) {
            showNotification(`${ability.name} is not unlocked!`, 'warning');
            return;
        }

        if (ability.cooldown > 0) {
            showNotification(`${ability.name} is on cooldown!`, 'warning');
            return;
        }

        ability.active = true;
        ability.cooldown = ability.maxCooldown;
        ability.remainingDuration = ability.duration;

        switch(ability.name) {
            case 'Reload':
                this.energy = Math.min(this.maxEnergy, this.energy + 100);
                ability.active = false; // Instant effect
                showNotification('Energy Restored!');
                break;
            case 'Boost':
                showNotification('Damage Boosted!');
                break;
            case 'Sentry':
                showNotification('Sentry Mode Activated!');
                break;
            case 'Storm':
                // Shoot 16 lasers in a circle
                for (let i = 0; i < 16; i++) {
                    const angle = (i / 16) * Math.PI * 2;
                    this.createLaser(angle, 2, 4);
                }
                ability.active = false; // Instant effect
                showNotification('Storm Released!');
                break;
            case 'Absolute Control':
                showNotification('Absolute Control Activated!');
                break;
            case 'Squadron':
                // Create two clones with level 1 speedster stats
                this.abilities.ability2.clones = [
                    {
                        x: this.x - 50,
                        y: this.y,
                        rotation: this.rotation,
                        health: SHIP_CLASSES.SPEEDSTER.health,
                        maxSpeed: SHIP_CLASSES.SPEEDSTER.maxSpeed,
                        acceleration: SHIP_CLASSES.SPEEDSTER.acceleration,
                        shootCost: SHIP_CLASSES.SPEEDSTER.shootCost,
                        maxEnergy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energyRegen: SHIP_CLASSES.SPEEDSTER.energyRegen,
                        shootCooldown: 0,
                        maxShootCooldown: 30 // Add shoot cooldown for clones (half second at 60 FPS)
                    },
                    {
                        x: this.x + 50,
                        y: this.y,
                        rotation: this.rotation,
                        health: SHIP_CLASSES.SPEEDSTER.health,
                        maxSpeed: SHIP_CLASSES.SPEEDSTER.maxSpeed,
                        acceleration: SHIP_CLASSES.SPEEDSTER.acceleration,
                        shootCost: SHIP_CLASSES.SPEEDSTER.shootCost,
                        maxEnergy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energy: SHIP_CLASSES.SPEEDSTER.maxEnergy,
                        energyRegen: SHIP_CLASSES.SPEEDSTER.energyRegen,
                        shootCooldown: 0,
                        maxShootCooldown: 30
                    }
                ];
                showNotification('Squadron Deployed!');
                break;
            case 'Warp Drive':
                // Store target location
                ability.targetX = mouse.x + camera.x;
                ability.targetY = mouse.y + camera.y;
                // Teleport
                this.x = ability.targetX;
                this.y = ability.targetY;
                showNotification('Warped!');
                break;
            case 'Deathray':
                ability.shotsRemaining = 16;
                showNotification('Deathray Charging!');
                break;
            case 'Charge Up':
                this.dashCharges = this.maxDashCharges;
                ability.active = false; // Instant effect
                showNotification('Dash Charges Ready!');
                break;
            case 'Fortify':
                this.damageReduction = 0.45;
                this.contactDamageMultiplier = 2;
                showNotification('Fortified!');
                break;
        }
    }

    deactivateAbility(ability) {
        ability.active = false;
        
        // Reset any temporary stat changes
        switch(ability.name) {
            case 'Absolute Control':
                this.rotationalAcceleration = this.shipClass.rotationalAcceleration;
                this.acceleration = this.shipClass.acceleration;
                break;
            case 'Sentry':
                this.maxSpeed = this.shipClass.maxSpeed;
                this.energyRegen = this.shipClass.energyRegen;
                this.damageMultiplier = 1;
                break;
            case 'Deathray':
                this.rotationalAcceleration = this.shipClass.rotationalAcceleration;
                this.energyRegen = this.shipClass.energyRegen;
                ability.shotsRemaining = 0;
                break;
            case 'Squadron':
                this.abilities.ability2.clones = [];
                break;
            case 'Fortify':
                this.damageReduction = 0;
                this.contactDamageMultiplier = 1;
                break;
            case 'Boost':
                this.damageMultiplier = 1;
                break;
        }
    }

    shoot() {
        if (this.shootCooldown > 0) return;
        
        let energyCost = this.shootCost;
        
        // Get the correct rotation based on mode
        let shootRotation = this.rotation;
        if (this.shipClass.name === 'Sniper' && this.isViewportMode) {
            // In viewport mode, calculate rotation to current cursor position
            const mouseWorldX = mouse.x + camera.x;
            const mouseWorldY = mouse.y + camera.y;
            shootRotation = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
        }
        
        // Handle Assault Fighter shooting
        if (this.shipClass.name === 'Assault Fighter') {
            if (this.energy >= energyCost) {
                switch(this.upgradeLevel) {
                    case 0: // Level 1 - Base pattern
                        this.createLaser(this.rotation, 1);
                        this.createLaser(this.rotation - 0.1, 0.8);
                        this.createLaser(this.rotation + 0.1, 0.8);
                        break;
                    case 1: // Level 2 - Two piercing lasers
                        this.createLaser(this.rotation - 0.05, 1, 1, this.x, this.y, 12, 2);
                        this.createLaser(this.rotation + 0.05, 1, 1, this.x, this.y, 12, 2);
                        break;
                    case 2: // Level 3 - One big laser and two small piercing lasers
                        this.createLaser(this.rotation, 1.5, 1, this.x, this.y, 23, 1); // Big central laser
                        this.createLaser(this.rotation - 0.15, 0.8, 1, this.x, this.y, 8, 3); // Small piercing lasers
                        this.createLaser(this.rotation + 0.15, 0.8, 1, this.x, this.y, 8, 3);
                        break;
                    case 3: // Level 4 - Five piercing bullets in spread pattern
                    case 4:
                        // Center three bullets (20 damage)
                        this.createLaser(this.rotation, 1.2, 1, this.x, this.y, 20, 2);
                        this.createLaser(this.rotation - 0.1, 1.2, 1, this.x, this.y, 20, 2);
                        this.createLaser(this.rotation + 0.1, 1.2, 1, this.x, this.y, 20, 2);
                        // Side bullets (6 damage)
                        this.createLaser(this.rotation - 0.2, 1, 1, this.x, this.y, 6, 2);
                        this.createLaser(this.rotation + 0.2, 1, 1, this.x, this.y, 6, 2);
                        break;
                }
                this.energy -= energyCost;
                this.shootCooldown = this.maxShootCooldown;
            }
            return;
        }
        
        // Class-specific shooting patterns with different energy costs
        if (this.shipClass.name === 'Sniper') {
            switch(this.upgradeLevel) {
                case 0: // Single powerful shot
                    if (this.energy >= energyCost) {
                        this.createLaser(shootRotation, 1.5, 8);
                    }
                    break;
                case 1: // Two powerful shots
                    energyCost *= 1.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(shootRotation - 0.03, 1.5, 8);
                        this.createLaser(shootRotation + 0.03, 1.5, 8);
                    }
                    break;
                case 2: // Three powerful shots
                    energyCost *= 2;
                    if (this.energy >= energyCost) {
                        this.createLaser(shootRotation - 0.05, 1.5, 8);
                        this.createLaser(shootRotation, 1.8, 8);
                        this.createLaser(shootRotation + 0.05, 1.5, 8);
                    }
                    break;
                default: // Level 3+ - Four powerful shots
                    energyCost *= 2.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(shootRotation - 0.08, 1.5, 8);
                        this.createLaser(shootRotation - 0.03, 1.8, 8);
                        this.createLaser(shootRotation + 0.03, 1.8, 8);
                        this.createLaser(shootRotation + 0.08, 1.5, 8);
                    }
                    break;
            }
        } else if (this.shipClass.name === 'Fighter') {
            switch(this.upgradeLevel) {
                case 0: // Single precise shot
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1);
                    }
                    break;
                case 1: // Dual shots
                    energyCost *= 1.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.1, 1);
                        this.createLaser(this.rotation + 0.1, 1);
                    }
                    break;
                case 2: // Triple shots
                    energyCost *= 2;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1);
                        this.createLaser(this.rotation - 0.15, 0.8);
                        this.createLaser(this.rotation + 0.15, 0.8);
                    }
                    break;
                default: // Level 3+ - Two side shots and one powerful center shot
                    energyCost *= 2.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1.5);
                        this.createLaser(this.rotation - 0.2, 0.8);
                        this.createLaser(this.rotation + 0.2, 0.8);
                    }
                    break;
            }
        } else if (this.shipClass.name === 'Tank') {
            switch(this.upgradeLevel) {
                case 0: // Single heavy shot
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1.2);
                    }
                    break;
                case 1: // Two heavy shots
                    energyCost *= 1.8;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.1, 1.2);
                        this.createLaser(this.rotation + 0.1, 1.2);
                    }
                    break;
                case 2: // Three spread shots
                    energyCost *= 2.5;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 1.2);
                        this.createLaser(this.rotation - 0.2, 1.2);
                        this.createLaser(this.rotation + 0.2, 1.2);
                    }
                    break;
                default: // Level 3+ - Five heavy spread shots
                    energyCost *= 3;
                    if (this.energy >= energyCost) {
                        for (let i = -2; i <= 2; i++) {
                            this.createLaser(this.rotation + (i * 0.15), 1.3);
                        }
                    }
                    break;
            }
        } else if (this.shipClass.name === 'Speedster') {
            switch(this.upgradeLevel) {
                case 0: // Quick single shot
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 0.8);
                    }
                    break;
                case 1: // Rapid dual shots
                    energyCost *= 1.3;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.05, 0.8);
                        this.createLaser(this.rotation + 0.05, 0.8);
                    }
                    break;
                case 2: // Triple quick shots
                    energyCost *= 1.6;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation, 0.8);
                        this.createLaser(this.rotation - 0.1, 0.8);
                        this.createLaser(this.rotation + 0.1, 0.8);
                    }
                    break;
                default: // Level 3+ - Four rapid shots in tight formation
                    energyCost *= 2;
                    if (this.energy >= energyCost) {
                        this.createLaser(this.rotation - 0.05, 0.8);
                        this.createLaser(this.rotation + 0.05, 0.8);
                        this.createLaser(this.rotation - 0.15, 0.8);
                        this.createLaser(this.rotation + 0.15, 0.8);
                    }
                    break;
            }
        }
        
        if (this.energy >= energyCost) {
            this.energy -= energyCost;
            // Sniper has longer cooldown
            this.shootCooldown = this.shipClass.name === 'Sniper' ? this.maxShootCooldown * 2.5 : this.maxShootCooldown;
        }
    }

    createLaser(angle, sizeMultiplier = 1, speedMultiplier = 1, startX = this.x, startY = this.y, customDamage = null, pierceCount = 0) {
        const laser = {
            x: startX,
            y: startY,
            velocityX: Math.cos(angle) * (10 * speedMultiplier) + this.velocityX,
            velocityY: Math.sin(angle) * (10 * speedMultiplier) + this.velocityY,
            width: 4 * sizeMultiplier,
            height: 4 * sizeMultiplier,
            rotation: angle,
            color: this.upgradeLevel >= 2 ? this.color : '#ff0000',
            damage: customDamage !== null ? customDamage : (this.shipClass.name === 'Sniper' ? 25 * sizeMultiplier : 10 * sizeMultiplier) * this.damageMultiplier,
            pierceCount: pierceCount,
            maxPierceCount: pierceCount
        };

        // Apply ability damage modifiers
        if ((this.abilities.ability1.active && this.abilities.ability1.name === 'Warp Drive') ||
            (this.abilities.ability2.active && this.abilities.ability2.name === 'Deathray')) {
            laser.damage *= 2;
        }
        if (this.abilities.ability1.active && this.abilities.ability1.name === 'Sentry') {
            laser.damage *= 2;
        }
        if (this.abilities.ability2.active && this.abilities.ability2.name === 'Storm') {
            laser.knockback = true;
        }

        this.lasers.push(laser);
    }

    drawLasers() {
        this.lasers.forEach(laser => {
            ctx.save();
            ctx.translate(laser.x - camera.x, laser.y - camera.y);
            ctx.rotate(laser.rotation);
            ctx.fillStyle = laser.color;
            
            if (this.upgradeLevel >= 2) {
                // Advanced laser appearance
                ctx.shadowColor = laser.color;
                ctx.shadowBlur = 5;
            }
            
            ctx.fillRect(-laser.width/2, -laser.height/2, laser.width, laser.height);
            ctx.restore();
        });
    }

    takeDamage(amount, isRam = false) {
        if (this.invulnerable) return;
        
        // Check hit cooldown
        const currentTime = Date.now();
        if (currentTime - this.lastHitTime < (isRam ? 250 : 100)) { // 250ms for rams, 100ms for regular hits
            return; // Skip damage if hit too recently
        }
        this.lastHitTime = currentTime;
        
        // Apply damage reduction for Rammer's Fortify ability
        if (this.shipClass.name === 'Rammer' && this.abilities.ability2.active) {
            amount *= (1 - this.damageReduction);
        }
        
        this.health -= amount;
        if (this.health <= 0) {
            gameOver = true;
        }
        // Temporary invulnerability
        this.invulnerable = true;
        this.invulnerableTime = isRam ? this.ramInvulnerabilityDuration : this.regularInvulnerabilityDuration;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    collectGems(amount) {
        this.gems = Math.min(UPGRADE_LEVELS.LEVEL4.gems, this.gems + amount);
    }

    updateLasers() {
        // Update laser positions
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.x += laser.velocityX;
            laser.y += laser.velocityY;

            // Remove lasers that are off screen or out of bounds
            if (laser.x < 0 || laser.x > WORLD_WIDTH || 
                laser.y < 0 || laser.y > WORLD_HEIGHT) {
                this.lasers.splice(i, 1);
            }
        }
    }

    // Add method to handle right-click for Rammer's charged dash
    handleRightClick() {
        if (this.shipClass.name === 'Rammer' && this.dashCharges > 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashDuration = this.maxDashDuration;
            this.dashCharges--;
            
            // Apply charged dash velocity with level scaling
            const scaledDashSpeed = this.chargedDashSpeed * (1 + this.upgradeLevel * 0.15); // 15% increase per level
            this.velocityX = Math.cos(this.rotation) * scaledDashSpeed;
            this.velocityY = Math.sin(this.rotation) * scaledDashSpeed;
        }
    }

    // Add method to calculate contact damage
    calculateContactDamage() {
        if (this.shipClass.name !== 'Rammer') return 0;

        // Reduced base damage to 12 and level scaling to 1.5
        const baseDamage = 12 + (this.upgradeLevel * 1.5);

        // Speed multiplier capped at 1.5x (reduced from 1.75x)
        const speedMultiplier = Math.min(1.5, Math.sqrt(
            this.velocityX * this.velocityX + 
            this.velocityY * this.velocityY
        ) / 3);

        // Reduced dash multiplier to 2.2 (from 2.5)
        const dashMultiplier = this.isDashing ? 2.2 : 1;

        // Apply ability multiplier if Fortify is active
        const abilityMultiplier = this.abilities.ability2.active && this.abilities.ability2.name === 'Fortify' ? 2 : 1;

        // Calculate final damage
        return Math.round(baseDamage * speedMultiplier * dashMultiplier * abilityMultiplier);
    }

    fireChargedShot() {
        if (this.shootCooldown > 0) return;
        
        // Create a powerful charged shot with normal sniper speed
        const sizeMultiplier = 2;
        const speedMultiplier = 8; // Same as normal sniper shots
        const damageMultiplier = 3;
        
        this.createLaser(this.rotation, sizeMultiplier, speedMultiplier);
        
        // No cooldown for charged shots
        this.shootCooldown = 0;
    }
}