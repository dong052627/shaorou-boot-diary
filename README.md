# 燒肉新訓日記 (架構版)

## 執行
    python3 -m http.server 8000      # 然後手機/電腦開 http://<IP>:8000

## 結構
- `js/data/levels.js`   ← 整個遊戲流程(直線式),改關卡只動這裡
- `js/minigames/`       ← 每個小遊戲一個檔案,格式見 base.js,到 index.js 註冊
- `js/core/state.js`    ← 能量、進度、旗標、數值設定 (CONFIG)
- `js/core/assets.js`   ← 素材登記,放 png 到 assets/sprites 再登記
- `js/scenes/`          ← 標題/劇情/小遊戲包裝/假日/結局

## 新增一個小遊戲
1. 複製 `minigames/timing.js` 改名並改 id
2. 在 `minigames/index.js` 加一行 import 與陣列項目
3. 在 `levels.js` 加 `{ type:'minigame', game:'你的id', params:{...} }`

## PWA
- `manifest.webmanifest` 安裝資訊、`sw.js` 離線快取、`icons/` 圖示。
- **改了任何程式/素材後,把 `sw.js` 的 `VERSION` 加 1**,否則同袍會一直看到舊版。
- 新增 js 檔時,記得加進 `sw.js` 的 `CORE` 清單(素材 png 會自動快取)。
- PWA 需要 HTTPS(或 localhost)才能安裝,正式發佈用 GitHub Pages / Netlify 即可。
- 安裝方式:iPhone Safari →「分享」→「加入主畫面」;Android Chrome → 選單 →「安裝應用程式」。
