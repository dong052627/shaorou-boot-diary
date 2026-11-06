// 小遊戲介面說明 (照這個格式寫新小遊戲即可,每個小遊戲一個檔案)
//
// export default {
//   id: 'xxx', title: '名稱',
//   howto: ['說明1', '說明2'],          // 開始前的說明卡
//   energyHint: '燒肉能量的效果',
//   defaults: { ... },                   // 預設參數,levels.js 的 params 可覆蓋
//   create(params, api) -> {
//     update(dt), render(g),             // render 要畫整個畫面背景(y=0~640),上方 0~76 會被 HUD 蓋住
//     onPointerDown(p), onPointerMove(p), onPointerUp(p),   // 都可省略
//     useEnergy()                        // 玩家按「燒肉」鈕時呼叫(每關限一次)
//   }
// }
//
// api: api.win(stars 1~3)、api.lose('失敗原因')、api.toast('提示', 顏色)
// 特效: import { FX } from '../core/fx.js'
//   FX.sparks(x,y) 火花 / FX.confetti 彩帶 / FX.smoke 煙 / FX.dust 灰塵 / FX.debris 碎片
//   FX.float(x,y,'文字') 飄字 / FX.ring 衝擊波 / FX.shake 震動 / FX.flash 閃光 / FX.hitstop 命中停頓
// 音效: import { Sound } from '../core/audio.js'  →  Sound.good() / bad() / tap() / shot() / boom() ...
