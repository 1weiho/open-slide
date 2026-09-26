const CHORDS = {
  Dm: { pad: [62, 65, 69, 72, 76], bass: 38, arp: [62, 65, 69, 72, 76, 81] },
  Bb: { pad: [58, 62, 65, 69, 72], bass: 34, arp: [58, 62, 65, 69, 72, 74] },
  F: { pad: [57, 60, 64, 65, 67], bass: 41, arp: [60, 64, 65, 69, 72, 76] },
  C: { pad: [60, 64, 67, 69, 74], bass: 36, arp: [60, 64, 67, 69, 72, 76] },
};
// One chord per 2 s bar.
const BARS =
  'Dm Dm Bb C Dm Bb F C Dm Bb F C Dm Bb C Dm Bb F C Dm Bb F C Dm Bb F Bb Dm Bb C Dm Dm Bb F C F F F F';

export default function score(kit) {
  const {
    BEAT,
    beats,
    kick,
    hat,
    snareRoll,
    crash,
    reverseCymbal,
    bassNote,
    padChord,
    pluck,
    bell,
  } = kit;
  const chordAt = kit.progression(CHORDS, BARS);
  for (const t of [2, 3, 4, 5, 6, 7]) {
    kick(t, 0.35 + (t - 2) * 0.06, { tone: 0.6, sidechain: true });
  }
  padChord(0, 4, CHORDS.Dm.pad, { gain: 0.9, cutoff: (t) => 500 + t * 300, attack: 2.5 });
  padChord(4, 2, CHORDS.Bb.pad, { gain: 0.9, cutoff: 1800 });
  padChord(6, 2, CHORDS.C.pad, { gain: 0.9, cutoff: (t) => 1800 + (t - 6) * 1200 });
  reverseCymbal(8, 1.6, 1.2);

  const groove = (from, to, opts) => kit.groove(from, to, { chordAt, ...opts });

  crash(8, 1.1);
  groove(8, 18.5, { hats: '16', arp: false, padGain: 0.55, cutoff: 1600 });
  padChord(18.5, 1.5, CHORDS.Dm.pad, {
    gain: 0.8,
    cutoff: (t) => 900 + (t - 18.5) * 2600,
    attack: 0.2,
  });
  for (const t of beats(18.5, 20, BEAT / 2)) hat(t, 0.25, false, t % 1 ? 0.3 : -0.3);
  reverseCymbal(20, 1.2, 0.9);
  crash(20, 0.8);
  groove(20, 28, { hats: '16', arp: false, padGain: 0.55, cutoff: 1800 });
  for (let t = 12; t < 28; t += BEAT / 4) {
    const ch = chordAt(t);
    const step = Math.round(t / (BEAT / 4));
    if (step % 2 === 0)
      pluck(t, ch.arp[[0, 2, 4, 3][Math.floor(step / 2) % 4]], {
        gain: 0.18,
        pan: step % 4 ? 0.4 : -0.4,
        bright: 0.7,
      });
  }
  padChord(28, 2, CHORDS.C.pad, { gain: 0.9, cutoff: (t) => 800 + (t - 28) * 2500, attack: 0.4 });
  snareRoll(29, 30, 0.6);
  reverseCymbal(30, 1.2, 1);
  crash(30, 1);
  groove(30, 40.5, {
    hats: '16',
    bassMode: 'roll',
    arp: true,
    padGain: 0.45,
    cutoff: 1400,
    openHats: true,
  });
  groove(40.5, 42, {
    hats: '8',
    bassMode: 'off',
    arp: false,
    padGain: 0.6,
    cutoff: 2600,
    clapOn: false,
  });
  crash(42, 0.8);
  groove(42, 51.5, {
    hats: '16',
    bassMode: 'off',
    arp: true,
    padGain: 0.55,
    cutoff: 2600,
    openHats: true,
    arpBright: 1.3,
  });
  reverseCymbal(47.65, 0.8, 0.8);
  padChord(51.5, 2.5, CHORDS.Bb.pad, { gain: 0.5, cutoff: 2400, attack: 0.3, release: 0.8 });
  for (const t of [52, 52.5, 53]) {
    kick(t, 0.6);
    bassNote(t, 34, 0.4, 0.7, 0.6);
  }
  crash(54, 0.7);
  groove(54, 59, { hats: '16', bassMode: 'roll', arp: false, padGain: 0.4, cutoff: 1500 });
  for (let i = 0; i < 12; i++)
    pluck(55.45 + i * 0.25, chordAt(55.45 + i * 0.25).arp[(i * 2) % 6] + 12, {
      gain: 0.2,
      pan: i % 2 ? 0.5 : -0.5,
      decay: 0.15,
    });
  for (const b of beats(59, 60)) kick(b, 0.9, { sidechain: true });
  snareRoll(59, 60, 0.7);
  reverseCymbal(60, 1.0, 1);
  [60, 60.5, 61, 61.5].forEach((t, i) => {
    kick(t, 1.1);
    crash(t, 0.5 + i * 0.1, 1.2);
    padChord(
      t,
      0.3,
      CHORDS.Dm.pad.map((m) => m - 12 + [0, 0, 2, 5][i]),
      { gain: 1.4, cutoff: 3500, attack: 0.005, release: 0.25 },
    );
    bassNote(t, 38 + [0, 0, 3, 7][i], 0.35, 1.1, 1.4);
  });
  crash(62, 0.8);
  groove(62, 66, {
    hats: '8',
    bassMode: 'off',
    arp: true,
    padGain: 0.0,
    cutoff: 1000,
    arpBright: 0.8,
  });
  groove(66, 70, {
    hats: '16',
    bassMode: 'roll',
    arp: true,
    padGain: 0.6,
    cutoff: 2400,
    openHats: true,
  });
  snareRoll(68, 70, 0.7);
  reverseCymbal(70, 1.6, 1.3);
  crash(70, 1.3, 4);
  kick(70, 1.2);
  padChord(70, 7, [53, 57, 60, 64, 67, 72], {
    gain: 1.1,
    cutoff: (t) => 4200 - (t - 70) * 380,
    attack: 0.02,
    release: 1.2,
  });
  bassNote(70, 41, 5.5, 0.9, 0.5);
  const bells = [72, 76, 79, 84, 81, 76, 79, 72, 76, 84];
  bells.forEach((m, i) => {
    bell(70.5 + i * 0.5, m, 0.12, i % 2 ? 0.5 : -0.5);
  });
}
