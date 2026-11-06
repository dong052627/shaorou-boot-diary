// 特效系統:粒子、飄字、衝擊波、畫面震動、閃光、命中停頓(hitstop)
import { W, H } from './screen.js';
import { text, COLOR } from './ui.js';
const rnd = (r, d) => { const [a, b] = r ?? d; return a + Math.random() * (b - a); };

export const FX = {
  parts: [], texts: [], rings: [],
  shakeT: 0, shakeDur: 1, shakeMag: 0, flashT: 0, flashDur: 1, flashC: '#fff', flashA: 0.6, stopT: 0,

  clear() { this.parts = []; this.texts = []; this.rings = []; this.shakeT = this.flashT = this.stopT = 0; },

  // 通用粒子爆發。o: n, colors, speed[a,b], life[a,b], size[a,b], gravity, drag, shape('sq'|'circ'|'conf'), glow, angle, spread, grow
  burst(x, y, o = {}) {
    const n = o.n ?? 14, colors = o.colors ?? ['#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = o.spread != null ? (o.angle ?? -Math.PI / 2) + (Math.random() - 0.5) * o.spread : Math.random() * Math.PI * 2;
      const sp = rnd(o.speed, [60, 220]), life = rnd(o.life, [0.4, 0.8]);
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, size: rnd(o.size, [2, 5]),
        color: colors[(Math.random() * colors.length) | 0], grav: o.gravity ?? 400, drag: o.drag ?? 2,
        shape: o.shape ?? 'sq', glow: !!o.glow, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 20, grow: o.grow ?? 0 });
    }
  },
  sparks(x, y, colors = ['#fff6c2', '#ffd24a', '#ff9a3d'], n = 18) { this.burst(x, y, { n, colors, speed: [120, 340], life: [0.2, 0.55], size: [2, 5], gravity: 250, glow: true }); },
  confetti(x, y) { this.burst(x, y, { n: 60, colors: ['#ff7a3d', '#ffd24a', '#7ee35a', '#5ec8ff', '#ff5ea8', '#ffffff'], speed: [180, 460], life: [1.0, 1.9], size: [5, 9], gravity: 460, drag: 1.4, shape: 'conf', spread: Math.PI * 0.95, angle: -Math.PI / 2 }); },
  smoke(x, y, n = 8, color = 'rgba(210,210,210,0.45)') { this.burst(x, y, { n, colors: [color], speed: [10, 60], life: [0.8, 1.6], size: [6, 12], gravity: -50, drag: 1.2, shape: 'circ', grow: 16 }); },
  dust(x, y, n = 8) { this.burst(x, y, { n, colors: ['rgba(230,220,200,0.6)'], speed: [30, 110], life: [0.4, 0.8], size: [4, 8], gravity: -20, drag: 3, shape: 'circ', grow: 14, spread: Math.PI, angle: -Math.PI / 2 }); },
  debris(x, y, colors, n = 10) { this.burst(x, y, { n, colors, speed: [80, 260], life: [0.5, 1.0], size: [3, 7], gravity: 800, drag: 0.6, shape: 'conf', spread: Math.PI * 1.1, angle: -Math.PI / 2 }); },
  float(x, y, str, o = {}) { const d = o.dur ?? 0.9; this.texts.push({ x, y, str, color: o.color ?? '#fff', size: o.size ?? 22, life: d, max: d, rise: o.rise ?? 50 }); },
  ring(x, y, o = {}) { const d = o.dur ?? 0.4; this.rings.push({ x, y, r0: o.r0 ?? 4, r1: o.r1 ?? 60, life: d, max: d, color: o.color ?? '#fff', w: o.width ?? 5 }); },
  shake(mag = 6, dur = 0.25) { const cur = this.shakeT > 0 ? this.shakeMag * this.shakeT / this.shakeDur : 0; if (mag >= cur) { this.shakeMag = mag; this.shakeT = this.shakeDur = dur; } },
  flash(color = '#ffffff', dur = 0.15, alpha = 0.6) { this.flashC = color; this.flashT = this.flashDur = dur; this.flashA = alpha; },
  hitstop(d = 0.05) { this.stopT = Math.max(this.stopT, d); },
  scaleDt(dt) { if (this.stopT > 0) { this.stopT -= dt; return 0; } return dt; },

  update(dt) {
    for (const p of this.parts) {
      p.life -= dt; const k = Math.exp(-p.drag * dt);
      p.vx *= k; p.vy *= k; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt; p.size += p.grow * dt;
    }
    this.parts = this.parts.filter(p => p.life > 0 && p.y < H + 40);
    for (const o of this.texts) o.life -= dt; this.texts = this.texts.filter(o => o.life > 0);
    for (const o of this.rings) o.life -= dt; this.rings = this.rings.filter(o => o.life > 0);
    this.shakeT = Math.max(0, this.shakeT - dt); this.flashT = Math.max(0, this.flashT - dt);
  },
  offset() {
    if (this.shakeT <= 0) return [0, 0];
    const m = this.shakeMag * this.shakeT / this.shakeDur;
    return [(Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m];
  },
  render(g) {
    g.save();
    for (const p of this.parts) {
      g.globalAlpha = Math.min(1, (p.life / p.max) * 1.6);
      g.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
      g.fillStyle = p.color;
      if (p.shape === 'circ') { g.beginPath(); g.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2); g.fill(); }
      else if (p.shape === 'conf') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); g.restore(); }
      else { const s = p.size * (0.35 + 0.65 * p.life / p.max); g.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
    }
    g.globalCompositeOperation = 'source-over';
    for (const r of this.rings) {
      const k = 1 - r.life / r.max, e = 1 - Math.pow(1 - k, 3);
      g.globalAlpha = 1 - k; g.strokeStyle = r.color; g.lineWidth = Math.max(0.5, r.w * (1 - k));
      g.beginPath(); g.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
    for (const o of this.texts) {
      const k = 1 - o.life / o.max;
      const pop = k < 0.12 ? 0.5 + (k / 0.12) * 0.75 : 1.25 - Math.min(0.25, (k - 0.12) * 2.5);
      text(g, o.str, o.x, o.y - o.rise * (1 - Math.pow(1 - k, 2)), { size: o.size * pop, align: 'center', base: 'middle', color: o.color, outline: COLOR.ink, ow: 5, alpha: Math.min(1, (o.life / o.max) * 3) });
    }
  },
  renderOverlay(g, h = H) {
    if (this.flashT <= 0) return;
    g.save(); g.globalAlpha = this.flashA * (this.flashT / this.flashDur); g.fillStyle = this.flashC; g.fillRect(0, 0, W, h); g.restore();
  },
};
