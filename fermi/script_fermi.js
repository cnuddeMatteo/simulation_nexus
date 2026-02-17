const canvas = document.getElementById('fermi-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- AUDIO SYSTEM ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
let isMuted = true; 
let droneOsc1, droneOsc2, droneGain; 

function toggleAudio() {
    isMuted = !isMuted;
    const btn = document.getElementById('btn-audio');
    
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!isMuted) {
        btn.innerHTML = '<i class="fas fa-volume-up"></i> Audio On';
        startDrone();
    } else {
        btn.innerHTML = '<i class="fas fa-volume-mute"></i> Audio Off';
        stopDrone();
    }
}

function startDrone() {
    if (droneOsc1) return; 
    droneGain = audioCtx.createGain();
    droneGain.gain.value = 0.05; 
    droneGain.connect(audioCtx.destination);
    droneOsc1 = audioCtx.createOscillator();
    droneOsc1.type = 'sine'; droneOsc1.frequency.value = 55; droneOsc1.connect(droneGain);
    droneOsc2 = audioCtx.createOscillator();
    droneOsc2.type = 'sine'; droneOsc2.frequency.value = 54.5; droneOsc2.connect(droneGain);
    droneOsc1.start(); droneOsc2.start();
}

function stopDrone() {
    if (droneOsc1) {
        droneOsc1.stop(); droneOsc1 = null; droneOsc2.stop(); droneOsc2 = null;
    }
}

function playSound(type) {
    if (isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === 'spawn') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, now); osc.frequency.exponentialRampToValueAtTime(440, now + 0.5); 
        gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'expand') {
        osc.type = 'square'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'die') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.4); 
        gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    }
}

// --- CONFIGURATION ---
const stars = [];
const links = []; 
const STAR_COUNT = 2000; 
const GALAXY_ARMS = 3;
const ARM_SPREAD = 0.5;

let baseSpawnRate = 0;
let baseExpansionRate = 0;
let baseFilterRate = 0;
let timeSpeed = 0; 

let activeCivs = 0;
let deadCivs = 0;
let galacticYear = 0;
let galacticAngle = 0;

let hasStarted = false; 

const camera = { x: 0, y: 0, zoom: 1, isDragging: false, lastX: 0, lastY: 0 };

