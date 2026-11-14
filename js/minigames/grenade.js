// 丟手榴彈:拉插銷(滑一下)→ 往後拖曳瞄準、放開投擲 → 馬上按「臥倒」。
import { W, H } from '../core/screen.js';
import { rect, text, button, hit, fillRR, vgrad, vignette, circle, ellipse, clamp, COLOR } from '../core/ui.js';
import { drawSprite, shadow } from '../core/sprite.js';
import { SOLDIER } from '../data/sprites.js';
import { Sound } from '../core/audio.js';
import { FX } from '../core/fx.js';

function drawGrenade(g, x, y, s, rot = 0, pin = true) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const gr = g.createRadialGradient(-3, -3, 1, 0, 0, 10); gr.addColorStop(0, '#8a9a60'); gr.addColorStop(1, '#3a4622');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 2, 8, 10, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-8, 0, 16, 1.2); g.fillRect(-0.6, -8, 1.2, 20);
  g.fillStyle = '#9a9a8a'; g.fillRect(-4, -11, 8, 4);
  g.fillStyle = '#7a7a6a'; g.fillRect(3, -10, 3, 16);
  if (pin) { g.strokeStyle = '#d8d0a0'; g.lineWidth = 1.4; g.beginPath(); g.arc(-7, -10, 3.5, 0, Math.PI * 2); g.stroke(); }
  g.restore();
}

