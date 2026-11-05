// 共用繪圖/UI 小工具
export const FONT = '"Zpix","PingFang TC","Microsoft JhengHei",sans-serif';
export const COLOR = { bg:'#1b2a1b', fg:'#e8f0d8', accent:'#ff7a3d', dim:'#7d8f6a', panel:'#2c402c', bad:'#e0463c', good:'#7ed957' };

export function text(g, s, x, y, { size = 14, color = COLOR.fg, align = 'left', base = 'top' } = {}) {
  g.font = `${size}px ${FONT}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  g.fillText(s, x, y);
}
export function wrapText(g, s, x, y, maxW, lh = 18, opt = {}) {
  g.font = `${opt.size || 14}px ${FONT}`;
  let line = '', yy = y;
  for (const ch of s) {
    if (ch === '\n' || g.measureText(line + ch).width > maxW) { text(g, line, x, yy, opt); line = ch === '\n' ? '' : ch; yy += lh; }
    else line += ch;
  }
  text(g, line, x, yy, opt); return yy + lh;
}
export function rect(g, x, y, w, h, color) { g.fillStyle = color; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
export function box(g, x, y, w, h, fill = COLOR.panel, border = COLOR.fg) { rect(g, x - 2, y - 2, w + 4, h + 4, border); rect(g, x, y, w, h, fill); }

export function hit(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
export function button(g, r, label, { color = COLOR.accent, disabled = false } = {}) {
  box(g, r.x, r.y, r.w, r.h, disabled ? '#444' : color, '#000');
  text(g, label, r.x + r.w / 2, r.y + r.h / 2, { align: 'center', base: 'middle', color: disabled ? '#888' : '#1b1b1b' });
}
// 能量條 (🔥 先用方塊,之後換成你的素材)
export function energyBar(g, energy, max, x = 8, y = 8) {
  text(g, '燒肉能量', x, y, { size: 11, color: COLOR.accent });
  for (let i = 0; i < max; i++) rect(g, x + i * 16, y + 16, 13, 13, i < energy ? COLOR.accent : '#3a3a3a');
}
