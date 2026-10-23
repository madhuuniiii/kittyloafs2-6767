// Config Variables & Assets Layout Mapping
const CONFIG = {
    // Symmetrical assets allocation mapping straight to falling lanes
    catSprites: [
        'c:\Users\SMILE\Downloads\loaf-removebg-preview.png',
        'c:\Users\SMILE\Downloads\chroma-keyed-video-ezgif.com-video-to-gif-converter.gif',
        'c:\Users\SMILE\Downloads\loaf_of_cat-removebg-preview.png',
        'c:\Users\SMILE\Downloads\____cat_loafing-removebg-preview.png'
    ],
    // Distinct standard hexadecimal fallback colors if image files are missing
    fallbackColors: ['#ff9f43', '#ee5253', '#0abde3', '#10ac84'],
    audioSrc: 'assets/meow.mp3',
    // Hit-zone geometry positioning values matching CSS
    hitZoneTop: undefined, // Evaluated dynamically based on real element layout
    hitZoneBottom: undefined
};

// Difficulty Speeds & Timings Matrix
const DIFFICULTIES = {
    slow: { speed: 3, spawnInterval: 1800 },
    normal: { speed: 5, spawnInterval: 1200 },
    fast: { speed: 8, spawnInterval: 700 }
};

// Game Instance Declarations
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let selectedDifficulty = 'normal';
let score = 0;
let misses = 0;
let timeSurvived = 0;
let highScore = localStorage.getItem('kittyloafs_highscore') || 0;

let catsArray = [];
let gameLoopId = null;
let spawnTimerId = null;
let gameClockId = null;

// Audio context helper fallback setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playMeowSound() {
    const audio = new Audio(CONFIG.audioSrc);
    audio.play().catch(() => {
        // Graceful Synthesized Audio Fallback if assets/meow.mp3 doesn't exist
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        // Classic rising meow frequency configuration
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    });
}

// Window Load Initialization
window.addEventListener('load', () => {
    document.getElementById('high-score-val').textContent = highScore;
    calculateHitZoneBounds();
    window.addEventListener('resize', calculateHitZoneBounds);
    
    // Continuous persistent ambient game loop running in background indefinitely
    startContinuousLoop();
    startSpawningLoop();
});

function calculateHitZoneBounds() {
    const container = document.getElementById('game-container').getBoundingClientRect();
    const hitZoneEl = document.getElementById('hit-zone');
    
    // Mapping internal coordinates metrics relative to 16:9 box container height
    const containerHeight = container.height;
    // Matching CSS metrics configuration: bottom: 80px, height: 90px
    // In standard top-down element flow, bounds calculations scale seamlessly:
    CONFIG.hitZoneTop = containerHeight - 80 - 90;
    CONFIG.hitZoneBottom = containerHeight - 80;
}

// Map Controls mapping matrix definition
const inputMap = { 'q': 0, 'w': 1, 'e': 2, 'r': 3, 'Q': 0, 'W': 1, 'E': 2, 'R': 3 };
window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // Prevent continuous machine-gun styling repeat execution
    if (inputMap[e.key] !== undefined) {
        handleInput(inputMap[e.key]);
    }
});

// Single Unified Gameplay & Intercept Scoring Controller
function handleInput(laneIndex) {
    if (gameState !== 'playing') return;

    // Scan targeting array elements for intersecting targets inside target lane range
    let hitDetected = false;
    
    for (let i = 0; i < catsArray.length; i++) {
        let cat = catsArray[i];
        if (cat.lane === laneIndex && !cat.isHit) {
            // Hit box window threshold calculation validation
            if (cat.y >= CONFIG.hitZoneTop - 30 && cat.y <= CONFIG.hitZoneBottom) {
                // Successful Hit Verified
                cat.isHit = true;
                hitDetected = true;
                score += 10;
                document.getElementById('score-val').textContent = score;
                playMeowSound();
                
                // Trigger visual pop animation execution
                cat.element.classList.add('hit-pop');
                break; 
            }
        }
    }
}

