// 像素精靈圖:用字串畫像素,啟動時轉成小畫布,放大時保持銳利。
// def = { rows:[...], pal:{字元:顏色}, mirror:true(只寫左半邊,自動左右對稱) }
// 之後要換成自己畫的 png:用 Assets.get('名稱') 拿到 Image,一樣用 g.drawImage 畫即可。
export function makeSprite(def) {
  if (def._c) return def._c;
  const rows = def.mirror ? def.rows.map(r => r + [...r].reverse().join('')) : def.rows;
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { const col = def.pal[ch]; if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } }));
  def._c = c; return c;
}
export function drawSprite(g, def, x, y, s = 3, { flip = false, anchor = 'bottom', alpha = 1, rot = 0, sx = 1, sy = 1 } = {}) {
  const c = makeSprite(def), w = c.width * s, h = c.height * s;
  g.save(); g.imageSmoothingEnabled = false; g.globalAlpha *= alpha;
  g.translate(x, y); if (rot) g.rotate(rot); g.scale((flip ? -1 : 1) * sx, sy);
  g.drawImage(c, -w / 2, anchor === 'bottom' ? -h : -h / 2, w, h);
  g.restore();
}
export function shadow(g, x, y, rx, ry = rx * 0.3, a = 0.3) {
  g.save(); g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore();
}
