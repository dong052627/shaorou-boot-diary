// 滑動偵測:down() 記起點,up() 回傳 'tap' | 'up' | 'down' | 'left' | 'right'
export class Swipe {
  constructor(min = 24) { this.min = min; this.s = null; }
  down(p) { this.s = { x: p.x, y: p.y }; }
  up(p) {
    if (!this.s) return null;
    const dx = p.x - this.s.x, dy = p.y - this.s.y; this.s = null;
    if (Math.hypot(dx, dy) < this.min) return 'tap';
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
}
