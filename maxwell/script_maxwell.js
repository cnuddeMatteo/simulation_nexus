const canvas = document.getElementById('maxwell-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- AUDIO SYNTHESIZER (Générateur de sons) ---
// On crée le contexte audio (le moteur sonore du navigateur)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSynthSound(type) {
    // Si le contexte est suspendu (sécurité navigateur), on le réactive
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'door_open') {
        // Son de moteur électrique (Onde en dent de scie)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3); // Le moteur accélère
        
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    } 
    else if (type === 'door_close') {
        // Son de fermeture (Moteur qui décélère + Impact bas)
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1); 
        
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }
    else if (type === 'ui') {
        // Petit Bip aigu futuriste
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        
        gainNode.gain.setValueAtTime(0.05, now); // Volume faible
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }
    else if (type === 'impact') {
        // Petit Zap statique
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }
}


// --- CONFIGURATION JEU ---
const particles = [];
const PARTICLE_COUNT = 150;
const SPEED_HOT = 4;    
const SPEED_COLD = 1.5; 
const RADIUS = 4;

let doorOpen = false;
let doorGap = 100;
const wallX = canvas.width / 2;

let isPaused = true; 
let gameStarted = false;

// --- CLASSE PARTICULE ---
class Particle {
    constructor() {
        this.x = Math.random() < 0.5 ? Math.random() * (wallX - 20) : wallX + 20 + Math.random() * (canvas.width - wallX - 20);
        this.y = Math.random() * canvas.height;
        this.isHot = Math.random() < 0.5;
        this.radius = this.isHot ? 5 : 4;
        
        let speed = this.isHot ? SPEED_HOT : SPEED_COLD;
        let angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Rebond Murs Extérieurs
        if (this.x < this.radius || this.x > canvas.width - this.radius) this.vx *= -1;
        if (this.y < this.radius || this.y > canvas.height - this.radius) this.vy *= -1;

        // Rebond Mur Central
        if (Math.abs(this.x - wallX) < this.radius + Math.abs(this.vx)) {
            let inDoorZone = this.y > (canvas.height/2 - doorGap/2) && this.y < (canvas.height/2 + doorGap/2);
            
            if (doorOpen && inDoorZone) {
                // PASSE
            } else {
                // REBONDIT CONTRE LA PORTE/MUR
                
                // Petit son d'impact (limité pour éviter la cacophonie)
                if (Math.random() < 0.1) playSynthSound('impact');

                if (this.x < wallX) {
                    this.x = wallX - this.radius - 2;
                    this.vx = -Math.abs(this.vx);
                } else {
                    this.x = wallX + this.radius + 2;
                    this.vx = Math.abs(this.vx);
                }
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.isHot) {
            ctx.fillStyle = '#d946ef'; 
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#d946ef';
        } else {
            ctx.fillStyle = '#3b82f6';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#3b82f6';
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
    }
}

// --- MOTEUR ---

function init() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

function updateGame() {
    if (isPaused || !gameStarted) return; 

    particles.forEach(p => p.update());
    updateStats();
}

function updateStats() {
    let leftHot = 0, leftCold = 0, leftSpeedSum = 0;
    let rightHot = 0, rightCold = 0, rightSpeedSum = 0;

    particles.forEach(p => {
        let speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (p.x < wallX) {
            if(p.isHot) leftHot++; else leftCold++;
            leftSpeedSum += speed;
        } else {
            if(p.isHot) rightHot++; else rightCold++;
            rightSpeedSum += speed;
        }
    });

    let totalLeft = leftHot + leftCold;
    let totalRight = rightHot + rightCold;

    let avgSpeedLeft = totalLeft > 0 ? (leftSpeedSum / totalLeft) : 0;
    let avgSpeedRight = totalRight > 0 ? (rightSpeedSum / totalRight) : 0;

    // Conversion Celsius ajustée
    let tempLeft = totalLeft > 0 ? (avgSpeedLeft * 25) - 60 : 0;
    let tempRight = totalRight > 0 ? (avgSpeedRight * 25) - 60 : 0;

    document.getElementById('count-left').innerText = totalLeft;
    document.getElementById('temp-left').innerText = Math.round(tempLeft);
    document.getElementById('count-right').innerText = totalRight;
    document.getElementById('temp-right').innerText = Math.round(tempRight);

    let correctParticles = leftCold + rightHot;
    let score = Math.round((correctParticles / PARTICLE_COUNT) * 100);
    
    let scoreEl = document.getElementById('demon-score');
    scoreEl.innerText = score;
    if(score > 60) scoreEl.style.color = "#00ff9d";
    else if(score < 40) scoreEl.style.color = "#ef4444";
    else scoreEl.style.color = "#fff";
}

function drawGame() {
    ctx.fillStyle = 'rgba(26, 11, 46, 0.4)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();

    // Mur
    ctx.beginPath();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    
    ctx.moveTo(wallX, 0);
    ctx.lineTo(wallX, canvas.height/2 - doorGap/2);
    ctx.moveTo(wallX, canvas.height/2 + doorGap/2);
    ctx.lineTo(wallX, canvas.height);
    ctx.stroke();
    
    // Porte
    if (!doorOpen) {
        ctx.beginPath();
        ctx.strokeStyle = '#f0abfc'; 
        ctx.lineWidth = 6;
        ctx.moveTo(wallX, canvas.height/2 - doorGap/2);
        ctx.lineTo(wallX, canvas.height/2 + doorGap/2);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;

    particles.forEach(p => p.draw());
    requestAnimationFrame(loop);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.1)'; 
    ctx.lineWidth = 1;
    const gridSize = 50;
    for(let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for(let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function loop() {
    updateGame();
    drawGame();
}

// --- CONTROLES & SONS ---

function startGame() {
    const screen = document.getElementById('start-screen');
    screen.classList.add('hidden');
    gameStarted = true;
    isPaused = false;
    
    // Son UI de démarrage
    playSynthSound('ui');
    
    init(); 
}

function openDoor() {
    if (!doorOpen) {
        doorOpen = true;
        document.getElementById('btn-door').classList.add('active');
        playSynthSound('door_open'); // SON PORTE
    }
}

function closeDoor() {
    if (doorOpen) {
        doorOpen = false;
        document.getElementById('btn-door').classList.remove('active');
        playSynthSound('door_close'); // SON FERMETURE
    }
}

function resetSim() {
    playSynthSound('ui');
    init();
}

function togglePause() {
    playSynthSound('ui');
    isPaused = !isPaused;
    document.getElementById('btn-pause').innerHTML = isPaused ? '<i class="fas fa-play"></i> Reprendre' : '<i class="fas fa-pause"></i> Pause';
}

// Events Clavier
window.addEventListener('keydown', (e) => {
    // Si la touche est ESPACE
    if (e.code === 'Space') {
        e.preventDefault(); 
        
        if (!e.repeat) openDoor(); // Ouvre la porte si on ne reste pas appuyé
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Bloque aussi l'action par défaut au relâchement
        closeDoor();
    }
});

// Event UI Sounds pour tous les boutons
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        // Optionnel : son au survol, peut être énervant à la longue, je le laisse commenté
        // playSynthSound('ui'); 
    });
});


window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Init
init();
// isPaused reste true jusqu'au clic sur Start
loop();