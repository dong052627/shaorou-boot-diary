import { W, H } from '../core/engine.js';
import { State } from '../core/state.js';
import { MINIGAMES } from '../minigames/index.js';
import { text, button, hit, rect, box, energyBar, COLOR } from '../core/ui.js';
import { next } from './flow.js';

export class MinigameScene {
  constructor(level) { this.level = level; }
  enter() { this.restart(); }
  restart() {
    this.result = null; this.stars = 0;
    const api = { engine: this.engine,
      win: (s = 1) => { this.result = 'win'; this.stars = s; State.stars[this.level.id] = Math.max(State.stars[this.level.id] || 0, s); State.save(); },
      lose: () => { this.result = 'lose'; } };
    this.game = MINIGAMES[this.level.game].create(this.level.params, api);
    this.energyUsed = false;
    this.energyBtn = { x: W - 110, y: 8, w: 102, h: 30 };
    this.okBtn = { x: 70, y: 330, w: 130, h: 36 };
    this.retryBtn = { x: 70, y: 380, w: 130, h: 36 };
  }
  update(dt) { if (!this.result) this.game.update?.(dt); }
  canEnergy() { return this.level.canUseEnergy && !this.energyUsed && State.energy > 0 && !this.result; }
  onPointerDown(p) {
    if (this.result === 'win') { if (hit(p, this.okBtn)) next(this.engine); return; }
    if (this.result === 'lose') { if (hit(p, this.retryBtn)) this.restart(); return; }
    if (this.canEnergy() && hit(p, this.energyBtn)) { State.useEnergy(1); this.energyUsed = true; this.game.useEnergy?.(); return; }
    this.game.onPointerDown?.(p);
  }
  onPointerMove(p) { this.game.onPointerMove?.(p); }
  onPointerUp(p) { this.game.onPointerUp?.(p); }
  render(g) {
    rect(g, 0, 0, W, H, COLOR.bg);
    this.game.render(g);
    energyBar(g, State.energy, 5);
    text(g, this.level.title, 8, 52, { size: 11, color: COLOR.dim });
    if (this.level.canUseEnergy) {
      button(g, this.energyBtn, '🔥能量', { disabled: !this.canEnergy() });
      text(g, this.level.energyHint || '', W - 8, 42, { size: 10, color: COLOR.dim, align: 'right' });
    }
    if (this.result) {
      rect(g, 0, 0, W, H, 'rgba(0,0,0,0.6)');
      box(g, 30, 220, W - 60, 220);
      text(g, this.result === 'win' ? '過關!' : '失敗…', W / 2, 240, { align: 'center', size: 24, color: this.result === 'win' ? COLOR.good : COLOR.bad });
      if (this.result === 'win') {
        text(g, '★'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, 285, { align: 'center', size: 22, color: '#ffd24a' });
        button(g, this.okBtn, '繼續');
      } else button(g, this.retryBtn, '再來一次');
    }
  }
}
