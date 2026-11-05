// 示範小遊戲 2:抓時機。準星來回移動,在靶心範圍內點擊。
import { W } from '../core/engine.js';
import { rect, text, COLOR } from '../core/ui.js';

export default {
  id: 'timing',
  create(params, api) {
    let t = 0, hits = 0, miss = 0, speed = params.speed, flash = 0, done = false;
    const zone = { x: W / 2 - 22, w: 44 };
    const pos = () => (Math.sin(t * speed * 2) * 0.5 + 0.5) * (W - 40) + 20;
    return {
      update(dt) { t += dt; flash = Math.max(0, flash - dt); },
      onPointerDown() {
        if (done) return;
        const x = pos();
        if (x >= zone.x && x <= zone.x + zone.w) { hits++; flash = 0.2; } else miss++;
        if (hits >= params.hitsNeeded) { done = true; api.win(miss === 0 ? 3 : miss <= 2 ? 2 : 1); }
        else if (miss >= 3) { done = true; api.lose(); }
      },
      useEnergy() { speed *= 0.6; },
      render(g) {
        text(g, '準星進入靶心時點擊', W / 2, 90, { align: 'center', size: 16 });
        text(g, `命中 ${hits}/${params.hitsNeeded}   失誤 ${miss}/3`, W / 2, 120, { align: 'center', color: COLOR.accent });
        rect(g, 20, 240, W - 40, 12, '#333');
        rect(g, zone.x, 236, zone.w, 20, flash > 0 ? COLOR.good : COLOR.accent);
        rect(g, pos() - 2, 226, 4, 40, '#fff');
      },
    };
  },
};
