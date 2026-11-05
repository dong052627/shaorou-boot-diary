// 小遊戲介面說明 (照這個格式寫新小遊戲即可,每個小遊戲一個檔案)
//
// export default {
//   id: 'xxx',
//   create(params, api) -> 回傳物件:
//     {
//       update(dt), render(g),
//       onPointerDown(p), onPointerMove(p), onPointerUp(p),   // 都可省略
//       useEnergy()        // 玩家按下「燒肉能量」鈕時呼叫,在這裡實作能量的效果
//     }
// }
//
// api (由 MinigameScene 提供):
//   api.win(stars=1~3)   通關
//   api.lose()           失敗 (玩家可重試,或花能量重來)
//   api.engine           取得 W/H 等
