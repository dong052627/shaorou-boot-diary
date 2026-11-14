import { Engine } from './core/engine.js';
import { Assets } from './core/assets.js';
import { TitleScene } from './scenes/title.js';

const engine = new Engine(document.getElementById('game'));
await Assets.loadAll();
engine.goto(new TitleScene());
engine.start();
if (/dev/.test(location.search)) window.__engine = engine;   // 開發測試用

// 離線快取 + 自動更新:
// 1. 每次開啟、或從背景切回來時都檢查有沒有新版本(iPhone 主畫面 App 常常只是從背景恢復,不會重新啟動)
// 2. 新版下載好後,等玩家回到「標題」或「關卡選擇」才自動重新整理,不會打斷正在玩的關卡
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;   // 第一次安裝不用重新整理
  let reloading = false;
  const reloadWhenSafe = () => {
    if (reloading) return;
    if (engine.scene?.reloadSafe && !engine.trans) { reloading = true; location.reload(); }
    else setTimeout(reloadWhenSafe, 800);
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) reloadWhenSafe(); });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    setInterval(check, 30 * 60 * 1000);
  }).catch(() => {});
}
