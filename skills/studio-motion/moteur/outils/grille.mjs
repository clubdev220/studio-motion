// Superpose une grille de coordonnées (fractions 0–1) sur une capture, pour lire les zones à encadrer.
//   node outils/grille.mjs capture.png capture-grille.png [--zones "0.40,0.47,0.20,0.04;0.1,0.2,0.3,0.1"]
// Les zones optionnelles sont dessinées en rouge : vérifiez qu'elles entourent bien l'élément voulu.
import path from 'node:path';
import { dataUrl, lireArgs, ouvrirNavigateur, quitter, tailleImage } from './commun.mjs';

const { pos, opt } = lireArgs();
const [entree, sortie] = pos;
if (!entree || !sortie) quitter('Usage : node outils/grille.mjs capture.png sortie.png [--zones "x,y,w,h;…"]');
const t = tailleImage(entree) || quitter('Image PNG ou JPEG attendue.');
const zones = opt.zones ? String(opt.zones).split(';').map(z => z.split(',').map(Number)) : [];
const traits = [];
for (let i = 1; i < 20; i++) {
  const f = i / 20, fort = i % 2 === 0;
  const c = fort ? 'rgba(255,0,90,.55)' : 'rgba(0,140,255,.35)';
  traits.push(`<div style="position:absolute;left:${f * 100}%;top:0;bottom:0;width:${fort ? 2 : 1}px;background:${c}"></div>`);
  traits.push(`<div style="position:absolute;top:${f * 100}%;left:0;right:0;height:${fort ? 2 : 1}px;background:${c}"></div>`);
  if (fort) {
    const lab = (f).toFixed(1);
    traits.push(`<span style="position:absolute;left:calc(${f * 100}% + 3px);top:2px" class="l">${lab}</span>`);
    traits.push(`<span style="position:absolute;top:calc(${f * 100}% + 2px);left:3px" class="l">${lab}</span>`);
    traits.push(`<span style="position:absolute;left:calc(${f * 100}% + 3px);bottom:2px" class="l">${lab}</span>`);
    traits.push(`<span style="position:absolute;top:calc(${f * 100}% + 2px);right:3px" class="l">${lab}</span>`);
  }
}
for (const [x, y, w, h] of zones) traits.push(`<div style="position:absolute;left:${x * 100}%;top:${y * 100}%;width:${w * 100}%;height:${h * 100}%;outline:3px solid #ff2020;background:rgba(255,32,32,.12)"></div>`);
const nav = await ouvrirNavigateur();
const page = await nav.newPage();
await page.setViewport({ width: t.w, height: t.h });
await page.setContent(`<style>.l{font:bold 13px monospace;color:#fff;background:#c0004e;padding:0 3px;border-radius:3px}</style>
<body style="margin:0"><div style="position:relative;width:${t.w}px;height:${t.h}px"><img src="${dataUrl(entree)}" style="width:100%;height:100%;display:block">${traits.join('')}</div></body>`);
await page.screenshot({ path: sortie });
await nav.close();
console.log(`Grille : ${path.resolve(sortie)} (traits roses tous les 0,1, bleus tous les 0,05)`);
