const canvas = document.getElementById('braess-canvas');
const ctx = canvas.getContext('2d');

// Force canvas to fill screen immediately
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

// --- CONFIGURATION ---
let shortcutOpen = false;
const cars = [];
const MAX_CARS = 150; 
const spawnRate = 30;
let frameCount = 0;
const BASE_SPEED = 5; 

// Statistiques
let totalTripTime = 0;
let carsFinished = 0;
const timeHistory = [];

// Les Noeuds (Initialisés après le resize)
const nodes = {
    start: { x: 200, y: canvas.height / 2, label: "DÉPART" },
    top:   { x: canvas.width / 2, y: canvas.height / 2 - 150, label: "A" },
    bot:   { x: canvas.width / 2, y: canvas.height / 2 + 150, label: "B" },
    end:   { x: canvas.width - 200, y: canvas.height / 2, label: "ARRIVÉE" }
};

// Les Routes
const roads = {
    start_top: { from: 'start', to: 'top', count: 0, capacity: true, color: '#f59e0b' },
    start_bot: { from: 'start', to: 'bot', count: 0, capacity: false, color: '#3b82f6' },
    top_end:   { from: 'top', to: 'end',   count: 0, capacity: false, color: '#3b82f6' },
    bot_end:   { from: 'bot', to: 'end',   count: 0, capacity: true, color: '#f59e0b' },
    shortcut:  { from: 'top', to: 'bot',   count: 0, capacity: false, color: '#ef4444' }
};

// --- CLASS CAR ---
class Car {
    constructor() {
        this.x = nodes.start.x;
        this.y = nodes.start.y;
        this.target = null;
        this.path = [];
        this.startTime = Date.now();
        this.maxSpeed = BASE_SPEED;
        this.currentSpeed = BASE_SPEED;
        this.currentNode = 'start';
        this.width = 16;
        this.height = 8;
        this.angle = 0;
        this.decidePath();
    }

    decidePath() {
        // Coûts (Heuristique simple)
        const costStartTop = roads.start_top.count * 1.8; 
        const costStartBot = 50;
        const costTopEnd = 50;
        const costBotEnd = roads.bot_end.count * 1.8;
        const costShortcut = 1;

        if (this.currentNode === 'start') {
            let pathTop = costStartTop + costTopEnd;
            let pathBot = costStartBot + costBotEnd;
            let pathZ   = costStartTop + costShortcut + costBotEnd;

            this.path = []; // Reset path

            if (shortcutOpen) {
                // Si le raccourci semble plus rapide, on le prend
                if (pathZ < pathBot && pathZ < pathTop) {
                    this.path = ['top', 'bot', 'end'];
                } else if (pathTop < pathBot) {
                    this.path = ['top', 'end'];
                } else {
                    this.path = ['bot', 'end'];
                }
            } else {
                if (pathTop < pathBot) {
                    this.path = ['top', 'end'];
                } else {
                    this.path = ['bot', 'end'];
                }
            }
        }
        
        if (this.path.length > 0) {
            this.target = this.path.shift();
            this.addToRoadCount(this.currentNode, this.target, 1);
        } else {
            this.target = null;
        }
    }

    addToRoadCount(u, v, val) {
        for (let key in roads) {
            if (roads[key].from === u && roads[key].to === v) {
                roads[key].count += val;
            }
        }
    }

    update() {
        if (!this.target) return true; // Arrivé

        const dest = nodes[this.target];
        // Calcul distance
        const dx = dest.x - this.x;
        const dy = dest.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        this.angle = Math.atan2(dy, dx);

        // Gestion Vitesse
        this.currentSpeed = this.maxSpeed;
        let roadKey = this.getCurrentRoadKey();
        
        if (roadKey && roads[roadKey].capacity) {
            let congestion = roads[roadKey].count;
            // Facteur de ralentissement
            this.currentSpeed = Math.max(0.5, this.maxSpeed - (congestion * 0.25));
        }

        // Déplacement
        if (dist < this.currentSpeed) {
            this.x = dest.x;
            this.y = dest.y;
            // On quitte la route actuelle
            this.addToRoadCount(this.currentNode, this.target, -1);
            this.currentNode = this.target;
            
            if (this.currentNode === 'end') {
                return true; // Fin du voyage
            } else {
                // Étape suivante
                if(this.path.length > 0) {
                    this.target = this.path.shift();
                    // On entre sur la nouvelle route
                    this.addToRoadCount(this.currentNode, this.target, 1);
                } else {
                    return true;
                }
            }
        } else {
            this.x += Math.cos(this.angle) * this.currentSpeed;
            this.y += Math.sin(this.angle) * this.currentSpeed;
        }
        return false;
    }

