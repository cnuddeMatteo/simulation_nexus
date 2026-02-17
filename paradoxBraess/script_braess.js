const canvas = document.getElementById('braess-canvas');
const ctx = canvas.getContext('2d');

// --- AUDIO SYSTEM (ASMR Traffic - Version Douce) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let lastSoundTime = 0;
const MIN_TIME_BETWEEN_SOUNDS = 100;

function playTrafficSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const now = Date.now();
    if (type !== 'toggle' && now - lastSoundTime < MIN_TIME_BETWEEN_SOUNDS) return;
    lastSoundTime = now;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const audioNow = audioCtx.currentTime;

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'arrive') {
        // Petit "Pop" discret
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(400, audioNow); 
        osc.frequency.exponentialRampToValueAtTime(800, audioNow + 0.1);
        gainNode.gain.setValueAtTime(0.01, audioNow); // Volume très faible
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioNow + 0.1);
        osc.start(audioNow); osc.stop(audioNow + 0.1);
    } 
    else if (type === 'horn') {
        // Klaxon CORRIGÉ : Plus doux, plus grave (Type "Bip" étouffé)
        osc.type = 'triangle'; // Triangle est beaucoup plus doux que Sawtooth
        let freq = 120 + Math.random() * 30; // Grave
        osc.frequency.setValueAtTime(freq, audioNow);
        
        gainNode.gain.setValueAtTime(0.02, audioNow); // À peine audible
        gainNode.gain.linearRampToValueAtTime(0.001, audioNow + 0.2);
        
        osc.start(audioNow); osc.stop(audioNow + 0.2);
    } 
    else if (type === 'toggle') {
        // Bruit mécanique (Reste le même pour le feedback)
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(80, audioNow); 
        osc.frequency.exponentialRampToValueAtTime(40, audioNow + 0.3);
        gainNode.gain.setValueAtTime(0.05, audioNow); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioNow + 0.3);
        osc.start(audioNow); osc.stop(audioNow + 0.3);
    }
}

// --- CONFIGURATION ---
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();

let shortcutOpen = false;
const cars = [];
const MAX_CARS = 600; 

// Gestion du spawn via Slider
let sliderValue = 50; 
let spawnRate = 20; 

let frameCount = 0;
const BASE_SPEED = 9; 
let isSimRunning = false;
let carsFinished = 0;
const timeHistory = [];

