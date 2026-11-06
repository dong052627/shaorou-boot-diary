// 共用繪圖 / UI 工具
import { W, H } from './screen.js';

export const FONT = '"Zpix","PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif';
export const COLOR = {
  bg: '#16221a', fg: '#f4f6ea', accent: '#ff7a3d', accent2: '#ffb347', dim: '#9aae94',
  panel: '#1e3226', panelEdge: '#c9d8ad', bad: '#ff5a4d', good: '#7ee35a', gold: '#ffd24a', ink: '#0d130f', sky: '#5ec8ff',
};
export const pointer = { x: -999, y: -999, down: false };   // 由 engine 更新,按鈕用來顯示按下效果

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
export const easeBack = k => { k = clamp(k); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const rand = (a, b) => a + Math.random() * (b - a);

const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export function shade(hex, amt) {   // amt>0 變亮, <0 變暗
  const f = c => Math.round(clamp(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt), 0, 255));
  const [r, g, b] = rgb(hex); return `rgb(${f(r)},${f(g)},${f(b)})`;
}
export function mix(h1, h2, k) {
  const a = rgb(h1), b = rgb(h2); k = clamp(k);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
}

export function text(g, s, x, y, o = {}) {
  const { size = 16, color = COLOR.fg, align = 'left', base = 'top', weight = 'bold', outline = null, ow = 4, alpha = 1, glow = null } = o;
  g.save(); g.globalAlpha *= alpha;
  g.font = `${weight} ${size}px ${FONT}`; g.textAlign = align; g.textBaseline = base;
  if (outline) { g.lineJoin = 'round'; g.lineWidth = ow; g.strokeStyle = outline; g.strokeText(s, x, y); }
  if (glow) { g.shadowColor = glow; g.shadowBlur = 14; }
  g.fillStyle = color; g.fillText(s, x, y);
  g.restore();
}
const NOSTART = ',。、!?;:)」』…,.!?)%';
// 自動換行;o.limit = 只顯示前 N 個字(打字機效果用,排版不會跳動)
export function wrapText(g, s, x, y, maxW, lh, o = {}) {
  g.save(); g.font = `${o.weight ?? 'bold'} ${o.size ?? 16}px ${FONT}`;
  const lines = []; let line = '';
  for (const ch of s) {
    if (ch === '\n') { lines.push(line); line = ''; continue; }
    if (line && g.measureText(line + ch).width > maxW && !NOSTART.includes(ch)) { lines.push(line); line = ch; } else line += ch;
  }
  lines.push(line); g.restore();
  let left = o.limit ?? Infinity;
  lines.forEach((l, i) => { if (left <= 0) return; const part = [...l].slice(0, left).join(''); left -= [...l].length; text(g, part, x, y + i * lh, o); });
  return y + lines.length * lh;
}

export function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
export function rrect(g, x, y, w, h, r) {
  g.beginPath();
  if (g.roundRect) { g.roundRect(x, y, w, h, r); return; }
  if (Array.isArray(r)) r = r[0];
  r = Math.min(r, w / 2, h / 2);
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function fillRR(g, x, y, w, h, r, c) { rrect(g, x, y, w, h, r); g.fillStyle = c; g.fill(); }
export function vgrad(g, x, y, w, h, c1, c2) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(x, y, w, h); }
export function circle(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.fill(); }
export function ellipse(g, x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2); g.fill(); }
export function hit(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }

