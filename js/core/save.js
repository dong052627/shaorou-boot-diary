// 存檔:localStorage (失敗也不會壞)
const KEY = 'shaorou_save_v1';
export const Save = {
  load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } },
  write(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} },
  clear() { try { localStorage.removeItem(KEY); } catch {} },
};
