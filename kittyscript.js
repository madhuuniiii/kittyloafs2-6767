const CONFIG = {
    catSprites: [
        'c:\Users\SMILE\Downloads\loaf-removebg-preview.png',
        'c:\Users\SMILE\Downloads\chroma-keyed-video-ezgif.com-video-to-gif-converter.gif',
        'c:\Users\SMILE\Downloads\loaf_of_cat-removebg-preview.png',
        'c:\Users\SMILE\Downloads\____cat_loafing-removebg-preview.png'
    ],
    fallbackColors: ['#ff9f43', '#ee5253', '#0abde3', '#10ac84'],
  //doubt how to add audio  audioSrc: '',
    hitZoneTop: undefined,
    hitZoneBottom: undefined
};
const DIFFICULTIES = {
    slow: { speed: 3, spawnInterval: 1800 },
    normal: { speed: 5, spawnInterval: 1200 },
    fast: { speed: 8, spawnInterval: 700 }
};
let gameState = 'menu';
let selectedDifficulty = 'normal';
let score = 0;
let misses = 0;
let timeSurvived = 0;
let highScore = localStorage.getItem('kittyloafs_highscore') || 0;
let catsArray = [];
let gameLoopId = null;
let spawnTimerId = null;
let gameClockId = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playMeowSound() {
    const audio = new Audio(CONFIG.audioSrc);
    audio.play().catch(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
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
window.addEventListener('load', () => {
    document.getElementById('high-score-val').textContent = highScore;
    calculateHitZoneBounds();
    window.addEventListener('resize', calculateHitZoneBounds);
    startContinuousLoop();
    startSpawningLoop();
});
function calculateHitZoneBounds() {
    const container = document.getElementById('game-container').getBoundingClientRect();
    const hitZoneEl = document.getElementById('hit-zone');
    const containerHeight = container.height;
    CONFIG.hitZoneTop = containerHeight - 80 - 90;
    CONFIG.hitZoneBottom = containerHeight - 80;
}
const inputMap = { 'q': 0, 'w': 1, 'e': 2, 'r': 3, 'Q': 0, 'W': 1, 'E': 2, 'R': 3 };
window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (inputMap[e.key] !== undefined) {
        handleInput(inputMap[e.key]);
    }
});
function handleInput(laneIndex) {
    if (gameState !== 'playing') return;
    let hitDetected = false;
    for (let i = 0; i < catsArray.length; i++) {
        let cat = catsArray[i];
        if (cat.lane === laneIndex && !cat.isHit) {
            if (cat.y >= CONFIG.hitZoneTop - 30 && cat.y <= CONFIG.hitZoneBottom) {
                cat.isHit = true;
                hitDetected = true;
                score += 10;
                document.getElementById('score-val').textContent = score;
               // playMeowSound();
                cat.element.classList.add('hit-pop');
                break; 
            }
        }
    }
}
function spawnCat() {
    const activeDiff = DIFFICULTIES[selectedDifficulty];
    const targetLane = Math.floor(Math.random() * 4);
    const laneElement = document.getElementById(`lane-${targetLane}`);
    const catEl = document.createElement('div');
    catEl.className = 'cat-loaf';
    catEl.style.top = '0px';
    const img = new Image();
    img.src = CONFIG.catSprites[targetLane];
    img.onload = () => {
        catEl.style.backgroundImage = `url('${CONFIG.catSprites[targetLane]}')`;
    };
    img.onerror = () => {
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
function startContinuousLoop() {
    function updateFrame() {
        const containerHeight = document.getElementById('game-container').getBoundingClientRect().height;
        for (let i = catsArray.length - 1; i >= 0; i--) {
            let cat = catsArray[i];
            cat.y += cat.speed;
            cat.element.style.transform = `translateY(${cat.y}px)`;
            if (cat.y > containerHeight) {
                if (!cat.isHit && gameState === 'playing') {
                    misses++;
                    document.getElementById('misses-val').textContent = misses;
                    if (misses >= 2) {
                        triggerGameOver();
                    }
                }
    
                cat.element.remove();
                catsArray.splice(i, 1);
            }
        }
        requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);
}
function startSpawningLoop() {
    if (spawnTimerId) clearInterval(spawnTimerId);
    
    const interval = DIFFICULTIES[selectedDifficulty].spawnInterval;
    spawnTimerId = setInterval(() => {
        spawnCat();
    }, interval);
}
function startGame(difficulty) {
    selectedDifficulty = difficulty;
    score = 0;
    misses = 0;
    timeSurvived = 0;
    document.getElementById('score-val').textContent = score;
    document.getElementById('misses-val').textContent = misses;
    document.getElementById('time-val').textContent = timeSurvived;
    document.getElementById('menu-overlay').classList.remove('active');
    document.getElementById('gameover-overlay').classList.remove('active');
    gameState = 'playing';
    if (gameClockId) clearInterval(gameClockId);
    gameClockId = setInterval(() => {
        if (gameState === 'playing') {
            timeSurvived++;
            document.getElementById('time-val').textContent = timeSurvived;
        }
    }, 1000);
    startSpawningLoop();
}

function triggerGameOver() {
    gameState = 'gameover';
    clearInterval(gameClockId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('kittyloafs_highscore', highScore);
        document.getElementById('high-score-val').textContent = highScore;
    }
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-time').textContent = timeSurvived;
    document.getElementById('session-high').textContent = highScore;
    
    document.getElementById('gameover-overlay').classList.add('active');
}

function restartGame() {
    clearAllCatElements();
    startGame(selectedDifficulty);
}

function showMainMenu() {
    gameState = 'menu';
    document.getElementById('gameover-overlay').classList.remove('active');
    document.getElementById('menu-overlay').classList.add('active');
    clearAllCatElements();
    selectedDifficulty = 'normal';
    startSpawningLoop();
}
function clearAllCatElements() {
    catsArray.forEach(cat => cat.element.remove());
    catsArray = [];
}
