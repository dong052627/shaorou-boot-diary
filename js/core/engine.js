// 引擎:畫布縮放、主迴圈、指標輸入、場景切換。邏輯解析度固定 270x480 (9:16)
export const W = 270, H = 480;

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = W; canvas.height = H;
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.scene = null;
    this.t = 0;
    this._resize();
    addEventListener('resize', () => this._resize());
    const pt = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    };
    canvas.addEventListener('pointerdown', e => { e.preventDefault(); this.scene?.onPointerDown?.(pt(e)); });
    canvas.addEventListener('pointermove', e => { this.scene?.onPointerMove?.(pt(e)); });
    canvas.addEventListener('pointerup',   e => { this.scene?.onPointerUp?.(pt(e)); });
  }
  _resize() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    this.canvas.style.width = W * s + 'px';
    this.canvas.style.height = H * s + 'px';
  }
  goto(scene) { this.scene = scene; scene.engine = this; scene.enter?.(); }
  start() {
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; this.t += dt;
      this.scene?.update?.(dt);
      this.g.clearRect(0, 0, W, H);
      this.scene?.render?.(this.g);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
