const canvas = document.getElementById('hotel-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- AUDIO (Synthé Industriel) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'slide') {
        // Son de glissement mécanique
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'arrive') {
        // Son de validation
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    }
}

// --- CONFIGURATION ---
const ROOM_WIDTH = 120;
const ROOM_HEIGHT = 180;
const ROOM_GAP = 20;
const Y_POS = canvas.height / 2 - ROOM_HEIGHT / 2;

// État de la caméra (Scroll)
let cameraX = 0;
let isDragging = false;
let lastX = 0;

// Les Invités
// Au début, chaque chambre N a un invité N.
// Structure: { id: 1, currentRoom: 1, targetRoom: 1, color: '...', isMoving: false, animProgress: 0 }
let guests = [];
const VISIBLE_RANGE = 50; // Nombre de chambres gérées en mémoire vive

// Générer les premiers invités
function initGuests() {
    guests = [];
    for(let i = 1; i <= 200; i++) {
        guests.push({
            id: i, // L'ID reste le même (c'est l'identité de la personne)
            currentRoom: i,
            targetRoom: i, // Au début, ils sont chez eux
            x: 0, // Sera calculé
            color: `hsl(${i * 15 % 360}, 70%, 50%)`, // Couleurs variées
            isNew: false // Pour marquer les nouveaux arrivants
        });
    }
}

// --- LOGIQUE D'ANIMATION ---
let isAnimating = false;

function update() {
    // Interpolation pour le mouvement
    let movingCount = 0;
    
    guests.forEach(guest => {
        // Position X de la chambre cible
        // Formule : (NuméroChambre - 1) * (Largeur + Ecart)
        let targetX = (guest.targetRoom - 1) * (ROOM_WIDTH + ROOM_GAP) + 100; // +100 padding
        
        // Position X de la chambre actuelle (départ)
        let currentRoomX = (guest.currentRoom - 1) * (ROOM_WIDTH + ROOM_GAP) + 100;

        // Si on doit bouger
        if (guest.currentRoom !== guest.targetRoom) {
            // Lerp (Linear Interpolation) pour fluidité
            // On rapproche la chambre actuelle de la cible virtuellement
            // Astuce : On utilise une variable flottante intermédiaire pour l'animation
            if (!guest.animX) guest.animX = currentRoomX;
            
            let dx = targetX - guest.animX;
            guest.animX += dx * 0.1; // Vitesse d'animation

            if (Math.abs(dx) < 1) {
                guest.animX = targetX;
                guest.currentRoom = guest.targetRoom; // Arrivé !
                if(guest.isNew) {
                    guest.isNew = false;
                    playSound('arrive');
                }
            }
            movingCount++;
        } else {
            guest.animX = targetX;
        }
    });

    isAnimating = movingCount > 0;
}

function draw() {
    // Fond (Grille Cyberpunk)
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();

    ctx.save();
    // Appliquer la caméra
    ctx.translate(cameraX, 0);

    // DESSINER LES CHAMBRES (Le décor)
    // On ne dessine que celles visibles à l'écran pour la perf
    let startRoom = Math.floor(-cameraX / (ROOM_WIDTH + ROOM_GAP));
    let endRoom = startRoom + Math.ceil(canvas.width / (ROOM_WIDTH + ROOM_GAP)) + 1;
    startRoom = Math.max(1, startRoom);

    for (let i = startRoom; i <= endRoom + 5; i++) {
        let x = (i - 1) * (ROOM_WIDTH + ROOM_GAP) + 100;
        
        // Cadre de la chambre
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, Y_POS, ROOM_WIDTH, ROOM_HEIGHT);
        
        // Numéro de chambre (Au dessus)
        ctx.fillStyle = '#666';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`ROOM ${i}`, x + ROOM_WIDTH/2, Y_POS - 15);

        // Porte (Design)
        ctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
        ctx.fillRect(x + 10, Y_POS + 10, ROOM_WIDTH - 20, ROOM_HEIGHT - 10);
    }

    // DESSINER LES INVITÉS (Par dessus)
    guests.forEach(guest => {
        // Ne dessiner que si visible (avec une marge large pour les anims)
        if (guest.animX + cameraX > -200 && guest.animX + cameraX < canvas.width + 200) {
            
            let x = guest.animX;
            let y = Y_POS + ROOM_HEIGHT - 60;

            // Corps
            ctx.fillStyle = guest.isNew ? '#fff' : guest.color;
            // Effet de "Glow" si nouveau
            if (guest.isNew) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#fff';
            } else {
                ctx.shadowBlur = 10;
                ctx.shadowColor = guest.color;
            }

            // Simple icône de bonhomme (Cercle + Rect)
            ctx.beginPath();
            ctx.arc(x + ROOM_WIDTH/2, y, 15, 0, Math.PI*2); // Tête
            ctx.fill();
            ctx.fillRect(x + ROOM_WIDTH/2 - 15, y + 20, 30, 40); // Corps
            
            // Numéro de l'invité (Badge)
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(guest.id, x + ROOM_WIDTH/2, y + 45);
        }
    });

    ctx.restore();

    update();
    requestAnimationFrame(draw);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offsetX = cameraX % gridSize;
    
    for(let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for(let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function startSystem() {
    const screen = document.getElementById('start-screen');
    screen.classList.add('hidden');
    
    // On lance l'audio context si nécessaire
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Petit son de démarrage
    playSound('arrive');
}

// --- PARADOXES ---

// 1. Un nouvel invité arrive (Tout le monde fait n -> n+1)
window.paradoxOne = function() {
    playSound('slide');
    
    // Tout le monde se décale
    guests.forEach(g => {
        g.targetRoom = g.currentRoom + 1;
    });

    // Créer le nouvel invité pour la chambre 1
    // On le met hors écran à gauche pour qu'il arrive
    setTimeout(() => {
        guests.push({
            id: 'NEW',
            currentRoom: -1, // Hors champ
            targetRoom: 1,
            animX: -200, // Position visuelle départ
            color: '#fff',
            isNew: true
        });
    }, 200);
}

// 2. Bus Infini (Tout le monde fait n -> 2n)
window.paradoxBus = function() {
    playSound('slide');

    // Les anciens font x2
    guests.forEach(g => {
        g.targetRoom = g.currentRoom * 2;
    });

    // On remplit les trous (chambres impaires) avec des nouveaux
    // Pour la démo, on en ajoute juste quelques-uns pour l'effet visuel
    setTimeout(() => {
        for(let i=0; i<20; i++) { // On simule l'arrivée des 20 premiers du bus
            let roomNumber = (i * 2) + 1; // 1, 3, 5, 7...
            guests.push({
                id: 'BUS',
                currentRoom: -1, 
                targetRoom: roomNumber,
                animX: -200 - (i*50), // Ils arrivent en file indienne
                color: '#fff',
                isNew: true
            });
        }
    }, 500);
}

// --- EVENTS ---

// Scroll Drag
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    canvas.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let dx = e.clientX - lastX;
        cameraX += dx;
        // Limite gauche
        if (cameraX > 50) cameraX = 50;
        lastX = e.clientX;
    }
});
window.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });

// Resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Init
initGuests();
draw();