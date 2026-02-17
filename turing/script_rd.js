const canvas = document.getElementById('rd-canvas');
const ctx = canvas.getContext('2d');

// --- PARAMÈTRES DE LA SIMULATION ---
// On réduit la résolution pour la performance (1 pixel simulé = 4 pixels écran)
const scale = 4; 
let width, height;

// Les deux grilles (état actuel et état futur)
let grid = [];
let next = [];

// Paramètres Gray-Scott (Feed & Kill)
let feed = 0.055;
let kill = 0.062;

// Diffusion rates (A se diffuse plus vite que B)
const dA = 1.0;
const dB = 0.5;

let isRunning = true;
let animationId;

// --- INITIALISATION ---
function init() {
    // Adapter la taille au canvas
    width = Math.floor(window.innerWidth / scale);
    height = Math.floor(window.innerHeight / scale);
    canvas.width = width;
    canvas.height = height;

    // Création des tableaux 2D
    // Chaque cellule est un objet {a: 1, b: 0}
    // A = Produit Chimique 1 (L'océan)
    // B = Produit Chimique 2 (L'encre qui se répand)
    grid = [];
    next = [];
    
    for (let x = 0; x < width; x++) {
        grid[x] = [];
        next[x] = [];
        for (let y = 0; y < height; y++) {
            grid[x][y] = { a: 1, b: 0 };
            next[x][y] = { a: 1, b: 0 };
        }
    }

    // On "ensemence" le milieu avec un carré de produit B
    seedArea(Math.floor(width/2), Math.floor(height/2), 20);
}

function seedArea(cx, cy, r) {
    for (let i = cx - r; i < cx + r; i++) {
        for (let j = cy - r; j < cy + r; j++) {
            if (i >= 0 && i < width && j >= 0 && j < height) {
                grid[i][j].b = 1;
            }
        }
    }
}

// --- MOTEUR PHYSIQUE ---
function update() {
    for (let x = 1; x < width - 1; x++) {
        for (let y = 1; y < height - 1; y++) {
            
            let a = grid[x][y].a;
            let b = grid[x][y].b;

            // Calcul du Laplacien (Diffusion simple : haut+bas+gauche+droite - 4*centre)
            // C'est une version simplifiée de la convolution pour aller plus vite
            let laplaceA = 
                (grid[x+1][y].a + grid[x-1][y].a + grid[x][y+1].a + grid[x][y-1].a) * 0.2 +
                (grid[x+1][y+1].a + grid[x+1][y-1].a + grid[x-1][y+1].a + grid[x-1][y-1].a) * 0.05 - 
                a;

            let laplaceB = 
                (grid[x+1][y].b + grid[x-1][y].b + grid[x][y+1].b + grid[x][y-1].b) * 0.2 +
                (grid[x+1][y+1].b + grid[x+1][y-1].b + grid[x-1][y+1].b + grid[x-1][y-1].b) * 0.05 - 
                b;

            // Formules de Gray-Scott
            // Nouveau A = A + (DiffusionA - Réaction + Nourriture)
            // Nouveau B = B + (DiffusionB + Réaction - Mort)
            let reaction = a * b * b;
            
            next[x][y].a = a + (dA * laplaceA - reaction + feed * (1 - a));
            next[x][y].b = b + (dB * laplaceB + reaction - (kill + feed) * b);

            // Sécurité pour rester entre 0 et 1
            next[x][y].a = Math.min(Math.max(next[x][y].a, 0), 1);
            next[x][y].b = Math.min(Math.max(next[x][y].b, 0), 1);
        }
    }

    // Swap des buffers
    let temp = grid;
    grid = next;
    next = temp;
}

// --- RENDU ---
function draw() {
    // Création de l'image pixel par pixel
    let imgData = ctx.createImageData(width, height);
    let data = imgData.data;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let index = (x + y * width) * 4;
            let a = grid[x][y].a;
            let b = grid[x][y].b;
            
            // Visualisation : C = A - B
            let c = Math.floor((a - b) * 255);
            c = Math.min(Math.max(c, 0), 255);

            // Palette Cyan / Noir
            // Si c est bas (beaucoup de B), c'est cyan brillant
            // Si c est haut (beaucoup de A), c'est sombre
            
            // Rouge (0)
            data[index + 0] = 0; 
            // Vert (dégradé)
            data[index + 1] = 255 - c; 
            // Bleu (plus intense)
            data[index + 2] = 255 - c + 50; 
            // Alpha
            data[index + 3] = 255;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function loop() {
    if (isRunning) {
        // Pour accélérer, on fait plusieurs updates physiques pour 1 dessin
        for(let i=0; i<8; i++) update(); 
        draw();
        animationId = requestAnimationFrame(loop);
    }
}

// --- UI & INTERACTIONS ---

// Sliders
const feedSlider = document.getElementById('feed-slider');
const killSlider = document.getElementById('kill-slider');
const feedVal = document.getElementById('feed-val');
const killVal = document.getElementById('kill-val');

feedSlider.addEventListener('input', (e) => {
    feed = parseFloat(e.target.value);
    feedVal.innerText = feed.toFixed(3);
});

killSlider.addEventListener('input', (e) => {
    kill = parseFloat(e.target.value);
    killVal.innerText = kill.toFixed(3);
});

// Presets
const presets = {
    'coral': { f: 0.0545, k: 0.062 },
    'mitosis': { f: 0.0367, k: 0.0649 },
    'fingerprint': { f: 0.0527, k: 0.0616 }, // Correction de valeur
    'worms': { f: 0.078, k: 0.061 },
    'chaos': { f: 0.026, k: 0.051 }
};

function applyPreset() {
    const val = document.getElementById('preset-select').value;
    if(presets[val]) {
        feed = presets[val].f;
        kill = presets[val].k;
        
        // Mettre à jour les sliders
        feedSlider.value = feed;
        killSlider.value = kill;
        feedVal.innerText = feed;
        killVal.innerText = kill;
        
        resetSim(); // On reset pour bien voir le motif se former
    }
}

// Contrôles
function toggleSim() {
    isRunning = !isRunning;
    const btn = document.getElementById('btn-play');
    if (isRunning) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        loop();
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Lancer';
        cancelAnimationFrame(animationId);
    }
}

function resetSim() {
    // Reset grille A=1 B=0
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            grid[x][y] = { a: 1, b: 0 };
            next[x][y] = { a: 1, b: 0 };
        }
    }
    // Re-seed random centers
    for(let i=0; i<5; i++) {
        seedArea(
            Math.floor(Math.random() * width), 
            Math.floor(Math.random() * height), 
            10
        );
    }
    if(!isRunning) draw();
}

// Interaction Souris (Ajouter du B)
let isDragging = false;
canvas.addEventListener('mousedown', () => isDragging = true);
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mousemove', (e) => {
    if(!isDragging) return;
    const x = Math.floor(e.clientX / scale);
    const y = Math.floor(e.clientY / scale);
    seedArea(x, y, 5); // Pinceau de taille 5
});

// --- MENU TOGGLE ---
function toggleMenu() {
    const panel = document.getElementById('main-panel');
    panel.classList.toggle('minimized');
}
function startLab() {
    document.getElementById('start-screen').classList.add('hidden');
    
    if (!isRunning) toggleSimulation();
}
// Resize
window.addEventListener('resize', init);

// --- DÉMARRAGE ---

init();

const btn = document.getElementById('btn-play');
if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> Pause';

loop();

