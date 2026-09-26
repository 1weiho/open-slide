const CHORDS = {
  Dm: { pad: [62, 65, 69, 72, 76], bass: 38, arp: [62, 65, 69, 72, 76, 81] },
  Bb: { pad: [58, 62, 65, 69, 72], bass: 34, arp: [58, 62, 65, 69, 72, 74] },
  F: { pad: [57, 60, 64, 65, 67], bass: 41, arp: [60, 64, 65, 69, 72, 76] },
  C: { pad: [60, 64, 67, 69, 74], bass: 36, arp: [60, 64, 67, 69, 72, 76] },
};
// One chord per bar (2 s at 120 BPM).
const BARS = 'Dm C Dm Bb F C Dm Bb F C F F';

export default function score(kit) {
  const { beats, kick, crash, reverseCymbal, snareRoll, bassNote, padChord, bell } = kit;
  const chordAt = kit.progression(CHORDS, BARS);
  const groove = (from, to, opts) => kit.groove(from, to, { chordAt, ...opts });

  padChord(0, 2, CHORDS.Dm.pad, { gain: 0.9, cutoff: (t) => 500 + t * 600, attack: 1.2 });
  for (const t of beats(1, 2)) kick(t, 0.5, { tone: 0.6, sidechain: true });
  reverseCymbal(2, 1.2, 1);
  crash(2, 1);
  groove(2, 4, { hats: '8', padGain: 0.6, cutoff: 1600 });
  crash(4, 0.7);
  groove(4, 12, { hats: '16', arp: true, padGain: 0.5, cutoff: 1800 });
  groove(12, 14, { hats: '16', bassMode: 'roll', arp: true, padGain: 0.55, cutoff: 2400 });
  snareRoll(15, 16, 0.6);
  reverseCymbal(16, 1.2, 1.1);
  crash(16, 1.2, 3);
  kick(16, 1.1);
  padChord(16, 3.5, [53, 57, 60, 64, 67, 72], {
    gain: 1,
    cutoff: (t) => 4000 - (t - 16) * 600,
    attack: 0.02,
    release: 1,
  });
  bassNote(16, 41, 3, 0.9, 0.5);
  [72, 76, 79, 84].forEach((m, i) => {
    bell(16.5 + i * 0.5, m, 0.12, i % 2 ? 0.5 : -0.5);
  });
}