const nodes = {
    start: { x: 200, y: canvas.height / 2, label: "DÉPART" },
    top:   { x: canvas.width / 2, y: canvas.height / 2 - 150, label: "A" },
    bot:   { x: canvas.width / 2, y: canvas.height / 2 + 150, label: "B" },
    end:   { x: canvas.width - 200, y: canvas.height / 2, label: "ARRIVÉE" }
};

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
        this.maxSpeed = BASE_SPEED + (Math.random() * 2 - 1); 
        this.currentSpeed = this.maxSpeed;
        this.currentNode = 'start';
        this.width = 20;  
        this.height = 12;
        this.angle = 0;
        this.lastHonkTime = 0; 
        this.offsetY = (Math.random() - 0.5) * 18; 

        this.decidePath();
    }

    // CORRECTION MAJEURE : L'IA peut recalculer son chemin n'importe où
    decidePath() {
        const congestionTop = roads.start_top.count;
        const congestionBot = roads.bot_end.count;
        
        // Coûts perçus
        const costStartTop = congestionTop + 10; 
        const costStartBot = 55; 
        const costTopEnd = 55; 
        const costBotEnd = congestionBot + 10;
        const costShortcut = 0;   

        this.path = []; 

        // CAS 1 : On est au départ
        if (this.currentNode === 'start') {
            let pathTop = costStartTop + costTopEnd;
            let pathBot = costStartBot + costBotEnd;
            let pathZ   = costStartTop + costShortcut + costBotEnd;

            if (shortcutOpen) {
                if (pathZ < pathBot && pathZ < pathTop) this.path = ['top', 'bot', 'end'];
                else if (pathTop < pathBot) this.path = ['top', 'end'];
                else this.path = ['bot', 'end'];
            } else {
                if (pathTop < pathBot) this.path = ['top', 'end'];
                else this.path = ['bot', 'end'];
            }
        }
        // CAS 2 : On est arrivé au noeud A (Top) et on doit décider de la suite
        else if (this.currentNode === 'top') {
            if (shortcutOpen) {
                // Le raccourci est ouvert, on le prend car costShortcut (0) < costTopEnd (55)
                this.path = ['bot', 'end'];
            } else {
                // Le raccourci est fermé, on n'a pas le choix
                this.path = ['end'];
            }
        }
        // CAS 3 : On est au noeud B (Bot)
        else if (this.currentNode === 'bot') {
            this.path = ['end'];
        }

        // Si on vient de recalculer et qu'on a un chemin, on définit la prochaine cible
        if (this.path.length > 0) {
            // Attention : Si on avait déjà une cible, on la garde si elle est cohérente
            // Ici on simplifie : on prend la première étape du nouveau chemin
            this.target = this.path.shift();
            
            // On incrémente le compteur de la nouvelle route choisie
            this.addToRoadCount(this.currentNode, this.target, 1);
        } else {
            // Cas rare où on est déjà à la fin ou perdu
            if (this.currentNode !== 'end') this.target = null;
        }
    }

    addToRoadCount(u, v, val) {
        for (let key in roads) {
            if (roads[key].from === u && roads[key].to === v) roads[key].count += val;
        }
    }

    update() {
        if (!this.target) return true;
        
        // Si la cible est invalide (ex: route fermée pendant le trajet), l'IA le gère via toggleShortcut qui force un decidePath
        
        const dest = nodes[this.target];
        const dx = dest.x - this.x; 
        const dy = dest.y - (this.y - this.offsetY);
        const dist = Math.sqrt(dx*dx + dy*dy);
        this.angle = Math.atan2(dy, dx);

        // --- PHYSIQUE DU BOUCHON ---
        this.currentSpeed = this.maxSpeed;
        let roadKey = this.getCurrentRoadKey();
        
        if (roadKey && roads[roadKey].capacity) {
            let congestion = roads[roadKey].count;
            let friction = 1;
            
            if (congestion > 10) friction = 1.5;
            if (congestion > 30) friction = 4;    
            if (congestion > 50) friction = 15;   
            if (congestion > 70) friction = 50;   
            
            this.currentSpeed = this.maxSpeed / friction;

            if (this.currentSpeed < 1 && Math.random() < 0.1) this.currentSpeed = 0;
            if (this.currentSpeed < 0.1) this.currentSpeed = 0.1;
            
            const now = Date.now();
            if (this.currentSpeed < 1 && Math.random() < 0.002 && (now - this.lastHonkTime > 3000)) {
                playTrafficSound('horn'); this.lastHonkTime = now;
            }
        }

        if (dist < this.currentSpeed) {
            this.x = dest.x; this.y = dest.y; 
            
            // On quitte la route
            this.addToRoadCount(this.currentNode, this.target, -1);
            
            this.currentNode = this.target;
            
            if (this.currentNode === 'end') return true; 
            else {
                if(this.path.length > 0) {
                    this.target = this.path.shift(); 
                    this.addToRoadCount(this.currentNode, this.target, 1);
                } else return true;
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
        ctx.translate(this.x, this.y + this.offsetY);
        ctx.rotate(this.angle);

        let speedRatio = this.currentSpeed / this.maxSpeed;
        let hue = Math.max(0, (speedRatio - 0.2) * 120); 
        hue = Math.min(hue, 120);

        if (speedRatio < 0.4) {
             ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10;
        } else {
             ctx.fillStyle = `hsl(${hue}, 100%, 50%)`; ctx.shadowBlur = 0;
        }

        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = '#fff'; ctx.fillRect(this.width/2 - 2, -this.height/2 + 1, 2, 2); ctx.fillRect(this.width/2 - 2, this.height/2 - 3, 2, 2);
        if (speedRatio < 0.5) {
            ctx.fillStyle = '#ff0000'; ctx.fillRect(-this.width/2, -this.height/2 + 1, 2, 2); ctx.fillRect(-this.width/2, this.height/2 - 3, 2, 2);
        }
        ctx.restore();
    }
}

// --- LOGIQUE SLIDER ---
const slider = document.getElementById('traffic-slider');
if (slider) {
    slider.addEventListener('input', (e) => {
        sliderValue = parseInt(e.target.value);
        spawnRate = Math.max(2, 60 - Math.floor(sliderValue * 0.58));
    });
    let val = parseInt(slider.value);
    spawnRate = Math.max(2, 60 - Math.floor(val * 0.58));
}

// --- MOTEUR ---
function updateGame() {
    if (!isSimRunning) return;
    frameCount++;
    
    if (frameCount % spawnRate === 0 && cars.length < MAX_CARS) {
        cars.push(new Car());
    }

    for (let i = cars.length - 1; i >= 0; i--) {
        if (cars[i].update()) {
            let duration = (Date.now() - cars[i].startTime) / 1000;
            updateStats(duration);
            if(Math.random() < 0.2) playTrafficSound('arrive');
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
            if (avg > 12.0) status.innerHTML = "État : <b style='color:#ef4444'>BOUCHON CRITIQUE</b>";
            else status.innerHTML = "État : <b>Analyse...</b>";
        } else {
            status.innerHTML = "État : <b style='color:#10b981'>Fluide</b>";
        }
    }
}

function drawGame() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.6)'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let key in roads) {
        let r = roads[key];
        if (key === 'shortcut' && !shortcutOpen) {
            let start = nodes[r.from]; let end = nodes[r.to];
            ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
            ctx.stroke(); ctx.setLineDash([]);
            continue;
        }

        let start = nodes[r.from]; let end = nodes[r.to];
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
        
        if (r.capacity) {
            let saturation = Math.min(r.count, 100);
            let roadHue = Math.max(0, 120 - (saturation * 1.5));
            ctx.strokeStyle = `hsl(${roadHue}, 50%, 30%)`; 
            ctx.lineWidth = 22; 
        } else {
            ctx.strokeStyle = '#222'; ctx.lineWidth = 22;
        }
        ctx.stroke();
        
        let midX = (start.x + end.x) / 2; let midY = (start.y + end.y) / 2;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText(r.count, midX, midY);
    }

    for (let key in nodes) {
        let n = nodes[key];
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(n.x, n.y, 25, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
        ctx.font = 'bold 14px Arial'; ctx.fillText(n.label, n.x, n.y);
    }
    cars.forEach(c => c.draw());
}

