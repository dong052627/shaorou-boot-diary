import { W, H } from '../core/engine.js';
import { State } from '../core/state.js';
import { text, wrapText, button, hit, rect, COLOR } from '../core/ui.js';
import { TitleScene } from './title.js';

export class EndingScene {
  constructor(level) { this.level = level; }
  enter() { this.btn = { x: 70, y: 380, w: 130, h: 40 }; State.save(); }
  onPointerDown(p) { if (hit(p, this.btn)) this.engine.goto(new TitleScene()); }
  render(g) {
    rect(g, 0, 0, W, H, COLOR.bg);
    text(g, this.level.title, W / 2, 100, { align: 'center', size: 26, color: COLOR.accent });
    wrapText(g, this.level.text, 30, 160, W - 60, 22);
    text(g, `剩餘燒肉能量:${State.energy}`, W / 2, 320, { align: 'center' });
    button(g, this.btn, '回標題');
  }
}