export default {
  id: 'grenade', icon: '💣', title: '丟手榴彈',
  howto: ['口令:拉插銷 → 投擲 → 臥倒!', '先在螢幕上滑一下,拉掉插銷。', '往左下拖曳瞄準(拉越長越遠),放開投擲。', '丟出去後 1 秒內按「臥倒」!3 投要成功 2 次。'],
  energyHint: '燒肉瞄準:顯示拋物線',
  defaults: { throws: 3, need: 2, targets: [180, 240, 296], zone: 26 },
  create(p, api) {
    const GROUND = 530, HX = 56, HAND = { x: HX + 26, y: GROUND - 50 }, GR = 560, VMAX = 440;
    let n = 0, phase = 'pin', start = null, aim = null, gp = null, gv = null, since = 0, prone = false, proneLate = false, bounced = false;
    let landed = null, fuse = 0, boomT = 0, results = [], preview = false, done = false, t = 0, pinOff = -1;
    const tx = () => p.targets[n % p.targets.length];
    const downBtn = { x: W / 2 - 70, y: 562, w: 140, h: 54 };
    const calc = cur => {
      const dx = start.x - cur.x, dy = start.y - cur.y, power = clamp(Math.hypot(dx, dy) / 150);
      const ang = clamp(Math.atan2(-dy, dx), 0.15, 1.4), v = power * VMAX;
      return { power, ang, vel: { x: Math.cos(ang) * v, y: -Math.sin(ang) * v } };
    };
    const traj = vel => { const pts = []; let x = HAND.x, y = HAND.y, vx = vel.x, vy = vel.y; for (let i = 0; i < 60 && y < GROUND && x < W; i++) { vy += GR * 0.04; x += vx * 0.04; y += vy * 0.04; if (i % 2) pts.push([x, y]); } return pts; };
    const finish = () => {
      done = true; const ok = results.filter(r => r.ok).length, bull = results.filter(r => r.bull).length;
      ok >= p.need ? api.win(ok === p.throws && bull >= 2 ? 3 : ok === p.throws ? 2 : 1) : api.lose(`成功 ${ok}/${p.throws} 次,投擲不合格,下週補考!`);
    };
    const explode = () => {
      const x = landed, d = Math.abs(x - tx()), inZone = d <= p.zone, ok = inZone && prone && !proneLate;
      results.push({ ok, bull: ok && d <= 8 });
      if (x < W) {
        Sound.boom(); FX.flash('#fff3c0', 0.25, 0.75); FX.shake(16, 0.6); FX.hitstop(0.08);
        FX.ring(x, GROUND - 6, { r1: 130, color: '#fff3c0', width: 9, dur: 0.5 }); FX.ring(x, GROUND - 6, { r1: 80, color: '#ff9a3d', width: 6, dur: 0.4 });
        FX.burst(x, GROUND - 10, { n: 46, colors: ['#fff3c0', '#ffd24a', '#ff7a3d', '#ff3d1f'], speed: [120, 400], life: [0.3, 0.8], size: [4, 10], gravity: 150, glow: true, spread: Math.PI * 1.3, angle: -Math.PI / 2 });
        FX.smoke(x, GROUND - 24, 18, 'rgba(90,85,80,0.6)'); FX.debris(x, GROUND - 4, ['#6b5a3a', '#4a3d28', '#8a7a5a'], 22);
      }
      if (!inZone) api.toast(x >= W ? '丟太遠了!' : '沒丟進投擲區!', COLOR.bad);
      else if (!ok) { api.toast('沒臥倒,判定陣亡!', COLOR.bad); FX.flash('#ff2020', 0.4, 0.3); }
      else { api.toast(d <= 8 ? '正中紅心!' : '成功!', COLOR.good); FX.float(x, GROUND - 80, d <= 8 ? '完美!' : '成功', { color: COLOR.gold, size: 30 }); }
      phase = 'boom'; boomT = 1.3;
    };
    return {
      update(dt) {
        t += dt; if (pinOff >= 0) pinOff += dt;
        if (done) return;
        if (phase === 'fly' || phase === 'fuse') {
          since += dt;
          if (since > 1.0 && !prone && !proneLate) { proneLate = true; api.toast('還不臥倒!', COLOR.bad); Sound.bad(); }
        }
        if (phase === 'fly') {
          gv.y += GR * dt; gp.x += gv.x * dt; gp.y += gv.y * dt;
          if (Math.random() < 0.6) FX.burst(gp.x, gp.y, { n: 1, colors: ['rgba(230,230,230,0.5)'], speed: [0, 10], life: [0.3, 0.5], size: [2, 3], grow: 8, gravity: -20, shape: 'circ' });
          if (gp.x > W + 30) { landed = W + 99; phase = 'fuse'; fuse = 0.3; }
          else if (gp.y >= GROUND - 4) {
            gp.y = GROUND - 4;
            if (!bounced) { bounced = true; gv.y *= -0.28; gv.x *= 0.35; FX.dust(gp.x, GROUND, 8); Sound.tone(140, 0.06, 'triangle', 0.15); }
            else { landed = gp.x; phase = 'fuse'; fuse = 0.8; }
          }
        } else if (phase === 'fuse') {
          if (landed < W) FX.burst(gp.x, gp.y - 8, { n: 1, colors: ['#ffd24a', '#fff'], speed: [40, 120], life: [0.1, 0.3], size: [1, 3], gravity: 100, glow: true });
          if ((fuse -= dt) <= 0) explode();
        } else if (phase === 'boom' && (boomT -= dt) <= 0) {
          n++;
          if (n >= p.throws) finish();
          else { phase = 'pin'; prone = false; proneLate = false; bounced = false; gp = null; pinOff = -1; api.toast(`第 ${n + 1} 投,準備!`, COLOR.accent2); }
        }
      },
      onPointerDown(q) {
        if (done) return;
        if (phase === 'pin' || phase === 'aim') { start = q; aim = null; }
        else if ((phase === 'fly' || phase === 'fuse' || phase === 'boom') && !prone && hit(q, downBtn)) {
          prone = true; Sound.tap(); FX.dust(HX, GROUND, 10);
          if (!proneLate) { FX.float(HX + 20, GROUND - 60, '臥倒!', { color: COLOR.good, size: 22 }); }
        }
      },
      onPointerMove(q) { if (phase === 'aim' && start) aim = calc(q); },
      onPointerUp(q) {
        if (!start || done) return;
        if (phase === 'pin') {
          if (Math.hypot(q.x - start.x, q.y - start.y) > 30) {
            phase = 'aim'; pinOff = 0; Sound.pin(); FX.sparks(W / 2 - 30, 220, ['#fff', '#d8d0a0'], 12); api.toast('插銷拉掉了!投擲!', COLOR.accent2);
          }
        } else if (phase === 'aim') {
          const a = calc(q); aim = null;
          if (a.power >= 0.12) { gp = { ...HAND }; gv = a.vel; phase = 'fly'; since = 0; Sound.whoosh(); }
        }
        start = null;
      },
      useEnergy() { preview = true; api.toast('燒肉瞄準!拋物線浮現', COLOR.accent); },
      render(g) {
        vgrad(g, 0, 76, W, GROUND - 76, '#7fb6dc', '#e2f0f4');
        for (let i = 0; i < 3; i++) {
          const cx = ((i * 140 + t * (8 + i * 4)) % (W + 120)) - 60, cy = 130 + i * 40;
          g.save(); g.globalAlpha = 0.85; circle(g, cx, cy, 18, '#fff'); circle(g, cx + 20, cy - 8, 22, '#fff'); circle(g, cx + 42, cy, 16, '#fff'); g.restore();
        }
        g.fillStyle = '#8fae7a'; g.beginPath(); g.moveTo(0, 440); g.quadraticCurveTo(90, 380, 180, 430); g.quadraticCurveTo(270, 390, 360, 420); g.lineTo(360, GROUND); g.lineTo(0, GROUND); g.fill();
        vgrad(g, 0, GROUND, W, H - GROUND, '#7a6542', '#4a3b25');
        g.globalAlpha = 0.25; for (let x = 0; x < W; x += 12) rect(g, x + (x * 7) % 5, GROUND + 6 + (x * 13) % 20, 3, 2, '#2a2014'); g.globalAlpha = 1;
        // 投擲區
        const X = tx();
        ellipse(g, X, GROUND + 3, p.zone + 4, 8, '#7a1a14'); ellipse(g, X, GROUND + 2, p.zone, 6, '#e0463c'); ellipse(g, X, GROUND + 2, p.zone * 0.6, 4, '#ffffff'); ellipse(g, X, GROUND + 2, 8, 3, '#e0463c');
        rect(g, X + p.zone + 6, GROUND - 46, 3, 46, '#e8e8e8');
        g.fillStyle = '#ff4d4d'; g.beginPath(); g.moveTo(X + p.zone + 9, GROUND - 46);
        for (let i = 0; i <= 6; i++) g.lineTo(X + p.zone + 9 + i * 4, GROUND - 46 + Math.sin(t * 8 + i) * 2);
        for (let i = 6; i >= 0; i--) g.lineTo(X + p.zone + 9 + i * 4, GROUND - 34 + Math.sin(t * 8 + i) * 2); g.fill();
        text(g, `${Math.round((X - HX) / 8)}m`, X + p.zone + 22, GROUND - 66, { size: 13, align: 'center', color: '#fff', outline: COLOR.ink, ow: 3 });
        // 沙包 & 人物
        shadow(g, HX, GROUND, 30, 6, 0.4);
        if (prone) drawSprite(g, SOLDIER, HX - 2, GROUND - 24, 3, { anchor: 'center', rot: -Math.PI / 2 });
        else drawSprite(g, SOLDIER, HX, GROUND, 3);
        for (let i = 0; i < 3; i++) fillRR(g, HX + 22, GROUND - 12 - i * 11, 34, 12, 5, i % 2 ? '#b39b6a' : '#a38a5a');
        if (!prone && (phase === 'pin' || phase === 'aim')) drawGrenade(g, HAND.x, HAND.y, 1.2, 0, phase === 'pin');
        // 拉插銷特寫
        if (phase === 'pin' || (pinOff >= 0 && pinOff < 0.6)) {
          const a = phase === 'pin' ? 1 : 1 - pinOff / 0.6;
          g.save(); g.globalAlpha = a; fillRR(g, W / 2 - 80, 140, 160, 160, 20, 'rgba(0,0,0,0.35)');
          drawGrenade(g, W / 2, 230, 5, 0, false);
          const off = pinOff >= 0 ? pinOff * 300 : 0;
          g.strokeStyle = '#e8e0b0'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2 - 35 - off, 180 - off * 0.5, 16, 0, Math.PI * 2); g.stroke();
          g.restore();
          if (phase === 'pin') { text(g, '班長:拉插銷!', W / 2, 330, { size: 22, align: 'center', base: 'middle', color: '#fff', outline: COLOR.ink, ow: 5 }); text(g, '在螢幕上用力滑一下', W / 2, 362, { size: 15, align: 'center', base: 'middle', color: '#fff', outline: COLOR.ink, ow: 4 }); }
        }
        if (phase === 'aim') {
          if (!aim) text(g, '往左下拖曳瞄準 → 放開投擲', W / 2, 340, { size: 17, align: 'center', base: 'middle', color: '#fff', outline: COLOR.ink, ow: 4 });
          else {
            fillRR(g, 40, 140, W - 80, 16, 8, 'rgba(0,0,0,0.4)');
            const pc = aim.power > 0.85 ? COLOR.bad : aim.power > 0.5 ? COLOR.gold : COLOR.good;
            g.save(); g.shadowColor = pc; g.shadowBlur = 10; fillRR(g, 42, 142, (W - 84) * aim.power, 12, 6, pc); g.restore();
            text(g, `力道 ${Math.round(aim.power * 100)}%   角度 ${Math.round(aim.ang * 57.3)}°`, W / 2, 176, { size: 15, align: 'center', color: '#fff', outline: COLOR.ink, ow: 4 });
            const L = 30 + aim.power * 70;
            for (let i = 1; i <= 6; i++) circle(g, HAND.x + Math.cos(aim.ang) * L * i / 6, HAND.y - Math.sin(aim.ang) * L * i / 6, 2 + i * 0.5, '#ffffff');
            if (preview) for (const [x, y] of traj(aim.vel)) circle(g, x, y, 3, 'rgba(255,122,61,0.85)');
          }
        }
        if (gp && phase !== 'boom') drawGrenade(g, gp.x, gp.y, 1.3, phase === 'fly' ? t * 14 : 0, false);
        if (phase === 'fly' || phase === 'fuse' || phase === 'boom') {
          button(g, downBtn, prone ? (proneLate ? '太慢了…' : '已臥倒 ✓') : '臥倒!', { color: prone ? (proneLate ? '#8a8a8a' : COLOR.good) : COLOR.bad, textColor: '#fff', size: 22, pulse: !prone, t, disabled: false });
        }
        text(g, `第 ${Math.min(n + 1, p.throws)}/${p.throws} 投`, 14, 86, { size: 16, outline: COLOR.ink, ow: 4 });
        text(g, results.map(r => r.ok ? '○' : '✖').join(' ') || '—', W - 14, 86, { size: 18, align: 'right', color: COLOR.gold, outline: COLOR.ink, ow: 4 });
        vignette(g, 0.3);
      },
    };
  },
};
