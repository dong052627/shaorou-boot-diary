// 折棉被:班長示範一次 → 照順序滑動折被 → 點掉凸起整成豆腐乾。
import { W, H } from '../core/screen.js';
import { rect, text, fillRR, vgrad, vignette, drawArrow, bubble, ellipse, lerp, rand, COLOR } from '../core/ui.js';
import { Swipe } from '../core/input.js';
import { drawSprite, shadow } from '../core/sprite.js';
import { SERGEANT } from '../data/sprites.js';
import { Sound } from '../core/audio.js';
import { FX } from '../core/fx.js';

const SYMS = ['up', 'down', 'left', 'right', 'tap'];
const NAME = { up: '往上折', down: '往下折', left: '往左折', right: '往右折', tap: '壓平' };
const BLK = '#5b6b3a';

export default {
  id: 'foldBlanket', title: '折棉被',
  howto: ['班長只示範一次,記住順序!', '輪到你時照順序在螢幕上滑動(「壓」=點一下)。', '最後點掉棉被上凸起的地方,整成豆腐乾。', '錯 3 次,棉被會被丟出窗外。'],
  energyHint: '燒肉記憶:顯示折法 / 整形時直接壓平 4 處',
  defaults: { steps: 5, demoTime: 0.85, shapeTime: 9, bumps: 6, maxMistakes: 3 },
  create(p, api) {
    const CX = 180, CY = 430, sw = new Swipe(28);
    const seq = []; for (let i = 0; i < p.steps; i++) { let s; do s = SYMS[(Math.random() * SYMS.length) | 0]; while (s === seq[i - 1]); seq.push(s); }
    let phase = 'ready', pt = 1.4, idx = 0, folds = 0, mistakes = 0, hint = false, bumps = [], shapeT = p.shapeTime, done = false, t = 0;
    let bw = 230, bh = 160, wob = 0, fly = null, trail = [], shine = -1;
    const target = () => { const f = folds / p.steps; return [lerp(230, 140, f), lerp(160, 90, f)]; };
    const foldFx = dir => {
      Sound.tone(180, 0.08, 'triangle', 0.18); FX.shake(3, 0.1);
      const dx = { left: -1, right: 1 }[dir] ?? 0, dy = { up: -1, down: 1 }[dir] ?? 0;
      FX.dust(CX + dx * bw / 2, CY + dy * bh / 2, 10);
    };
    const makeBumps = n => {
      for (let i = 0; i < n; i++) {
        const side = (Math.random() * 4) | 0, u = rand(-0.85, 0.85);
        const x = side < 2 ? CX + u * 65 : CX + (side === 2 ? -65 : 65), y = side < 2 ? CY + (side === 0 ? -42 : 42) : CY + u * 38;
        bumps.push({ x, y, ph: rand(0, 6) });
      }
    };
    const winNow = () => { done = true; shine = 0; FX.sparks(CX - 65, CY - 40); FX.sparks(CX + 65, CY - 40); FX.sparks(CX, CY + 50);
      const left = shapeT / p.shapeTime; api.win(mistakes === 0 && left > 0.4 ? 3 : mistakes <= 1 ? 2 : 1); };
    return {
      update(dt) {
        t += dt; wob = Math.max(0, wob - dt * 3);
        const [tw, th] = phase === 'shape' || done ? [130, 84] : target();
        bw += (tw - bw) * Math.min(1, dt * 14); bh += (th - bh) * Math.min(1, dt * 14);
        trail = trail.filter(o => (o.life -= dt) > 0);
        if (shine >= 0) shine += dt;
        if (fly) { fly.x += fly.vx * dt; fly.y += fly.vy * dt; fly.vy += 900 * dt; fly.r += dt * 8; }
        if (done) return;
        if (phase === 'ready' && (pt -= dt) <= 0) { phase = 'demo'; idx = 0; pt = p.demoTime; folds = 1; foldFx(seq[0]); }
        else if (phase === 'demo' && (pt -= dt) <= 0) {
          idx++;
          if (idx >= p.steps) { phase = 'input'; idx = 0; folds = 0; FX.dust(CX, CY, 16); Sound.tone(300, 0.15, 'triangle', 0.15, -150); api.toast('班長拆開了,換你!', COLOR.accent2); }
          else { pt = p.demoTime; folds = idx + 1; foldFx(seq[idx]); }
        } else if (phase === 'shape' && (shapeT -= dt) <= 0) { done = true; api.lose('時間到!還是一坨饅頭,不是豆腐乾!'); }
      },
      onPointerDown(q) {
        sw.down(q); trail.push({ x: q.x, y: q.y, life: 0.3 });
        if (done || phase !== 'shape') return;
        let best = null, bd = 30;
        for (const b of bumps) { const d = Math.hypot(b.x - q.x, b.y - q.y); if (d < bd) { bd = d; best = b; } }
        if (!best) return;
        bumps.splice(bumps.indexOf(best), 1); Sound.tap(); FX.dust(best.x, best.y, 8); FX.ring(best.x, best.y, { r1: 30, color: '#e8f0c8' }); FX.float(best.x, best.y - 20, '平!', { size: 18, color: COLOR.good });
        if (!bumps.length) winNow();
      },
      onPointerMove(q) { if (sw.s) trail.push({ x: q.x, y: q.y, life: 0.3 }); },
      onPointerUp(q) {
        const dir = sw.up(q); if (!dir || done || phase !== 'input') return;
        if (dir === seq[idx]) {
          idx++; folds = idx; foldFx(dir); Sound.good();
          if (idx >= p.steps) { phase = 'shape'; makeBumps(p.bumps + mistakes * 2); shapeT = p.shapeTime; api.toast('最後整形!點掉凸起的地方', COLOR.accent2); }
        } else {
          mistakes++; wob = 1; Sound.bad(); FX.shake(7, 0.25); FX.flash('#ff3030', 0.15, 0.2);
          if (mistakes >= p.maxMistakes) { done = true; fly = { x: 0, y: 0, vx: 420, vy: -620, r: 0 }; api.lose('棉被被班長從窗戶丟出去了!'); }
          else api.toast(`班長:不對!(失誤 ${mistakes}/${p.maxMistakes})`, COLOR.bad);
        }
      },
      useEnergy() {
        if (phase === 'shape') { bumps.splice(0, 4).forEach(b => FX.dust(b.x, b.y, 8)); api.toast('燒肉之掌!壓平 4 處', COLOR.accent); if (!bumps.length) winNow(); }
        else { hint = true; api.toast('燒肉記憶!折法浮現了', COLOR.accent); }
      },
      render(g) {
        vgrad(g, 0, 0, W, 300, '#e2dcc6', '#c9c1a6'); vgrad(g, 0, 300, W, H - 300, '#6b5039', '#3e2e20');
        for (let x = 0; x < W; x += 40) rect(g, x, 300, 2, H - 300, 'rgba(0,0,0,0.15)');
        // 窗戶
        fillRR(g, 236, 100, 100, 110, 4, '#7a6a50'); vgrad(g, 242, 106, 88, 98, '#a8d8f0', '#e8f6ff'); rect(g, 284, 106, 4, 98, '#7a6a50'); rect(g, 242, 152, 88, 4, '#7a6a50');
        g.save(); g.globalAlpha = 0.12; g.fillStyle = '#fffbe0'; g.beginPath(); g.moveTo(242, 106); g.lineTo(330, 106); g.lineTo(200, 600); g.lineTo(40, 600); g.fill(); g.restore();
        // 床
        g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; fillRR(g, 18, 300, W - 36, 250, 8, '#7a858c'); g.restore();
        fillRR(g, 26, 308, W - 52, 234, 6, '#ecebe2'); fillRR(g, 26, 308, W - 52, 10, 4, '#ffffff');
        // 棉被 / 豆腐乾
        g.save();
        if (fly) { g.translate(CX + fly.x, CY + fly.y); g.rotate(fly.r); g.translate(-CX, -CY); }
        g.translate(Math.sin(t * 50) * 6 * wob, 0);
        if (phase === 'shape' || done) {
          shadow(g, CX, CY + 60, 90, 12, 0.35);
          vgrad(g, CX - 65, CY + 42, 130, 18, '#4a5830', '#36421f');
          const tg = g.createLinearGradient(CX - 65, CY - 42, CX + 65, CY + 42); tg.addColorStop(0, '#6e7f48'); tg.addColorStop(1, '#55653a');
          g.fillStyle = tg; g.fillRect(CX - 65, CY - 42, 130, 84);
          rect(g, CX - 65, CY - 42, 130, 2, '#8a9a60'); rect(g, CX - 65, CY + 40, 130, 2, '#3a4622');
          for (const b of bumps) {
            const s = 1 + Math.sin(t * 6 + b.ph) * 0.12;
            g.save(); g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 6; ellipse(g, b.x, b.y, 15 * s, 10 * s, '#6b7b45'); g.restore();
            ellipse(g, b.x - 3, b.y - 3, 7 * s, 4 * s, '#8fa060');
          }
          if (shine >= 0 && shine < 0.8) { g.save(); g.beginPath(); g.rect(CX - 65, CY - 42, 130, 84); g.clip(); const sx = CX - 120 + shine * 300; g.globalAlpha = 0.5; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(sx, CY - 42); g.lineTo(sx + 30, CY - 42); g.lineTo(sx - 10, CY + 42); g.lineTo(sx - 40, CY + 42); g.fill(); g.restore(); }
        } else {
          shadow(g, CX, CY + bh / 2 + 8, bw / 2, 10, 0.3);
          const tg = g.createLinearGradient(0, CY - bh / 2, 0, CY + bh / 2); tg.addColorStop(0, '#6e7f48'); tg.addColorStop(1, '#4e5d32');
          fillRR(g, CX - bw / 2, CY - bh / 2, bw, bh, 10 - folds, tg);
          g.globalAlpha = 0.08; for (let i = -bw; i < bw; i += 10) { g.fillStyle = '#fff'; g.fillRect(CX - bw / 2 + ((i + bw) % bw), CY - bh / 2, 1, bh); } g.globalAlpha = 1;
          for (let i = 0; i < folds; i++) i % 2 ? rect(g, CX - bw / 2 + 6, CY - bh / 2 + bh * (i + 1) / (folds + 1), bw - 12, 2, '#3a4622') : rect(g, CX - bw / 2 + bw * (i + 1) / (folds + 1), CY - bh / 2 + 6, 2, bh - 12, '#3a4622');
        }
        g.restore();
        // 班長示範
        if (phase === 'ready' || phase === 'demo') {
          shadow(g, 64, 282, 30, 7, 0.35); drawSprite(g, SERGEANT, 64, 282, 3);
          bubble(g, 112, 104, 116, 120, 130, true);
          if (phase === 'ready') text(g, '看清楚!', 170, 164, { size: 22, align: 'center', base: 'middle', color: COLOR.ink });
          else if (pt > p.demoTime * 0.2) { drawArrow(g, seq[idx], 170, 154, 64); text(g, NAME[seq[idx]], 170, 206, { size: 14, align: 'center', base: 'middle', color: COLOR.ink }); }
          text(g, phase === 'demo' ? `示範 ${idx + 1}/${p.steps}` : '班長示範一次', 14, 86, { size: 16, outline: COLOR.ink, ow: 4 });
        } else if (phase === 'input') {
          text(g, '換你了!照順序滑動', W / 2, 176, { size: 22, align: 'center', base: 'middle', color: '#2a2418' });
          for (let i = 0; i < p.steps; i++) {
            const x = W / 2 - (p.steps - 1) * 26 + i * 52;
            if (hint && i >= idx) drawArrow(g, seq[i], x, 230, 36, i === idx ? COLOR.gold : '#b3a678');
            else fillRR(g, x - 14, 216, 28, 28, 8, i < idx ? COLOR.good : 'rgba(0,0,0,0.2)');
          }
          text(g, `失誤 ${mistakes}/${p.maxMistakes}`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4, color: mistakes ? COLOR.bad : COLOR.fg });
        } else if (phase === 'shape') {
          text(g, '點掉凸起的地方!', W / 2, 176, { size: 22, align: 'center', base: 'middle', color: '#2a2418' });
          fillRR(g, 60, 210, 240, 14, 7, 'rgba(0,0,0,0.3)'); fillRR(g, 62, 212, 236 * Math.max(0, shapeT / p.shapeTime), 10, 5, shapeT > 3 ? COLOR.good : COLOR.bad);
          text(g, `剩 ${bumps.length} 處`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4 });
        }
        // 手指軌跡
        for (const o of trail) { g.globalAlpha = o.life / 0.3; ellipse(g, o.x, o.y, 9 * o.life / 0.3 + 2, 9 * o.life / 0.3 + 2, '#ffe9a0'); } g.globalAlpha = 1;
        vignette(g, 0.35);
      },
    };
  },
};
