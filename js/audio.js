// Synthesized audio (no asset files). Fails silently if WebAudio is unavailable.
const Sfx = (() => {
  let ctx = null, master = null, droneOsc = null, droneGain = null;
  function init() {
    if (ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  }
  function tone(freq, dur, type = 'square', vol = 0.2, slideTo = null) {
    if (!ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.3, filterFreq = 1800, type = 'bandpass') {
    if (!ctx) return;
    const t = ctx.currentTime, len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }
  // 16-beat melody in C minor-ish (Hz); 0 = rest
  const MEL = [262, 0, 311, 0, 392, 0, 311, 349, 262, 0, 311, 0, 466, 392, 349, 311];
  const BASS = [65, 65, 78, 78, 98, 98, 78, 87];
  return {
    init,
    beat(i, slowing) {
      if (!ctx) return;
      const m = MEL[i % 16];
      if (m) tone(slowing ? m * 0.94 : m, 0.18, 'triangle', 0.12);
      if (i % 2 === 0) tone(BASS[(i / 2) % 8], 0.3, 'square', 0.07);
      if (i % 4 === 0) noise(0.05, 0.12, 4000, 'highpass');
    },
    hit() { tone(880, 0.06, 'square', 0.08, 440); },
    hurt() { noise(0.18, 0.45, 2500, 'bandpass'); tone(110, 0.15, 'sawtooth', 0.12, 60); },
    slam() { tone(120, 0.5, 'sine', 0.5, 35); noise(0.3, 0.3, 300, 'lowpass'); },
    shatter() { noise(0.6, 0.6, 500, 'lowpass'); tone(80, 0.6, 'sawtooth', 0.25, 30); },
    swing() { noise(0.06, 0.1, 3000, 'highpass'); },
    dash() { tone(300, 0.1, 'sine', 0.08, 700); },
    seat() { tone(660, 0.08, 'triangle', 0.15); tone(990, 0.12, 'triangle', 0.1); },
    phase() { tone(196, 0.6, 'sawtooth', 0.2, 392); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.18), i * 120)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.15), i * 160)); },
    droneStart() {
      if (!ctx || droneOsc) return;
      droneOsc = ctx.createOscillator(); droneGain = ctx.createGain();
      droneOsc.type = 'sawtooth'; droneOsc.frequency.setValueAtTime(220, ctx.currentTime);
      droneOsc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 2.6);
      droneGain.gain.value = 0.06; droneOsc.connect(droneGain); droneGain.connect(master); droneOsc.start();
    },
    droneStop() { if (droneOsc) { try { droneOsc.stop(); } catch (e) {} droneOsc = null; } },
  };
})();
