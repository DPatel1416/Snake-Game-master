const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/index.js'), 'utf8');
function game(saved = '4') {
    const nodes = new Map();
    function element() {
        return { style: {}, textContent: '', hidden: false, disabled: false, children: [], listeners: {},
            replaceChildren() { this.children = []; }, appendChild(child) { this.children.push(child); },
            addEventListener(name, fn) { this.listeners[name] = fn; }, setAttribute() {}, focus() {}, blur() {} };
    }
    const events = {};
    const storage = new Map([['hiscore', saved]]);
    const context = {
        Audio: function () { this.play = () => Promise.resolve(); this.pause = () => {}; },
        performance: { now: () => 0 },
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
        window: { requestAnimationFrame() {}, addEventListener: (key, fn) => { events[key] = fn; } },
        document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); },
            createElement: element, querySelectorAll: () => [], addEventListener() {} }
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { run: code => vm.runInContext(code, context), nodes, events, storage };
}
test('initial screen and persisted best', () => {
    const g = game(); assert.equal(g.run('state'), 'ready');
    assert.equal(g.nodes.get('scoreBox').textContent, '00');
    assert.equal(g.nodes.get('hiscoreBox').textContent, '04');
    assert.equal(g.nodes.get('board').children.length, 4);
});
test('start, pause and resume preserve the run', () => {
    const g = game(); g.run('start(); tick(); togglePause()');
    assert.equal(g.run('state'), 'paused'); assert.equal(g.run('snake[0].x'), 8);
    g.run('togglePause()'); assert.equal(g.run('state'), 'playing');
    assert.equal(g.run('snake[0].x'), 8); assert.equal(g.nodes.get('overlay').hidden, true);
});
test('eating moves exactly one cell, grows and saves best', () => {
    const g = game('0'); g.run('start(); food={x:8,y:10}; tick()');
    assert.equal(g.run('snake[0].x'), 8); assert.equal(g.run('snake.length'), 4);
    assert.equal(g.run('score'), 1); assert.equal(g.storage.get('hiscore'), '1');
    assert.equal(g.run('snake.some(p=>p.x===food.x && p.y===food.y)'), false);
});
test('all four edges wrap and preserve direction, score and length', () => {
    const cases = [
        { head: {x:18,y:10}, dir: {x:1,y:0}, expected: {x:1,y:10} },
        { head: {x:1,y:10}, dir: {x:-1,y:0}, expected: {x:18,y:10} },
        { head: {x:10,y:18}, dir: {x:0,y:1}, expected: {x:10,y:1} },
        { head: {x:10,y:1}, dir: {x:0,y:-1}, expected: {x:10,y:18} }
    ];
    for (const {head, dir, expected} of cases) {
        const g = game();
        const body = [head, {x:head.x-dir.x,y:head.y-dir.y}, {x:head.x-2*dir.x,y:head.y-2*dir.y}];
        g.run(`start(); score=3; snake=${JSON.stringify(body)}; nextDirection=${JSON.stringify(dir)}; tick()`);
        assert.equal(g.run('state'), 'playing');
        assert.deepEqual(JSON.parse(g.run('JSON.stringify(snake)')), [expected, ...body.slice(0, -1)]);
        assert.deepEqual(JSON.parse(g.run('JSON.stringify(direction)')), dir);
        assert.equal(g.run('score'), 3);
    }
});
test('food at the wrapped destination is eaten normally', () => {
    const g = game('0');
    g.run('start(); snake=[{x:18,y:10},{x:17,y:10}]; food={x:1,y:10}; tick()');
    assert.equal(g.run('state'), 'playing');
    assert.equal(g.run('snake[0].x'), 1);
    assert.equal(g.run('snake.length'), 3);
    assert.equal(g.run('score'), 1);
    assert.equal(g.nodes.get('scoreBox').textContent, '01');
});
test('wrapping into the body ends the game but a vacated tail is safe', () => {
    const g = game();
    g.run('start(); snake=[{x:18,y:10},{x:1,y:10},{x:2,y:10}]; tick()');
    assert.equal(g.run('state'), 'over');
    g.run('start(); snake=[{x:18,y:10},{x:18,y:11},{x:1,y:11},{x:1,y:10}]; tick()');
    assert.equal(g.run('state'), 'playing');
    assert.equal(g.run('snake[0].x'), 1);
});
test('replay resets score and display', () => {
    const g = game(); g.run('start(); score=5; updateScores(); finish(); start()');
    assert.equal(g.run('score'), 0); assert.equal(g.nodes.get('scoreBox').textContent, '00');
});
test('reverse and multiple turns within one tick are rejected', () => {
    const g = game(); g.run('start(); steer("ArrowLeft"); tick()');
    assert.equal(g.run('snake[0].x'), 8);
    g.run('steer("ArrowUp"); steer("ArrowLeft"); tick()');
    assert.equal(g.run('snake[0].x'), 8); assert.equal(g.run('snake[0].y'), 9);
});
test('unrelated keys do not start or redirect the game', () => {
    const g = game(); g.events.keydown({key:'a',target:{tagName:'BODY'}});
    assert.equal(g.run('state'), 'ready');
});
test('food is only generated in empty cells and full board is detected', () => {
    const g = game(); g.run('snake=[]; for(let y=1;y<=18;y++) for(let x=1;x<=18;x++) snake.push({x,y})');
    assert.equal(g.run('spawnFood()'), null);
    g.run('snake.pop()'); assert.equal(g.run('JSON.stringify(spawnFood())'), '{"x":18,"y":18}');
});
test('self collision ends game; moving into vacated tail is allowed', () => {
    const g = game();
    g.run('start(); snake=[{x:5,y:5},{x:5,y:6},{x:6,y:6},{x:6,y:5}]; tick()');
    assert.equal(g.run('state'), 'playing');
    g.run('snake=[{x:5,y:5},{x:6,y:5},{x:6,y:6},{x:5,y:6}]; tick()');
    assert.equal(g.run('state'), 'over');
});
test('invalid stored score falls back to zero', () => {
    assert.equal(game('not a score').run('best'), 0);
});
