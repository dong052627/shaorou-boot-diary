// 角色像素圖(16x24,只寫左半邊 8 格,自動鏡像)。之後可換成你自己的 png。
const PAL = {
  k: '#1b1d16', h: '#2a241f', s: '#f0c29a', S: '#cf9a72', e: '#1b1d16', m: '#9a4a3a',
  g: '#66793f', G: '#4d5c2f', b: '#2c261c', y: '#d8b54a', p: '#55653a', P: '#44512d', B: '#24211b',
  c: '#3f4b2a', r: '#d8b54a', d: '#262d1c', q: '#101010', w: '#f4f4ee', W: '#d2d2c8',
};
const BODY = [
  '...kSsss', '....kssm', '.....kkk', '......ks', '..kkgggg', '.kgggggg', '.kgkgggg', '.kgkgGgg',
  '.kGkgggg', '.kskgggg', '.kskbbby', '..kkpppp', '...kpppp', '...kpppk', '...kpppk', '...kPppk', '..kBBBBk', '..kkkkkk',
];
// 新兵(你):平頭
export const SOLDIER = { mirror: true, pal: PAL, rows: ['.....kkk', '....khhh', '...khhhh', '...khsss', '...ksses', '...kssss', ...BODY] };
// 班長:小帽 + 墨鏡
export const SERGEANT = { mirror: true, pal: PAL, rows: ['....kkkk', '...kcccr', '..kccccc', '..kddddd', '...ksqqs', '...kssss', ...BODY] };
// 伙房學長:白色廚師帽 + 白衣
export const COOK = { mirror: true, pal: { ...PAL, g: '#e6e6dc', G: '#c4c4b8' }, rows: ['...kkkkk', '..kwwwww', '..kwwwww', '...kWWWW', '...ksses', '...kssss', ...BODY] };
export const PORTRAITS = { '班長': SERGEANT, '你': SOLDIER, '伙房學長': COOK };
