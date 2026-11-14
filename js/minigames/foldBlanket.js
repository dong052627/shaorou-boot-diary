// 折棉被(國軍豆腐乾正統折法),班長逐步下口令:
// ① 鋪平拉撐 → ② 縱向三折(三等份)→ ③ 兩端往中間折(四等份,中間留一個手掌寬)→ ④ 對折
// → ⑤ 壓實 → ⑥ 捏線 → ⑦ 捏角
// 折線不平均會被要求重折;錯 3 次棉被會被丟出窗外。
import { W, H } from '../core/screen.js';
import { rect, text, wrapText, fillRR, vgrad, vignette, bubble, drawArrow, ellipse, circle, clamp, lerp, rand, easeOut, COLOR } from '../core/ui.js';
import { drawSprite, shadow } from '../core/sprite.js';
import { SERGEANT } from '../data/sprites.js';
import { Sound } from '../core/audio.js';
import { FX } from '../core/fx.js';

const C1 = '#6e7f48', C2 = '#4e5d32', FLAP1 = '#80925a', FLAP2 = '#56663a', PREV1 = '#93a66a', PREV2 = '#62744a', SEAM = 'rgba(40,50,24,0.6)';
const X0 = 50, X1 = 310, Y0 = 262, Y1 = 602, MIDY = (Y0 + Y1) / 2, PALM = 30;   // 棉被攤平時的範圍、一個手掌寬
const BW = 210, BH = 120, BD = 38, BX = W / 2 - BW / 2, BY = 360;              // 整形階段的豆腐乾
const ORDERS = {
  smooth: ['鋪平拉撐!', '在棉被上來回滑,把皺褶全部撫平'],
  tri1: ['縱向三折!', '抓住左或右邊緣往內拉,取三等份'],
  tri2: ['另一邊蓋上去!', '邊緣要對齊折線'],
  quad1: ['兩端往中間折!', '上下各折四分之一,中間留一個手掌寬'],
  quad2: ['另一端也折!', '中間要留一個手掌寬'],
  half: ['對折!', '由上往下滑'],
  press: ['壓實!', '連點棉被,把棉花壓紮實'],
  line: ['捏線!', '沿著發光的邊滑過去,捏出線條'],
  corner: ['捏角!', '點四個角,捏出直角'],
};
const STEP_NO = { smooth: 1, tri: 2, quad: 3, half: 4, press: 5, line: 6, corner: 7 };

const segDist = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1, k = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - x1 - k * dx, py - y1 - k * dy);
};

