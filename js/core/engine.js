// 引擎:高解析度畫布、主迴圈、指標輸入、場景切換(圓形轉場)、特效整合
import { W, H } from './screen.js';
import { Sound } from './audio.js';
import { FX } from './fx.js';
import { pointer, clamp, COLOR } from './ui.js';
export { W, H };

const OUT = 0.25, IN = 0.3;

export class Engine {
  constructor(canvas) {
    this.canvas = canvas; this.g = canvas.getContext('2d');
    this.scene = null; this.t = 0; this.scale = 1; this.trans = null;
    this._resize(); addEventListener('resize', () => this._resize());
    const pt = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * this.fullH / r.height - this.offY }; };
    const busy = () => this.trans && this.trans.phase === 'out';
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault(); Sound.unlock();
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      const p = pt(e); Object.assign(pointer, p, { down: true });
      if (!busy()) this.scene?.onPointerDown?.(p);
    });
    canvas.addEventListener('pointermove', e => { const p = pt(e); pointer.x = p.x; pointer.y = p.y; if (!busy()) this.scene?.onPointerMove?.(p); });
    const up = e => { const p = pt(e); pointer.down = false; if (!busy()) this.scene?.onPointerUp?.(p); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  }
  _resize() {
    // 長螢幕(19.5:9 等)時把畫布加高,遊戲區 360x640 置中,上下用邊緣延伸填滿 → 沒有黑邊
    this.fullH = Math.min(W * 2.3, Math.max(H, W * innerHeight / innerWidth));
    this.offY = (this.fullH - H) / 2;
    const css = Math.min(innerWidth / W, innerHeight / this.fullH);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    this.scale = css * dpr;                                   // 依螢幕實際像素繪製 → 清晰
    this.canvas.width = Math.round(W * this.scale); this.canvas.height = Math.round(this.fullH * this.scale);
    this.canvas.style.width = W * css + 'px'; this.canvas.style.height = this.fullH * css + 'px';
  }
  goto(scene, { instant = false } = {}) {
    if (instant || !this.scene) return this._enter(scene);
    if (this.trans?.phase === 'out') { this.trans.next = scene; return; }
    this.trans = { phase: 'out', t: 0, next: scene };
  }
  _enter(scene) { this.scene = scene; scene.engine = this; FX.clear(); scene.enter?.(); }
  start() {
    let last = performance.now();
    const loop = now => {
      const raw = Math.min(0.05, (now - last) / 1000); last = now; this.t += raw;
      const tr = this.trans;
      if (tr) { tr.t += raw; if (tr.phase === 'out' && tr.t >= OUT) { this._enter(tr.next); tr.phase = 'in'; tr.t = 0; } else if (tr.phase === 'in' && tr.t >= IN) this.trans = null; }
      const dt = FX.scaleDt(raw);
      this.scene?.update?.(dt); FX.update(dt);
      const g = this.g, S = this.scale, oy = this.offY;
      g.setTransform(S, 0, 0, S, 0, 0); g.clearRect(0, 0, W, this.fullH);
      g.setTransform(S, 0, 0, S, 0, oy * S); g.imageSmoothingEnabled = false;
      const [sx, sy] = FX.offset();
      g.save(); g.translate(sx, sy); this.scene?.render?.(g); FX.render(g); g.restore();
      if (oy > 0.5) {                                         // 上下延伸帶:拉伸遊戲區最邊緣的一列像素
        const c = this.canvas, top = Math.ceil(oy * S) + 1, bot = Math.floor((oy + H) * S) - 2, cw = c.width;
        g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true;
        g.drawImage(c, 0, top, cw, 1, 0, 0, cw, top);
        g.drawImage(c, 0, bot, cw, 1, 0, bot + 1, cw, c.height - bot - 1);
      }
      g.setTransform(S, 0, 0, S, 0, 0);
      FX.renderOverlay(g, this.fullH);
      if (this.trans) this._renderTrans(g);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  _renderTrans(g) {
    const tr = this.trans, k = clamp(tr.phase === 'out' ? tr.t / OUT : 1 - tr.t / IN);
    const FH = this.fullH, cy = FH * 0.47, R = Math.hypot(W, FH) * 0.62 * Math.pow(1 - k, 1.5);
    g.save(); g.fillStyle = '#070b08'; g.beginPath(); g.rect(0, 0, W, FH); g.arc(W / 2, cy, Math.max(0.01, R), 0, Math.PI * 2); g.fill('evenodd');
    if (R > 1) { g.strokeStyle = COLOR.accent; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, cy, R, 0, Math.PI * 2); g.stroke(); }
    g.restore();
  }
}
