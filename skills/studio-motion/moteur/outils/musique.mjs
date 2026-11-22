// Compose une musique d'ambiance ORIGINALE, entièrement synthétisée (aucun morceau ni échantillon extérieur :
// donc aucun droit d'auteur tiers). Sortie WAV, lisible directement par le moteur vidéo.
//   node outils/musique.mjs <style> <durée en secondes> sortie.wav [--graine 7]
// Styles : doux (tutoriel, posé), entrainant (marimba), clair (cloches, création), calme (piano lent),
//          vif (rythmé, promotions), pose (très calme, réglages). Changez --graine pour une variante du même style.
import { writeFileSync } from 'node:fs';
import { lireArgs, quitter } from './commun.mjs';

const STYLES = {
  doux:       { bpm: 72,  timbre: 'pluck',   dens: 0.72, prog: [[50, 57, 61, 64, 66], [47, 54, 57, 61, 62], [43, 50, 54, 57, 62], [45, 52, 54, 59, 61]] },
  entrainant: { bpm: 84,  timbre: 'marimba', dens: 0.8,  prog: [[53, 60, 64, 67, 69], [50, 57, 60, 65, 69], [46, 53, 57, 62, 65], [48, 55, 58, 64, 67]] },
  clair:      { bpm: 92,  timbre: 'cloche',  dens: 0.65, prog: [[57, 64, 68, 71, 73], [54, 61, 64, 69, 71], [50, 57, 61, 66, 69], [52, 59, 62, 68, 71]] },
  calme:      { bpm: 66,  timbre: 'piano',   dens: 0.55, prog: [[51, 58, 62, 65, 70], [48, 55, 58, 63, 67], [44, 51, 55, 60, 63], [46, 53, 56, 62, 65]] },
  vif:        { bpm: 100, timbre: 'marimba', dens: 0.85, prog: [[55, 62, 66, 69, 71], [52, 59, 62, 67, 71], [48, 55, 59, 64, 67], [50, 57, 60, 66, 69]] },
  pose:       { bpm: 60,  timbre: 'cloche',  dens: 0.35, prog: [[48, 55, 59, 62, 66], [45, 52, 55, 60, 64], [41, 48, 52, 57, 60], [43, 50, 53, 59, 62]] },
};

const { pos, opt } = lireArgs();
const [nom, dureeTxt, sortie] = pos;
const S = STYLES[nom];
if (!S || !dureeTxt || !sortie) quitter(`Usage : node outils/musique.mjs <${Object.keys(STYLES).join('|')}> <durée s> sortie.wav [--graine N]`);

// Générateur pseudo-aléatoire déterministe (même graine = même musique)
let g = Number(opt.graine || 7) * 9301 + 49297;
const rnd = () => ((g = (g * 1103515245 + 12345) % 2147483648) / 2147483648);

const SR = 44100, dur = Number(dureeTxt) + 2, n = Math.floor(SR * dur);
const L = new Float32Array(n), R = new Float32Array(n);
const beat = 60 / S.bpm, mesure = 4 * beat;
const f = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;

function ajouter(at, longueur, gen, pan) {
  const i0 = Math.floor(at * SR), len = Math.floor(longueur * SR);
  for (let k = 0; k < len && i0 + k < n; k++) { const v = gen(k / SR); L[i0 + k] += v * (1 - pan); R[i0 + k] += v * pan; }
}
const nappe = (fr, l, amp) => { const ph = [rnd() * 6, rnd() * 6, rnd() * 6]; return (t) => {
  const s = (Math.sin(TAU * fr * 0.997 * t + ph[0]) + Math.sin(TAU * fr * t + ph[1]) + Math.sin(TAU * fr * 1.0035 * t + ph[2])) / 3 + 0.25 * Math.sin(TAU * 2 * fr * t);
  return s * Math.min(1, t / 1.6) * Math.min(1, (l - t) / 1.8) * amp; }; };
const melodie = (fr, amp) => (t) => {
  let s;
  if (S.timbre === 'marimba') s = (Math.sin(TAU * fr * t) + 0.5 * Math.sin(TAU * 4 * fr * t) * Math.exp(-t * 25)) * Math.exp(-t * 5);
  else if (S.timbre === 'cloche') s = (Math.sin(TAU * fr * t) + 0.35 * Math.sin(TAU * 2.76 * fr * t) * Math.exp(-t * 4) + 0.2 * Math.sin(TAU * 5.4 * fr * t) * Math.exp(-t * 8)) * Math.exp(-t * 2);
  else if (S.timbre === 'piano') s = (Math.sin(TAU * fr * t) + 0.4 * Math.sin(TAU * 2 * fr * t) * Math.exp(-t * 3) + 0.15 * Math.sin(TAU * 3 * fr * t) * Math.exp(-t * 5)) * Math.exp(-t * 2.4);
  else s = (Math.sin(TAU * fr * t) + 0.3 * Math.sin(TAU * 2 * fr * t) * Math.exp(-t * 6)) * Math.exp(-t * 2.8);
  return s * Math.min(1, t / 0.006) * amp;
};

for (let k = 0, t0 = 0; t0 < dur; k++, t0 += 2 * mesure) {
  const ch = S.prog[k % 4], l = 2 * mesure + 1.5;
  for (const m of ch) ajouter(t0, l, nappe(f(m), l, 0.05), 0.3 + 0.4 * rnd());
  ajouter(t0, l, nappe(f(ch[0] - 12), l, 0.06), 0.5);
  if (k >= 1) {
    const arp = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12, ch[1] + 12, ch[4] + 12];
    for (let s = 0; s < 16; s++) if (rnd() < S.dens) ajouter(t0 + (s * beat) / 2, 1.8, melodie(f(arp[k % 2 ? (s * 5) % 6 : s % 6]), 0.045), 0.25 + 0.5 * (s % 2));
  }
}
// Réverbération simple (échos croisés), filtre passe-bas doux, fondus, normalisation
for (const [d, gain] of [[0.113, 0.32], [0.197, 0.26], [0.293, 0.2], [0.41, 0.14], [0.57, 0.1]]) {
  const s = Math.floor(d * SR);
  for (let i = n - 1; i >= s; i--) { L[i] += gain * R[i - s]; R[i] += gain * L[i - s]; }
}
const a = 1 - Math.exp((-TAU * 5500) / SR);
let pl = 0, pr = 0, max = 0;
for (let i = 0; i < n; i++) {
  pl += a * (L[i] - pl); pr += a * (R[i] - pr);
  const t = i / SR, env = Math.min(1, t / 3) * Math.min(1, (dur - t) / 4);
  L[i] = pl * env; R[i] = pr * env; max = Math.max(max, Math.abs(L[i]), Math.abs(R[i]));
}
const buf = Buffer.alloc(44 + n * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round((L[i] / max) * 0.7 * 32767), 44 + i * 4); buf.writeInt16LE(Math.round((R[i] / max) * 0.7 * 32767), 46 + i * 4); }
writeFileSync(sortie, buf);
console.log(`Musique originale « ${nom} » (${dur.toFixed(0)} s) : ${sortie}`);
