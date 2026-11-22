// Prépare le pack studio-motion : installe le moteur et télécharge le navigateur de rendu.
// Usage : node preparer.mjs   (depuis le dossier du skill)
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const moteur = path.join(ici, 'moteur');
const majeur = Number(process.versions.node.split('.')[0]);
if (majeur < 18) { console.error(`Node.js 18 ou plus est nécessaire (version actuelle : ${process.versions.node}).`); process.exit(1); }

if (!existsSync(path.join(moteur, 'node_modules', 'remotion'))) {
  console.log('Installation du moteur (quelques minutes la première fois)…');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npm, ['ci', '--no-audit', '--no-fund'], { cwd: moteur, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) { console.error('Échec de « npm ci » dans moteur/.'); process.exit(1); }
} else console.log('Moteur déjà installé.');

console.log('Vérification du navigateur de rendu…');
const { cheminNavigateur } = await import('./moteur/outils/commun.mjs');
const nav = await cheminNavigateur();
console.log(`Navigateur : ${nav}\nPrêt. Lisez guides/video.md pour faire une vidéo.`);
