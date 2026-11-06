// 全域遊戲狀態:進度 + 燒肉能量。所有數值集中在這,方便調整平衡。
import { Save } from './save.js';

export const CONFIG = {
  maxEnergy: 5,        // 能量上限
  startEnergy: 3,      // 開局能量
  weekendRefill: 3,    // 假日補充量
};

export const State = {
  step: 0,             // 目前在 LEVELS 的第幾步 (直線式)
  energy: CONFIG.startEnergy,
  flags: {},           // 劇情旗標,給多結局用
  stars: {},           // 各關評價 { levelId: 1~3 }
  dev: false,          // 開發者關卡選擇模式:不扣能量、不影響存檔

  reset() { this.step = 0; this.energy = CONFIG.startEnergy; this.flags = {}; this.stars = {}; this.save(); },
  hasSave() { return !!Save.load(); },
  load() { const d = Save.load(); if (d) Object.assign(this, d); return !!d; },
  save() { if (this.dev) return; const { step, energy, flags, stars } = this; Save.write({ step, energy, flags, stars }); },

  useEnergy(n = 1) { if (this.dev) return true; if (this.energy < n) return false; this.energy -= n; this.save(); return true; },
  addEnergy(n) { this.energy = Math.min(CONFIG.maxEnergy, this.energy + n); this.save(); },
};
