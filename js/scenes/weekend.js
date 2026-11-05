import { W, H } from '../core/engine.js';
import { State, CONFIG } from '../core/state.js';
import { text, wrapText, button, hit, rect, energyBar, COLOR } from '../core/ui.js';
import { next } from './flow.js';

// 假日補充。先做成「點一下吃燒肉」的簡化版,之後可換成真正的烤肉小遊戲。
export class WeekendScene {
  constructor(level) { this.level = level; this.eaten = false; }
  enter() { this.btn = { x: 70, y: 340, w: 130, h: 40 }; }
  onPointerDown(p) {
    if (!hit(p, this.btn)) return;
    if (!this.eaten) { State.addEnergy(CONFIG.weekendRefill); this.eaten = true; }
    else next(this.engine);
  }
  render(g) {
    rect(g, 0, 0, W, H, '#3a2418');
    text(g, this.level.title, W / 2, 80, { align: 'center', size: 22, color: COLOR.accent });
    wrapText(g, this.level.text, 30, 130, W - 60, 22);
    energyBar(g, State.energy, CONFIG.maxEnergy, 70, 220);
    button(g, this.btn, this.eaten ? '收假回營' : '吃燒肉!');
    if (this.eaten) text(g, `能量 +${CONFIG.weekendRefill}`, W / 2, 300, { align: 'center', color: COLOR.good });
  }
}
