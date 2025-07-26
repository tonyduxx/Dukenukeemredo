class HydraHeros {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.selectedCharacter = null;
        this.gameState = 'menu'; // 'menu', 'playing', 'gameOver'
        
        this.setupCanvas();
        this.setupEventListeners();
        this.setupGame();
        
        this.lastTime = 0;
        this.gameLoop();
    }
    
    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    setupEventListeners() {
        // Character selection
        const characterCards = document.querySelectorAll('.character-card');
        characterCards.forEach(card => {
            card.addEventListener('click', () => this.selectCharacter(card.dataset.character));
        });
        
        // Start game button
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        
        // Game over buttons
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showMenu());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleMouseClick(e));
    }
    
    setupGame() {
        // Character stats
        this.characters = {
            duxx: {
                name: 'DUXX',
                health: 100,
                maxHealth: 100,
                speed: 1.2,
                damage: 25,
                ammo: 30,
                maxAmmo: 30,
                reloadTime: 1000,
                color: '#4a90e2'
            },
            van: {
                name: 'VAN',
                health: 120,
                maxHealth: 120,
                speed: 1.0,
                damage: 30,
                ammo: 25,
                maxAmmo: 25,
                reloadTime: 1200,
                color: '#50c878'
            },
            grizz: {
                name: 'GRIZZ',
                health: 150,
                maxHealth: 150,
                speed: 0.8,
                damage: 40,
                ammo: 20,
                maxAmmo: 20,
                reloadTime: 1500,
                color: '#8b4513'
            }
        };
        
        // Game state
        this.player = {
            x: 400,
            y: 300,
            angle: 0,
            health: 100,
            ammo: 30,
            score: 0,
            lastShot: 0,
            isReloading: false
        };
        
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.keys = {};
        
        this.spawnEnemies();
    }
    
    selectCharacter(character) {
        // Remove previous selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select new character
        document.querySelector(`[data-character="${character}"]`).classList.add('selected');
        this.selectedCharacter = character;
        
        // Enable start button
        document.getElementById('startGame').disabled = false;
    }
    
    startGame() {
        if (!this.selectedCharacter) return;
        
        // Hide character selection, show game
        document.getElementById('characterSelect').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        // Set player stats based on character
        const charStats = this.characters[this.selectedCharacter];
        this.player.health = charStats.health;
        this.player.maxHealth = charStats.maxHealth;
        this.player.ammo = charStats.ammo;
        this.player.maxAmmo = charStats.maxAmmo;
        this.player.damage = charStats.damage;
        this.player.speed = charStats.speed;
        this.player.color = charStats.color;
        
        this.gameState = 'playing';
        this.updateHUD();
        
        // Focus canvas for keyboard input
        this.canvas.focus();
    }
    
    showMenu() {
        this.gameState = 'menu';
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('characterSelect').classList.add('active');
        document.getElementById('gameOver').classList.add('hidden');
        
        // Reset game
        this.setupGame();
    }
    
    restartGame() {
        this.setupGame();
        this.player.health = this.characters[this.selectedCharacter].health;
        this.player.maxHealth = this.characters[this.selectedCharacter].maxHealth;
        this.player.ammo = this.characters[this.selectedCharacter].ammo;
        this.player.maxAmmo = this.characters[this.selectedCharacter].maxAmmo;
        this.player.damage = this.characters[this.selectedCharacter].damage;
        this.player.speed = this.characters[this.selectedCharacter].speed;
        this.player.color = this.characters[this.selectedCharacter].color;
        this.player.score = 0;
        
        this.gameState = 'playing';
        document.getElementById('gameOver').classList.add('hidden');
        this.updateHUD();
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;
        
        this.keys[e.code] = true;
        
        // Reload
        if (e.code === 'KeyR') {
            this.reload();
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    handleMouseMove(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate angle to mouse
        const dx = mouseX - this.player.x;
        const dy = mouseY - this.player.y;
        this.player.angle = Math.atan2(dy, dx);
    }
    
    handleMouseClick(e) {
        if (this.gameState !== 'playing') return;
        
        this.shoot();
    }
    
    shoot() {
        if (this.player.ammo <= 0 || this.player.isReloading) return;
        
        const now = Date.now();
        if (now - this.player.lastShot < 200) return; // Rate limiting
        
        this.player.ammo--;
        this.player.lastShot = now;
        
        // Create bullet
        const bullet = {
            x: this.player.x,
            y: this.player.y,
            angle: this.player.angle,
            speed: 10,
            damage: this.player.damage
        };
        
        this.bullets.push(bullet);
        this.updateHUD();
        
        // Create muzzle flash
        this.createMuzzleFlash();
    }
    
    reload() {
        if (this.player.isReloading || this.player.ammo === this.player.maxAmmo) return;
        
        this.player.isReloading = true;
        setTimeout(() => {
            this.player.ammo = this.player.maxAmmo;
            this.player.isReloading = false;
            this.updateHUD();
        }, this.characters[this.selectedCharacter].reloadTime);
    }
    
    createMuzzleFlash() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.player.x + Math.cos(this.player.angle) * 30,
                y: this.player.y + Math.sin(this.player.angle) * 30,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 20,
                maxLife: 20,
                color: '#ffff00'
            });
        }
    }
    
    spawnEnemies() {
        if (this.enemies.length < 10) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            switch (side) {
                case 0: // Top
                    x = Math.random() * this.canvas.width;
                    y = -50;
                    break;
                case 1: // Right
                    x = this.canvas.width + 50;
                    y = Math.random() * this.canvas.height;
                    break;
                case 2: // Bottom
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + 50;
                    break;
                case 3: // Left
                    x = -50;
                    y = Math.random() * this.canvas.height;
                    break;
            }
            
            this.enemies.push({
                x: x,
                y: y,
                health: 30,
                maxHealth: 30,
                speed: 1 + Math.random() * 2,
                size: 20 + Math.random() * 10
            });
        }
    }
    
    updatePlayer(deltaTime) {
        const speed = this.player.speed * 2;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.player.y -= speed * deltaTime;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.player.y += speed * deltaTime;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.x -= speed * deltaTime;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.x += speed * deltaTime;
        }
        
        // Keep player in bounds
        this.player.x = Math.max(25, Math.min(this.canvas.width - 25, this.player.x));
        this.player.y = Math.max(25, Math.min(this.canvas.height - 25, this.player.y));
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.x += Math.cos(bullet.angle) * bullet.speed * deltaTime;
            bullet.y += Math.sin(bullet.angle) * bullet.speed * deltaTime;
            
            // Remove bullets that are off screen
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.size) {
                    enemy.health -= bullet.damage;
                    this.bullets.splice(i, 1);
                    
                    // Create hit particles
                    for (let k = 0; k < 8; k++) {
                        this.particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 15,
                            vy: (Math.random() - 0.5) * 15,
                            life: 30,
                            maxLife: 30,
                            color: '#ff0000'
                        });
                    }
                    
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                        this.player.score += 100;
                        this.updateHUD();
                    }
                    break;
                }
            }
        }
    }
    
    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed * deltaTime;
                enemy.y += (dy / distance) * enemy.speed * deltaTime;
            }
            
            // Check collision with player
            if (distance < enemy.size + 25) {
                this.player.health -= 1;
                this.updateHUD();
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Spawn new enemies
        if (Math.random() < 0.02) {
            this.spawnEnemies();
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.player.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    updateHUD() {
        // Update health bar
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.querySelector('.health-fill').style.width = healthPercent + '%';
        document.querySelector('.health-text').textContent = this.player.health;
        
        // Update ammo
        document.getElementById('ammoText').textContent = this.player.ammo;
        
        // Update score
        document.getElementById('scoreText').textContent = this.player.score;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState !== 'playing') return;
        
        // Draw grid background
        this.drawGrid();
        
        // Draw particles
        this.drawParticles();
        
        // Draw bullets
        this.drawBullets();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw player
        this.drawPlayer();
        
        // Draw crosshair
        this.drawCrosshair();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        // Draw player body
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(-15, -10, 30, 20);
        
        // Draw player gun
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(10, -3, 20, 6);
        
        // Draw player outline
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-15, -10, 30, 20);
        
        this.ctx.restore();
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            // Draw enemy body
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw enemy outline
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw health bar
            const healthPercent = enemy.health / enemy.maxHealth;
            const barWidth = enemy.size * 2;
            const barHeight = 4;
            
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth, barHeight);
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.size - 10, barWidth * healthPercent, barHeight);
        });
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw bullet trail
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(bullet.x, bullet.y);
            this.ctx.lineTo(
                bullet.x - Math.cos(bullet.angle) * 10,
                bullet.y - Math.sin(bullet.angle) * 10
            );
            this.ctx.stroke();
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawCrosshair() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        
        // Draw crosshair
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 10, centerY);
        this.ctx.lineTo(centerX + 10, centerY);
        this.ctx.moveTo(centerX, centerY - 10);
        this.ctx.lineTo(centerX, centerY + 10);
        this.ctx.stroke();
        
        // Draw circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 16.67; // 60 FPS target
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.updatePlayer(deltaTime);
            this.updateBullets(deltaTime);
            this.updateEnemies(deltaTime);
            this.updateParticles(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HydraHeros();
});