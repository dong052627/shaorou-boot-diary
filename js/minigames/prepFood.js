// 伙房備菜:蔬菜往左移動,點螢幕下刀,每片寬度越接近目標越好。
import { W, H } from '../core/screen.js';
import { rect, text, fillRR, vgrad, vignette, shade, easeOut, COLOR } from '../core/ui.js';
import { Sound } from '../core/audio.js';
import { FX } from '../core/fx.js';

const VEGS = [
  { name: '紅蘿蔔', c: '#f28a2e', top: '#4f9a3a', h: 30, len: 230 },
  { name: '小黃瓜', c: '#4f9a3a', top: '#e6d15a', h: 26, len: 240 },
  { name: '白蘿蔔', c: '#eeebe0', top: '#6aa84f', h: 36, len: 220 },
  { name: '茄子', c: '#7a3f9e', top: '#3f6b2a', h: 30, len: 230 },
];
const QCOL = ['#ff5a4d', '#7ee35a', '#ffd24a'];

export default {
  id: 'prepFood', icon: '🔪', title: '伙房備菜',
  howto: ['被抓去伙房支援,五百人份的菜等你切!', '蔬菜會往左移動,點螢幕就下刀。', '每片寬度越接近上方「目標寬度」越好。', '切得好的片數要達六成。'],
  energyHint: '燒肉刀工:顯示下刀輔助線(2 根菜)',
  defaults: { vegs: 3, width: 26, speed: 56, speedUp: 16, pass: 0.6 },
  create(p, api) {
    const KX = 132, BY = 360, T = p.width;
    let vi = 0, veg, off, cuts, marks, v, wait = 0.8, good = 0, expect = 0, guide = 0, chop = 0, done = false, combo = 0, t = 0;
    const startVeg = () => { veg = VEGS[vi % VEGS.length]; cuts = [0]; marks = []; v = p.speed + vi * p.speedUp; expect += Math.floor(veg.len / T); wait = 0.8; };
    startVeg(); off = W + 20;
    return {
      update(dt) {
        t += dt; chop = Math.max(0, chop - dt);
        if (done) return;
        if (wait > 0) { wait -= dt; off = W + 20 + (KX + 2 - W - 20) * easeOut(1 - wait / 0.8); return; }
        off -= v * dt;
        if (KX - off >= veg.len) {
          api.toast(`${veg.name} 切完!`, COLOR.good); vi++; if (guide > 0) guide--;
          if (vi >= p.vegs) {
            done = true; const r = Math.min(1, good / expect);
            r >= p.pass ? api.win(r >= 0.9 ? 3 : r >= 0.75 ? 2 : 1) : api.lose(`好片只有 ${Math.round(r * 100)}%,伙房學長看不下去了…`);
          } else startVeg();
        }
      },
      onPointerDown() {
        if (done || wait > 0) return;
        const kp = KX - off; if (kp <= 0 || kp >= veg.len) return;
        const w = kp - cuts[cuts.length - 1]; if (w < 4) return;
        cuts.push(kp); chop = 0.13; Sound.chop(); FX.shake(2, 0.08);
        FX.burst(KX, BY - 4, { n: 10, colors: [veg.c, shade(veg.c, 0.35)], speed: [80, 220], spread: Math.PI * 0.9, life: [0.3, 0.6], size: [2, 5], gravity: 700 });
        const e = Math.abs(w - T) / T; let q;
        if (e <= 0.12) { q = 2; combo++; FX.sparks(KX, BY - 20); FX.ring(KX, BY, { r1: 40, color: COLOR.gold }); FX.float(KX, BY - 70, combo >= 3 ? `完美 x${combo}` : '完美!', { color: COLOR.gold, size: 22 }); Sound.good(); }
        else if (e <= 0.3) { q = 1; combo = 0; FX.float(KX, BY - 70, '不錯', { color: COLOR.good, size: 18 }); }
        else { q = 0; combo = 0; FX.float(KX, BY - 70, w > T ? '太厚!' : '太薄!', { color: COLOR.bad, size: 20 }); Sound.bad(); }
        if (q > 0) good++; marks.push(q);
      },
      useEnergy() { guide = 2; api.toast('燒肉刀工!顯示輔助線', COLOR.accent); },
      render(g) {
        vgrad(g, 0, 0, W, H, '#56503f', '#2a261e');
        g.globalAlpha = 0.08; for (let y = 80; y < 290; y += 28) rect(g, 0, y, W, 2, '#fff'); for (let x = 0; x < W; x += 28) rect(g, x, 80, 2, 210, '#fff'); g.globalAlpha = 1;
        vgrad(g, 0, 290, W, 12, '#c9ced3', '#7c858c'); vgrad(g, 0, 302, W, H - 302, '#9aa3aa', '#5b6369');
        // 砧板
        g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16; g.shadowOffsetY = 8; fillRR(g, 8, BY - 48, W - 16, 104, 10, '#c89b63'); g.restore();
        g.globalAlpha = 0.18; for (let i = 0; i < 6; i++) rect(g, 20, BY - 38 + i * 16, W - 40, 2, '#6a4a2a'); g.globalAlpha = 1;
        fillRR(g, 8, BY + 48, W - 16, 8, 4, '#8a6a3f');
        // 目標寬度
        fillRR(g, 16, 140, W - 32, 64, 10, 'rgba(0,0,0,0.35)');
        text(g, '目標寬度', 30, 172, { size: 15, base: 'middle', color: COLOR.fg });
        fillRR(g, 112, 158, T, veg.h, 4, veg.c); rect(g, 112, 152, 2, veg.h + 12, COLOR.gold); rect(g, 110 + T, 152, 2, veg.h + 12, COLOR.gold);
        text(g, `${veg.name}  ${Math.min(vi + 1, p.vegs)}/${p.vegs}`, W - 30, 172, { size: 16, align: 'right', base: 'middle', color: COLOR.accent2 });
        text(g, `好片 ${good}`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4 });
        // 蔬菜
        const h = veg.h, top = BY - h / 2, grd = g.createLinearGradient(0, top, 0, top + h);
        grd.addColorStop(0, shade(veg.c, 0.35)); grd.addColorStop(0.45, veg.c); grd.addColorStop(1, shade(veg.c, -0.35));
        for (let j = 0; j < cuts.length; j++) {
          const a = cuts[j], b = cuts[j + 1] ?? veg.len, cut = j < cuts.length - 1, n = cuts.length - 1 - j;
          const xa = off + a - (cut ? n * 4 : 0), w = b - a - (cut ? 2 : 0), dy = cut ? Math.min(4, n) : 0;
          g.save(); g.translate(0, dy);
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(xa + 3, top + h - 2, w, 6);
          fillRR(g, xa, top, w, h, j === 0 ? h / 2 : !cut ? [3, h / 2, h / 2, 3] : 3, grd);
          if (cut) rect(g, xa + w - 2, top + 2, 2, h - 4, shade(veg.c, 0.5));
          if (cut && marks[j] != null) fillRR(g, xa + w / 2 - 4, top + h + 8, 8, 8, 3, QCOL[marks[j]]);
          if (!cut) { fillRR(g, xa + w - 4, top - 8, 14, 8, 3, veg.top); fillRR(g, xa + w, top + 2, 16, 6, 3, veg.top); fillRR(g, xa + w - 2, top + h - 6, 12, 6, 3, veg.top); }
          g.restore();
        }
        if (guide > 0 && wait <= 0) {
          const last = cuts[cuts.length - 1];
          for (let x = last + T; x < veg.len; x += T) { g.save(); g.shadowColor = COLOR.accent; g.shadowBlur = 8; rect(g, off + x - 1, top - 12, 2, h + 24, COLOR.accent); g.restore(); }
        }
        // 菜刀
        const rest = top - 40, low = top + h + 2, k = chop > 0 ? Math.sin((1 - chop / 0.13) * Math.PI) : 0;
        const bottom = rest + (low - rest) * k, bt = bottom - 70;
        g.save(); g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 10;
        const kg = g.createLinearGradient(KX, 0, KX + 30, 0); kg.addColorStop(0, '#ffffff'); kg.addColorStop(0.3, '#d9dee2'); kg.addColorStop(1, '#8a949c');
        g.fillStyle = kg; g.beginPath(); g.moveTo(KX - 1, bt); g.lineTo(KX + 30, bt); g.lineTo(KX + 30, bottom - 6); g.lineTo(KX - 1, bottom); g.closePath(); g.fill(); g.restore();
        fillRR(g, KX + 6, bt - 46, 18, 50, 6, '#5a3a1f'); rect(g, KX + 13, bt - 36, 4, 4, '#c9b27a'); rect(g, KX + 13, bt - 20, 4, 4, '#c9b27a');
        if (wait > 0 && !done) text(g, `下一個:${veg.name}`, W / 2, 250, { size: 26, align: 'center', base: 'middle', color: COLOR.accent2, outline: COLOR.ink, ow: 6 });
        text(g, '點螢幕下刀', W / 2, 470, { size: 16, align: 'center', color: '#e8ecef', outline: COLOR.ink, ow: 4 });
        vignette(g, 0.45);
      },
    };
  },
};
