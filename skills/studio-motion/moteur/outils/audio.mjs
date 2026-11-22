// Outils audio : ffmpeg (celui du système s'il est complet, sinon celui de Remotion), normalisation du volume.
import { spawnSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { RACINE } from './commun.mjs';

const cache = {};
// Renvoie { cmd, args0, filtres:Set } ; STUDIO_MOTION_FFMPEG impose un exécutable précis
export function ffmpeg() {
  if (cache.f) return cache.f;
  const candidats = [];
  if (process.env.STUDIO_MOTION_FFMPEG) candidats.push([process.env.STUDIO_MOTION_FFMPEG, []]);
  candidats.push(['ffmpeg', []]);
  if (process.platform === 'win32') candidats.push(['C:/ffmpeg/ffmpeg.exe', []]);
  const rem = path.join(RACINE, 'node_modules', '.bin', process.platform === 'win32' ? 'remotion.cmd' : 'remotion');
  candidats.push([rem, ['ffmpeg']]);
  // On préfère le premier ffmpeg complet (égaliseur, compresseur) ; à défaut, le premier qui fonctionne
  let premier = null;
  for (const [cmd, a0] of candidats) {
    const r = spawnSync(cmd, [...a0, '-hide_banner', '-filters'], { encoding: 'utf8', shell: cmd.endsWith('.cmd') });
    if (r.status !== 0 || !r.stdout) continue;
    const filtres = new Set([...r.stdout.matchAll(/^\s*[.A-Z|]{2,3}\s+(\w+)\s+\S+->/gm)].map(m => m[1]));
    const f = { cmd, a0, filtres, complet: ['equalizer', 'acompressor', 'highpass'].every(x => filtres.has(x)) };
    if (f.complet) return (cache.f = f);
    premier ??= f;
  }
  if (premier) return (cache.f = premier);
  throw new Error('ffmpeg introuvable : installez ffmpeg, ou relancez « node preparer.mjs ».');
}

export function lancer(args, { silencieux = true } = {}) {
  const f = ffmpeg();
  const r = spawnSync(f.cmd, [...f.a0, '-hide_banner', ...(silencieux ? ['-loglevel', 'error'] : []), ...args], { encoding: 'utf8', shell: f.cmd.endsWith('.cmd'), maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg : ${(r.stderr || '').slice(-600)}`);
  return r;
}

// Durée d'un fichier audio ou vidéo (secondes), lue dans la sortie de ffmpeg
export function dureeMedia(fichier) {
  const f = ffmpeg();
  const r = spawnSync(f.cmd, [...f.a0, '-hide_banner', '-i', fichier], { encoding: 'utf8', shell: f.cmd.endsWith('.cmd') });
  const m = (r.stderr || '').match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
}

// Crête réelle (true peak, dBTP) d'un fichier, ou null si ffmpeg ne sait pas la mesurer
export function crete_reelle(fichier) {
  try {
    const r = lancer(['-i', fichier, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], { silencieux: false });
    const m = r.stderr.match(/True peak:\s*Peak:\s*(-?[\d.]+|-inf)/);
    return m && m[1] !== '-inf' ? Number(m[1]) : null;
  } catch { return null; }
}

// Normalisation en deux passes (EBU R128) : -14 LUFS pour les réseaux sociaux, crêtes à -1,5 dBTP.
// La vidéo est copiée telle quelle ; le son est réencodé en AAC 192 kb/s, 48 kHz.
export function normaliser(fichier, { cible = -14, crete = -1.5 } = {}) {
  const mesure = lancer(['-i', fichier, '-vn', '-af', `loudnorm=I=${cible}:TP=${crete}:LRA=11:print_format=json`, '-f', 'null', '-'], { silencieux: false });
  const j = JSON.parse((mesure.stderr.match(/\{[\s\S]*?\}/g) || []).pop());
  const tmp = fichier.replace(/(\.\w+)$/, '.norm$1');
  lancer(['-y', '-i', fichier, '-c:v', 'copy', '-af',
    `loudnorm=I=${cible}:TP=${crete}:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`,
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', tmp]);
  if (!existsSync(tmp)) throw new Error('normalisation : fichier non produit');
  renameSync(tmp, fichier);
  // L'encodeur AAC fait souvent remonter les crêtes au-dessus de la cible : on mesure et on corrige une fois
  const pic = crete_reelle(fichier);
  if (pic !== null && pic > crete + 0.3) {
    const tmp2 = fichier.replace(/(\.\w+)$/, '.pic$1');
    lancer(['-y', '-i', fichier, '-c:v', 'copy', '-af', `volume=${(crete - 0.3 - pic).toFixed(2)}dB`, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', tmp2]);
    renameSync(tmp2, fichier);
  }
  return { avant: +j.input_i, apres: cible, crete: crete_reelle(fichier) };
}
