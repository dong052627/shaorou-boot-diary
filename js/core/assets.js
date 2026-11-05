// 素材載入器。之後把 png 放進 assets/sprites,在 MANIFEST 登記即可;
// 沒登記/沒檔案時 Assets.get() 回傳 null,各場景用色塊代替,遊戲照常能跑。
export const MANIFEST = {
  // player: 'assets/sprites/player.png',
  // bg_camp: 'assets/sprites/bg_camp.png',
};
const cache = {};
export const Assets = {
  async loadAll() {
    await Promise.all(Object.entries(MANIFEST).map(([k, src]) => new Promise(res => {
      const im = new Image(); im.onload = () => { cache[k] = im; res(); }; im.onerror = res; im.src = src;
    })));
  },
  get(k) { return cache[k] || null; },
};
