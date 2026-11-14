// 關卡選擇:新訓日程表。直線式解鎖,過關的關卡可以重玩、看星數。
import { W, H } from '../core/screen.js';
import { State, CONFIG } from '../core/state.js';
import { NODES } from '../data/levels.js';
import { MINIGAMES } from '../minigames/index.js';
import { FX } from '../core/fx.js';
import { Sound } from '../core/audio.js';
import { text, button, hit, rect, fillRR, rrect, vgrad, vignette, energyBar, star, easeBack, clamp, COLOR } from '../core/ui.js';
import { playNode } from './flow.js';
import { TitleScene } from './title.js';

const TYPE_ICON = { weekend: '🍖', ending: '🎓' };
const TYPE_SUB = { weekend: '放假補能量', ending: '新訓結束' };

export class LevelSelectScene {
  constructor({ dev = false, unlockedNow = -1 } = {}) { this.dev = dev; this.unlockedNow = unlockedNow; this.reloadSafe = true; }
  enter() {
    State.dev = this.dev;
    this.t = 0; this.ut = 0;
    this.cards = NODES.map((n, i) => ({ n, i, x: 72, y: 104 + i * 56, w: 274, h: 48, shake: 0 }));
    this.back = { x: 10, y: 16, w: 52, h: 38 };
  }
  isOpen(i) { return this.dev || i <= State.unlocked; }
  shown(i) { return this.isOpen(i) && !(i === this.unlockedNow && this.ut < 0.5); }       // 剛解鎖的關卡先上鎖再解開
  info(n) {
    const m = n.main;
    if (m.type === 'minigame') { const mod = MINIGAMES[m.game]; return { icon: mod.icon ?? '🎮', title: m.title ?? mod.title, sub: n.subtitle }; }
    return { icon: TYPE_ICON[m.type] ?? '⭐', title: m.title, sub: n.subtitle || TYPE_SUB[m.type] || '' };
  }
  update(dt) {
    this.t += dt;
    for (const c of this.cards) c.shake = Math.max(0, c.shake - dt * 3);
    if (this.unlockedNow >= 0 && this.ut < 1) {
      const before = this.ut; this.ut += dt;
      if (before < 0.5 && this.ut >= 0.5) {
        const c = this.cards[this.unlockedNow];
        FX.sparks(44, c.y + c.h / 2, undefined, 26); FX.ring(44, c.y + c.h / 2, { r1: 50, color: COLOR.gold });
        FX.float(c.x + c.w / 2, c.y + 6, '解鎖!', { color: COLOR.gold, size: 24 }); Sound.win();
      }
    }
  }
  onPointerDown(p) {
    if (hit(p, this.back)) { Sound.tap(); State.dev = false; this.engine.goto(new TitleScene()); return; }
    for (const c of this.cards) if (hit(p, c)) {
      if (!this.shown(c.i)) { Sound.bad(); c.shake = 1; FX.float(c.x + c.w / 2, c.y + 14, '先通過前一關!', { color: '#c8d0c0', size: 16 }); return; }
      Sound.good(); FX.sparks(44, c.y + c.h / 2, undefined, 10);
      playNode(this.engine, c.i, { dev: this.dev }); return;
    }
  }
  render(g) {
    const t = this.t;
    vgrad(g, 0, 0, W, H, '#1d3226', '#0b130e');
    g.globalAlpha = 0.05; for (let y = 0; y < H; y += 28) rect(g, 0, y, W, 1, '#fff'); g.globalAlpha = 1;
    // 標題列
    button(g, this.back, '◀', { color: '#9aa4ad', size: 18 });
    text(g, '新訓日程', 74, 20, { size: 22, color: COLOR.accent2, outline: COLOR.ink, ow: 5 });
    energyBar(g, State.energy, CONFIG.maxEnergy, 222, 8, t);
    const done = NODES.filter(n => State.cleared[n.id]).length, maxStars = NODES.filter(n => n.main.type === 'minigame').length * 3;
    text(g, `進度 ${done}/${NODES.length}   ★ ${State.totalStars()}/${maxStars}`, 74, 52, { size: 13, color: COLOR.dim });
    if (this.dev) { fillRR(g, 256, 66, 92, 22, 6, COLOR.sky); text(g, '開發:全解鎖', 302, 77, { size: 12, align: 'center', base: 'middle', color: COLOR.ink }); }
    // 時間軸
    const cy = c => c.y + c.h / 2;
    for (let i = 0; i < this.cards.length - 1; i++) {
      const a = this.cards[i], b = this.cards[i + 1], on = this.shown(i + 1);
      if (on) rect(g, 42, cy(a), 4, cy(b) - cy(a), State.cleared[a.n.id] ? COLOR.accent : '#5a6e5c');
      else for (let y = cy(a) + 18; y < cy(b) - 16; y += 8) rect(g, 43, y, 2, 4, '#3a463c');
    }
    const cur = this.cards.find(c => this.shown(c.i) && !State.cleared[c.n.id]);
    for (const c of this.cards) {
      const open = this.shown(c.i), clr = !!State.cleared[c.n.id], isCur = c === cur, { icon, title, sub } = this.info(c.n);
      const pop = c.i === this.unlockedNow && this.ut >= 0.5 ? easeBack((this.ut - 0.5) / 0.4) : 1;
      g.save(); g.translate(Math.sin(t * 50) * 6 * c.shake, 0);
      // 節點圓圈
      g.save(); g.translate(44, cy(c)); g.scale(pop, pop);
      if (isCur) { g.shadowColor = COLOR.gold; g.shadowBlur = 14 + Math.sin(t * 5) * 6; }
      g.fillStyle = clr ? COLOR.accent : open ? '#e8f0d8' : '#2a332c'; g.beginPath(); g.arc(0, 0, 15, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0; g.lineWidth = 3; g.strokeStyle = isCur ? COLOR.gold : COLOR.ink; g.stroke();
      text(g, clr ? '✓' : open ? `${c.i + 1}` : '🔒', 0, 1, { size: open ? 15 : 13, align: 'center', base: 'middle', color: clr ? '#fff' : COLOR.ink });
      g.restore();
      // 卡片
      g.save();
      if (isCur) { g.shadowColor = COLOR.gold; g.shadowBlur = 12 + Math.sin(t * 5) * 5; }
      fillRR(g, c.x, c.y, c.w, c.h, 10, isCur ? '#33503b' : open ? '#243a2c' : '#161e19');
      g.restore();
      rrect(g, c.x, c.y, c.w, c.h, 10); g.lineWidth = isCur ? 2.5 : 1.5; g.strokeStyle = isCur ? COLOR.gold : open ? 'rgba(201,216,173,0.35)' : 'rgba(255,255,255,0.08)'; g.stroke();
      text(g, icon, c.x + 24, c.y + c.h / 2 + 1, { size: 22, align: 'center', base: 'middle', alpha: open ? 1 : 0.25 });
      text(g, open ? title : '???', c.x + 46, c.y + 8, { size: 17, color: open ? COLOR.fg : '#56605a' });
      text(g, open ? sub : '尚未解鎖', c.x + 46, c.y + 30, { size: 11, color: open ? COLOR.dim : '#46504a', weight: 'normal' });
      const rx = c.x + c.w - 12;
      if (!open) text(g, '🔒', rx, c.y + c.h / 2, { size: 16, align: 'right', base: 'middle', alpha: 0.5 });
      else if (c.n.main.type === 'minigame' && clr) {
        const s = State.stars[c.n.main.id] ?? 0;
        for (let k = 0; k < 3; k++) star(g, rx - 50 + k * 22, c.y + c.h / 2, 9, k < s ? COLOR.gold : '#3a4038', COLOR.ink);
      } else if (clr) text(g, '✓ 完成', rx, c.y + c.h / 2, { size: 14, align: 'right', base: 'middle', color: COLOR.good });
      else if (isCur) { fillRR(g, rx - 54, c.y + 12, 54, 24, 12, COLOR.accent); text(g, '出發 ▶', rx - 27, c.y + 24, { size: 13, align: 'center', base: 'middle', color: '#2a1408' }); }
      g.restore();
    }
    text(g, this.dev ? '開發模式:全部解鎖、不扣能量、不存檔' : '點關卡開始;過關會解鎖下一關,已過的關卡可以重玩', W / 2, 616, { size: 11, align: 'center', color: COLOR.dim, weight: 'normal' });
    vignette(g, 0.4);
  }
}
