// Rend une vidéo à partir d'un scénario JSON (montage de briques et de scènes libres).
//   node outils/video.mjs scenario.json sortie.mp4                    rendu complet (MP4 H.264, 30 i/s)
//   node outils/video.mjs scenario.json dossier --images-tests 3,12,25 images fixes aux instants donnés + planche.png
//   node outils/video.mjs scenario.json dossier --images-tests auto     une image au milieu de chaque scène (et de chaque repère)
// Options : --format 9:16 (remplace le format du scénario), --concurrence N (1 par défaut : machines modestes), --forcer (rendre malgré les erreurs du vérificateur)
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RACINE, cheminNavigateur, dataUrl, lireArgs, ouvrirNavigateur, quitter } from './commun.mjs';
import { FICHIER_MEDIA, chargerScenario, verifier } from './verifier.mjs';

const { pos, opt } = lireArgs();
const [fichier, sortie] = pos;
if (!fichier || !sortie) quitter('Usage : node outils/video.mjs scenario.json sortie.mp4 [--images-tests 3,12,25|auto] [--concurrence 1] [--forcer]');

// 1. Vérification
const { erreurs, alertes, duree } = verifier(fichier);
for (const m of erreurs) console.log('ERREUR    ' + m);
for (const m of alertes) console.log('ATTENTION ' + m);
if (erreurs.length && !opt.forcer) quitter(`\n${erreurs.length} erreur(s) : rendu annulé (corrigez le scénario, ou --forcer).`);

// 2. Dossier public temporaire : on y copie uniquement les fichiers cités par le scénario
const { sc, dossier, dossierCharte } = chargerScenario(fichier);
if (opt.format) sc.format = String(opt.format); // essayer le même scénario dans un autre format
const pub = mkdtempSync(path.join(os.tmpdir(), 'studio-motion-'));
mkdirSync(path.join(pub, 'f'), { recursive: true });
let n = 0;
const deja = new Map();
const copier = (base, rel) => {
  const cle = path.resolve(base, rel);
  if (!deja.has(cle)) { const nom = `f/${n++}${path.extname(rel).toLowerCase()}`; copyFileSync(cle, path.join(pub, nom)); deja.set(cle, nom); }
  return deja.get(cle);
};
const remplacer = (o) => {
  if (typeof o === 'string') return FICHIER_MEDIA.test(o) && !/^https?:/.test(o) ? copier(dossier, o) : o;
  if (Array.isArray(o)) return o.map(remplacer);
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === 'fichier' ? v : remplacer(v)]));
  return o;
};
sc.scenes = sc.scenes.map(remplacer);
if (sc.musique) sc.musique = copier(dossier, sc.musique);
if (sc.charte.logo) sc.charte.logo = copier(dossierCharte, sc.charte.logo);

// 3. Scènes libres : copiées dans le moteur le temps du rendu (elles importent « remotion », « react » et « studio-motion »)
const dossierLibre = path.join(RACINE, 'video/src/libre');
const genere = path.join(dossierLibre, '_genere.ts');
const VIDE = "// Fichier régénéré par outils/video.mjs à chaque rendu : scènes « libres » du projet en cours.\nimport type { FC } from 'react';\nexport const LIBRES: Record<string, FC<Record<string, unknown>>> = {};\n";
const libres = [...new Set(sc.scenes.filter(s => s.brique === 'libre').map(s => s.fichier))];
rmSync(path.join(dossierLibre, 'projet'), { recursive: true, force: true });
if (libres.length) {
  mkdirSync(path.join(dossierLibre, 'projet'), { recursive: true });
  const imports = libres.map((f, i) => { copyFileSync(path.resolve(dossier, f), path.join(dossierLibre, 'projet', `s${i}.tsx`)); return `import S${i} from './projet/s${i}';`; });
  writeFileSync(genere, `import type { FC } from 'react';\n${imports.join('\n')}\nexport const LIBRES: Record<string, FC<Record<string, unknown>>> = {\n${libres.map((f, i) => `  ${JSON.stringify(f)}: S${i} as FC<Record<string, unknown>>,`).join('\n')}\n};\n`);
}

