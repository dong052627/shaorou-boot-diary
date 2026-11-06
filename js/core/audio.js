// 音效:全部用 WebAudio 即時合成(8-bit 風),不需要音檔。之後可換成自己的 mp3。
let ctx = null, master = null;

function tone(freq, dur = 0.08, type = 'square', vol = 0.1, slide = 0, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur = 0.2, vol = 0.3, cutoff = 2000) {
  if (!ctx) return;
  const t = ctx.currentTime, n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf; f.type = 'lowpass'; f.frequency.value = cutoff;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t);
}

export const Sound = {
  unlock() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination); }
      catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  },
  tone, noise,
  tap:    () => tone(660, 0.05, 'square', 0.07),
  good:   () => { tone(880, 0.06); tone(1320, 0.08, 'square', 0.1, 0, 0.06); },
  bad:    () => tone(170, 0.18, 'sawtooth', 0.12),
  win:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.1, 0, i * 0.1)),
  lose:   () => [392, 330, 262].forEach((f, i) => tone(f, 0.2, 'triangle', 0.14, 0, i * 0.16)),
  tick:   () => tone(1400, 0.02, 'square', 0.04),
  call:   (f) => tone(f, 0.16, 'square', 0.1),
  chop:   () => noise(0.05, 0.25, 3500),
  shot:   () => noise(0.25, 0.5, 1800),
  boom:   () => noise(0.9, 0.7, 400),
  whoosh: () => noise(0.3, 0.12, 1200),
  pin:    () => tone(1800, 0.05, 'triangle', 0.1, -800),
};