function loop() { updateGame(); drawGame(); requestAnimationFrame(loop); }

window.startTraffic = function() {
    document.getElementById('start-screen').classList.add('hidden');
    if (audioCtx.state === 'suspended') audioCtx.resume();
    isSimRunning = true; playTrafficSound('toggle');
}

// CORRECTION MAJEURE : On met à jour l'IA de TOUTES les voitures au clic
window.toggleShortcut = function() {
    shortcutOpen = !shortcutOpen;
    const btn = document.getElementById('toggle-road-btn');
    const txt = document.getElementById('btn-text');
    playTrafficSound('toggle');
    
    // --- MISE À JOUR INSTANTANÉE GPS ---
    // On force chaque voiture à re-vérifier son chemin
    cars.forEach(car => {
        // On annule la route en cours (virtuellement)
        if (car.target) car.addToRoadCount(car.currentNode, car.target, -1);
        
        // On recalcule
        car.decidePath();
        
        // On remet la route (soit la même, soit une nouvelle)
        if (car.target) car.addToRoadCount(car.currentNode, car.target, 1);
    });

    if (shortcutOpen) {
        if(btn) btn.classList.add('active'); if(txt) txt.innerText = "FERMER LE RACCOURCI";
    } else {
        if(btn) btn.classList.remove('active'); if(txt) txt.innerText = "OUVRIR LE RACCOURCI";
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
    nodes.start.y = canvas.height / 2; nodes.end.x = canvas.width - 200; nodes.end.y = canvas.height / 2;
    nodes.top.x = canvas.width / 2; nodes.top.y = canvas.height / 2 - 150;
    nodes.bot.x = canvas.width / 2; nodes.bot.y = canvas.height / 2 + 150;
});

const initS = document.getElementById('traffic-slider');
if(initS) {
     let val = parseInt(initS.value);
     spawnRate = Math.max(2, 60 - Math.floor(val * 0.58));
}
loop();