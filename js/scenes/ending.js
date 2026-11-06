import { W, H } from '../core/screen.js';
import { State } from '../core/state.js';
import { FX } from '../core/fx.js';
import { Sound } from '../core/audio.js';
import { text, wrapText, button, hit, panel, vgrad, vignette, star, COLOR } from '../core/ui.js';

export class EndingScene {
  constructor(level, done) { this.level = level; this.done = done; }
  enter() {
    this.t = 0; this.btn = { x: 90, y: 520, w: 180, h: 52 }; State.save();
    this.total = Object.values(State.stars).reduce((a, b) => a + b, 0);
    FX.confetti(W / 2, 260); Sound.win();
  }
  update(dt) { this.t += dt; if (Math.random() < dt * 1.2) FX.confetti(Math.random() * W, 200); }
  onPointerDown(p) { if (this.t > 0.8 && hit(p, this.btn)) this.done(); }
  render(g) {
    vgrad(g, 0, 0, W, H, '#1d3a28', '#0a140e');
    text(g, this.level.title, W / 2, 110, { size: 44, align: 'center', base: 'middle', color: COLOR.gold, outline: COLOR.ink, ow: 8, glow: '#ffb347' });
    panel(g, 30, 170, W - 60, 320);
    wrapText(g, this.level.text, 54, 196, W - 108, 28, { size: 18 });
    star(g, 120, 380, 22, COLOR.gold, COLOR.ink);
    text(g, `× ${this.total}`, 152, 380, { size: 26, base: 'middle', color: COLOR.gold, outline: COLOR.ink, ow: 5 });
    text(g, `剩餘燒肉能量:${State.energy}`, W / 2, 440, { size: 18, align: 'center', color: COLOR.accent2 });
    vignette(g, 0.45);
    if (this.t > 0.8) button(g, this.btn, '回標題', { pulse: true, t: this.t });
  }
}
