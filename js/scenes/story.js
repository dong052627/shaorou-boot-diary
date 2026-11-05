import { W, H } from '../core/engine.js';
import { text, wrapText, box, rect, COLOR } from '../core/ui.js';
import { next } from './flow.js';

export class StoryScene {
  constructor(level) { this.level = level; this.i = 0; }
  onPointerDown() { if (++this.i >= this.level.lines.length) next(this.engine); }
  render(g) {
    rect(g, 0, 0, W, H, COLOR.bg);
    text(g, this.level.title, W / 2, 30, { align: 'center', color: COLOR.dim });
    const l = this.level.lines[this.i];
    box(g, 14, 330, W - 28, 130);
    text(g, l.who, 24, 340, { color: COLOR.accent });
    wrapText(g, l.text, 24, 364, W - 48, 20);
    text(g, '▼', W - 26, 440, { color: COLOR.dim });
  }
}
