// 全域遊戲狀態:進度 + 燒肉能量。所有數值集中在這,方便調整平衡。
import { Save } from './save.js';
import { NODES } from '../data/levels.js';

export const CONFIG = {
  maxEnergy: 5,        // 能量上限
  startEnergy: 3,      // 開局能量
  weekendRefill: 3,    // 假日補充量
};

export const State = {
  unlocked: 0,         // 已解鎖到第幾個關卡(NODES 索引);直線式,過關才開下一關
  cleared: {},         // 已過關的關卡 { nodeId: true }
  energy: CONFIG.startEnergy,
  flags: {},           // 劇情旗標,給多結局用
  stars: {},           // 各關評價 { levelId: 1~3 }
  dev: false,          // 開發者模式:全部解鎖、不扣能量、不存檔

  reset() { this.unlocked = 0; this.cleared = {}; this.energy = CONFIG.startEnergy; this.flags = {}; this.stars = {}; this.save(); },
  hasSave() { return !!Save.load(); },
  load() {
    const d = Save.load(); if (!d) return false;
    Object.assign(this, { cleared: {}, flags: {}, stars: {} }, d);
    if (d.unlocked == null && d.step != null) {           // 舊版(v0.2)存檔:step 轉成關卡進度
      const k = NODES.findIndex(n => n.levelIndex >= d.step);
      this.unlocked = k < 0 ? NODES.length - 1 : k;
      NODES.slice(0, this.unlocked).forEach(n => { this.cleared[n.id] = true; });
    }
    delete this.step; this.save(); return true;
  },
  save() { if (this.dev) return; const { unlocked, cleared, energy, flags, stars } = this; Save.write({ v: 2, unlocked, cleared, energy, flags, stars }); },
  // 過關:記錄並解鎖下一關;回傳是否第一次過
  clearNode(i) {
    const n = NODES[i], first = !this.cleared[n.id];
    this.cleared[n.id] = true; this.unlocked = Math.max(this.unlocked, Math.min(i + 1, NODES.length - 1));
    this.save(); return first;
  },
  totalStars() { return Object.values(this.stars).reduce((a, b) => a + b, 0); },

  useEnergy(n = 1) { if (this.dev) return true; if (this.energy < n) return false; this.energy -= n; this.save(); return true; },
  addEnergy(n) { this.energy = Math.min(CONFIG.maxEnergy, this.energy + n); this.save(); },
};
