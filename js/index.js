const size = 18;
let speed = 5;
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
    const level = Math.min(7, Math.floor(score / 5) + 1);
    speed = 4 + level;
    document.getElementById('levelBox').textContent = String(level);
    const meter = document.getElementById('speedMeter');
    const filledBars = level + 3;
    meter.setAttribute('aria-valuenow', String(filledBars));
    meter.setAttribute('aria-valuetext', `${speed} cells per second`);
    meter.replaceChildren();
    for (let i = 0; i < 10; i++) {
        const bar = document.createElement('i');
        bar.className = i < filledBars ? 'lit' : '';
        meter.appendChild(bar);
    }
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
    startButton.textContent = button + ' ▷';
    overlay.className = 'overlay';
    overlay.hidden = false;
}
function start() {
    if (state !== 'paused') reset();
    state = 'playing';
    overlay.hidden = true;
    statusText.textContent = 'RUN IN PROGRESS';
    pauseButton.disabled = false;
    pauseButton.textContent = 'Ⅱ Pause';
    lastTick = performance.now();
    playSound('music');
}
function togglePause() {
    if (state === 'paused') { start(); return; }
    if (state !== 'playing') return;
    state = 'paused';
    sounds.music.pause();
    statusText.textContent = 'RUN PAUSED';
    pauseButton.textContent = '▷ Resume';
    showOverlay('Take a breather.', 'Your snake will be right here.', 'RESUME', 'GAME PAUSED', 'P or Space to resume');
}
function finish(won = false) {
    state = 'over';
    sounds.music.pause();
    playSound('over');
    pauseButton.disabled = true;
    statusText.textContent = won ? 'ARENA CLEARED' : 'RUN COMPLETE';
    showOverlay(won ? 'You grew it all.' : 'One more try?', `${score} ${score === 1 ? 'apple' : 'apples'} collected. Best score: ${best}.`, 'PLAY AGAIN', won ? 'BOARD COMPLETE' : 'GAME OVER', 'R or a direction key to restart');
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
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable) return;
    const letter = event.key.toLowerCase();
    const key = { w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight' }[letter] || event.key;
    if (directions[key]) {
        event.preventDefault();
        steer(key);
    } else if (letter === 'p') {
        event.preventDefault();
        if (!event.repeat) togglePause();
    } else if (letter === 'r') {
        event.preventDefault();
        if (!event.repeat) restart();
    } else if (event.code === 'Space' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') {
        event.preventDefault();
        if (event.repeat) return;
        if (state === 'ready' || state === 'over') start();
        else togglePause();
    }
});
function restart() {
    state = 'ready';
    start();
}
document.getElementById('restartButton').addEventListener('click', event => {
    restart();
    event.currentTarget.blur();
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
