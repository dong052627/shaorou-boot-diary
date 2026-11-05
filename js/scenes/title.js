import { W, H } from '../core/engine.js';
import { State } from '../core/state.js';
import { text, button, hit, rect, COLOR } from '../core/ui.js';
import { runStep } from './flow.js';

export class TitleScene {
  enter() {
    this.btns = [{ x: 55, y: 300, w: 160, h: 40, label: '新遊戲', act: 'new' }];
    if (State.hasSave()) this.btns.unshift({ x: 55, y: 250, w: 160, h: 40, label: '繼續', act: 'cont' });
  }
  onPointerDown(p) {
    for (const b of this.btns) if (hit(p, b)) {
      if (b.act === 'new') State.reset(); else State.load();
      runStep(this.engine);
    }
  }
  render(g) {
    rect(g, 0, 0, W, H, COLOR.bg);
    text(g, '燒肉新訓日記', W / 2, 110, { align: 'center', size: 28, color: COLOR.accent });
    text(g, '— 內部測試版 —', W / 2, 150, { align: 'center', size: 12, color: COLOR.dim });
    this.btns.forEach(b => button(g, b, b.label));
  }
}
