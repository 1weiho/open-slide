import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { filmOut, loadFilm, root } from '../scripts/films.mjs';
import { Biquad, Bus, db, pingPong, reverb, SR, writeWav } from './dsp.mjs';
import { createKit } from './kit.mjs';
import { createSfx } from './sfx.mjs';

function limiter(out, ceiling, lookahead = 0.004, release = 0.18) {
  const la = Math.round(lookahead * SR);
  const need = new Float32Array(out.n);
  for (let i = 0; i < out.n; i++) {
    const p = Math.max(Math.abs(out.L[i]), Math.abs(out.R[i]));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  const win = new Float32Array(out.n);
  const dq = [];
  for (let i = out.n - 1; i >= 0; i--) {
    while (dq.length && need[dq[dq.length - 1]] >= need[i]) dq.pop();
    dq.push(i);
    while (dq[0] > i + la) dq.shift();
    win[i] = need[dq[0]];
  }
  const att = 1 - Math.exp(-1 / (la / 3));
  const rel = 1 - Math.exp(-1 / (release * SR));
  let g = 1;
  let peak = 0;
  for (let i = 0; i < out.n; i++) {
    const target = win[i];
    g += (target - g) * (target < g ? att : rel);
    out.L[i] = Math.max(-ceiling, Math.min(ceiling, out.L[i] * g));
    out.R[i] = Math.max(-ceiling, Math.min(ceiling, out.R[i] * g));
    peak = Math.max(peak, Math.abs(out.L[i]), Math.abs(out.R[i]));
  }
  return peak;
}

// Fade the tail, set loudness from RMS, then look-ahead limit to -1 dBFS.
function master(out, duration) {
  let sum = 0;
  for (let i = 0; i < out.n; i++) {
    const t = i / SR;
    const fade = t > duration - 1.2 ? Math.max(0, (duration - t) / 1.2) : 1;
    const g = fade * Math.min(1, t / 0.05);
    out.L[i] *= g;
    out.R[i] *= g;
    sum += out.L[i] ** 2 + out.R[i] ** 2;
  }
  const rms = Math.sqrt(sum / (out.n * 2));
  const hpL = new Biquad('hp', 25, 0.7);
  const hpR = new Biquad('hp', 25, 0.7);
  for (let i = 0; i < out.n; i++) {
    out.L[i] = hpL.run(out.L[i]);
    out.R[i] = hpR.run(out.R[i]);
  }
  const k = db(-15) / rms;
  for (let i = 0; i < out.n; i++) {
    out.L[i] = Math.tanh(out.L[i] * k * 0.9) / 0.9;
    out.R[i] = Math.tanh(out.R[i] * k * 0.9) / 0.9;
  }
  const peak = limiter(out, db(-1));
  let sum2 = 0;
  for (let i = 0; i < out.n; i++) sum2 += out.L[i] ** 2 + out.R[i] ** 2;
  return { peak, rms: Math.sqrt(sum2 / (out.n * 2)) };
}

// Plays the film's score (films/<id>/score.js), a card whoosh per transition,
// and every scene's sfx cues, then mixes and masters to out/<id>/soundtrack.wav.
export async function renderSoundtrack(film) {
  const started = Date.now();
  const kit = createKit({ duration: film.duration, bpm: film.bpm });
  const { LEN, BEAT, duck, kickTimes } = kit;
  const { drums, bass, pads, arps, sfx, verbSend } = kit.buses;

  const scoreFile = path.join(root, 'films', film.id, 'score.js');
  if (fs.existsSync(scoreFile)) {
    const { default: score } = await import(pathToFileURL(scoreFile).href);
    score(kit);
  }
  kickTimes.sort((a, b) => a - b);
  bass.apply((t) => duck(t, 0.75));
  pads.apply((t) => duck(t, 0.45));
  arps.apply((t) => duck(t, 0.35));

  const SFX = createSfx(kit);
  let seed = 1;
  let cues = 0;
  for (const tr of film.transitions) {
    SFX.card(tr.t, 1);
    cues++;
  }
  for (const scene of film.scenes) {
    for (const [t, type, gain = 1, opts] of scene.sfx) {
      const fn = SFX[type];
      if (!fn) throw new Error(`no sfx "${type}" (scene ${scene.name})`);
      fn(t, gain, opts ?? {}, seed++);
      cues++;
    }
  }

  const music = new Bus(LEN);
  music.mix(drums, db(-3));
  music.mix(bass, db(-5));
  music.mix(pads, db(-4));
  const delayed = pingPong(arps, { time: BEAT * 0.75, feedback: 0.38 });
  music.mix(arps, db(-6));
  music.mix(delayed, db(-12));
  verbSend.mix(pads, 0.5);
  verbSend.mix(arps, 0.7);
  verbSend.mix(sfx, 0.25);
  const wet = reverb(verbSend, { room: 0.88, damp: 0.3 });

  const out = new Bus(LEN);
  out.mix(music, 1);
  out.mix(sfx, db(-2));
  out.mix(wet, db(-7));
  const stats = master(out, film.duration);

  const file = filmOut(film.id, 'soundtrack.wav');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeWav(file, out, fs);
  console.log(
    `soundtrack: ${cues} cues, ${LEN.toFixed(1)}s, rms ${(20 * Math.log10(stats.rms)).toFixed(1)} dBFS, ${((Date.now() - started) / 1000).toFixed(1)}s → ${path.relative(process.cwd(), file)}`,
  );
  return file;
}

if (process.argv[1] === import.meta.filename) {
  await renderSoundtrack(await loadFilm(process.argv.slice(2).find((a) => a !== '--')));
}
