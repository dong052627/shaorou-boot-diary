// 開發者關卡選擇:網址加 ?dev 或在標題點 5 下進入。不扣能量、不影響存檔。
import { W, H } from '../core/screen.js';
import { State } from '../core/state.js';
import { LEVELS } from '../data/levels.js';
import { MINIGAMES } from '../minigames/index.js';
import { text, button, hit, vgrad, COLOR } from '../core/ui.js';
import { MinigameScene } from './minigame.js';
import { WeekendScene } from './weekend.js';

export class DevScene {
  enter() {
    State.dev = true; this.t = 0;
    const items = LEVELS.filter(l => l.type === 'minigame' || l.type === 'weekend').filter((l, i, a) => l.type !== 'weekend' || a.findIndex(x => x.type === 'weekend') === i);
    this.btns = items.map((l, i) => ({ x: 60, y: 110 + i * 56, w: 240, h: 44, level: l, label: l.type === 'weekend' ? '假日:烤肉' : (l.title ?? MINIGAMES[l.game].title) }));
    this.back = { x: 100, y: 110 + items.length * 56 + 10, w: 160, h: 40 };
  }
  update(dt) { this.t += dt; }
  onPointerDown(p) {
    const back = () => this.engine.goto(new DevScene());
    for (const b of this.btns) if (hit(p, b)) {
      const S = b.level.type === 'weekend' ? WeekendScene : MinigameScene;
      this.engine.goto(new S(b.level, back, { dev: true })); return;
    }
    if (hit(p, this.back)) { State.dev = false; import('./title.js').then(m => this.engine.goto(new m.TitleScene())); }
  }
  render(g) {
    vgrad(g, 0, 0, W, H, '#10202a', '#081014');
    text(g, '關卡選擇(開發)', W / 2, 50, { size: 24, align: 'center', color: COLOR.sky, outline: COLOR.ink, ow: 5 });
    text(g, '不扣能量、不影響存檔', W / 2, 80, { size: 12, align: 'center', color: COLOR.dim });
    this.btns.forEach(b => button(g, b, b.label, { size: 17, t: this.t }));
    button(g, this.back, '回標題', { color: '#9aa4ad', size: 16 });
  }
}
