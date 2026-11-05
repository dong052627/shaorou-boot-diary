// 示範小遊戲 1:連點跑障礙。時間內點滿步數過關。
import { W, H } from '../core/engine.js';
import { rect, text, COLOR } from '../core/ui.js';

export default {
  id: 'tapRun',
  create(params, api) {
    let steps = 0, timeLeft = params.time, done = false, bob = 0;
    return {
      update(dt) {
        if (done) return;
        timeLeft -= dt; bob *= 0.85;
        if (steps >= params.goal) { done = true; api.win(timeLeft > params.time * 0.4 ? 3 : timeLeft > params.time * 0.15 ? 2 : 1); }
        else if (timeLeft <= 0) { done = true; api.lose(); }
      },
      onPointerDown() { if (!done) { steps++; bob = 6; } },
      useEnergy() { steps += 15; },
      render(g) {
        rect(g, 0, 300, W, 180, '#4a6b3a');                       // 地面
        const px = 20 + (steps / params.goal) * (W - 60);
        rect(g, px, 260 - bob, 20, 40, '#d9b38c');                 // 玩家(之後換 sprite)
        rect(g, W - 30, 250, 6, 50, '#fff');                       // 終點
        text(g, '狂點螢幕前進!', W / 2, 90, { align: 'center', size: 16 });
        text(g, `${steps} / ${params.goal}`, W / 2, 120, { align: 'center', size: 20, color: COLOR.accent });
        rect(g, 20, 150, (W - 40) * Math.max(0, timeLeft / params.time), 8, COLOR.good);
      },
    };
  },
};