    getCurrentRoadKey() {
        for (let key in roads) {
            if (roads[key].from === this.currentNode && roads[key].to === this.target) return key;
        }
        return null;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Couleur selon vitesse
        let speedRatio = this.currentSpeed / this.maxSpeed;
        let hue = speedRatio * 120; // 0=Rouge, 120=Vert
        
        if (speedRatio < 0.3) {
             ctx.fillStyle = '#ff0000';
             ctx.shadowColor = '#ff0000';
             ctx.shadowBlur = 10;
        } else {
             ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
             ctx.shadowBlur = 0;
        }

        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Phares
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.width/2 - 2, -this.height/2 + 1, 2, 2);
        ctx.fillRect(this.width/2 - 2, this.height/2 - 3, 2, 2);

        ctx.restore();
    }
}

// --- MOTEUR ---

function updateGame() {
    frameCount++;
    
    // Spawner
    if (frameCount % spawnRate === 0 && cars.length < MAX_CARS) {
        cars.push(new Car());
    }

    // Update cars
    for (let i = cars.length - 1; i >= 0; i--) {
        if (cars[i].update()) {
            let duration = (Date.now() - cars[i].startTime) / 1000;
            updateStats(duration);
            cars.splice(i, 1);
        }
    }
}

function updateStats(time) {
    carsFinished++;
    timeHistory.push(time);
    if (timeHistory.length > 50) timeHistory.shift();

    let sum = timeHistory.reduce((a, b) => a + b, 0);
    let avg = sum / timeHistory.length || 0;

    const avgEl = document.getElementById('avg-time');
    const countEl = document.getElementById('car-count');
    const status = document.getElementById('paradox-status');

    if(avgEl) avgEl.innerText = avg.toFixed(2) + "s";
    if(countEl) countEl.innerText = cars.length;

    if(status) {
        if (shortcutOpen) {
            if (avg > 6.5) status.innerHTML = "État : <b style='color:#ef4444'>PARADOXE ACTIF (Bouchons)</b>";
            else status.innerHTML = "État : <b>Analyse en cours...</b>";
        } else {
            status.innerHTML = "État : <b style='color:#10b981'>Optimal (Fluide)</b>";
        }
    }
}

function drawGame() {
    // Fond avec traînée
    ctx.fillStyle = 'rgba(10, 10, 10, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessin Routes
    for (let key in roads) {
        let r = roads[key];
        if (key === 'shortcut' && !shortcutOpen) continue;

        let start = nodes[r.from];
        let end = nodes[r.to];

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        
        // Couleur route
        if (r.capacity) {
            let saturation = Math.min(r.count * 8, 100);
            ctx.strokeStyle = `hsl(${40 - (saturation/2.5)}, 100%, 50%)`; 
            ctx.lineWidth = 8 + (r.count/1.5); 
        } else {
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 10;
        }
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Compteur
        let midX = (start.x + end.x) / 2;
        let midY = (start.y + end.y) / 2;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(r.count, midX, midY - 15);
    }

    // Dessin Noeuds
    for (let key in nodes) {
        let n = nodes[key];
        ctx.shadowBlur = 20; 
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#222';
        ctx.beginPath(); 
        ctx.arc(n.x, n.y, 25, 0, Math.PI*2); 
        ctx.fill();
        ctx.strokeStyle = '#fff'; 
        ctx.lineWidth = 3; 
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#fff'; 
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle'; 
        ctx.font = 'bold 12px Arial';
        ctx.fillText(n.label, n.x, n.y);
    }

    // Dessin Voitures
    cars.forEach(c => c.draw());
}

function loop() {
    updateGame();
    drawGame();
    requestAnimationFrame(loop);
}

// --- INTERACTION ---
function toggleShortcut() {
    shortcutOpen = !shortcutOpen;
    const btn = document.getElementById('toggle-road-btn');
    const txt = document.getElementById('btn-text');
    
    if (shortcutOpen) {
        if(btn) btn.classList.add('active');
        if(txt) txt.innerText = "FERMER LE RACCOURCI";
        timeHistory.length = 0; 
    } else {
        if(btn) btn.classList.remove('active');
        if(txt) txt.innerText = "OUVRIR LE RACCOURCI";
        timeHistory.length = 0;
    }
}

// Resize avec mise à jour des positions
window.addEventListener('resize', () => {
    resizeCanvas();
    nodes.start.y = canvas.height / 2;
    nodes.end.x = canvas.width - 200;
    nodes.end.y = canvas.height / 2;
    nodes.top.x = canvas.width / 2;
    nodes.top.y = canvas.height / 2 - 150;
    nodes.bot.x = canvas.width / 2;
    nodes.bot.y = canvas.height / 2 + 150;
});

// Lancement
loop();