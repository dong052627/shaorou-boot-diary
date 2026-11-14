// 假日:烤肉補充燒肉能量。放假先 +1,之後每片「完美熟度」再 +1(最多 +CONFIG.weekendRefill)
import { W, H } from '../core/screen.js';
import { State, CONFIG } from '../core/state.js';
import { FX } from '../core/fx.js';
import { Sound } from '../core/audio.js';
import { text, wrapText, button, hit, rect, rrect, panel, fillRR, vgrad, vignette, energyBar, circle, mix, rand, easeBack, COLOR } from '../core/ui.js';

const RAW = '#e8707e', GOLD = '#b8662c', DARK = '#6b3a1c', BURNT = '#231510';
const PERFECT = [0.55, 0.82];
const meatColor = c => c < 0.55 ? mix(RAW, GOLD, c / 0.55) : c < 0.82 ? mix(GOLD, DARK, (c - 0.55) / 0.27 * 0.5) : mix(DARK, BURNT, (c - 0.82) / 0.35);

export class WeekendScene {
  constructor(level, done, opts = {}) { this.level = level; this.done = done; this.opts = opts; }
  enter() {
    this.t = 0; this.phase = 'intro'; this.pt = 0;
    this.pieces = this.level.pieces ?? 5; this.used = 0; this.perfect = 0; this.gained = 0;
    this.slots = [{ x: 108, y: 360 }, { x: 252, y: 360 }, { x: 180, y: 452 }].map(s => ({ ...s, meat: null, wait: rand(0.1, 0.6) }));
    this.btn = { x: 90, y: 548, w: 180, h: 52 };
    this.smokeT = 0;
  }
  give(n, x, y) {
    if (this.opts.replay) { FX.float(x, y - 30, '重溫美味', { color: COLOR.accent2, size: 20 }); return; }
    const before = State.energy; State.addEnergy(n); const got = State.energy - before; this.gained += got;
    if (got > 0) {
      FX.float(x, y - 30, `能量 +${got}`, { color: COLOR.accent2, size: 26 });
      FX.burst(x, y, { n: 24, colors: ['#ff3d1f', '#ff8f3d', '#ffe27a'], speed: [80, 260], life: [0.4, 0.9], gravity: -200, glow: true });
      Sound.tone(500, 0.3, 'sawtooth', 0.08, 700);
    }
  }
  update(dt) {
    this.t += dt; this.pt += dt;
    if (this.phase !== 'grill') return;
    this.smokeT -= dt;
    for (const s of this.slots) {
      if (!s.meat) {
        if (this.used + this.slots.filter(x => x.meat).length >= this.pieces) continue;
        if ((s.wait -= dt) <= 0) { s.meat = { c: 0, sp: rand(0.17, 0.3), drop: 0 }; Sound.noise(0.25, 0.15, 3000); FX.dust(s.x, s.y); }
        continue;
      }
      const m = s.meat; m.c += m.sp * dt; m.drop = Math.min(1, m.drop + dt * 5);
      if (this.smokeT <= 0) FX.smoke(s.x + rand(-20, 20), s.y - 10, 1, m.c > 0.9 ? 'rgba(40,30,25,0.55)' : 'rgba(230,230,230,0.35)');
      if (Math.random() < dt * 6) FX.burst(s.x + rand(-28, 28), s.y + rand(-8, 8), { n: 1, colors: ['#ffd27a'], speed: [30, 80], life: [0.2, 0.4], size: [2, 3], gravity: 200, glow: true });
      if (m.c > 1.18) { s.meat = null; s.wait = 0.8; this.used++; FX.smoke(s.x, s.y, 10, 'rgba(30,20,15,0.7)'); FX.float(s.x, s.y - 20, '烤焦了!', { color: COLOR.bad }); Sound.bad(); }
    }
    if (this.smokeT <= 0) this.smokeT = 0.12;
    if (this.used >= this.pieces && this.slots.every(s => !s.meat)) { this.phase = 'done'; this.pt = 0; FX.confetti(W / 2, 300); Sound.win(); }
  }
  onPointerDown(p) {
    if (this.phase === 'intro') { if (hit(p, this.btn)) { this.phase = 'grill'; this.pt = 0; this.give(1, W / 2, 200); } return; }
    if (this.phase === 'done') { if (this.pt > 0.6 && hit(p, this.btn)) { State.save(); this.done(); } return; }
    for (const s of this.slots) {
      if (!s.meat || Math.abs(p.x - s.x) > 50 || Math.abs(p.y - s.y) > 32) continue;
      const c = s.meat.c;
      if (c < PERFECT[0]) { FX.float(s.x, s.y - 30, '還沒熟!', { color: '#ffd0d0', size: 18 }); Sound.tap(); return; }
      s.meat = null; s.wait = rand(0.4, 0.9); this.used++;
      if (c <= PERFECT[1]) {
        this.perfect++; FX.sparks(s.x, s.y); FX.ring(s.x, s.y, { r1: 60, color: COLOR.gold }); FX.shake(3, 0.15);
        if (this.gained < 1 + CONFIG.weekendRefill) this.give(1, s.x, s.y); else FX.float(s.x, s.y - 30, '完美!', { color: COLOR.gold });
      } else { FX.float(s.x, s.y - 30, '有點焦…', { color: '#d0a080', size: 18 }); Sound.tap(); }
      return;
    }
  }
  renderMeat(g, s) {
    const m = s.meat, c = m.c, y = s.y - (1 - m.drop) * 40;
    g.save(); g.translate(s.x, y); g.rotate(-0.06);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(4, 6, 46, 20, 0, 0, Math.PI * 2); g.fill();
    fillRR(g, -46, -22, 92, 44, 16, meatColor(c));
    g.globalAlpha = Math.max(0, 0.8 - c);                         // 油花
    for (let i = 0; i < 4; i++) fillRR(g, -36 + i * 20, -16 + (i % 2) * 6, 14, 4, 2, '#fff0f0');
    g.globalAlpha = Math.min(0.7, Math.max(0, (c - 0.3) * 2));    // 烤網痕
    for (let i = 0; i < 4; i++) rect(g, -34 + i * 22, -20, 6, 40, '#3a1c0c');
    g.globalAlpha = 1;
    if (c >= PERFECT[0] && c <= PERFECT[1]) { g.shadowColor = '#ffd24a'; g.shadowBlur = 14 + Math.sin(this.t * 10) * 6; g.lineWidth = 3; g.strokeStyle = '#ffd24a'; rrect(g, -46, -22, 92, 44, 16); g.stroke(); }
    g.restore();
    // 熟度條
    const bw = 80, bx = s.x - 40, by = s.y + 32;
    fillRR(g, bx, by, bw, 8, 4, '#1a1008');
    fillRR(g, bx + bw * PERFECT[0] / 1.18, by, bw * (PERFECT[1] - PERFECT[0]) / 1.18, 8, 2, 'rgba(255,210,74,0.5)');
    rect(g, bx + bw * Math.min(1, c / 1.18) - 1.5, by - 3, 3, 14, '#fff');
  }
  render(g) {
    const t = this.t;
    vgrad(g, 0, 0, W, H, '#3d2215', '#120905');
    for (let i = 0; i < 4; i++) {                                 // 燈籠
      const x = 45 + i * 90, y = 120 + Math.sin(t * 1.5 + i) * 3;
      g.save(); g.shadowColor = '#ff6a3a'; g.shadowBlur = 30; fillRR(g, x - 16, y, 32, 40, 12, '#d8402a'); g.restore();
      rect(g, x - 1, y - 30, 2, 30, '#2a1a10'); text(g, '肉', x, y + 21, { size: 16, align: 'center', base: 'middle', color: '#ffe0a0' });
    }
    energyBar(g, State.energy, CONFIG.maxEnergy, 12, 12, t);
    text(g, this.level.title, W - 14, 20, { size: 18, align: 'right', color: COLOR.accent2, outline: COLOR.ink, ow: 4 });
    // 烤爐
    const cx = 180, cy = 410;
    g.save(); g.shadowColor = '#000'; g.shadowBlur = 24; circle(g, cx, cy, 168, '#2c2c2c'); g.restore();
    circle(g, cx, cy, 160, '#4a4a4a'); circle(g, cx, cy, 150, '#1a1210');
    const coal = g.createRadialGradient(cx, cy, 10, cx, cy, 150);
    coal.addColorStop(0, `rgba(255,${150 + Math.sin(t * 5) * 30},60,0.95)`); coal.addColorStop(0.6, 'rgba(200,50,20,0.6)'); coal.addColorStop(1, 'rgba(40,10,5,0.2)');
    g.fillStyle = coal; g.beginPath(); g.arc(cx, cy, 148, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, 148, 0, Math.PI * 2); g.clip();
    for (let x = cx - 150; x < cx + 150; x += 16) rect(g, x, cy - 150, 4, 300, '#2a2a2a');
    rect(g, cx - 150, cy - 2, 300, 4, '#2a2a2a');
    g.restore();
    for (const s of this.slots) if (s.meat) this.renderMeat(g, s);
    text(g, `肉片 ${this.pieces - this.used} 片   完美 ${this.perfect}`, W / 2, 90, { size: 15, align: 'center', color: COLOR.fg, outline: COLOR.ink, ow: 3 });
    vignette(g, 0.5);
    if (this.phase === 'grill') text(g, '金色發光時點肉吃掉!太早沒熟、太晚會焦', W / 2, 600, { size: 14, align: 'center', color: '#ffd8b0', outline: COLOR.ink, ow: 3 });
    if (this.phase === 'intro' || this.phase === 'done') {
      const k = easeBack(this.pt / 0.4);
      rect(g, 0, 0, W, H, 'rgba(0,0,0,0.55)');
      g.save(); g.translate(W / 2, 360); g.scale(k, k); g.translate(-W / 2, -360);
      panel(g, 30, 180, W - 60, 440, { fill: '#2a1810', edge: COLOR.accent });
      if (this.phase === 'intro') {
        text(g, this.level.title, W / 2, 226, { size: 32, align: 'center', base: 'middle', color: COLOR.accent2, outline: COLOR.ink, ow: 6, glow: '#ff7a3d' });
        wrapText(g, this.level.text + (this.opts.replay ? '\n\n(重溫假日:能量只有第一次放假會補)' : '\n\n放假先補 1 格能量。\n烤肉時在「金色發光」的瞬間點肉,每片完美熟度再 +1!'), 56, 270, W - 112, 28, { size: 17 });
        button(g, this.btn, '開烤!', { pulse: true, t });
      } else {
        text(g, '吃飽了!', W / 2, 226, { size: 34, align: 'center', base: 'middle', color: COLOR.gold, outline: COLOR.ink, ow: 6, glow: '#ffb347' });
        wrapText(g, `完美熟度 ${this.perfect} 片\n本次假日能量 +${this.gained}\n\n帶著滿滿的燒肉能量收假吧!`, 56, 280, W - 112, 30, { size: 18 });
        if (this.pt > 0.6) button(g, this.btn, '收假回營', { pulse: true, t });
      }
      g.restore();
    }
  }
}
