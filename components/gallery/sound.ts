"use client";
/** Optional ambient room tone generated with WebAudio (muted by default). */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function setAmbient(on: boolean) {
  if (on) {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      // soft brown-noise air
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520;
      const ng = ctx.createGain(); ng.gain.value = 0.35;
      noise.connect(lp).connect(ng).connect(master); noise.start();
      // a very quiet, slowly breathing low drone
      [110, 164.81, 220.5].forEach((f, i) => {
        const o = ctx!.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = ctx!.createGain(); g.gain.value = 0.018 / (i + 1);
        const lfo = ctx!.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
        const lg = ctx!.createGain(); lg.gain.value = 0.01 / (i + 1);
        lfo.connect(lg).connect(g.gain); lfo.start();
        o.connect(g).connect(master!); o.start();
      });
    }
    ctx.resume();
    master!.gain.cancelScheduledValues(ctx.currentTime);
    master!.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
  } else if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  }
}

export function ambientState() { return ctx?.state ?? "none"; }
