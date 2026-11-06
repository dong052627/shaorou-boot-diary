// 廚餘分裝:東西從上方掉下來,點正確的桶子分類。
import { W, H } from '../core/screen.js';
import { rect, text, hit, rrect, fillRR, vgrad, vignette, shade, rand, COLOR } from '../core/ui.js';
import { Sound } from '../core/audio.js';
import { FX } from '../core/fx.js';

const BINS = [
  { name: '廚餘', color: '#9a6a34' }, { name: '回收', color: '#2f78c4' },
  { name: '一般', color: '#5d625d' }, { name: '餐具', color: '#8fa0ad' },
];
const ITEMS = [
  { name: '剩飯', bin: 0, shape: 'pile', c: '#f2efe2' }, { name: '雞骨頭', bin: 0, shape: 'bone', c: '#efe3c2' },
  { name: '菜葉', bin: 0, shape: 'leaf', c: '#5fae3e' }, { name: '香蕉皮', bin: 0, shape: 'peel', c: '#e8cf3a' },
  { name: '寶特瓶', bin: 1, shape: 'bottle', c: '#9fd8f0' }, { name: '鋁箔包', bin: 1, shape: 'box', c: '#e8e2d0' },
  { name: '鐵罐', bin: 1, shape: 'can', c: '#c0392b' }, { name: '衛生紙', bin: 2, shape: 'paper', c: '#ffffff' },
  { name: '免洗筷', bin: 2, shape: 'sticks', c: '#d9b98a' }, { name: '菸蒂', bin: 2, shape: 'butt', c: '#e0a96d' },
  { name: '鐵餐盤', bin: 3, shape: 'tray', c: '#b8c2cc' }, { name: '湯匙', bin: 3, shape: 'spoon', c: '#d0d6dc' },
];
const SHAPES = {
  pile(R, c) { R(-14, 2, 28, 10, c); R(-10, -4, 20, 6, c); R(-5, -8, 10, 4, c); R(-14, 10, 28, 2, shade(c, -0.25)); R(-8, -2, 3, 3, '#d9d3bd'); R(3, 4, 3, 3, '#d9d3bd'); R(-2, -7, 3, 2, '#fff'); },
  bone(R, c) { R(-11, -2, 22, 5, c); R(-16, -6, 6, 6, c); R(-16, 1, 6, 6, c); R(10, -6, 6, 6, c); R(10, 1, 6, 6, c); R(-11, 2, 22, 1, shade(c, -0.2)); },
  leaf(R, c) { R(-9, -7, 18, 14, c); R(-13, -3, 26, 6, c); R(-13, -1, 26, 2, shade(c, -0.3)); R(-6, -6, 4, 3, shade(c, 0.3)); },
  peel(R, c) { R(-2, -13, 4, 5, '#7a5a1a'); R(-6, -8, 12, 6, c); R(-13, -2, 8, 12, c); R(5, -2, 8, 12, c); R(-3, -2, 6, 13, c); R(-13, 8, 8, 2, '#a88a20'); R(5, 8, 8, 2, '#a88a20'); },
  bottle(R, c) { R(-3, -15, 6, 4, '#2a8f3a'); R(-4, -11, 8, 3, c); R(-7, -8, 14, 22, c); R(-7, -1, 14, 6, '#2a8f3a'); R(-5, -7, 2, 18, 'rgba(255,255,255,0.6)'); },
  box(R, c) { R(-9, -12, 18, 24, c); R(-9, -5, 18, 9, '#3d7fd1'); R(4, -17, 2, 6, '#fff'); R(-9, 10, 18, 2, shade(c, -0.25)); },
  can(R, c) { R(-8, -12, 16, 24, c); R(-8, -12, 16, 3, '#d8d8d8'); R(-8, 9, 16, 3, '#a8a8a8'); R(-5, -5, 10, 7, '#fff'); R(-6, -9, 2, 16, 'rgba(255,255,255,0.35)'); },
  paper(R, c) { R(-11, -8, 22, 16, c); R(-7, -12, 9, 5, c); R(-11, -1, 22, 1, '#dcdcdc'); R(-11, 6, 22, 2, '#d0d0d0'); },
  sticks(R, c) { R(-4, -15, 3, 30, c); R(2, -15, 3, 30, c); R(-5, -15, 11, 5, '#f3f3f3'); },
  butt(R, c) { R(-13, -2, 17, 6, '#f5f5f5'); R(4, -2, 9, 6, c); R(-15, -2, 2, 6, '#555'); R(-17, -5, 2, 2, 'rgba(200,200,200,0.6)'); },
  tray(R, c) { R(-17, -11, 34, 22, c); R(-15, -9, 13, 8, shade(c, -0.15)); R(0, -9, 15, 8, shade(c, -0.15)); R(-15, 1, 30, 8, shade(c, -0.15)); R(-17, 9, 34, 2, shade(c, -0.35)); R(-14, -10, 28, 1, '#fff'); },
  spoon(R, c) { R(-6, -15, 12, 10, c); R(-2, -5, 4, 19, c); R(-4, -13, 3, 4, '#fff'); },
};
function drawItem(g, it, cx, cy, s = 1.8, rot = 0, label = true) {
  g.save(); g.translate(cx + 4, cy + 6); g.rotate(rot); g.scale(s, s);           // 影子
  SHAPES[it.shape]((x, y, w, h) => { g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, y, w, h); }, it.c);
  g.restore();
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(s, s);
  SHAPES[it.shape]((x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, it.c);
  g.restore();
  if (label) text(g, it.name, cx, cy + 30 * s / 1.8, { size: 14, align: 'center', base: 'middle', outline: COLOR.ink, ow: 4 });
}