// --- CLASSE ÉTOILE ---
class Star {
    constructor(x, y, isCenter = false) {
        this.x = x; this.y = y;
        let rand = Math.random();
        if (isCenter) { this.baseColor = '#ffffff'; this.size = Math.random() * 2 + 2; }
        else if (rand > 0.95) { this.baseColor = '#a5b4ff'; this.size = Math.random() * 2 + 1.2; }
        else if (rand > 0.6) { this.baseColor = '#xffdcb'; this.size = Math.random() * 1.5 + 0.8; }
        else { this.baseColor = '#ff8e7f'; this.size = Math.random() * 1.2 + 0.6; }
        this.hasLife = false; this.isDead = false; this.neighbors = [];
    }
    draw() {
        ctx.beginPath();
        let displaySize = this.size;
        if (this.hasLife) {
            ctx.fillStyle = '#00ffff'; ctx.shadowBlur = 15 * camera.zoom; ctx.shadowColor = '#00ffff';
            displaySize = Math.max(this.size * 2, 2 / camera.zoom); 
        } else if (this.isDead) {
            ctx.fillStyle = '#b91c1c'; ctx.shadowBlur = 5 * camera.zoom; ctx.shadowColor = '#b91c1c';
            displaySize = Math.max(this.size * 1.5, 1.5 / camera.zoom);
        } else {
            ctx.fillStyle = this.baseColor; ctx.shadowBlur = 0;
        }
        ctx.arc(this.x, this.y, displaySize, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- GÉNÉRATION ---
function generateGalaxy() {
    stars.length = 0; links.length = 0; activeCivs = 0; deadCivs = 0; galacticYear = 0; galacticAngle = 0;
    
    // RESET DU JEU
    hasStarted = false;
    const instruction = document.getElementById('game-instruction');
    if(instruction) {
        instruction.innerHTML = '<i class="fas fa-mouse-pointer"></i> INITIALISATION REQUISE : CLIQUEZ SUR UNE ÉTOILE';
        instruction.style.color = '#00ffff';
    }

    for(let i=0; i<300; i++) {
        let angle = Math.random() * Math.PI * 2; let dist = Math.random() * 60;
        stars.push(new Star(Math.cos(angle)*dist, Math.sin(angle)*dist, true));
    }
    for (let i = 0; i < STAR_COUNT; i++) {
        let dist = Math.pow(Math.random(), 1.5) * 800; 
        let angle = (i % GALAXY_ARMS) * ((Math.PI * 2) / GALAXY_ARMS);
        angle += dist * 0.004; angle += (Math.random() - 0.5) * ARM_SPREAD;
        stars.push(new Star(Math.cos(angle) * dist, Math.sin(angle) * dist));
    }
    stars.forEach(star => {
        let closeStars = [];
        for(let other of stars) {
            if (star === other) continue;
            let dx = star.x - other.x; let dy = star.y - other.y;
            if (Math.abs(dx) < 60 && Math.abs(dy) < 60) { 
                let d = dx*dx + dy*dy; if (d < 3600) closeStars.push({s: other, dist: d});
            }
        }
        closeStars.sort((a,b) => a.dist - b.dist);
        star.neighbors = closeStars.slice(0, 5).map(item => item.s);
    });
    document.getElementById('star-count').innerText = stars.length;
}

// --- LOGIQUE ---
function update() {
    if (!hasStarted) return; 
    if (timeSpeed <= 0) return;
    
    galacticYear += 5 * timeSpeed;
    document.getElementById('year-count').innerText = Math.floor(galacticYear).toLocaleString();
    
    let currentSpawnRate = baseSpawnRate * timeSpeed;
    let currentFilterRate = baseFilterRate * timeSpeed;
    let currentExpansionRate = baseExpansionRate * timeSpeed;

    if (Math.random() < currentSpawnRate) {
        let target = stars[Math.floor(Math.random() * stars.length)];
        if (!target.hasLife && !target.isDead) {
            target.hasLife = true; activeCivs++;
            if(Math.random() < 0.3) playSound('spawn');
        }
    }
    let living = stars.filter(s => s.hasLife);
    for (let i = links.length - 1; i >= 0; i--) {
        if (!links[i].from.hasLife || !links[i].to.hasLife) links.splice(i, 1);
    }
    living.forEach(star => {
        if (Math.random() < currentFilterRate) {
            star.hasLife = false; star.isDead = true; activeCivs--; deadCivs++;
            if(Math.random() < 0.1) playSound('die'); return;
        }
        if (Math.random() < currentExpansionRate) {
            if (star.neighbors.length > 0) {
                let target = star.neighbors[Math.floor(Math.random() * star.neighbors.length)];
                if (!target.hasLife && !target.isDead) {
                    target.hasLife = true; activeCivs++; links.push({ from: star, to: target });
                    if(Math.random() < 0.05) playSound('expand');
                }
            }
        }
    });
    document.getElementById('civ-active').innerText = activeCivs;
    document.getElementById('civ-dead').innerText = deadCivs;
    checkGameState();
}

function draw() {
    ctx.fillStyle = 'rgba(5, 5, 8, 0.9)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    
    // --- CORRECTION ROTATION ---
    // La rotation ne commence que si le jeu a démarré
    if (hasStarted) {
        galacticAngle += 0.0005; 
    }
    
    ctx.rotate(galacticAngle);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    if (links.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(0.4, 0.2 * camera.zoom)})`;
        ctx.lineWidth = 1.2 / camera.zoom;
        links.forEach(link => { ctx.moveTo(link.from.x, link.from.y); ctx.lineTo(link.to.x, link.to.y); });
        ctx.stroke();
    }
    stars.forEach(s => s.draw());
    ctx.restore();

    update();
    requestAnimationFrame(draw);
}

// --- UTILITAIRE DE CONVERSION DE COORDONNÉES ---
// Cette fonction transforme un clic écran (x,y) en coordonnées Monde (x,y)
// en tenant compte du Zoom ET de la Rotation actuelle.
function getMouseWorldCoords(clientX, clientY) {
    // 1. Coordonnées par rapport au centre de l'écran
    const screenX = clientX - canvas.width / 2;
    const screenY = clientY - canvas.height / 2;

    // 2. Annuler la rotation (Rotation inverse)
    // Formule de rotation vectorielle : 
    // x' = x*cos(-a) - y*sin(-a)
    // y' = x*sin(-a) + y*cos(-a)
    const cos = Math.cos(-galacticAngle);
    const sin = Math.sin(-galacticAngle);

    const rotatedX = screenX * cos - screenX * sin; // Erreur corrigée ci-dessous dans la vraie implémentation
    
    // Correction de la formule mathématique exacte :
    const unrotatedX = screenX * cos - screenY * sin;
    const unrotatedY = screenX * sin + screenY * cos;

    // 3. Annuler le zoom et ajouter la position caméra
    const worldX = unrotatedX / camera.zoom + camera.x;
    const worldY = unrotatedY / camera.zoom + camera.y;

    return { x: worldX, y: worldY };
}

function closeStartMenu() {
    const screen = document.getElementById('start-screen');
    screen.classList.add('hidden');

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    playSound('expand'); // Un petit bip pour confirmer
}

// --- GESTION DES MESSAGES D'ÉTAT ---
function checkGameState() {
    if (!hasStarted) return; // Ne rien faire si le jeu n'a pas commencé

    const instruction = document.getElementById('game-instruction');
    if (!instruction) return;

    const total = stars.length;
    // Seuils
    const dominationThreshold = 0.8; // 80% de la galaxie conquise
    
    // 1. CAS : DOMINATION GALACTIQUE (Trop facile ?)
    if (activeCivs > total * dominationThreshold) {
        instruction.innerHTML = '<i class="fas fa-skull"></i> DOMINATION TOTALE : AUGMENTEZ LE GRAND FILTRE !';
        instruction.style.color = '#ef4444'; // Rouge pour inciter à la destruction
        instruction.className = 'pulse'; // Rétablit l'animation si perdue
    }
    // 2. CAS : EXTINCTION TOTALE (Tout le monde est mort)
    else if (activeCivs === 0 && deadCivs > 0) {
        instruction.innerHTML = '<i class="fas fa-undo"></i> EXTINCTION CONFIRMÉE : RÉINITIALISEZ LA GALAXIE';
        instruction.style.color = '#b91c1c'; // Rouge sombre
        instruction.className = 'pulse';
    }
    // 3. CAS : ETAT NORMAL (En cours de jeu)
    else {
        // On remet le message par défaut si on n'est pas dans les extrêmes
        // On vérifie le texte actuel pour ne pas le spammer (optimisation)
        if (!instruction.innerHTML.includes('PARAMÈTRES')) {
            instruction.innerHTML = '<i class="fas fa-sliders-h"></i> UTILISEZ LES PARAMÈTRES À GAUCHE POUR CONTROLER L\'EXPANSION';
            instruction.style.color = '#fbbf24'; // Jaune
            instruction.className = ''; // Pas de pulse pour le texte standard
        }
    }
}

// --- EVENTS ---
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = 1 + (0.1 * (e.deltaY > 0 ? -1 : 1));
    
    // Zoomer vers la souris en prenant en compte la rotation
    const mousePos = getMouseWorldCoords(e.clientX, e.clientY);
    
    let newZoom = Math.max(0.1, Math.min(camera.zoom * factor, 5));
    
    // Ajustement de la caméra pour garder la souris au même point
    // Note: C'est complexe avec la rotation, ici on simplifie en zoomant juste
    // Si on veut un zoom parfait vers la souris avec rotation, il faut recalculer camera.x/y
    // Pour l'instant, un zoom centré ou approximatif est plus stable pour l'UX
    
    camera.zoom = newZoom;
});

canvas.addEventListener('mousedown', (e) => {
    camera.isDragging = true; 
    camera.lastX = e.clientX; 
    camera.lastY = e.clientY; 
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (camera.isDragging) {
        // Mouvement de la souris à l'écran
        const dx = e.clientX - camera.lastX; 
        const dy = e.clientY - camera.lastY;

        // --- CORRECTION DU MOUVEMENT ---
        // Il faut tourner le vecteur de mouvement de la souris dans le sens INVERSE de la galaxie
        // pour que "Haut" reste "Haut" par rapport à l'écran, peu importe la rotation.
        const cos = Math.cos(-galacticAngle);
        const sin = Math.sin(-galacticAngle);

        // Rotation du vecteur (dx, dy)
        const dxWorld = dx * cos - dy * sin;
        const dyWorld = dx * sin + dy * cos;

        // Application à la caméra
        // -= pour que "Glisser vers le bas" monte la vue (Drag the map standard)
        camera.x -= dxWorld / camera.zoom; 
        camera.y -= dyWorld / camera.zoom;

        camera.lastX = e.clientX; 
        camera.lastY = e.clientY;
    }
});
window.addEventListener('mouseup', () => { camera.isDragging = false; canvas.style.cursor = 'default'; });

canvas.addEventListener('click', (e) => {
    if (camera.isDragging) return;
    if (hasStarted) return; 

    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Utilisation de la nouvelle fonction qui corrige la rotation pour le clic
    const coords = getMouseWorldCoords(e.clientX, e.clientY);

    let closest = null; let minDist = 1500 / camera.zoom;
    for (let star of stars) {
        let dx = star.x - coords.x; 
        let dy = star.y - coords.y; 
        let dist = dx*dx + dy*dy;
        if (dist < minDist) { minDist = dist; closest = star; }
    }
    
    if (closest) {
        closest.hasLife = true; 
        closest.isDead = false; 
        activeCivs++; 
        playSound('spawn');
        hasStarted = true;
        
        const instruction = document.getElementById('game-instruction');
        if(instruction) {
            instruction.innerHTML = '<i class="fas fa-sliders-h"></i> UTILISEZ LES PARAMÈTRES À GAUCHE POUR CONTROLER L\'EXPANSION';
            instruction.style.color = '#fbbf24'; 
        }
    }
});

document.getElementById('spawn-slider').addEventListener('input', (e) => baseSpawnRate = e.target.value / 5000);
document.getElementById('expansion-slider').addEventListener('input', (e) => baseExpansionRate = e.target.value / 500);
document.getElementById('filter-slider').addEventListener('input', (e) => baseFilterRate = e.target.value / 1000);
document.getElementById('speed-slider').addEventListener('input', (e) => timeSpeed = e.target.value / 100);

baseSpawnRate = document.getElementById('spawn-slider').value / 5000;
baseExpansionRate = document.getElementById('expansion-slider').value / 500;
baseFilterRate = document.getElementById('filter-slider').value / 1000;
timeSpeed = document.getElementById('speed-slider').value / 100;

window.resetGalaxy = function() { generateGalaxy(); };
window.clearCivs = function() { 
    stars.forEach(s => { s.hasLife = false; s.isDead = false; });
    links.length = 0; activeCivs = 0; deadCivs = 0; galacticYear = 0;
};
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

generateGalaxy();
draw();