export function vignette(g, a = 0.5, color = '0,0,0') {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
  gr.addColorStop(0, `rgba(${color},0)`); gr.addColorStop(1, `rgba(${color},${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

export function panel(g, x, y, w, h, { fill = COLOR.panel, edge = COLOR.panelEdge, r = 14, alpha = 0.97 } = {}) {
  g.save(); g.globalAlpha *= alpha;
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
  fillRR(g, x, y, w, h, r, fill);
  g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.15)');
  rrect(g, x, y, w, h, r); g.fillStyle = gr; g.fill();
  g.lineWidth = 2.5; g.strokeStyle = edge; g.stroke();
  rrect(g, x + 5, y + 5, w - 10, h - 10, Math.max(2, r - 5)); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.14)'; g.stroke();
  g.restore();
}

// 立體按鈕(按下會下沉),pulse=發光呼吸
export function button(g, r, label, { color = COLOR.accent, disabled = false, size = 19, textColor = '#2a1408', t = 0, pulse = false } = {}) {
  const base = disabled ? '#59605a' : color;
  const pressed = !disabled && pointer.down && hit(pointer, r);
  const dy = pressed ? 4 : 0;
  g.save();
  if (pulse && !disabled) { g.shadowColor = color; g.shadowBlur = 14 + Math.sin(t * 6) * 8; }
  fillRR(g, r.x, r.y + 5, r.w, r.h, 12, shade(base, -0.5));
  g.restore();
  const gr = g.createLinearGradient(0, r.y + dy, 0, r.y + dy + r.h);
  gr.addColorStop(0, shade(base, 0.3)); gr.addColorStop(1, shade(base, -0.12));
  rrect(g, r.x, r.y + dy, r.w, r.h, 12); g.fillStyle = gr; g.fill();
  g.lineWidth = 2; g.strokeStyle = shade(base, -0.55); g.stroke();
  fillRR(g, r.x + 8, r.y + dy + 5, r.w - 16, 5, 3, 'rgba(255,255,255,0.35)');
  text(g, label, r.x + r.w / 2, r.y + dy + r.h / 2 + 1, { size, align: 'center', base: 'middle', color: disabled ? '#2e322f' : textColor });
}

export function star(g, cx, cy, r, fill, stroke = null) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath();
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = stroke; g.stroke(); }
  g.fillStyle = fill; g.fill();
}

export function drawFlame(g, cx, cy, s, t = 0, lit = true) {
  const f = lit ? 1 + Math.sin(t * 13 + cx) * 0.07 + Math.sin(t * 7.1) * 0.04 : 1;
  const layers = lit ? [['#ff3d1f', 1], ['#ff8f3d', 0.72], ['#ffe27a', 0.42]] : [['#363b34', 1], ['#474d44', 0.6]];
  g.save();
  if (lit) { g.shadowColor = '#ff6a2a'; g.shadowBlur = s * 0.6; }
  for (const [c, k] of layers) {
    const w = s * 0.42 * k, h = s * k * f;
    g.fillStyle = c; g.beginPath(); g.moveTo(cx, cy - h);
    g.quadraticCurveTo(cx + w * 1.4, cy - h * 0.35, cx + w, cy - w * 0.2);
    g.quadraticCurveTo(cx, cy + w * 0.9, cx - w, cy - w * 0.2);
    g.quadraticCurveTo(cx - w * 1.4, cy - h * 0.35, cx, cy - h); g.fill();
    g.shadowBlur = 0;
  }
  g.restore();
}
export function energyBar(g, energy, max, x, y, t) {
  text(g, '燒肉能量', x, y, { size: 12, color: COLOR.accent2, outline: COLOR.ink, ow: 3 });
  for (let i = 0; i < max; i++) drawFlame(g, x + 11 + i * 26, y + 46, 22, t + i * 0.7, i < energy);
}

// 方向箭頭('up'|'down'|'left'|'right'),'tap' 畫成「壓」字圓鈕
export function drawArrow(g, dir, cx, cy, s, color = COLOR.gold) {
  if (dir === 'tap') {
    g.save(); g.shadowColor = color; g.shadowBlur = 12;
    circle(g, cx, cy, s * 0.46, COLOR.ink); circle(g, cx, cy, s * 0.4, color); g.restore();
    text(g, '壓', cx, cy + 2, { size: s * 0.42, align: 'center', base: 'middle', color: COLOR.ink }); return;
  }
  const ang = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir];
  g.save(); g.translate(cx, cy); g.rotate(ang);
  g.beginPath(); g.moveTo(s * 0.5, 0); g.lineTo(0, -s * 0.45); g.lineTo(0, -s * 0.18); g.lineTo(-s * 0.48, -s * 0.18);
  g.lineTo(-s * 0.48, s * 0.18); g.lineTo(0, s * 0.18); g.lineTo(0, s * 0.45); g.closePath();
  g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = COLOR.ink; g.stroke();
  g.shadowColor = color; g.shadowBlur = 12; g.fillStyle = color; g.fill(); g.restore();
}

export function bubble(g, x, y, w, h, tailX, tailDown = true, fill = '#fffdf2') {
  g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
  fillRR(g, x, y, w, h, 14, fill);
  g.beginPath(); const ty = tailDown ? y + h : y;
  g.moveTo(tailX - 10, ty); g.lineTo(tailX, ty + (tailDown ? 16 : -16)); g.lineTo(tailX + 10, ty); g.fill();
  g.restore();
  rrect(g, x, y, w, h, 14); g.lineWidth = 2.5; g.strokeStyle = COLOR.ink; g.stroke();
}
