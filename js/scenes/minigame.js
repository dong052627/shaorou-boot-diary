// 小遊戲外框:說明卡 → 遊玩(HUD、燒肉能量鈕、提示條)→ 結算(星星、彩帶)
import { W, H } from '../core/screen.js';
import { State, CONFIG } from '../core/state.js';
import { MINIGAMES } from '../minigames/index.js';
import { FX } from '../core/fx.js';
import { Sound } from '../core/audio.js';
import { text, wrapText, button, hit, rect, panel, fillRR, energyBar, drawFlame, star, easeBack, easeOut, clamp, COLOR } from '../core/ui.js';

export class MinigameScene {
  constructor(level, done, opts = {}) { this.level = level; this.done = done; this.opts = opts; this.mod = MINIGAMES[level.game]; this.t = 0; }
  get title() { return this.level.title ?? this.mod.title; }
  enter() { this.phase = 'intro'; this.introT = 0; this.build(); }
  build() {
    this.result = null; this.stars = 0; this.starShown = 0; this.toast = null; this.energyUsed = false; this.resT = 0; this.reason = '';
    const params = { ...(this.mod.defaults || {}), ...(this.level.params || {}) };
    const api = {
      win: (s = 1) => {
        if (this.result) return;
        this.result = 'win'; this.stars = s; this.resT = 0;
        const id = this.level.id; State.stars[id] = Math.max(State.stars[id] || 0, s); State.save();
        Sound.win(); FX.confetti(W / 2, 300); FX.flash('#ffffff', 0.25, 0.35);
      },
      lose: (reason = '') => {
        if (this.result) return;
        this.result = 'lose'; this.reason = reason; this.resT = 0;
        Sound.lose(); FX.shake(9, 0.4); FX.flash('#ff2020', 0.3, 0.3);
      },
      toast: (msg, color = COLOR.fg) => { this.toast = { msg, color, t: 0 }; },
    };
    this.api = api;
    this.game = this.mod.create(params, api);
    this.energyBtn = { x: 236, y: 14, w: 112, h: 40 };
    this.startBtn = { x: 90, y: 478, w: 180, h: 54 };
    this.okBtn = { x: 90, y: 420, w: 180, h: 52 };
    this.retryBtn = { x: 90, y: 412, w: 180, h: 50 };
    this.backBtn = { x: 110, y: 474, w: 140, h: 40 };
  }
  canEnergy() { return this.level.canUseEnergy !== false && !this.energyUsed && State.energy > 0 && !this.result && this.phase === 'play'; }
  update(dt) {
    this.t += dt;
    if (this.phase === 'intro') { this.introT += dt; return; }
    if (this.toast && (this.toast.t += dt) > 1.5) this.toast = null;
    this.game.update?.(dt);
    if (!this.result) return;
    this.resT += dt;
    if (this.result === 'win' && this.starShown < this.stars && this.resT > 0.9 + this.starShown * 0.32) {
      const i = this.starShown++, x = 120 + i * 60;
      Sound.tone(660 + i * 220, 0.15, 'square', 0.12); FX.sparks(x, 340, undefined, 24); FX.ring(x, 340, { r1: 50, color: COLOR.gold });
    }
  }
  onPointerDown(p) {
    if (this.phase === 'intro') { if (hit(p, this.startBtn)) { this.phase = 'play'; Sound.good(); } return; }
    if (this.result) {
      if (this.resT < 0.8) return;
      if (this.result === 'win' && hit(p, this.okBtn)) this.done();
      if (this.result === 'lose' && hit(p, this.retryBtn)) { this.build(); Sound.tap(); }
      if (this.result === 'lose' && this.opts.dev && hit(p, this.backBtn)) this.done();
      return;
    }
    if (this.canEnergy() && hit(p, this.energyBtn)) {
      State.useEnergy(1); this.energyUsed = true; this.game.useEnergy?.();
      Sound.tone(300, 0.4, 'sawtooth', 0.1, 900);
      FX.flash('#ff7a3d', 0.35, 0.35); FX.shake(5, 0.25);
      FX.burst(this.energyBtn.x + 56, 34, { n: 30, colors: ['#ff3d1f', '#ff8f3d', '#ffe27a'], speed: [100, 320], life: [0.4, 0.9], size: [3, 7], gravity: -100, glow: true });
      FX.float(W / 2, 230, '🔥 燒肉能量發動!', { color: COLOR.accent2, size: 28, dur: 1.2, rise: 40 });
      return;
    }
    if (this.energyBtn && p.y < 76) return;   // HUD 區不傳給小遊戲
    this.game.onPointerDown?.(p);
  }
  onPointerMove(p) { if (this.phase === 'play' && !this.result) this.game.onPointerMove?.(p); }
  onPointerUp(p) { if (this.phase === 'play' && !this.result) this.game.onPointerUp?.(p); }

