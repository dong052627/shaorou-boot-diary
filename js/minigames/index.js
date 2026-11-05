// 小遊戲註冊表:新增小遊戲 = 寫一個檔案 + 在這裡 import 一行。
import tapRun from './tapRun.js';
import timing from './timing.js';
export const MINIGAMES = Object.fromEntries([tapRun, timing].map(m => [m.id, m]));