export default {
  id: 'sortWaste', title: '廚餘分裝',
  howto: ['餐後輪到你倒廚餘、收餐盤!', '東西掉下來時,點下方正確的桶子。', '有發光框的那個會先被分。', '分錯或掉到地上算失誤,錯 3 次失敗。'],
  energyHint: '燒肉專注:時間變慢 6 秒',
  defaults: { goal: 15, lives: 3, speed: 50, spawn: 1.6 },
  create(p, api) {
    const TOP = 150, FLOOR = 488;
    const bins = BINS.map((b, i) => ({ ...b, i, x: 8 + i * 87, y: 516, w: 80, h: 112, bounce: 0, shake: 0 }));
    let items = [], flies = [], spawnT = 0, sorted = 0, miss = 0, slowT = 0, elapsed = 0, done = false, last = -1, combo = 0, t = 0;
    const spawn = () => { let k; do k = (Math.random() * ITEMS.length) | 0; while (k === last); last = k; items.push({ it: ITEMS[k], x: rand(80, 280), y: TOP, wob: rand(0, 6), scale: 0 }); };
    const front = () => items.reduce((a, b) => (!a || b.y > a.y ? b : a), null);
    const fail = (msg, x, y) => {
      miss++; combo = 0; Sound.bad(); api.toast(msg, COLOR.bad); FX.shake(7, 0.25); FX.float(x, y, '✖', { color: COLOR.bad, size: 34 });
      if (miss >= p.lives) { done = true; api.lose('廚餘桶被班長翻出來檢查,全連重新分…'); }
    };
    return {
      update(dt) {
        t += dt;
        for (const b of bins) { b.bounce = Math.max(0, b.bounce - dt * 4); b.shake = Math.max(0, b.shake - dt * 3); }
        flies = flies.filter(f => { f.t += dt * 3.4; if (f.t >= 1 && !f.landed) { f.landed = true; f.onLand(); } return f.t < 1; });
        if (done) return;
        const k = slowT > 0 ? 0.4 : 1; slowT = Math.max(0, slowT - dt);
        const d = dt * k; elapsed += d; spawnT -= d;
        if (spawnT <= 0 || items.length === 0) { spawn(); spawnT = Math.max(0.65, p.spawn - elapsed * 0.03); }
        const v = p.speed + elapsed * 2.4;
        for (const o of items) { o.y += v * d; o.scale = Math.min(1, o.scale + dt * 5); }
        for (const o of items.filter(o => o.y > FLOOR)) {
          items.splice(items.indexOf(o), 1);
          FX.debris(o.x, FLOOR + 8, [o.it.c, shade(o.it.c, -0.3)], 14);
          fail(`${o.it.name}掉到地上了!`, o.x, FLOOR - 30); if (done) return;
        }
      },
      onPointerDown(pt) {
        if (done) return;
        const b = bins.find(b => hit(pt, b)); if (!b) return;
        const f = front(); if (!f) return;
        items.splice(items.indexOf(f), 1);
        const ok = f.it.bin === b.i;
        flies.push({ it: f.it, x0: f.x, y0: f.y, x1: b.x + b.w / 2, y1: b.y + 26, t: 0, onLand: () => {
          if (ok) { b.bounce = 1; FX.sparks(b.x + b.w / 2, b.y + 10, [shade(b.color, 0.5), '#ffffff', COLOR.gold]); FX.ring(b.x + b.w / 2, b.y + 20, { r1: 50, color: shade(b.color, 0.5) }); }
          else { b.shake = 1; FX.debris(b.x + b.w / 2, b.y + 10, [f.it.c], 8); }
        } });
        if (ok) {
          sorted++; combo++; Sound.good();
          FX.float(b.x + b.w / 2, b.y - 20, combo >= 3 ? `連擊 x${combo}!` : '+1', { color: combo >= 3 ? COLOR.gold : COLOR.good, size: combo >= 3 ? 24 : 22 });
          if (sorted >= p.goal) { done = true; api.win(miss === 0 ? 3 : miss === 1 ? 2 : 1); }
        } else fail(`${f.it.name}要丟「${BINS[f.it.bin].name}」!`, b.x + b.w / 2, b.y - 20);
      },
      useEnergy() { slowT = 6; api.toast('燒肉專注!時間變慢 6 秒', COLOR.accent); },
      render(g) {
        vgrad(g, 0, 0, W, H, '#33463a', '#18221b');
        g.globalAlpha = 0.07; for (let y = 80; y < H; y += 32) rect(g, 0, y, W, 2, '#fff'); for (let x = 0; x < W; x += 32) rect(g, x, 80, 2, H, '#fff'); g.globalAlpha = 1;
        fillRR(g, 40, 128, 280, 380, 18, 'rgba(0,0,0,0.28)');
        vgrad(g, 34, 128, 8, 380, '#b8c4cc', '#5a666e'); vgrad(g, 318, 128, 8, 380, '#b8c4cc', '#5a666e');
        const f = front(), danger = f ? Math.max(0, (f.y - 380) / (FLOOR - 380)) : 0;
        for (let x = 0; x < 272; x += 18) rect(g, 44 + x, FLOOR + 14, 10, 4, `rgba(255,77,77,${0.35 + danger * 0.6 * (0.5 + 0.5 * Math.sin(t * 20))})`);
        text(g, `分裝 ${sorted}/${p.goal}`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4 });
        text(g, '♥'.repeat(p.lives - miss) + '♡'.repeat(miss), W - 14, 86, { size: 18, align: 'right', color: COLOR.bad, outline: COLOR.ink, ow: 4 });
        for (const o of items) {
          const rot = Math.sin(t * 3 + o.wob) * 0.15;
          if (o === f) {
            g.save(); g.shadowColor = COLOR.gold; g.shadowBlur = 16 + Math.sin(t * 8) * 6;
            rrect(g, o.x - 38, o.y - 36, 76, 84, 12); g.lineWidth = 3; g.strokeStyle = COLOR.gold; g.stroke(); g.restore();
          }
          drawItem(g, o.it, o.x, o.y, 1.8 * o.scale, rot);
        }
        for (const fl of flies) {
          const k = fl.t, x = fl.x0 + (fl.x1 - fl.x0) * k, y = fl.y0 + (fl.y1 - fl.y0) * k - Math.sin(k * Math.PI) * 70;
          drawItem(g, fl.it, x, y, 1.8 * (1 - k * 0.5), k * 8, false);
        }
        for (const b of bins) {
          const sx = Math.sin(t * 60) * 6 * b.shake, sq = 1 - 0.14 * Math.sin(b.bounce * Math.PI);
          g.save(); g.translate(b.x + b.w / 2 + sx, b.y + b.h); g.scale(2 - sq, sq); g.translate(-b.w / 2, -b.h);
          if (b.bounce > 0) { g.shadowColor = shade(b.color, 0.4); g.shadowBlur = 24 * b.bounce; }
          const gr = g.createLinearGradient(0, 0, b.w, 0);
          gr.addColorStop(0, shade(b.color, -0.3)); gr.addColorStop(0.4, shade(b.color, 0.18)); gr.addColorStop(1, shade(b.color, -0.4));
          rrect(g, 5, 16, b.w - 10, b.h - 16, 8); g.fillStyle = gr; g.fill(); g.shadowBlur = 0;
          for (let i = 0; i < 3; i++) rect(g, 16 + i * 20, 32, 4, b.h - 44, 'rgba(0,0,0,0.15)');
          fillRR(g, 0, 4, b.w, 16, 6, shade(b.color, -0.45)); fillRR(g, 4, 6, b.w - 8, 4, 2, 'rgba(255,255,255,0.3)');
          text(g, b.name, b.w / 2, b.h / 2 + 14, { size: 20, align: 'center', base: 'middle', outline: COLOR.ink, ow: 5 });
          g.restore();
        }
        if (slowT > 0) { vignette(g, 0.55, '255,122,61'); text(g, `⏱ ${slowT.toFixed(1)}`, W / 2, 86, { size: 16, align: 'center', color: COLOR.accent2, outline: COLOR.ink, ow: 4 }); }
        vignette(g, 0.4);
      },
    };
  },
};
