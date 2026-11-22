// Met une image au format 16:10 (1440×900) attendu par les plans « ecran ».
//   node outils/cadrer.mjs entree.png sortie.png [--recadrer x,y,l,h (pixels)] [--fond "#f4f4f5"]
// Une fenêtre, un menu ou un e-mail plus petit est centré sur un fond uni ; la position de l'image est affichée
// en fractions, pour viser ensuite le zoom sur elle.
import { dataUrl, lireArgs, ouvrirNavigateur, quitter, tailleImage } from './commun.mjs';

const { pos, opt } = lireArgs();
const [entree, sortie] = pos;
if (!entree || !sortie) quitter('Usage : node outils/cadrer.mjs entree.png sortie.png [--recadrer x,y,l,h] [--fond "#f4f4f5"]');
const t = tailleImage(entree) || quitter('Image PNG ou JPEG attendue.');
let [cx, cy, cw, ch] = opt.recadrer ? String(opt.recadrer).split(',').map(Number) : [0, 0, t.w, t.h];
const W = 1440, H = 900;
const s = Math.min(1.4, 860 / ch, 1400 / cw);
const w = Math.round(cw * s), h = Math.round(ch * s), x = Math.round((W - w) / 2), y = Math.round((H - h) / 2);
const nav = await ouvrirNavigateur();
const page = await nav.newPage();
await page.setViewport({ width: W, height: H });
await page.setContent(`<body style="margin:0;background:${opt.fond || '#f4f4f5'}"><div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden">
<img src="${dataUrl(entree)}" style="position:absolute;left:${-cx * s}px;top:${-cy * s}px;width:${t.w * s}px;height:${t.h * s}px"></div></body>`);
await page.screenshot({ path: sortie });
await nav.close();
const f = (v) => v.toFixed(3);
console.log(`Image cadrée : ${sortie}\nPosition de l'image dans le cadre : { "x": ${f(x / W)}, "y": ${f(y / H)}, "w": ${f(w / W)}, "h": ${f(h / H)} }`);
