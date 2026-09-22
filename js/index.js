const size = 18;
const speed = 5;
const board = document.getElementById('board');
const scoreBox = document.getElementById('scoreBox');
const hiscoreBox = document.getElementById('hiscoreBox');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('statusText');
const pauseButton = document.getElementById('pauseButton');
const startButton = document.getElementById('startButton');
const soundButton = document.getElementById('soundButton');
const sounds = {
    food: new Audio('bgmusic/food.mp3'), over: new Audio('bgmusic/over.mp3'),
    move: new Audio('bgmusic/move.mp3'), music: new Audio('bgmusic/theme.mp3')
};
sounds.music.loop = true;
sounds.music.volume = 0.25;
let soundEnabled = false;
let state = 'ready';
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let turnQueued = false;
let food;
let score = 0;
let best = 0;
let lastTick = 0;
try {
    const saved = Number(localStorage.getItem('hiscore'));
    if (Number.isFinite(saved) && saved >= 0) best = saved;
} catch { /* Play normally when storage is unavailable. */ }

function playSound(name) {
    if (!soundEnabled) return;
    const audio = sounds[name];
    if (name !== 'music') audio.currentTime = 0;
    const playback = audio.play();
    if (playback) playback.catch(() => {});
}
function updateScores() {
    scoreBox.textContent = String(score).padStart(2, '0');
    hiscoreBox.textContent = String(best).padStart(2, '0');
}
function reset() {
    snake = [{ x: 7, y: 10 }, { x: 6, y: 10 }, { x: 5, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { ...direction };
    turnQueued = false;
    food = { x: 13, y: 7 };
    score = 0;
    updateScores();
    render();
}
function showOverlay(title, description, button, eyebrow, hint) {
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayDescription').textContent = description;
    document.getElementById('overlayEyebrow').textContent = eyebrow;
    document.getElementById('overlayHint').textContent = hint;
    startButton.textContent = button + ' ↗';
    overlay.hidden = false;
}
function start() {
    if (state !== 'paused') reset();
    state = 'playing';
    overlay.hidden = true;
    statusText.textContent = 'MAKE EVERY BITE COUNT';
    pauseButton.disabled = false;
    pauseButton.textContent = 'Pause Ⅱ';
    lastTick = performance.now();
    playSound('music');
}
function togglePause() {
    if (state === 'paused') { start(); return; }
    if (state !== 'playing') return;
    state = 'paused';
    sounds.music.pause();
    statusText.textContent = 'TAKE YOUR TIME';
    pauseButton.textContent = 'Resume ▷';
    showOverlay('A little breather.', 'Your next bite can wait. Pick up where you left off.', 'Keep going', 'ON YOUR OWN TIME', 'or press space to resume');
}
function finish(won = false) {
    state = 'over';
    sounds.music.pause();
    playSound('over');
    pauseButton.disabled = true;
    statusText.textContent = won ? 'THE WHOLE BOARD. YOURS.' : 'READY FOR ANOTHER ROUND';
    showOverlay(won ? 'Look at you grow.' : 'One more round?', `You collected ${score} ${score === 1 ? 'bite' : 'bites'}. Your personal best is ${best}.`, 'Play again', won ? 'A PERFECT RUN' : 'GOOD THINGS TAKE PRACTICE', 'or press an arrow key to restart');
    startButton.focus({ preventScroll: true });
}
function spawnFood() {
    const free = [];
    for (let y = 1; y <= size; y++) {
        for (let x = 1; x <= size; x++) {
            if (!snake.some(part => part.x === x && part.y === y)) free.push({ x, y });
        }
    }
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}
function tick() {
    direction = { ...nextDirection };
    turnQueued = false;
    // Wrap the next position into the board's 1-based grid on every edge.
    const head = {
        x: (snake[0].x - 1 + direction.x + size) % size + 1,
        y: (snake[0].y - 1 + direction.y + size) % size + 1
    };
    const eating = head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);
    if (body.some(part => part.x === head.x && part.y === head.y)) {
        finish();
        return;
    }
    snake.unshift(head);
    if (eating) {
        score++;
        playSound('food');
        if (score > best) {
            best = score;
            try { localStorage.setItem('hiscore', String(best)); } catch { /* Keep the session best. */ }
        }
        updateScores();
        food = spawnFood();
    } else snake.pop();
    render();
    if (!food) finish(true);
}
function render() {
    board.replaceChildren();
    const facing = direction.x < 0 ? 'left' : direction.y < 0 ? 'up' : direction.y > 0 ? 'down' : 'right';
    snake.forEach((part, index) => {
        const element = document.createElement('div');
        element.className = index === 0 ? `head ${facing}` : 'snake';
        element.style.gridColumnStart = part.x;
        element.style.gridRowStart = part.y;
        board.appendChild(element);
    });
    if (food) {
        const element = document.createElement('div');
        element.className = 'food';
        element.style.gridColumnStart = food.x;
        element.style.gridRowStart = food.y;
        board.appendChild(element);
    }
}
const directions = {
    ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }
};
function steer(key) {
    if (state === 'paused') return;
    if (state !== 'playing') start();
    const requested = directions[key];
    if (turnQueued || (requested.x === -direction.x && requested.y === -direction.y)) return;
    nextDirection = { ...requested };
    turnQueued = true;
    playSound('move');
}
window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (directions[event.key]) {
        event.preventDefault();
        steer(event.key);
    } else if (event.code === 'Space' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') {
        event.preventDefault();
        if (state === 'ready' || state === 'over') start();
        else togglePause();
    }
});
startButton.addEventListener('click', () => { start(); startButton.blur(); });
pauseButton.addEventListener('click', () => { togglePause(); pauseButton.blur(); });
soundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.textContent = soundEnabled ? 'Sound on ♪' : 'Sound off ♪';
    if (soundEnabled && state === 'playing') playSound('music');
    else Object.values(sounds).forEach(audio => audio.pause());
    soundButton.blur();
});
document.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => { steer(button.dataset.direction); button.blur(); });
});
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') togglePause();
});
function main(time) {
    if (state === 'playing' && time - lastTick >= 1000 / speed) {
        lastTick = time;
        tick();
    }
    window.requestAnimationFrame(main);
}
reset();
window.requestAnimationFrame(main);