  render(g) {
    const t = this.t;
    this.game.render(g);
    // HUD
    const gr = g.createLinearGradient(0, 0, 0, 80); gr.addColorStop(0, 'rgba(6,10,8,0.92)'); gr.addColorStop(1, 'rgba(6,10,8,0.70)');
    g.fillStyle = gr; g.fillRect(0, 0, W, 76); rect(g, 0, 76, W, 2, 'rgba(255,122,61,0.5)');
    energyBar(g, State.energy, CONFIG.maxEnergy, 12, 8, t);
    text(g, this.title, 152, 22, { size: 15, color: COLOR.fg, outline: COLOR.ink, ow: 3 });
    if (this.level.canUseEnergy !== false) {
      button(g, this.energyBtn, '🔥 燒肉', { disabled: !this.canEnergy(), pulse: this.canEnergy(), t, size: 16 });
      if (this.energyUsed) text(g, '能量已使用', 152, 46, { size: 12, color: COLOR.accent2 });
    }
    // 提示條
    if (this.toast) {
      const k = easeOut(this.toast.t / 0.18), a = clamp((1.5 - this.toast.t) / 0.3);
      g.save(); g.globalAlpha = a; g.translate((1 - k) * -W, 0);
      fillRR(g, 16, 108, W - 32, 38, 10, 'rgba(8,12,10,0.85)'); fillRR(g, 16, 108, 6, 38, 3, this.toast.color);
      text(g, this.toast.msg, W / 2, 128, { size: 17, align: 'center', base: 'middle', color: this.toast.color, outline: COLOR.ink, ow: 3 });
      g.restore();
    }
    if (this.phase === 'intro') this.renderIntro(g);
    else if (this.result && this.resT > 0.4) this.renderResult(g);
  }
  renderIntro(g) {
    const k = easeBack(this.introT / 0.4);
    rect(g, 0, 0, W, H, `rgba(0,0,0,${0.65 * clamp(this.introT / 0.2)})`);
    g.save(); g.translate(W / 2, 330); g.scale(k, k); g.translate(-W / 2, -330);
    panel(g, 22, 110, W - 44, 440);
    text(g, this.title, W / 2, 152, { size: 32, align: 'center', base: 'middle', color: COLOR.accent2, outline: COLOR.ink, ow: 6, glow: '#ff7a3d' });
    rect(g, 50, 182, W - 100, 2, 'rgba(201,216,173,0.4)');
    let y = 200;
    for (const line of this.mod.howto ?? []) { text(g, '▸', 44, y, { size: 16, color: COLOR.accent }); y = wrapText(g, line, 64, y, W - 120, 26, { size: 16 }) + 6; }
    if (this.level.canUseEnergy !== false) {
      fillRR(g, 40, 412, W - 80, 48, 10, 'rgba(255,122,61,0.15)');
      drawFlame(g, 64, 446, 26, this.t, true);
      wrapText(g, this.level.energyHint ?? this.mod.energyHint ?? '', 86, 418, W - 140, 20, { size: 14, color: COLOR.accent2 });
    }
    button(g, this.startBtn, '開始!', { pulse: true, t: this.t, size: 22 });
    g.restore();
  }
  renderResult(g) {
    const k = easeBack((this.resT - 0.4) / 0.4), win = this.result === 'win';
    rect(g, 0, 0, W, H, `rgba(0,0,0,${0.6 * clamp((this.resT - 0.4) / 0.3)})`);
    g.save(); g.translate(W / 2, 370); g.scale(k, k); g.translate(-W / 2, -370);
    panel(g, 36, 220, W - 72, 310, { edge: win ? COLOR.gold : COLOR.bad });
    text(g, win ? '過關!' : '失敗…', W / 2, 268, { size: 44, align: 'center', base: 'middle', color: win ? COLOR.gold : COLOR.bad, outline: COLOR.ink, ow: 8, glow: win ? '#ffb347' : '#ff3030' });
    if (win) {
      for (let i = 0; i < 3; i++) {
        const shown = i < this.starShown, x = 120 + i * 60;
        g.save(); g.translate(x, 340);
        if (shown) { const s = Math.min(1.25, 0.6 + (this.resT - 0.9 - i * 0.32) * 4); g.scale(Math.max(1, s > 1.2 ? 2.4 - s : s), Math.max(1, s > 1.2 ? 2.4 - s : s)); g.shadowColor = '#ffd24a'; g.shadowBlur = 16; }
        star(g, 0, 0, 24, shown ? COLOR.gold : '#3a4038', COLOR.ink); g.restore();
      }
      if (this.resT > 0.8) button(g, this.okBtn, '繼續', { pulse: true, t: this.t });
    } else {
      wrapText(g, this.reason || '再試一次吧!', 60, 310, W - 120, 26, { size: 16, color: '#ffd0c8' });
      if (this.resT > 0.8) {
        button(g, this.retryBtn, '再來一次', { t: this.t, pulse: true });
        if (this.opts.dev) button(g, this.backBtn, '返回選單', { color: '#9aa4ad', size: 15 });
      }
    }
    g.restore();
  }
}
