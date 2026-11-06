// 小遊戲註冊表:新增小遊戲 = 寫一個檔案 + 在這裡 import 一行。
import sortWaste from './sortWaste.js';
import prepFood from './prepFood.js';
import shoot from './shoot.js';
import foldBlanket from './foldBlanket.js';
import cadence from './cadence.js';
import grenade from './grenade.js';
export const MINIGAMES = Object.fromEntries([sortWaste, prepFood, shoot, foldBlanket, cadence, grenade].map(m => [m.id, m]));
