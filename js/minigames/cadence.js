// 答數:班長喊 4 拍,你在接下來 4 拍照著答(只在他有喊的拍子點)。節奏+記憶。
import { W, H } from '../core/screen.js';
import { rect, rrect, text, fillRR, vgrad, vignette, bubble, rand, COLOR } from '../core/ui.js';
import { drawSprite, shadow } from '../core/sprite.js';
import { SERGEANT, SOLDIER } from '../data/sprites.js';
import { Sound } from '../core/audio.js';
import { FX } from '../core/fx.js';

const NUM = ['一', '二', '三', '四'], FREQ = [392, 440, 494, 523];

export default {
  id: 'cadence', title: '答數',
  howto: ['班長喊什麼,你就照節拍答什麼!', '前 4 拍聽班長喊,後 4 拍輪到你。', '只在班長「有喊」的那幾拍點螢幕。', '搶拍、亂答、漏答都會扣分,正確率要七成。'],
  energyHint: '燒肉丹田:答數時顯示提示',
  defaults: { rounds: 6, bpm: 104, pass: 0.7 },
  create(p, api) {
    const I = 60 / p.bpm, WIN = 0.17, PERF = 0.07;
    const pats = [];
    for (let r = 0; r < p.rounds; r++) {
      if (r < 2) { pats.push([1, 1, 1, 1]); continue; }
      let pat; do pat = [0, 1, 2, 3].map(() => Math.random() < 0.6 ? 1 : 0); while (pat.reduce((a, b) => a + b) < 2 || pat.every(Boolean));
      pats.push(pat);
    }
    const notes = [];
    pats.forEach((pat, r) => pat.forEach((on, k) => { if (on) notes.push({ r, k, time: (4 + 8 * r + 4 + k) * I, res: null }); }));
    let t = -0.8, lastBeat = -99, hits = 0, extras = 0, misses = 0, hint = false, done = false, voice = null, boxFx = {}, foot = 0;
    const END = (4 + 8 * p.rounds) * I + 0.4;
    const beatInfo = b => { if (b < 4) return { pre: true }; const r = Math.floor((b - 4) / 8), k = (b - 4) % 8; return { r, k, call: k < 4, ans: k >= 4 }; };
    const boxPos = (row, k) => ({ x: 76 + k * 68, y: row ? 392 : 304 });
    const say = (ch, who) => { voice = { ch, who, t: 0.35 }; };
    return {
      update(dt) {
        t += dt; if (voice && (voice.t -= dt) <= 0) voice = null;
        for (const key in boxFx) if ((boxFx[key].t -= dt) <= 0) delete boxFx[key];
        if (done) return;
        const b = Math.floor(t / I);
        if (b !== lastBeat && b >= 0) {
          lastBeat = b; foot = b % 2; Sound.tick(); FX.dust(foot ? 230 : 130, 560, 3);
          const bi = beatInfo(b);
          if (bi.pre) { if (b === 0) say('答數!', 'sgt'); if (b === 0) Sound.call(330); }
          else if (bi.r < p.rounds && bi.call && pats[bi.r][bi.k]) { say(NUM[bi.k], 'sgt'); Sound.call(FREQ[bi.k] * 0.75); const q = boxPos(0, bi.k); FX.ring(q.x + 29, q.y + 29, { r1: 40, color: COLOR.accent2, width: 3 }); }
        }
        for (const n of notes) if (!n.res && t > n.time + WIN) {
          n.res = 'miss'; misses++; Sound.bad(); api.toast('漏答!', COLOR.bad);
          const q = boxPos(1, n.k); boxFx[`1${n.k}`] = { t: 0.3, c: COLOR.bad }; FX.float(q.x + 29, q.y, '漏', { color: COLOR.bad, size: 20 });
        }
        if (t > END) {
          done = true; const acc = Math.max(0, (hits - extras * 0.5) / notes.length);
          acc >= p.pass ? api.win(acc >= 0.95 ? 3 : acc >= 0.85 ? 2 : 1) : api.lose(`正確率 ${Math.round(acc * 100)}%,全連加跑一圈操場!`);
        }
      },
      onPointerDown() {
        if (done || t < 0) return;
        let best = null, bd = WIN;
        for (const n of notes) if (!n.res && Math.abs(t - n.time) <= bd) { bd = Math.abs(t - n.time); best = n; }
        if (best) {
          best.res = bd <= PERF ? 'perfect' : 'good'; hits++; Sound.call(FREQ[best.k]); say(NUM[best.k], 'me');
          const q = boxPos(1, best.k), cx = q.x + 29, cy = q.y + 29;
          boxFx[`1${best.k}`] = { t: 0.25, c: COLOR.good };
          FX.sparks(cx, cy, best.res === 'perfect' ? undefined : ['#c8ffb0', '#7ee35a'], best.res === 'perfect' ? 20 : 10);
          FX.ring(cx, cy, { r1: 46, color: best.res === 'perfect' ? COLOR.gold : COLOR.good });
          FX.float(cx, q.y - 6, best.res === 'perfect' ? '完美' : '好', { color: best.res === 'perfect' ? COLOR.gold : COLOR.good, size: 18 });
          if (best.res === 'perfect') FX.shake(2, 0.08);
        } else {
          extras++; Sound.bad(); FX.shake(5, 0.15);
          const bi = beatInfo(Math.floor(t / I));
          api.toast(bi.call ? '班長還沒喊完,搶拍!' : '這拍沒喊,亂答!', COLOR.bad);
        }
      },
      useEnergy() { hint = true; api.toast('燒肉丹田!答數提示出現', COLOR.accent); },
      render(g) {
        const b = Math.floor(t / I), bi = beatInfo(Math.max(0, b)), phase = (t / I) % 1, pulse = t >= 0 ? Math.max(0, 1 - phase * 3) : 0;
        vgrad(g, 0, 76, W, 180, '#9cc6e0', '#e6f0e0');
        g.fillStyle = '#c0b8a0'; g.fillRect(0, 200, W, 30); for (let x = 10; x < W; x += 60) { rect(g, x, 180, 40, 22, '#a89a80'); rect(g, x + 6, 186, 10, 8, '#5a6a7a'); }
        vgrad(g, 0, 230, W, H - 230, '#7d7d6e', '#55554a');
        for (let y = 470; y < H; y += 60) rect(g, 0, y, W, 3, 'rgba(255,255,255,0.35)');
        // 人物
        const bob = Math.round(pulse * 3);
        shadow(g, 60, 284, 28, 7, 0.35); drawSprite(g, SERGEANT, 60, 284 - bob, 3);
        [216, 262, 308].forEach((x, i) => { shadow(g, x, 284, 26, 6, 0.3); drawSprite(g, SOLDIER, x, 284 - (foot === i % 2 ? bob : 0), 3, { flip: true }); });
        if (voice) {
          const sgt = voice.who === 'sgt', x = sgt ? 92 : 214;
          bubble(g, x, 150, sgt ? 96 : 120, 50, sgt ? 112 : 262, true, sgt ? '#fffdf2' : '#eaffdf');
          text(g, voice.ch, x + (sgt ? 48 : 60), 176, { size: 30, align: 'center', base: 'middle', color: sgt ? COLOR.ink : '#1d5a12' });
        }
        // 節拍格
        text(g, '班長', 14, 333, { size: 16, base: 'middle', outline: COLOR.ink, ow: 4 });
        text(g, '你', 24, 421, { size: 18, base: 'middle', color: COLOR.accent2, outline: COLOR.ink, ow: 4 });
        const r = bi.pre ? 0 : Math.min(bi.r, p.rounds - 1);
        for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) {
          const q = boxPos(row, k), cur = !bi.pre && bi.r < p.rounds && (row === 0 ? bi.call && bi.k === k : bi.ans && bi.k - 4 === k);
          const fx = boxFx[`${row}${k}`];
          g.save();
          if (cur) { g.shadowColor = COLOR.accent2; g.shadowBlur = 16 + pulse * 10; }
          fillRR(g, q.x, q.y, 58, 58, 12, fx ? fx.c : cur ? '#3e5a44' : 'rgba(20,30,24,0.75)');
          g.restore();
          g.lineWidth = cur ? 3 : 1.5; g.strokeStyle = cur ? COLOR.accent2 : 'rgba(255,255,255,0.25)';
          rrect(g, q.x, q.y, 58, 58, 12); g.stroke();
          const on = pats[r][k];
          if (row === 0) {
            const show = on && (bi.call && bi.r === r && k <= bi.k || hint);
            if (show) text(g, NUM[k], q.x + 29, q.y + 30, { size: 28, align: 'center', base: 'middle', color: '#fff6dc' });
          } else {
            const n = notes.find(n => n.r === r && n.k === k);
            if (n?.res === 'miss') text(g, '✖', q.x + 29, q.y + 30, { size: 26, align: 'center', base: 'middle', color: COLOR.bad });
            else if (n?.res) text(g, NUM[k], q.x + 29, q.y + 30, { size: 28, align: 'center', base: 'middle', color: n.res === 'perfect' ? COLOR.gold : COLOR.good });
            else if (hint && on) text(g, NUM[k], q.x + 29, q.y + 30, { size: 26, align: 'center', base: 'middle', color: 'rgba(255,210,74,0.4)' });
          }
        }
        // 腳步
        for (let i = 0; i < 2; i++) {
          const x = i ? 230 : 130, up = foot !== i ? 12 : 0;
          shadow(g, x, 574, 24, 6, 0.4);
          fillRR(g, x - 22, 548 - up, 44, 24, 8, '#24211b'); fillRR(g, x - 18, 550 - up, 30, 6, 3, '#4a463c');
          text(g, i ? '右' : '左', x, 600, { size: 14, align: 'center', color: COLOR.dim });
        }
        if (bi.pre && t < 4 * I) {
          text(g, '預備', W / 2, 490, { size: 30, align: 'center', base: 'middle', color: '#fff', outline: COLOR.ink, ow: 6 });
          for (let i = 0; i < 4; i++) fillRR(g, W / 2 - 54 + i * 30, 516, 18, 8, 4, t >= i * I ? COLOR.accent2 : 'rgba(255,255,255,0.3)');
        } else text(g, '在班長有喊的拍子點螢幕', W / 2, 500, { size: 15, align: 'center', color: '#fff', outline: COLOR.ink, ow: 4 });
        text(g, `第 ${r + 1}/${p.rounds} 輪`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4 });
        text(g, `命中 ${hits}  失誤 ${extras + misses}`, W - 14, 86, { size: 16, align: 'right', outline: COLOR.ink, ow: 4 });
        vignette(g, 0.35);
      },
    };
  },
};
