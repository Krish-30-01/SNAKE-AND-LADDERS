const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

const SFX = {
    roll: () => playTone(300, 'square', 0.05, 0.05),
    hop: () => playTone(600, 'sine', 0.1, 0.05),
    ladder: () => {
        let time = 0;
        [400, 500, 600, 700, 800].forEach(f => {
            setTimeout(() => playTone(f, 'sine', 0.1, 0.1), time); time += 100;
        });
    },
    snake: () => { playTone(150, 'sawtooth', 0.8, 0.2); playTone(100, 'square', 0.8, 0.2); },
    win: () => {
        let time = 0;
        [523.25, 659.25, 783.99, 1046.50].forEach(f => {
            setTimeout(() => playTone(f, 'square', 0.2, 0.1), time); time += 150;
        });
        setTimeout(() => playTone(1046.50, 'square', 0.6, 0.1), 600);
    }
};

const ladders = { 2:38, 7:14, 8:31, 15:26, 28:84, 51:67, 71:91, 78:98 };
const snakes = { 16:6, 46:25, 49:11, 62:19, 64:60, 74:53, 89:68, 94:72, 95:75, 99:23 };
const pColors = ['var(--p1-color)', 'var(--p2-color)', 'var(--p3-color)', 'var(--p4-color)'];
const posAdjectives = ["SUPER", "FABULOUS", "AMAZING", "SPECTACULAR", "BRILLIANT"];
const negAdjectives = ["BRUTAL", "TERRIBLE", "HORRIBLE", "DEVASTATING", "TRAGIC"];

let playerCount = 2;
let names = [];
let pos = [];
let turn = 0;
let moving = false;
let cursedPlayer = null;
let curseFulfilled = false;

function updateInputs() {
    const count = parseInt(document.getElementById('player-count').value);
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`group${i}`).style.display = i <= count ? 'flex' : 'none';
    }
}

function beginGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume(); 
    playerCount = parseInt(document.getElementById('player-count').value);
    
    for (let i = 0; i < playerCount; i++) {
        names.push(document.getElementById(`name${i+1}`).value || `Player ${i+1}`);
        pos.push(1);
        const playerEl = document.getElementById(`p${i+1}`);
        playerEl.innerText = document.getElementById(`avatar${i+1}`).value;
        playerEl.style.display = 'flex';
    }

    document.getElementById('overlay').style.display = 'none';
    updateStatus();
    initBoard();
}

function initBoard() {
    const b = document.getElementById('board');
    for (let r = 9; r >= 0; r--) {
        let row = [];
        for (let c = 1; c <= 10; c++) row.push(r * 10 + c);
        if (r % 2 !== 0) row.reverse();
        row.forEach(n => {
            const t = document.createElement('div');
            t.className = 'tile'; t.id = `t${n}`; t.innerText = n;
            b.appendChild(t);
        });
    }
    setTimeout(() => { drawBoardAssets(); instantPlaceTokens(); }, 200);
}

function getXY(n) {
    const t = document.getElementById(`t${n}`);
    return { x: t.offsetLeft + 32.5, y: t.offsetTop + 32.5 };
}

function getOffset(playerIndex) {
    const offsets = [{x:-12, y:-18}, {x:8, y:-18}, {x:-12, y:2}, {x:8, y:2}];
    return offsets[playerIndex];
}

function drawBoardAssets() {
    const ctx = document.getElementById('asset-layer').getContext('2d');
    ctx.clearRect(0, 0, 650, 650);
    
    for (let s in ladders) {
        const start = getXY(s); const end = getXY(ladders[s]);
        const ang = Math.atan2(end.y - start.y, end.x - start.x);
        const d = Math.hypot(end.y - start.y, end.x - start.x);
        ctx.save(); ctx.translate(start.x, start.y); ctx.rotate(ang);
        ctx.fillStyle = '#5d4037'; ctx.fillRect(0, -15, d, 6); ctx.fillRect(0, 9, d, 6);
        ctx.fillStyle = '#3e2723';
        for (let i = 10; i < d; i += 20) ctx.fillRect(i, -15, 3, 30);
        ctx.restore();
    }

    for (let head in snakes) {
        const s = getXY(head); const e = getXY(snakes[head]);
        const dist = Math.hypot(e.x - s.x, e.y - s.y);
        const ang = Math.atan2(e.y - s.y, e.x - s.x);
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(0, 0);
        for(let i = 0; i <= dist; i += 5) ctx.lineTo(i, Math.sin(i * 0.05) * 15);
        ctx.lineWidth = 14; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
        ctx.strokeStyle = '#2ecc71'; ctx.setLineDash([8, 20]); ctx.stroke();
        ctx.restore();
    }
}

