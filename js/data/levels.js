// 直線式流程:整個遊戲就是這一個陣列,由上往下依序進行。
// 你整理好關卡後,只要在這裡增刪/改順序,不用動引擎。
//
// type:
//   'story'     劇情對話   { lines:[{who,text}] }
//   'minigame'  小遊戲     { game:'小遊戲id', params:{...}, canUseEnergy:true, energyHint:'能量能幫什麼' }
//   'weekend'   假日補充   { text }
//   'ending'    結局       { text }
export const LEVELS = [
  { id: 's1', type: 'story', title: '入伍', lines: [
    { who: '旁白', text: '大學剛畢業的你,踏進了新訓中心的大門。' },
    { who: '班長', text: '新兵!動作快!你身上那股肉味是怎麼回事?' },
    { who: '你', text: '(不好,燒肉能量快要外洩了……)' },
  ]},
  { id: 'g1', type: 'minigame', game: 'tapRun', title: '五百障礙(示範)',
    params: { goal: 40, time: 8 }, canUseEnergy: true, energyHint: '燒肉衝刺:直接+15步' },
  { id: 'g2', type: 'minigame', game: 'timing', title: '打靶(示範)',
    params: { hitsNeeded: 3, speed: 1.4 }, canUseEnergy: true, energyHint: '燒肉穩定:準星變慢' },
  { id: 'w1', type: 'weekend', title: '第一個假日', text: '終於放假!去吃一頓燒肉吧。' },
  { id: 'e1', type: 'ending', title: '結訓', text: '新訓結束。你帶著滿滿的燒肉能量,邁向下一站。\n(待續)' },
];