// Base Spawning Logic Implementation
function spawnCat() {
    // Dynamic difficulty parameter checks
    const activeDiff = DIFFICULTIES[selectedDifficulty];
    const targetLane = Math.floor(Math.random() * 4);
    
    const laneElement = document.getElementById(`lane-${targetLane}`);
    const catEl = document.createElement('div');
    catEl.className = 'cat-loaf';
    catEl.style.top = '0px';
    
    // Graceful image handling implementation check setup
    const img = new Image();
    img.src = CONFIG.catSprites[targetLane];
    img.onload = () => {
        catEl.style.backgroundImage = `url('${CONFIG.catSprites[targetLane]}')`;
    };
    img.onerror = () => {
        // Robust Fallback styling if local graphic resources return errors
        catEl.style.backgroundColor = CONFIG.fallbackColors[targetLane];
        catEl.style.border = '2px solid #fff';
    };

    laneElement.appendChild(catEl);

    catsArray.push({
        element: catEl,
        lane: targetLane,
        y: -80,
        speed: activeDiff.speed,
        isHit: false
    });
}

// Centralized Indestructible Frame Execution Engine
function startContinuousLoop() {
    function updateFrame() {
        const containerHeight = document.getElementById('game-container').getBoundingClientRect().height;
        
        for (let i = catsArray.length - 1; i >= 0; i--) {
            let cat = catsArray[i];
            cat.y += cat.speed;
            cat.element.style.transform = `translateY(${cat.y}px)`;

            // Check if object passed structural escape window boundary lines
            if (cat.y > containerHeight) {
                // If it wasn't destroyed via scoring input triggers, verify miss metrics
                if (!cat.isHit && gameState === 'playing') {
                    misses++;
                    document.getElementById('misses-val').textContent = misses;
                    if (misses >= 2) {
                        triggerGameOver();
                    }
                }
                // Memory Cleanup Allocation Management
                cat.element.remove();
                catsArray.splice(i, 1);
            }
        }
        requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);
}

// Independent Dynamic Auto Spawning Controller
function startSpawningLoop() {
    if (spawnTimerId) clearInterval(spawnTimerId);
    
    const interval = DIFFICULTIES[selectedDifficulty].spawnInterval;
    spawnTimerId = setInterval(() => {
        spawnCat();
    }, interval);
}

// UI State State Switching Functions
function startGame(difficulty) {
    selectedDifficulty = difficulty;
    score = 0;
    misses = 0;
    timeSurvived = 0;
    
    // Clear out residual display elements safely
    document.getElementById('score-val').textContent = score;
    document.getElementById('misses-val').textContent = misses;
    document.getElementById('time-val').textContent = timeSurvived;
    
    // Toggle application active layers screens
    document.getElementById('menu-overlay').classList.remove('active');
    document.getElementById('gameover-overlay').classList.remove('active');
    
    gameState = 'playing';
    
    // Start active clock routines
    if (gameClockId) clearInterval(gameClockId);
    gameClockId = setInterval(() => {
        if (gameState === 'playing') {
            timeSurvived++;
            document.getElementById('time-val').textContent = timeSurvived;
        }
    }, 1000);

    // Refresh ambient speed metrics updates
    startSpawningLoop();
}

function triggerGameOver() {
    gameState = 'gameover';
    clearInterval(gameClockId);
    
    // LocalStorage tracking mechanics integration
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('kittyloafs_highscore', highScore);
        document.getElementById('high-score-val').textContent = highScore;
    }
    
    // Render Stats values straight into the scoreboard block overlay interfaces
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-time').textContent = timeSurvived;
    document.getElementById('session-high').textContent = highScore;
    
    document.getElementById('gameover-overlay').classList.add('active');
}

function restartGame() {
    // Retain execution speed metrics, purging out visual assets safely
    clearAllCatElements();
    startGame(selectedDifficulty);
}

function showMainMenu() {
    gameState = 'menu';
    document.getElementById('gameover-overlay').classList.remove('active');
    document.getElementById('menu-overlay').classList.add('active');
    clearAllCatElements();
    // Revert ambient pacing background settings to normal configuration rules
    selectedDifficulty = 'normal';
    startSpawningLoop();
}

function clearAllCatElements() {
    catsArray.forEach(cat => cat.element.remove());
    catsArray = [];
}