async function playTurn() {
    if (moving) return;
    moving = true;
    document.getElementById('roll-btn').disabled = true;
    document.getElementById('dice').classList.add('shake-dice');

    if (cursedPlayer === null && pos[turn] >= 90 && !curseFulfilled) {
        cursedPlayer = turn;
    }

    let rollInterval = setInterval(SFX.roll, 100);
    let roll = Math.floor(Math.random() * 6) + 1;

    if (cursedPlayer === turn && !curseFulfilled && pos[turn] + roll >= 99) {
        roll = 99 - pos[turn];
        curseFulfilled = true;
    }

    await new Promise(r => setTimeout(r, 600));
    clearInterval(rollInterval);
    document.getElementById('dice').classList.remove('shake-dice');
    showDice(roll);

    if (pos[turn] + roll <= 100) {
        for (let i = 0; i < roll; i++) {
            pos[turn]++; 
            instantPlaceTokens(true); 
            SFX.hop();
            await new Promise(r => setTimeout(r, 250));
        }

        const jump = ladders[pos[turn]] || snakes[pos[turn]];
        if (jump) {
            const isSnake = !!snakes[pos[turn]];
            await new Promise(r => setTimeout(r, 400));
            const startNode = pos[turn]; pos[turn] = jump; 
            const el = document.getElementById(`p${turn+1}`);
            const startXY = getXY(startNode); const endXY = getXY(jump);
            
            if (isSnake) {
                SFX.snake();
                document.getElementById('game-frame').classList.add('shake-board');
            } else SFX.ladder();

            await animateMove(el, startXY, endXY, isSnake ? 800 : 1200, isSnake, turn);
            document.getElementById('game-frame').classList.remove('shake-board');
        }
    }

    if (pos[turn] === 100) {
        SFX.win();
        document.getElementById('win-text').innerText = `${names[turn]} WINS!`;
        document.getElementById('win-screen').style.display = 'flex';
    } else {
        turn = (turn + 1) % playerCount;
        updateStatus();
        moving = false; document.getElementById('roll-btn').disabled = false;
    }
}

function animateMove(el, startXY, endXY, duration, isSnake, playerIndex) {
    return new Promise(resolve => {
        const startTime = performance.now();
        const off = getOffset(playerIndex);
        function step(time) {
            let progress = (time - startTime) / duration;
            if (progress > 1) progress = 1;
            const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            const x = startXY.x + (endXY.x - startXY.x) * ease;
            const y = startXY.y + (endXY.y - startXY.y) * ease;
            el.style.left = (x + off.x) + 'px'; el.style.top = (y + off.y) + 'px';
            if (progress < 1) requestAnimationFrame(step);
            else resolve();
        }
        requestAnimationFrame(step);
    });
}

function updateStatus() {
    const s = document.getElementById('status-bar');
    s.innerText = `${names[turn].toUpperCase()}'S TURN`;
    s.style.color = pColors[turn];
}

function instantPlaceTokens(hop = false) {
    for (let i = 0; i < playerCount; i++) {
        const c = getXY(pos[i]);
        const el = document.getElementById(`p${i+1}`);
        const off = getOffset(i);
        el.style.left = (c.x + off.x) + 'px';
        el.style.top = (c.y + off.y) + 'px';
    }
}

function showDice(n) {
    document.querySelectorAll('.dot').forEach(d => d.classList.remove('visible'));
    const m = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
    m[n].forEach(id => document.getElementById(`d${id}`).classList.add('visible'));
}
