// Outils communs du pack studio-motion : navigateur, lecture d'images, petites aides
import { ensureBrowser } from '@remotion/renderer';
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Navigateur : STUDIO_MOTION_NAVIGATEUR (chemin d'un Chrome/Chromium) sinon le Chrome que Remotion télécharge lui-même
export async function cheminNavigateur() {
  if (process.env.STUDIO_MOTION_NAVIGATEUR) return process.env.STUDIO_MOTION_NAVIGATEUR;
  // Remotion range son Chrome dans « .remotion » du dossier courant : on le fixe dans moteur/ pour ne le télécharger qu'une fois
  const avant = process.cwd();
  process.chdir(RACINE);
  let st;
  try { st = await ensureBrowser({ logLevel: 'error' }); } finally { process.chdir(avant); }
  if ('path' in st) return path.resolve(RACINE, st.path);
  throw new Error(`Navigateur introuvable (${st.type}). Définissez STUDIO_MOTION_NAVIGATEUR=/chemin/vers/chromium`);
}

export async function ouvrirNavigateur() {
  const executablePath = await cheminNavigateur();
  return puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'] });
}

// Dimensions d'une image PNG ou JPEG, sans dépendance
export function tailleImage(fichier) {
  const b = readFileSync(fichier);
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return null;
  return null;
}

export const dataUrl = (fichier) => {
  const ext = path.extname(fichier).slice(1).toLowerCase().replace('jpg', 'jpeg').replace('svg', 'svg+xml');
  return `data:image/${ext};base64,${readFileSync(fichier).toString('base64')}`;
};

// Lecture des options « --nom valeur » et des arguments positionnels
export function lireArgs(argv = process.argv.slice(2)) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) opt[k] = true; else opt[k] = argv[++i];
    } else pos.push(argv[i]);
  }
  return { pos, opt };
}

export const quitter = (msg) => { console.error(msg); process.exit(1); };