// 4. Rendu
try {
  const browserExecutable = await cheminNavigateur();
  console.log(`\nPréparation du rendu (${sc.format}, ${duree.toFixed(1)} s)…`);
  const serveUrl = await bundle({
    entryPoint: path.join(RACINE, 'video/src/index.ts'), publicDir: pub,
    webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias || {}), 'studio-motion': path.join(RACINE, 'video/src/outils.tsx') } } }),
  });
  const composition = await selectComposition({ serveUrl, id: 'Montage', inputProps: sc, browserExecutable });
  const commun = { serveUrl, composition, inputProps: sc, browserExecutable };

  if (opt['images-tests']) {
    mkdirSync(sortie, { recursive: true });
    let instants;
    if (opt['images-tests'] === 'auto' || opt['images-tests'] === true) {
      instants = []; let t = 0;
      sc.scenes.forEach((s, i) => {
        const nom = `${i + 1}. ${s.brique}`;
        if (s.brique === 'ecran' && s.reperes?.length) s.reperes.forEach((r, k) => { const fin = s.reperes[k + 1]?.at ?? s.duree; instants.push({ t: t + Math.min(fin - 0.3, r.at + Math.max(2.6, (fin - r.at) * 0.55)), nom: `${nom} · repère ${k + 1}` }); });
        else instants.push({ t: t + Math.min(s.duree - 0.4, Math.max(1.5, s.duree * 0.62)), nom });
        t += s.duree;
      });
    } else instants = String(opt['images-tests']).split(',').map(Number).map(t => ({ t, nom: '' }));
    instants = instants.filter(x => x.t >= 0 && x.t < duree);
    const fichiers = [];
    for (const { t, nom } of instants) {
      const f = path.join(sortie, `t${t.toFixed(1).padStart(6, '0')}.png`);
      await renderStill({ ...commun, frame: Math.round(t * 30), output: f, scale: sc.format === '16:9' ? 0.5 : 0.6 });
      fichiers.push({ f, t, nom });
      console.log(`image ${t.toFixed(1)} s ${nom}`);
    }
    // Planche : toutes les images sur une seule page, pour les regarder d'un coup d'œil
    const larg = sc.format === '16:9' ? 960 : sc.format === '1:1' ? 640 : 540;
    const cols = sc.format === '16:9' ? 3 : 4;
    const nav = await ouvrirNavigateur();
    const page = await nav.newPage();
    await page.setViewport({ width: cols * (larg + 10) + 10, height: 600 });
    await page.setContent(`<body style="margin:0;padding:10px;background:#222;display:grid;grid-template-columns:repeat(${cols},${larg}px);gap:10px;font:20px sans-serif;color:#fff">
      ${fichiers.map(x => `<div style="position:relative"><img src="${dataUrl(x.f)}" style="width:${larg}px;display:block"><span style="position:absolute;left:8px;bottom:8px;background:#000c;padding:4px 10px;border-radius:6px">${x.t.toFixed(1)} s${x.nom ? ' · ' + x.nom : ''}</span></div>`).join('')}</body>`);
    await page.screenshot({ path: path.join(sortie, 'planche.png'), fullPage: true });
    await nav.close();
    console.log(`\nImages-tests et planche : ${path.join(sortie, 'planche.png')} — regardez-les avant le rendu complet.`);
  } else {
    let dernier = -1;
    await renderMedia({ ...commun, codec: 'h264', crf: 20, concurrency: Number(opt.concurrence || 1), outputLocation: sortie,
      onProgress: ({ progress }) => { const p = Math.floor(progress * 10) * 10; if (p !== dernier) { dernier = p; process.stdout.write(`${p} % `); } } });
    console.log(`\nVidéo rendue : ${sortie}`);
  }
} finally {
  rmSync(pub, { recursive: true, force: true });
  rmSync(path.join(dossierLibre, 'projet'), { recursive: true, force: true });
  writeFileSync(genere, VIDE);
}
