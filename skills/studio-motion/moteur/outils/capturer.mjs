// Capture d'écran d'une page web au format 16:10 (1440×900).
//   node outils/capturer.mjs https://exemple.com sortie.png [--mobile] [--attendre 2000] [--masquer "Jean Dupont=>Client Démo;+22670000000=>+226 00 00 00 00"]
// --masquer remplace des textes dans la page AVANT la capture (noms, téléphones, e-mails de vrais clients).
// Pages protégées par un mot de passe : voir guides/video.md, « Captures d'écran ».
import { lireArgs, ouvrirNavigateur, quitter } from './commun.mjs';

const { pos, opt } = lireArgs();
const [url, sortie] = pos;
if (!url || !sortie) quitter('Usage : node outils/capturer.mjs URL sortie.png [--attendre ms] [--masquer "a=>b;c=>d"]');
const nav = await ouvrirNavigateur();
const page = await nav.newPage();
// --mobile : téléphone (390 px de large, page entière, pour la brique « telephone ») ; sinon écran 1440×900 (brique « ecran »)
if (opt.mobile) await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
else await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, Number(opt.attendre || 1500)));
if (opt.masquer) {
  const paires = String(opt.masquer).split(';').map(p => p.split('=>'));
  await page.evaluate((paires) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { let t = n.nodeValue; for (const [a, b] of paires) t = t.split(a).join(b); if (t !== n.nodeValue) n.nodeValue = t; }
  }, paires);
}
await page.screenshot({ path: sortie, fullPage: !!opt.mobile });
await nav.close();
console.log(`Capture : ${sortie}`);
