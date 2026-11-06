import { W, H } from '../core/screen.js';
import { State } from '../core/state.js';
import { FX } from '../core/fx.js';
import { Sound } from '../core/audio.js';
import { text, button, hit, vgrad, vignette, drawFlame, rect, COLOR } from '../core/ui.js';
import { drawSprite, shadow } from '../core/sprite.js';
import { SOLDIER } from '../data/sprites.js';
import { runStep } from './flow.js';
import { DevScene } from './dev.js';

const TITLE = '燒肉新訓日記';

export class TitleScene {
  enter() {
    this.t = 0; this.taps = 0; this.ember = 0;
    this.btns = []; let y = 440;
    if (State.hasSave()) { this.btns.push({ x: 90, y, w: 180, h: 52, label: '繼續', act: 'cont' }); y += 66; }
    this.btns.push({ x: 90, y, w: 180, h: 52, label: '新遊戲', act: 'new' }); y += 66;
    if (/dev/.test(location.search)) this.btns.push({ x: 90, y, w: 180, h: 44, label: '關卡選擇', act: 'dev', color: COLOR.sky });
  }
  update(dt) {
    this.t += dt; this.ember -= dt;
    if (this.ember <= 0) {
      this.ember = 0.04;
      FX.burst(Math.random() * W, H + 4, { n: 1, colors: ['#ff7a3d', '#ffb347', '#ffd24a'], speed: [40, 130], spread: 0.6, life: [2.5, 4.5], size: [2, 4], gravity: -15, drag: 0.15, glow: true });
    }
  }
  onPointerDown(p) {
    if (p.y > 90 && p.y < 190 && ++this.taps >= 5) { State.dev = true; this.engine.goto(new DevScene()); return; }   // 秘技:點標題 5 下
    for (const b of this.btns) if (hit(p, b)) {
      Sound.good(); FX.sparks(b.x + b.w / 2, b.y + b.h / 2);
      if (b.act === 'dev') { State.dev = true; this.engine.goto(new DevScene()); return; }
      State.dev = false;
      if (b.act === 'new') State.reset(); else State.load();
      runStep(this.engine); return;
    }
  }
  render(g) {
    const t = this.t;
    vgrad(g, 0, 0, W, H, '#0b1510', '#2b1609');
    // 營區剪影
    g.fillStyle = '#0a110c';
    g.fillRect(0, 330, W, 40); g.fillRect(20, 300, 90, 40); g.fillRect(250, 290, 100, 50); g.fillRect(150, 270, 6, 70);
    rect(g, 156, 272, 24, 14, '#2a3a26');
    for (let i = 0; i < 6; i++) rect(g, 30 + i * 13, 312, 7, 8, Math.sin(t * 2 + i) > 0.6 ? '#ffd27a' : '#1d2a20');
    for (let i = 0; i < 6; i++) rect(g, 262 + i * 14, 304, 7, 8, Math.sin(t * 1.7 + i * 2) > 0.7 ? '#ffd27a' : '#1d2a20');
    vgrad(g, 0, 368, W, H - 368, '#1a120a', '#0c0805');
    // 燒肉能量光環 + 主角
    g.save(); g.globalAlpha = 0.85; drawFlame(g, W / 2, 400, 150 + Math.sin(t * 3) * 6, t, true); g.restore();
    shadow(g, W / 2, 402, 34, 8, 0.5);
    drawSprite(g, SOLDIER, W / 2, 402 + Math.sin(t * 3) * 2, 5);
    // 標題:逐字彈跳
    [...TITLE].forEach((ch, i) => {
      const x = W / 2 - (TITLE.length - 1) * 23 + i * 46, y = 118 + Math.sin(t * 3 + i * 0.6) * 5;
      text(g, ch, x, y, { size: 42, align: 'center', base: 'middle', color: '#ffe0a0', outline: '#3a1206', ow: 9, glow: '#ff7a3d' });
    });
    text(g, '— 燒肉能量,啟動! —', W / 2, 172, { size: 15, align: 'center', color: COLOR.accent2, outline: COLOR.ink, ow: 4 });
    vignette(g, 0.55);
    this.btns.forEach(b => button(g, b, b.label, { color: b.color ?? COLOR.accent, t, pulse: b.act === 'new' || b.act === 'cont' }));
    text(g, 'v0.2 內部測試版', W / 2, H - 22, { size: 11, align: 'center', color: COLOR.dim });
  }
}
