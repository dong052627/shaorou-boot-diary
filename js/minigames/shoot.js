// 打靶:準星會晃動;按住閉氣讓準星變穩,放開射擊。閉氣太久會喘。
import { W, H } from '../core/screen.js';
import { rect, text, fillRR, vgrad, vignette, circle, clamp, rand, COLOR } from '../core/ui.js';
import { Sound } from '../core/audio.js';
import { FX } from '../core/fx.js';

export default {
  id: 'shoot', icon: '🎯', title: '打靶',
  howto: ['五發子彈,總分 30 分及格。', '準星會隨呼吸晃動。', '按住螢幕「閉氣」,準星會慢慢變穩。', '放開手指就擊發!閉氣太久會喘,準星反而亂晃。'],
  energyHint: '燒肉穩定:準星晃動減半',
  defaults: { shots: 5, pass: 30, sway: 46 },
  create(p, api) {
    const C = { x: 180, y: 330 }, RING = 10;
    let t = 0, shot = 0, total = 0, holes = [], scores = [], holding = false, steady = 0, breath = 1, swayK = 1, kick = { x: 0, y: 0 }, cool = 0, endT = -1, done = false;
    const pos = () => {
      const tired = breath <= 0 ? 1.9 : 1;
      const amp = p.sway * swayK * (1 - 0.78 * steady) * tired;
      const jx = breath <= 0 ? rand(-0.15, 0.15) : 0;
      return {
        x: C.x + amp * (Math.sin(t * 1.7) * 0.6 + Math.sin(t * 3.1 + 1.3) * 0.3 + Math.sin(t * 7.3) * 0.1 + jx) + kick.x,
        y: C.y + amp * (Math.cos(t * 1.3) * 0.6 + Math.sin(t * 2.7 + 0.4) * 0.3 + Math.cos(t * 6.1) * 0.1 + jx) + kick.y,
      };
    };
    const fire = () => {
      const q = pos(), d = Math.hypot(q.x - C.x, q.y - C.y), score = Math.max(0, 10 - Math.floor(d / RING));
      holes.push(q); scores.push(score); total += score; shot++;
      Sound.shot(); FX.flash('#fff6d0', 0.08, 0.5); FX.shake(8, 0.22); FX.hitstop(0.05);
      FX.debris(q.x, q.y, d < 40 ? ['#1a1a1a', '#444'] : ['#f2efe6', '#d0c8b0'], 10); FX.ring(q.x, q.y, { r1: 26, color: '#fff' });
      FX.float(q.x, q.y - 26, score === 10 ? '10!!' : score > 0 ? `${score}` : '脫靶', { color: score >= 9 ? COLOR.gold : score >= 7 ? COLOR.good : score > 0 ? '#ffffff' : COLOR.bad, size: score >= 9 ? 32 : 26 });
      if (score === 10) FX.sparks(q.x, q.y);
      FX.burst(W - 40, H - 110, { n: 1, colors: ['#e0b040'], angle: -Math.PI * 0.62, spread: 0.3, speed: [240, 300], gravity: 1000, drag: 0.2, life: [0.8, 1], size: [7, 9], shape: 'conf' });
      kick = { x: rand(-12, 12), y: -30 }; cool = 0.55; steady = 0;
      if (shot >= p.shots) { done = true; endT = 0.9; }
    };
    return {
      update(dt) {
        t += dt; cool -= dt; kick.x *= Math.exp(-dt * 6); kick.y *= Math.exp(-dt * 6);
        if (endT > 0 && (endT -= dt) <= 0) {
          total >= p.pass ? api.win(total >= 45 ? 3 : total >= 38 ? 2 : 1) : api.lose(`總分 ${total} 分,不及格要補打了…`);
        }
        if (done) return;
        if (holding) { steady = Math.min(1, steady + dt * 1.1); breath = Math.max(0, breath - dt / 3.4); if (breath === 0 && Math.random() < dt * 2) FX.flash('#ff3030', 0.15, 0.12); }
        else { steady = Math.max(0, steady - dt * 2); breath = Math.min(1, breath + dt / 1.8); }
      },
      onPointerDown() { if (!done && cool <= 0) holding = true; },
      onPointerUp() { if (holding) { holding = false; fire(); } },
      useEnergy() { swayK = 0.5; api.toast('燒肉穩定!準星晃動減半', COLOR.accent); },
      render(g) {
        vgrad(g, 0, 76, W, 200, '#8fc0e6', '#d8ecf5');
        g.fillStyle = '#86a1ae'; g.beginPath(); g.moveTo(0, 220); g.lineTo(60, 170); g.lineTo(120, 205); g.lineTo(200, 150); g.lineTo(280, 200); g.lineTo(360, 165); g.lineTo(360, 260); g.lineTo(0, 260); g.fill();
        for (let x = -10; x < W; x += 26) circle(g, x, 250, 22, '#4f7a45');
        vgrad(g, 0, 250, W, H - 250, '#7a9a50', '#3f5a2c');
        g.fillStyle = '#8a7250'; g.beginPath(); g.moveTo(10, 470); g.lineTo(60, 230); g.lineTo(300, 230); g.lineTo(350, 470); g.fill();
        rect(g, 100, 440, 10, 60, '#6a4a2a'); rect(g, 250, 440, 10, 60, '#6a4a2a');
        g.save(); g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 16; g.shadowOffsetY = 6; fillRR(g, C.x - 116, C.y - 116, 232, 232, 6, '#f2efe6'); g.restore();
        for (let s = 1; s <= 10; s++) {
          const r = (11 - s) * RING, black = s >= 7;
          circle(g, C.x, C.y, r, black ? '#1c1c1c' : '#f2efe6');
          g.strokeStyle = black ? '#e8e8e8' : '#2a2a2a'; g.lineWidth = 1.5; g.beginPath(); g.arc(C.x, C.y, r, 0, Math.PI * 2); g.stroke();
          if (s <= 9) text(g, `${s}`, C.x + r - 5, C.y, { size: 9, align: 'center', base: 'middle', color: black ? '#ddd' : '#333', weight: 'normal' });
        }
        rect(g, C.x - 4, C.y - 0.5, 8, 1, '#fff'); rect(g, C.x - 0.5, C.y - 4, 1, 8, '#fff');
        for (const q of holes) { circle(g, q.x, q.y, 5, '#8a7a5a'); circle(g, q.x, q.y, 3.5, '#0a0a0a'); }
        const q = pos();
        // 瞄準鏡遮罩
        g.save(); g.fillStyle = `rgba(0,0,0,${0.5 + steady * 0.15})`; g.beginPath(); g.rect(0, 76, W, H - 76); g.arc(q.x, q.y, 140, 0, Math.PI * 2); g.fill('evenodd');
        g.strokeStyle = '#0a0a0a'; g.lineWidth = 8; g.beginPath(); g.arc(q.x, q.y, 140, 0, Math.PI * 2); g.stroke(); g.restore();
        if (!done) {
          g.save(); g.shadowColor = '#ff2a2a'; g.shadowBlur = 8; g.fillStyle = '#ff3a3a';
          g.fillRect(q.x - 60, q.y - 1, 48, 2); g.fillRect(q.x + 12, q.y - 1, 48, 2); g.fillRect(q.x - 1, q.y - 60, 2, 48); g.fillRect(q.x - 1, q.y + 12, 2, 48);
          circle(g, q.x, q.y, 2.5, '#ff3a3a');
          if (holding) { g.strokeStyle = `rgba(126,227,90,${0.4 + steady * 0.6})`; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, 34 - steady * 18, 0, Math.PI * 2); g.stroke(); }
          g.restore();
        }
        text(g, `第 ${Math.min(shot + 1, p.shots)}/${p.shots} 發`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4 });
        text(g, `總分 ${total}  (及格 ${p.pass})`, W - 14, 86, { size: 16, align: 'right', color: total >= p.pass ? COLOR.good : COLOR.fg, outline: COLOR.ink, ow: 4 });
        text(g, holding ? (breath > 0 ? '閉氣中…放開擊發' : '喘不過氣了!') : '按住閉氣,放開射擊', W / 2, 540, { size: 17, align: 'center', color: breath > 0 ? '#ffffff' : COLOR.bad, outline: COLOR.ink, ow: 4 });
        fillRR(g, 70, 568, 220, 14, 7, 'rgba(0,0,0,0.6)');
        const bc = breath > 0.5 ? COLOR.good : breath > 0.2 ? COLOR.gold : COLOR.bad;
        g.save(); g.shadowColor = bc; g.shadowBlur = 8; fillRR(g, 72, 570, 216 * clamp(breath), 10, 5, bc); g.restore();
        text(g, '氣', 52, 575, { size: 14, align: 'center', base: 'middle', color: COLOR.fg });
        text(g, scores.map(s => s).join('  ') || ' ', W / 2, 600, { size: 16, align: 'center', color: COLOR.gold, outline: COLOR.ink, ow: 3 });
        vignette(g, 0.3);
      },
    };
  },
};