export default {
  id: 'foldBlanket', icon: '🛏️', title: '折棉被',
  howto: [
    '照國軍正統「豆腐乾」折法,跟著班長口令做:',
    '鋪平拉撐 → 縱向三折 → 兩端往中間折(留一個手掌)→ 對折',
    '最後壓實、捏線、捏角。',
    '折得不平均要重折,錯 3 次棉被會被丟出窗外!',
  ],
  energyHint: '燒肉手刀:顯示等分線 / 整形時一次捏好一半',
  defaults: { shapeTime: 18, maxMistakes: 3, presses: 6 },
  create(p, api) {
    const wrinkles = Array.from({ length: 7 }, () => {
      const cx = rand(X0 + 40, X1 - 40), cy = rand(Y0 + 40, Y1 - 40), a = rand(0, Math.PI), l = rand(50, 90);
      return { x1: cx - Math.cos(a) * l / 2, y1: cy - Math.sin(a) * l / 2, x2: cx + Math.cos(a) * l / 2, y2: cy + Math.sin(a) * l / 2, hp: 1 };
    });
    let step = 'smooth', t = 0, mistakes = 0, guide = false, done = false, fly = null, wob = 0, down = false, last = null;
    let fL = null, fR = null, fT = null, fB = null, drag = null, swipe0 = null;
    const triOrder = [], quadOrder = [], grades = [];
    let halfK = -1, zoomK = -1, pressN = 0, squash = 0, shapeT = p.shapeTime, lineDrag = null, shine = -1;
    const edgeDone = [false, false, false, false], cornerDone = [false, false, false, false];
    const EDGES = [[BX, BY, BX + BW, BY], [BX, BY + BH, BX + BW, BY + BH], [BX, BY, BX, BY + BH], [BX + BW, BY, BX + BW, BY + BH]];
    const CORNERS = [[BX, BY], [BX + BW, BY], [BX, BY + BH], [BX + BW, BY + BH]];
    const midX = () => ((fL ?? X0) + (fR ?? X1)) / 2;

    // 每一折的「邊緣該落在哪」
    const target = side => ({
      L: fR == null ? X0 + (X1 - X0) * 2 / 3 : fR,                  // 三等份;第二折邊緣對齊第一折的折線
      R: fL == null ? X0 + (X1 - X0) / 3 : fL,
      T: fB == null ? MIDY - PALM / 2 : (2 * fB - Y1) - PALM,      // 四等份,中間留一個手掌
      B: fT == null ? MIDY + PALM / 2 : (2 * fT - Y0) + PALM,
    })[side];
    const EDGE = { L: X0, R: X1, T: Y0, B: Y1 };

    const foldFx = (side, line) => {
      Sound.tone(180, 0.08, 'triangle', 0.18); FX.shake(3, 0.1);
      for (let i = 0; i < 4; i++) side === 'L' || side === 'R' ? FX.dust(line, Y0 + (Y1 - Y0) * (i + 0.5) / 4, 4) : FX.dust(fL + (fR - fL) * (i + 0.5) / 4, line, 3);
    };
    const mistake = msg => {
      mistakes++; wob = 1; Sound.bad(); FX.shake(7, 0.25); FX.flash('#ff3030', 0.15, 0.2);
      if (mistakes >= p.maxMistakes) { done = true; fly = { x: 0, y: 0, vx: 420, vy: -620, r: 0 }; api.lose('棉被被班長從窗戶丟出去了!'); }
      else api.toast(`班長:${msg}重折!(失誤 ${mistakes}/${p.maxMistakes})`, COLOR.bad);
    };
    const commit = () => {
      const d = drag; drag = null;
      const vert = d.side === 'L' || d.side === 'R', land = vert ? d.x : d.y, edge = EDGE[d.side];
      if (Math.abs(land - edge) < 24) return;                                  // 拉太短,當作沒折
      const err = Math.abs(land - target(d.side)), [perf, ok] = vert ? [14, 32] : [10, 22];
      if (err > ok) { mistake(vert ? '三等份不平均,' : '中間要留一個手掌,'); return; }
      const line = (edge + land) / 2;
      if (d.side === 'L') fL = line; else if (d.side === 'R') fR = line; else if (d.side === 'T') fT = line; else fB = line;
      (vert ? triOrder : quadOrder).push(d.side);
      grades.push(err <= perf ? 2 : 1);
      foldFx(d.side, line);
      const fx = vert ? line : midX(), fy = vert ? MIDY : line;
      if (err <= perf) { FX.sparks(fx, fy); FX.float(fx, fy - 30, '完美!', { color: COLOR.gold, size: 22 }); Sound.good(); }
      else FX.float(fx, fy - 30, '還可以', { color: COLOR.good, size: 18 });
      if (vert && fL != null && fR != null) { step = 'quad'; api.toast('三折完成!換橫向', COLOR.good); }
      if (!vert && fT != null && fB != null) { step = 'half'; api.toast('留得剛好一個手掌!準備對折', COLOR.good); }
    };
    const winNow = () => {
      done = true; shine = 0;
      CORNERS.forEach(([x, y]) => FX.sparks(x, y));
      api.toast('班長:這才叫豆腐乾!', COLOR.gold);
      const perfect = grades.filter(g => g === 2).length, left = shapeT / p.shapeTime;
      api.win(mistakes === 0 && perfect >= 3 && left > 0.3 ? 3 : mistakes <= 1 ? 2 : 1);
    };
    const nextShape = () => {
      if (step === 'press' && pressN >= p.presses) { step = 'line'; api.toast('壓實了!開始捏線', COLOR.good); }
      if (step === 'line' && edgeDone.every(Boolean)) { step = 'corner'; api.toast('線很挺!最後捏角', COLOR.good); }
      if (step === 'corner' && cornerDone.every(Boolean)) winNow();
    };
    const pinchEdge = i => { edgeDone[i] = true; const [x1, y1, x2, y2] = EDGES[i]; for (let k = 0; k <= 4; k++) FX.sparks(lerp(x1, x2, k / 4), lerp(y1, y2, k / 4), ['#ffffff', '#e8f0c8'], 4); Sound.tone(900, 0.06, 'square', 0.08); };
    const pinchCorner = i => { cornerDone[i] = true; const [x, y] = CORNERS[i]; FX.sparks(x, y); FX.ring(x, y, { r1: 30, color: COLOR.gold }); Sound.tone(1200, 0.08, 'square', 0.09); };

    // ---------- 繪圖 ----------
    const layer = (g, x0, y0, x1, y1, c1, c2) => {
      const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
      if (w < 1 || h < 1) return;
      g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
      const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      fillRR(g, x, y, w, h, 4, gr); g.restore();
      g.save(); g.globalAlpha = 0.07; for (let i = x + 8; i < x + w - 4; i += 12) rect(g, i, y + 3, 1, h - 6, '#ffffff'); g.restore();
    };
    const dashed = (g, x1, y1, x2, y2, color = COLOR.accent) => { g.save(); g.setLineDash([7, 6]); g.lineWidth = 2.5; g.strokeStyle = color; g.shadowColor = color; g.shadowBlur = 8; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); };
    const grabHint = (g, dir, x, y) => { g.save(); g.globalAlpha = 0.45 + 0.4 * Math.sin(t * 6); drawArrow(g, dir, x, y, 30, COLOR.gold); g.restore(); };

    const drawTri = g => {
      let L = fL ?? X0, R = fR ?? X1;
      const pv = drag && (drag.side === 'L' || drag.side === 'R') ? drag : null;
      if (pv) { const line = (EDGE[pv.side] + pv.x) / 2; if (pv.side === 'L') L = line; else R = line; }
      layer(g, L, Y0, R, Y1, C1, C2);
      if (step === 'smooth') for (const w of wrinkles) {
        g.save(); g.globalAlpha = w.hp; g.lineCap = 'round';
        g.lineWidth = 4; g.strokeStyle = 'rgba(30,40,18,0.7)'; g.beginPath(); g.moveTo(w.x1, w.y1); g.lineTo(w.x2, w.y2); g.stroke();
        g.lineWidth = 2; g.strokeStyle = 'rgba(200,220,150,0.5)'; g.beginPath(); g.moveTo(w.x1 + 2, w.y1 - 2); g.lineTo(w.x2 + 2, w.y2 - 2); g.stroke(); g.restore();
      }
      for (const s of triOrder) s === 'L' ? layer(g, fL, Y0, 2 * fL - X0, Y1, FLAP1, FLAP2) : layer(g, 2 * fR - X1, Y0, fR, Y1, FLAP1, FLAP2);
      if (pv) { const line = (EDGE[pv.side] + pv.x) / 2; layer(g, line, Y0, pv.x, Y1, PREV1, PREV2); dashed(g, line, Y0 - 8, line, Y1 + 8, '#ffffff'); }
      if (step === 'tri' && !drag) {
        if (fL == null) grabHint(g, 'right', X0 + 4, MIDY);
        if (fR == null) grabHint(g, 'left', X1 - 4, MIDY);
        if (guide) for (const s of ['L', 'R']) if ((s === 'L' ? fL : fR) == null) { const line = (EDGE[s] + target(s)) / 2; dashed(g, line, Y0 - 10, line, Y1 + 10); }
      }
    };
    const drawStrip = (g, preview = true) => {
      let T = fT ?? Y0, B = fB ?? Y1;
      const pv = preview && drag && (drag.side === 'T' || drag.side === 'B') ? drag : null;
      if (pv) { const line = (EDGE[pv.side] + pv.y) / 2; if (pv.side === 'T') T = line; else B = line; }
      layer(g, fL, T, fR, B, C1, C2);
      for (const x of [2 * fL - X0, 2 * fR - X1]) if (x > fL + 3 && x < fR - 3) rect(g, x, T + 2, 1.5, B - T - 4, SEAM);   // 三折的層線
      for (const s of quadOrder) s === 'T' ? layer(g, fL, fT, fR, 2 * fT - Y0, FLAP1, FLAP2) : layer(g, fL, 2 * fB - Y1, fR, fB, FLAP1, FLAP2);
      if (pv) { const line = (EDGE[pv.side] + pv.y) / 2; layer(g, fL, line, fR, pv.y, PREV1, PREV2); dashed(g, fL - 10, line, fR + 10, line, '#ffffff'); }
      if (step === 'quad' && !drag && preview) {
        const cx = midX();
        if (fT == null) grabHint(g, 'down', cx, Y0 + 6);
        if (fB == null) grabHint(g, 'up', cx, Y1 - 6);
        if (guide) {
          for (const s of ['T', 'B']) if ((s === 'T' ? fT : fB) == null) { const line = (EDGE[s] + target(s)) / 2; dashed(g, fL - 12, line, fR + 12, line); }
          const a = fT != null ? 2 * fT - Y0 : MIDY - PALM / 2, b = fB != null ? 2 * fB - Y1 : MIDY + PALM / 2;
          g.save(); g.globalAlpha = 0.35; rect(g, fL, a, fR - fL, b - a, COLOR.gold); g.restore();
          text(g, '✋ 一個手掌', fR + 8, (a + b) / 2, { size: 12, base: 'middle', color: COLOR.gold, outline: COLOR.ink, ow: 3 });
        }
      }
    };
    const block3D = (g, x, y, w, h, d) => {
      shadow(g, x + w / 2, y + h + d + 6, w * 0.55, 12, 0.35);
      const s = Math.sin(squash * Math.PI) * 0.06;
      g.save(); g.translate(x + w / 2, y + h + d); g.scale(1 + s * 0.5, 1 - s); g.translate(-(x + w / 2), -(y + h + d));
      vgrad(g, x, y + h, w, d, '#4a5830', '#323d1c');
      const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#76884e'); gr.addColorStop(1, '#55653a');
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.restore();
    };
    const drawShape = g => {
      const k = easeOut(clamp(zoomK)), m = (fT + fB) / 2;
      const x = lerp(fL, BX, k), y = lerp(m, BY, k), w = lerp(fR - fL, BW, k), h = lerp(fB - m, BH, k), d = lerp(6, BD, k);
      block3D(g, x, y, w, h, d);
      if (zoomK < 1) return;
      const wa = 1 - pressN / p.presses;                                        // 皺褶(壓實後消失)
      if (wa > 0) { g.save(); g.globalAlpha = wa * 0.8; g.lineCap = 'round'; g.lineWidth = 3; g.strokeStyle = 'rgba(30,40,18,0.7)';
        [[0.15, 0.3, 0.45, 0.2], [0.55, 0.55, 0.85, 0.4], [0.2, 0.75, 0.5, 0.65], [0.6, 0.15, 0.8, 0.3]].forEach(([a, b, c, e]) => { g.beginPath(); g.moveTo(BX + BW * a, BY + BH * b); g.quadraticCurveTo(BX + BW * (a + c) / 2, BY + BH * (b + e) / 2 - 8, BX + BW * c, BY + BH * e); g.stroke(); }); g.restore(); }
      EDGES.forEach(([x1, y1, x2, y2], i) => {
        if (edgeDone[i]) { g.save(); g.shadowColor = '#e8f0c8'; g.shadowBlur = 6; g.strokeStyle = '#c8d89a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); }
        else if (step === 'line') { g.save(); g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + i); dashed(g, x1, y1, x2, y2, COLOR.gold); g.restore(); }
      });
      CORNERS.forEach(([cx, cy], i) => {
        if (cornerDone[i]) { const sx = i % 2 ? -1 : 1, sy = i < 2 ? 1 : -1; g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.shadowColor = '#fff'; g.shadowBlur = 8; g.beginPath(); g.moveTo(cx + sx * 14, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + sy * 14); g.stroke(); g.restore(); }
        else if (step === 'corner') { const r = 12 + Math.sin(t * 7 + i) * 3; g.save(); g.strokeStyle = COLOR.gold; g.lineWidth = 3; g.shadowColor = COLOR.gold; g.shadowBlur = 10; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); g.restore(); }
      });
      if (shine >= 0 && shine < 0.8) { g.save(); g.beginPath(); g.rect(BX, BY, BW, BH); g.clip(); const sx = BX - 60 + shine * 400; g.globalAlpha = 0.5; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(sx, BY); g.lineTo(sx + 30, BY); g.lineTo(sx - 10, BY + BH); g.lineTo(sx - 40, BY + BH); g.fill(); g.restore(); }
    };

    return {
      update(dt) {
        t += dt; wob = Math.max(0, wob - dt * 3); squash = Math.max(0, squash - dt * 5);
        if (shine >= 0) shine += dt;
        if (fly) { fly.x += fly.vx * dt; fly.y += fly.vy * dt; fly.vy += 900 * dt; fly.r += dt * 8; }
        if (halfK >= 0 && halfK < 1) { halfK = Math.min(1, halfK + dt / 0.35); if (halfK >= 1) { zoomK = 0; Sound.tone(150, 0.12, 'triangle', 0.2); FX.shake(4, 0.15); } }
        if (zoomK >= 0 && zoomK < 1) { zoomK = Math.min(1, zoomK + dt / 0.55); if (zoomK >= 1) { step = 'press'; api.toast('對折完成!壓實它', COLOR.good); } }
        if (done) return;
        if (step === 'press' || step === 'line' || step === 'corner') {
          if ((shapeT -= dt) <= 0) { done = true; api.lose('時間到!還是一坨饅頭,不是豆腐乾!'); }
        }
      },
      onPointerDown(q) {
        if (done) return;
        down = true; last = q;
        if (step === 'tri') {
          const nearY = q.y > Y0 - 20 && q.y < Y1 + 20;
          if (fL == null && nearY && q.x > X0 - 30 && q.x < X0 + 50) drag = { side: 'L', x: X0, y: q.y };
          else if (fR == null && nearY && q.x > X1 - 50 && q.x < X1 + 30) drag = { side: 'R', x: X1, y: q.y };
          else if (q.y < Y0 + 40 || q.y > Y1 - 40) api.toast('先縱向:抓左右邊緣往內折', COLOR.accent2);
          else api.toast('要抓住棉被的左右邊緣再拉', COLOR.accent2);
        } else if (step === 'quad') {
          const nearX = q.x > fL - 30 && q.x < fR + 30;
          if (fT == null && nearX && q.y > Y0 - 30 && q.y < Y0 + 50) drag = { side: 'T', x: q.x, y: Y0 };
          else if (fB == null && nearX && q.y > Y1 - 50 && q.y < Y1 + 30) drag = { side: 'B', x: q.x, y: Y1 };
          else api.toast('換橫向:抓上下兩端往中間折', COLOR.accent2);
        } else if (step === 'half' && halfK < 0) swipe0 = q;
        else if (step === 'press' && zoomK >= 1 && q.x > BX - 10 && q.x < BX + BW + 10 && q.y > BY - 10 && q.y < BY + BH + BD + 10) {
          pressN++; squash = 1; Sound.tone(110, 0.1, 'triangle', 0.2); FX.dust(BX + 10, BY + BH + BD, 4); FX.dust(BX + BW - 10, BY + BH + BD, 4); FX.shake(2, 0.06);
          nextShape();
        } else if (step === 'line') {
          let best = -1, bd = 22;
          EDGES.forEach((e, i) => { if (!edgeDone[i]) { const dd = segDist(q.x, q.y, ...e); if (dd < bd) { bd = dd; best = i; } } });
          if (best >= 0) lineDrag = { i: best, x: q.x, y: q.y };
        } else if (step === 'corner') {
          let best = -1, bd = 30;
          CORNERS.forEach(([x, y], i) => { if (!cornerDone[i]) { const dd = Math.hypot(q.x - x, q.y - y); if (dd < bd) { bd = dd; best = i; } } });
          if (best >= 0) { pinchCorner(best); nextShape(); }
        }
      },
      onPointerMove(q) {
        if (done) return;
        if (step === 'smooth' && down && last) {
          const moved = Math.hypot(q.x - last.x, q.y - last.y);
          for (const w of wrinkles) if (w.hp > 0 && segDist(q.x, q.y, w.x1, w.y1, w.x2, w.y2) < 22) {
            w.hp -= moved / 70;
            if (w.hp <= 0) { FX.dust((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2, 6); Sound.tap(); }
          }
          if (wrinkles.every(w => w.hp <= 0)) { step = 'tri'; Sound.good(); FX.sparks(W / 2, MIDY); api.toast('鋪平了!開始縱向三折', COLOR.good); }
        }
        if (drag) {
          if (drag.side === 'L') drag.x = clamp(q.x, X0, fR ?? X1);
          else if (drag.side === 'R') drag.x = clamp(q.x, fL ?? X0, X1);
          else if (drag.side === 'T') drag.y = clamp(q.y, Y0, fB ?? Y1);
          else drag.y = clamp(q.y, fT ?? Y0, Y1);
        }
        last = q;
      },
      onPointerUp(q) {
        down = false;
        if (done) { drag = null; return; }
        if (drag) commit();
        if (step === 'half' && swipe0) {
          if (q.y - swipe0.y > 50) { halfK = 0; step = 'halfAnim'; Sound.whoosh(); } else api.toast('由上往下滑,對折!', COLOR.accent2);
          swipe0 = null;
        }
        if (lineDrag) {
          const [x1, y1, x2, y2] = EDGES[lineDrag.i], horiz = y1 === y2, len = horiz ? x2 - x1 : y2 - y1;
          const along = horiz ? Math.abs(q.x - lineDrag.x) : Math.abs(q.y - lineDrag.y);
          if (along >= len * 0.5 && segDist(q.x, q.y, x1, y1, x2, y2) < 30) { pinchEdge(lineDrag.i); nextShape(); }
          else api.toast('要沿著整條邊滑過去', COLOR.accent2);
          lineDrag = null;
        }
      },
      useEnergy() {
        if (step === 'press' || step === 'line' || step === 'corner') {
          if (step === 'press') pressN = p.presses;
          else if (step === 'line') edgeDone.map((v, i) => v ? -1 : i).filter(i => i >= 0).slice(0, 2).forEach(pinchEdge);
          else cornerDone.map((v, i) => v ? -1 : i).filter(i => i >= 0).slice(0, 2).forEach(pinchCorner);
          api.toast('燒肉手刀!一次捏好', COLOR.accent); nextShape();
        } else {
          guide = true;
          if (step === 'smooth') wrinkles.slice(0, 4).forEach(w => { if (w.hp > 0) { w.hp = 0; FX.dust((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2, 6); } });
          if (step === 'smooth' && wrinkles.every(w => w.hp <= 0)) step = 'tri';
          api.toast('燒肉手刀!等分線浮現', COLOR.accent);
        }
      },
      render(g) {
        vgrad(g, 0, 0, W, 250, '#e2dcc6', '#c9c1a6'); vgrad(g, 0, 236, W, 10, '#8a7458', '#6b5039');
        vgrad(g, 0, 246, W, H - 246, '#6b5039', '#3e2e20');
        for (let x = 0; x < W; x += 40) rect(g, x, 246, 2, H - 246, 'rgba(0,0,0,0.15)');
        // 床
        g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; fillRR(g, 20, 244, W - 40, 388, 8, '#7a858c'); g.restore();
        fillRR(g, 28, 252, W - 56, 372, 6, '#ecebe2'); fillRR(g, 28, 252, W - 56, 8, 4, '#ffffff');
        // 棉被
        g.save();
        if (fly) { g.translate(W / 2 + fly.x, MIDY + fly.y); g.rotate(fly.r); g.translate(-W / 2, -MIDY); }
        g.translate(Math.sin(t * 50) * 6 * wob, 0);
        if (step === 'smooth' || step === 'tri') drawTri(g);
        else if (step === 'quad' || step === 'half') drawStrip(g);
        else if (step === 'halfAnim' && halfK < 1) {
          const m = (fT + fB) / 2, k = halfK;
          g.save(); g.beginPath(); g.rect(0, m, W, H); g.clip(); drawStrip(g, false); g.restore();
          if (Math.abs(1 - 2 * k) > 0.02) {
            g.save(); g.translate(0, m); g.scale(1, 1 - 2 * k); g.translate(0, -m); g.beginPath(); g.rect(0, 0, W, m); g.clip(); drawStrip(g, false);
            if (k > 0.5) { g.globalAlpha = 0.25; rect(g, 0, 0, W, m, '#000'); } g.restore();
          }
        } else drawShape(g);
        g.restore();
        // 班長口令
        const key = step === 'tri' ? (triOrder.length ? 'tri2' : 'tri1') : step === 'quad' ? (quadOrder.length ? 'quad2' : 'quad1') : step === 'halfAnim' ? 'half' : step;
        const [order, sub] = ORDERS[key];
        shadow(g, 46, 236, 28, 6, 0.35); drawSprite(g, SERGEANT, 46, 236, 3);
        bubble(g, 92, 152, 256, 74, 104, true);
        text(g, order, 220, 175, { size: 22, align: 'center', base: 'middle', color: COLOR.ink });
        wrapText(g, sub, 220, 196, 236, 17, { size: 13, align: 'center', color: '#4a4030' });
        text(g, `失誤 ${mistakes}/${p.maxMistakes}`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4, color: mistakes ? COLOR.bad : COLOR.fg });
        text(g, `步驟 ${STEP_NO[step === 'halfAnim' ? 'half' : step]}/7`, W - 14, 86, { size: 16, align: 'right', outline: COLOR.ink, ow: 4 });
        if ((step === 'press' || step === 'line' || step === 'corner') && zoomK >= 1) {
          fillRR(g, 56, 300, 210, 12, 6, 'rgba(0,0,0,0.35)');
          fillRR(g, 58, 302, 206 * clamp(shapeT / p.shapeTime), 8, 4, shapeT > 5 ? COLOR.good : COLOR.bad);
          text(g, `${Math.ceil(Math.max(0, shapeT))} 秒`, 276, 306, { size: 13, base: 'middle', color: '#3a3020' });
          if (step === 'press') text(g, `${pressN}/${p.presses}`, W / 2, 330, { size: 16, align: 'center', color: '#3a3020' });
        }
        vignette(g, 0.35);
      },
    };
  },
};
