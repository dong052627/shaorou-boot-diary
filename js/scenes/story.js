import { W, H } from '../core/screen.js';
import { Sound } from '../core/audio.js';
import { text, wrapText, panel, fillRR, vgrad, vignette, ellipse, button, hit, COLOR } from '../core/ui.js';
import { drawSprite, shadow } from '../core/sprite.js';
import { PORTRAITS, SOLDIER } from '../data/sprites.js';

export class StoryScene {
  constructor(level, done, opts = {}) { this.level = level; this.done = done; this.opts = opts; this.i = 0; this.c = 0; this.t = 0; this.lt = 0; this.ended = false; this.skipBtn = { x: 276, y: 26, w: 74, h: 34 }; }
  get line() { return this.level.lines[this.i]; }
  update(dt) {
    this.t += dt; this.lt += dt;
    const before = Math.floor(this.c);
    this.c = Math.min(this.line.text.length, this.c + dt * 34);
    if (Math.floor(this.c) !== before && before % 2 === 0) Sound.tone(this.line.who === '班長' ? 300 : 620, 0.03, 'square', 0.03);
  }
  onPointerDown(p) {
    if (this.ended) return;
    if (hit(p, this.skipBtn)) { this.ended = true; Sound.tap(); (this.opts.onSkip ?? this.done)(); return; }
    if (this.c < this.line.text.length) { this.c = this.line.text.length; return; }
    if (this.i + 1 >= this.level.lines.length) { this.ended = true; this.done(); return; }
    this.i++; this.c = 0; this.lt = 0; Sound.tap();
  }
  render(g) {
    const l = this.line, t = this.t;
    vgrad(g, 0, 0, W, H, '#20352a', '#0b130e');
    // 背景光暈
    g.save(); g.globalAlpha = 0.25; ellipse(g, W / 2, 300, 220, 140, '#3f6b4a'); g.restore();
    panel(g, W / 2 - 90, 24, 180, 40, { r: 20, fill: '#2a1a10', edge: COLOR.accent });
    text(g, this.level.title, W / 2, 44, { size: 17, align: 'center', base: 'middle', color: COLOR.accent2 });
    // 立繪
    const spr = PORTRAITS[l.who] ?? (l.who === '旁白' ? null : SOLDIER);
    if (spr) {
      const right = l.who !== '你', x = right ? 258 : 102, k = Math.min(1, this.lt / 0.2);
      shadow(g, x, 452, 52, 12, 0.45);
      drawSprite(g, spr, x + (right ? 1 : -1) * (1 - k) * 40, 452 + Math.sin(t * 2.5) * 1.5, 6, { flip: right, alpha: k });
    }
    // 對話框
    panel(g, 14, 452, W - 28, 170);
    if (l.who !== '旁白') {
      fillRR(g, 28, 436, 24 + l.who.length * 18, 32, 10, COLOR.accent);
      text(g, l.who, 40, 452, { size: 17, base: 'middle', color: '#2a1408' });
    }
    wrapText(g, l.text, 32, 486, W - 64, 30, { size: 19, limit: Math.floor(this.c), color: l.who === '旁白' ? '#cfe0c4' : COLOR.fg });
    if (this.c >= l.text.length) text(g, '▼', W - 40, 594 + Math.sin(t * 6) * 3, { size: 16, color: COLOR.accent2 });
    vignette(g, 0.4);
    button(g, this.skipBtn, '跳過 ▶▶', { color: '#9aa4ad', size: 13 });
  }
}
