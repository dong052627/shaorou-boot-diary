// 直線式流程:整個遊戲就是這一個陣列,由上往下依序進行。
// 關卡整理好後,只要在這裡增刪 / 改順序 / 改台詞,不用動引擎。
//
// type:
//   'story'     劇情對話   { title, lines:[{who,text}] }   who='班長'|'你'|'伙房學長'|'旁白'… (立繪見 data/sprites.js)
//   'minigame'  小遊戲     { game:'小遊戲id', params:{...覆蓋預設難度}, canUseEnergy:false 可關閉能量 }
//   'weekend'   假日烤肉   { title, text, pieces:肉片數 }
//   'ending'    結局       { title, text }
export const LEVELS = [
  { id: 's1', type: 'story', title: '入伍第一天', lines: [
    { who: '旁白', text: '大學剛畢業的你,踏進了新訓中心的大門。' },
    { who: '班長', text: '新兵!動作快!你身上那股肉味是怎麼回事?' },
    { who: '你', text: '(糟了……昨天畢業聚餐吃的燒肉,能量還在體內燃燒。)' },
    { who: '班長', text: '吃完飯去幫忙廚餘分裝!分錯一個,全連重來!' },
  ]},
  { id: 'waste', type: 'minigame', game: 'sortWaste' },
  { id: 's2', type: 'story', title: '伙房支援', lines: [
    { who: '伙房學長', text: '你!看起來很會切菜,明天五百人份的菜交給你了。' },
    { who: '你', text: '學長,我只會吃燒肉啊……' },
  ]},
  { id: 'prep', type: 'minigame', game: 'prepFood' },
  { id: 'w1', type: 'weekend', title: '第一次放假', text: '終於放假!衝去吃燒肉補充能量!' },
  { id: 's3', type: 'story', title: '第二週', lines: [
    { who: '班長', text: '棉被要折成豆腐乾!我只示範一次,看清楚!' },
  ]},
  { id: 'blanket', type: 'minigame', game: 'foldBlanket' },
  { id: 's4', type: 'story', title: '基本教練', lines: [
    { who: '班長', text: '答數要大聲!我喊什麼,你們就答什麼!' },
  ]},
  { id: 'cadence', type: 'minigame', game: 'cadence' },
  { id: 'w2', type: 'weekend', title: '第二次放假', text: '下週要打靶跟丟手榴彈,這次要吃好吃滿!' },
  { id: 's5', type: 'story', title: '靶場', lines: [
    { who: '班長', text: '五發子彈,三十分及格。不及格的,下週再來!' },
  ]},
  { id: 'shoot', type: 'minigame', game: 'shoot' },
  { id: 's6', type: 'story', title: '手榴彈投擲', lines: [
    { who: '班長', text: '口令:拉插銷、投擲、臥倒!誰沒臥倒,我就當他陣亡!' },
  ]},
  { id: 'grenade', type: 'minigame', game: 'grenade' },
  { id: 'end', type: 'ending', title: '結訓', text: '新訓結束。你帶著滿滿的燒肉能量,邁向下一站。\n\n(待續)' },
];
