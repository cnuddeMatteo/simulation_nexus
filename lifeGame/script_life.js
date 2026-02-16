const canvas = document.getElementById('life-canvas');
const ctx = canvas.getContext('2d');

// --- CONFIGURATION ---
const cellSize = 10; 
let cols, rows;
let grid = [];
let isRunning = false;
let generation = 0;
let animationId;
let fps = 30; // Vitesse par défaut

// Couleurs (Style Matrix/Bio)
const colorAlive = '#00ff9d';
const colorTrail = [
    '#050505', '#001a10', '#003320', '#004d30', '#006640',
    '#008050', '#009960', '#00b370', '#00cc80', '#00e690', '#00ff9d'
];

// --- INITIALISATION ---
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / cellSize);
    rows = Math.floor(canvas.height / cellSize);
    
    grid = new Array(cols).fill(null).map(() => 
        new Array(rows).fill(null).map(() => ({ state: 0, value: 0 }))
    );

    randomize();
    draw();
}

// --- LOGIQUE DU JEU ---
function update() {
    let nextGrid = grid.map(arr => arr.map(cell => ({ ...cell })));
    let population = 0;

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let neighbors = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    let nx = (x + i + cols) % cols;
                    let ny = (y + j + rows) % rows;
                    neighbors += grid[nx][ny].state;
                }
            }

            let cell = grid[x][y];
            // Règles standards
            if (cell.state === 1) {
                if (neighbors < 2 || neighbors > 3) nextGrid[x][y].state = 0;
                else nextGrid[x][y].state = 1;
            } else {
                if (neighbors === 3) nextGrid[x][y].state = 1;
            }

            // Gestion de l'affichage (Traînée)
            if (nextGrid[x][y].state === 1) {
                nextGrid[x][y].value = 1;
                population++;
            } else if (nextGrid[x][y].value > 0) {
                nextGrid[x][y].value -= 0.08; // Disparition un peu plus rapide
                if (nextGrid[x][y].value < 0) nextGrid[x][y].value = 0;
            }
        }
    }
    grid = nextGrid;
    generation++;
    updateUI(population);
}

// --- RENDU GRAPHIQUE ---
function draw() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let val = grid[x][y].value;
            if (val > 0) {
                let colorIndex = Math.floor(val * 10);
                if(colorIndex > 10) colorIndex = 10;
                ctx.fillStyle = colorTrail[colorIndex];
                
                if (val >= 0.9) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = colorAlive;
                    ctx.beginPath();
                    ctx.arc(x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize/2 - 1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
    }
}

// --- BOUCLE D'ANIMATION (Gestion Vitesse) ---
function loop() {
    if (isRunning) {
        // On utilise setTimeout pour contrôler les FPS
        setTimeout(() => {
            if(isRunning) { // Double vérification
                update();
                draw();
                animationId = requestAnimationFrame(loop);
            }
        }, 1000 / fps);
    }
}

// --- INTERACTION ---
function toggleSim() {
    isRunning = !isRunning;
    const btn = document.getElementById('btn-play');
    if (isRunning) {
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        loop();
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Lancer';
    }
}

function randomize() {
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            grid[x][y].state = Math.random() > 0.85 ? 1 : 0;
            grid[x][y].value = grid[x][y].state;
        }
    }
    generation = 0;
    draw();
}

function clearGrid() {
    grid.forEach(row => row.forEach(cell => { cell.state = 0; cell.value = 0; }));
    generation = 0;
    draw();
    if(isRunning) toggleSim();
}

function updateUI(pop) {
    document.getElementById('gen-count').innerText = generation;
    document.getElementById('pop-count').innerText = pop;
}

// Changement de vitesse via le slider
document.getElementById('speed-range').addEventListener('input', (e) => {
    fps = parseInt(e.target.value);
});

// --- GESTION DES MODÈLES (PRESETS) ---
function loadSelectedPreset() {
    const type = document.getElementById('preset-select').value;
    if(!type) return;

    // On vide mais on garde l'animation si elle tourne
    grid.forEach(row => row.forEach(cell => { cell.state = 0; cell.value = 0; }));
    
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);

    const patterns = {
        'glider': [[0, -1], [1, 0], [-1, 1], [0, 1], [1, 1]],
        'lwss': [[-2,-1], [1,-1], [-3,0], [-3,1], [1,1], [-3,2], [-2,2], [-1,2], [0,2]], // Vaisseau spatial
        'pulsar': [], // Généré par boucle ci-dessous
        'diehard': [[-3,0], [-2,0], [-2,1], [2,1], [3,-1], [3,1], [4,1]], // Disparaît après 130 gen
        'gosper': [ // Le fameux canon
            [0,4], [0,5], [1,4], [1,5], [10,4], [10,5], [10,6], [11,3], [11,7], [12,2], [12,8],
            [13,2], [13,8], [14,5], [15,3], [15,7], [16,4], [16,5], [16,6], [17,5], [20,2], [20,3],
            [20,4], [21,2], [21,3], [21,4], [22,1], [22,5], [24,0], [24,1], [24,5], [24,6], [34,2], [34,3], [35,2], [35,3]
        ]
    };

    // Génération spécifique pour le Pulsar
    for(let i=2; i<=4; i++) {
        let sets = [[-1,-1], [-1,1], [1,-1], [1,1]]; // 4 quadrants
        sets.forEach(([mx, my]) => {
            patterns['pulsar'].push([i*mx, 1*my], [i*mx, 6*my], [1*mx, i*my], [6*mx, i*my]);
            patterns['pulsar'].push([i*mx, -1*my], [i*mx, -6*my], [1*mx, -i*my], [6*mx, -i*my]);
        });
    }

    // Application du motif
    if (patterns[type]) {
        // Pour Gosper, on décale un peu vers la gauche et le haut car il tire vers le bas-droite
        let offsetX = (type === 'gosper') ? cx - 15 : cx;
        let offsetY = (type === 'gosper') ? cy - 5 : cy;

        patterns[type].forEach(([dx, dy]) => {
            // Vérification des limites pour éviter les crashs
            if (offsetX + dx >= 0 && offsetX + dx < cols && offsetY + dy >= 0 && offsetY + dy < rows) {
                grid[offsetX + dx][offsetY + dy].state = 1;
                grid[offsetX + dx][offsetY + dy].value = 1;
            }
        });
    }
    
    draw();
}

// Dessiner souris
let isDrawing = false;
canvas.addEventListener('mousedown', () => isDrawing = true);
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const x = Math.floor(e.clientX / cellSize);
    const y = Math.floor(e.clientY / cellSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        grid[x][y].state = 1; grid[x][y].value = 1;
        if (!isRunning) draw();
    }
});

window.addEventListener('resize', () => init());
init();