// Trouve ou construit la charte graphique de l'utilisateur, puis la montre en aperçu pour validation.
//
//   node moteur/outils/charte.mjs mon-projet/charte --projet /chemin/du/projet      scanne un code source (CSS, Tailwind, polices, logos)
//   node moteur/outils/charte.mjs mon-projet/charte --site https://exemple.com      lit un site web (couleurs, polices, logo)
//   node moteur/outils/charte.mjs mon-projet/charte --couleurs "#0a6cff,#ffb703"    à partir des couleurs données par l'utilisateur
//   Options combinables : --nom "Ma Marque"  --logo chemin/logo.svg  --polices "Poppins,Inter"  --theme sombre|clair
//
// Écrit <dossier>/charte.json (+ logo copié) et <dossier>/apercu.png (affiche d'essai, thèmes sombre et clair).
// La charte proposée doit être montrée à l'utilisateur et validée avant de servir. Voir guides/charte.md.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { lireArgs, ouvrirNavigateur, quitter } from './commun.mjs';
import { planche } from './html.mjs';

// Polices disponibles dans le moteur vidéo (les affiches et documents acceptent toute police Google)
export const POLICES_VIDEO = ['Cormorant Garamond', 'DM Sans', 'Fraunces', 'Inter', 'JetBrains Mono', 'Lora', 'Manrope', 'Montserrat', 'Nunito', 'Outfit', 'Playfair Display', 'Poppins', 'Raleway', 'Sora', 'Space Grotesk'];
const GENERIQUES = /^(serif|sans-serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|-apple-system|blinkmacsystemfont|segoe ui|roboto|helvetica( neue)?|arial|apple color emoji|segoe ui emoji|segoe ui symbol|noto color emoji|inherit|initial|var\(.*)$/i;

// ---------- Couleurs ----------
const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2hex(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return rgb2hex(f(0) * 255, f(8) * 255, f(4) * 255);
}
const normHex = (c) => { const m = String(c).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i); if (m) return rgb2hex(...hex2rgb(m[0])); const r = String(c).match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/i); if (r && (r[4] === undefined || +r[4] > 0.5)) return rgb2hex(+r[1], +r[2], +r[3]); return null; };
const lum = (hex) => { const v = hex2rgb(hex).map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const ecartTeinte = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

// Couleurs pondérées -> accent (et secondaire), fond sombre éventuel
export function choisirCouleurs(poids) {
  const liste = [...poids.entries()].map(([hex, p]) => ({ hex, p, hsl: rgb2hsl(hex2rgb(hex)) }));
  const vives = liste.filter(c => c.hsl[1] > 0.28 && c.hsl[2] > 0.18 && c.hsl[2] < 0.82).sort((a, b) => b.p - a.p);
  const sombres = liste.filter(c => c.hsl[2] < 0.16).sort((a, b) => b.p - a.p);
  const accent = vives[0]?.hex || null;
  const second = accent ? vives.find(c => ecartTeinte(c.hsl[0], vives[0].hsl[0]) > 35)?.hex || null : null;
  return { accent, second, sombre: sombres[0]?.hex || null, vives: vives.slice(0, 6).map(c => c.hex) };
}

// Palette complète du pack à partir de l'accent (et d'un fond sombre déjà utilisé par la marque, s'il existe)
export function palette(accent, { second, sombre } = {}) {
  const [h, s] = rgb2hsl(hex2rgb(accent));
  const sf = Math.min(s, 0.45);
  const fond = sombre && rgb2hsl(hex2rgb(sombre))[2] < 0.14 ? sombre : hsl2hex(h, sf * 0.9, 0.075);
  const [hf, sF, lF] = rgb2hsl(hex2rgb(fond));
  const c = {
    fond,
    surface: hsl2hex(hf, sF, Math.min(lF + 0.07, 0.22)),
    surfaceSombre: hsl2hex(hf, sF, Math.min(lF + 0.035, 0.18)),
    accent,
    accentClair: hsl2hex(h, Math.min(s, 0.6), 0.93),
    accentProfond: second ? hsl2hex(rgb2hsl(hex2rgb(second))[0], Math.min(rgb2hsl(hex2rgb(second))[1], 0.6), 0.32) : hsl2hex(h, Math.min(s, 0.65), 0.3),
    texte: hsl2hex(h, 0.12, 0.95),
    texteSecondaire: hsl2hex(h, 0.1, 0.74),
  };
  const notes = [];
  if (contraste(c.accent, c.fond) < 3) notes.push(`l'accent ${accent} ressort peu sur le fond sombre (contraste ${contraste(c.accent, c.fond).toFixed(1)}) : il sera surtout lisible en grand`);
  return { c, notes };
}

// Police la plus proche disponible dans le moteur vidéo
export function policeVideo(nom, generique = '') {
  if (!nom) return null;
  const n = nom.replace(/["']/g, '').trim();
  const trouve = POLICES_VIDEO.find(p => p.toLowerCase() === n.toLowerCase());
  if (trouve) return { police: trouve, exacte: true };
  const t = (n + ' ' + generique).toLowerCase();
  let police = 'Inter';
  if (/mono|code|courier|consol/.test(t)) police = 'JetBrains Mono';
  else if (/playfair|didot|bodoni|display|abril|dm serif/.test(t)) police = 'Playfair Display';
  else if (/garamond|cormorant|baskerville|caslon/.test(t)) police = 'Cormorant Garamond';
  else if (/serif|merriweather|georgia|times|libre|crimson|source serif|pt serif|noto serif|roboto slab|slab/.test(t) && !/sans/.test(t)) police = 'Lora';
  else if (/futura|avenir|gotham|geometric|lexend|urbanist|jost|figtree|plus jakarta/.test(t)) police = 'Poppins';
  else if (/rounded|quicksand|nunito|varela|comfortaa/.test(t)) police = 'Nunito';
  else if (/grotesk|archivo|neue haas|helvetica|roboto|open sans|lato|work sans|ibm plex sans|source sans|segoe|noto sans|geist/.test(t)) police = 'Inter';
  return { police, exacte: false, origine: n };
}

// ---------- Sources ----------
const IGNORES = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', 'vendor', '.cache', '.turbo', '.remotion', 'android', 'ios', '.venv', 'venv', '__pycache__']);
const EXT_CODE = /\.(css|scss|sass|less|styl|html?|vue|svelte|astro|jsx?|tsx?|mjs|cjs|json|ya?ml|toml|dart|xml)$/i;
const NOMS_FORTS = /(primary|brand|accent|main|principal|marque|secondary|cta|highlight|theme)/i;

function parcourir(dossier, cb, etat = { n: 0 }) {
  let entrees = [];
  try { entrees = readdirSync(dossier, { withFileTypes: true }); } catch { return; }
  for (const e of entrees) {
    if (etat.n > 4000) return;
    const f = path.join(dossier, e.name);
    if (e.isDirectory()) { if (!IGNORES.has(e.name) && !e.name.startsWith('.')) parcourir(f, cb, etat); }
    else { etat.n++; cb(f, e.name); }
  }
}

export function scannerProjet(dossier) {
  const poids = new Map(), polices = new Map(), logos = [], policesFichiers = [], sources = new Set();
  const ajouter = (m, k, p) => m.set(k, (m.get(k) || 0) + p);
  parcourir(dossier, (f, nom) => {
    if (/logo/i.test(nom) && /\.(svg|png|webp)$/i.test(nom) && !/favicon/i.test(nom)) logos.push(f);
    if (/\.(woff2?|ttf|otf)$/i.test(nom)) policesFichiers.push(f);
    if (!EXT_CODE.test(nom) || /lock|\.min\.|\.map$|package-lock|yarn\.lock/i.test(nom)) return;
    let t; try { if (statSync(f).size > 800_000) return; t = readFileSync(f, 'utf8'); } catch { return; }
    // Couleurs (hexadécimales et rgb), plus fortes si la ligne parle de « primary », « brand »…
    for (const ligne of t.split('\n')) {
      const cs = ligne.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])|rgba?\([^)]+\)/g);
      if (!cs) continue;
      const fort = NOMS_FORTS.test(ligne) ? 8 : /(--|\$|colors|color|bg|background|fill)/i.test(ligne) ? 2 : 1;
      for (const c of cs) { const h = normHex(c); if (h) { ajouter(poids, h, fort); if (fort > 1) sources.add(path.relative(dossier, f)); } }
    }
    // Polices : font-family, Google Fonts, next/font
    for (const m of t.matchAll(/font-family\s*:\s*([^;}\n]+)/gi)) for (const p of m[1].split(',').map(x => x.trim().replace(/["']/g, ''))) if (p && !GENERIQUES.test(p)) { ajouter(polices, p, /h[1-3]|title|titre|heading|display/i.test(t.slice(Math.max(0, m.index - 120), m.index)) ? 3 : 1); break; }
    for (const m of t.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'\s)]+)/g)) for (const fam of m[1].matchAll(/family=([^:&]+)/g)) ajouter(polices, decodeURIComponent(fam[1]).replace(/\+/g, ' '), 4);
    for (const m of t.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/g)) for (const p of m[1].split(',')) ajouter(polices, p.trim().replace(/_/g, ' '), 5);
    for (const m of t.matchAll(/fontFamily\s*:\s*\{([^}]+)\}/g)) for (const p of m[1].matchAll(/\[\s*['"]([^'"]+)['"]/g)) if (!GENERIQUES.test(p[1])) ajouter(polices, p[1], 4);
  });
  return { poids, polices: [...polices.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]), logos, policesFichiers, sources: [...sources].slice(0, 8) };
}

export async function lireSite(url, dossierSortie) {
  const nav = await ouvrirNavigateur();
  try {
    const page = await nav.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1200));
    const r = await page.evaluate(() => {
      const poids = {}, polices = {};
      const add = (o, k, p) => { if (k) o[k] = (o[k] || 0) + p; };
      const vu = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.top < innerHeight * 3; };
      for (const el of document.querySelectorAll('body *')) {
        if (!vu(el)) continue;
        const cs = getComputedStyle(el), b = el.getBoundingClientRect();
        const aire = Math.min(b.width * b.height, innerWidth * innerHeight) / 20000;
        const fort = el.matches('button, a.button, .btn, [class*="btn"], [class*="button"], [class*="cta"], [role="button"], input[type="submit"]') ? 25 : el.matches('a') ? 3 : 1;
        add(poids, cs.backgroundColor, aire * fort);
        add(poids, cs.color, (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) ? fort * 2 : 0);
        if (fort > 1) add(poids, cs.borderTopColor, fort);
      }
      add(poids, getComputedStyle(document.body).backgroundColor, 200);
      // Variables CSS de la page
      const vars = {};
      for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch { continue; } for (const ru of rules) if (ru.style) for (const p of ru.style) if (p.startsWith('--')) vars[p] = ru.style.getPropertyValue(p).trim(); }
      const fam = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).fontFamily : null; };
      for (const [sel, p] of [['h1', 5], ['h2', 4], ['h3', 2]]) add(polices, fam(sel) && 'T:' + fam(sel), p);
      add(polices, 'X:' + getComputedStyle(document.body).fontFamily, 5);
      add(polices, fam('p') && 'X:' + fam('p'), 4);
      // Logo : image ou SVG de l'en-tête qui parle de « logo », sinon première image de l'en-tête
      const cands = [...document.querySelectorAll('header img, header svg, nav img, nav svg, [class*="logo"] img, [class*="logo"] svg, img[alt*="logo" i], img[src*="logo" i], a[href="/"] img, a[href="/"] svg')].filter(vu);
      cands.sort((a, b) => (/logo/i.test((b.outerHTML || '').slice(0, 300)) - /logo/i.test((a.outerHTML || '').slice(0, 300))) || a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const l = cands[0];
      const logo = l ? (l.tagName.toLowerCase() === 'svg' ? { svg: l.outerHTML.includes('xmlns') ? l.outerHTML : l.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"') } : { src: l.currentSrc || l.src }) : null;
      return { poids, vars, polices, logo, titre: document.title, nomSite: document.querySelector('meta[property="og:site_name"]')?.content || null };
    });
    const poids = new Map();
    for (const [c, p] of Object.entries(r.poids)) { const h = normHex(c); if (h) poids.set(h, (poids.get(h) || 0) + p); }
    for (const [k, v] of Object.entries(r.vars)) { const h = normHex(v); if (h) poids.set(h, (poids.get(h) || 0) + (NOMS_FORTS.test(k) ? 400 : 20)); }
    const pol = { titres: null, texte: null };
    const tri = Object.entries(r.polices).sort((a, b) => b[1] - a[1]);
    const premiere = (stack) => stack.split(',').map(x => x.trim().replace(/["']/g, '')).find(x => !GENERIQUES.test(x)) || null;
    pol.titres = premiere(tri.find(([k]) => k.startsWith('T:'))?.[0].slice(2) || '');
    pol.texte = premiere(tri.find(([k]) => k.startsWith('X:'))?.[0].slice(2) || '');
    let logo = null;
    if (r.logo?.svg) { logo = path.join(dossierSortie, 'logo.svg'); writeFileSync(logo, r.logo.svg); }
    else if (r.logo?.src && !r.logo.src.startsWith('data:')) {
      try {
        const rep = await fetch(r.logo.src);
        const type = rep.headers.get('content-type') || '';
        const ext = /svg/.test(type) ? 'svg' : /png/.test(type) ? 'png' : /webp/.test(type) ? 'webp' : /jpe?g/.test(type) ? 'jpg' : null;
        if (rep.ok && ext) { logo = path.join(dossierSortie, `logo.${ext}`); writeFileSync(logo, Buffer.from(await rep.arrayBuffer())); }
      } catch { /* logo non récupérable : on le demandera */ }
    }
    return { poids, polices: [pol.titres, pol.texte].filter(Boolean), logo, nom: r.nomSite || r.titre?.split(/[|–—-]/)[0].trim() };
  } finally { await nav.close(); }
}

// Luminosité moyenne d'un logo (pixels visibles) : clair -> pour fond sombre, foncé -> pour fond clair
async function clarteLogo(fichier) {
  const nav = await ouvrirNavigateur();
  try {
    const page = await nav.newPage();
    const ext = path.extname(fichier).slice(1).toLowerCase().replace('jpg', 'jpeg').replace('svg', 'svg+xml');
    const src = `data:image/${ext};base64,${readFileSync(fichier).toString('base64')}`;
    return await page.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const w = Math.min(400, img.naturalWidth || 400), h = Math.round(w * ((img.naturalHeight || 200) / (img.naturalWidth || 400)));
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data; let s = 0, n = 0, opaque = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 40) { s += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; n++; } if (d[i + 3] > 250) opaque++; }
      return { clarte: n ? s / n : 0.5, fondPlein: opaque / (d.length / 4) > 0.97 };
    }, src);
  } finally { await nav.close(); }
}

// Recadre un logo au plus près de son contenu (SVG : boîte englobante ; PNG/WebP : pixels non transparents)
export async function rogner(fichier) {
  const nav = await ouvrirNavigateur();
  try {
    const page = await nav.newPage();
    if (fichier.endsWith('.svg')) {
      const svg = readFileSync(fichier, 'utf8');
      const vb = await page.evaluate((s) => { document.body.innerHTML = s; const el = document.querySelector('svg'); el.style.width = '1000px'; el.style.height = '1000px'; const b = el.getBBox(); return b.width && b.height ? [b.x, b.y, b.width, b.height] : null; }, svg);
      if (!vb) return;
      const m = Math.max(vb[2], vb[3]) * 0.02;
      const nv = [vb[0] - m, vb[1] - m, vb[2] + 2 * m, vb[3] + 2 * m].map(v => +v.toFixed(2)).join(' ');
      let out = /<svg[^>]*viewBox="/.test(svg) ? svg.replace(/(<svg[^>]*?)viewBox="[^"]*"/, `$1viewBox="${nv}"`) : svg.replace('<svg', `<svg viewBox="${nv}"`);
      out = out.replace(/<svg[^>]*>/, (t) => t.replace(/\s(width|height)="[^"]*"/g, ''));
      writeFileSync(fichier, out);
    } else if (/\.(png|webp)$/i.test(fichier)) {
      const src = `data:image/${path.extname(fichier).slice(1)};base64,${readFileSync(fichier).toString('base64')}`;
      const b64 = await page.evaluate(async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0 || (x1 - x0 + 1) * (y1 - y0 + 1) > c.width * c.height * 0.9) return null;
        const w = x1 - x0 + 1, h = y1 - y0 + 1;
        const o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
        return o.toDataURL('image/png').split(',')[1];
      }, src);
      if (b64) writeFileSync(fichier, Buffer.from(b64, 'base64'));
    }
  } finally { await nav.close(); }
}

// ---------- Programme ----------
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const { pos, opt } = lireArgs();
  const sortie = pos[0] && path.resolve(pos[0]);
  if (!sortie || !(opt.projet || opt.site || opt.couleurs)) quitter('Usage : node moteur/outils/charte.mjs dossier-de-sortie (--projet DOSSIER | --site URL | --couleurs "#hex,#hex") [--nom N] [--logo F] [--polices "Titres,Texte"]');
  mkdirSync(sortie, { recursive: true });
  const rapport = [];
  let poids = new Map(), polices = [], logos = [], nom = opt.nom || null, policesFichiers = [];

  if (opt.projet) {
    const p = path.resolve(String(opt.projet));
    if (!existsSync(p)) quitter(`ERREUR dossier introuvable : ${p}`);
    console.log(`Analyse du projet ${p}…`);
    const s = scannerProjet(p);
    poids = s.poids; polices = s.polices; logos = s.logos; policesFichiers = s.policesFichiers;
    rapport.push(`Projet analysé : ${s.poids.size} couleurs, ${s.polices.length} polices, ${s.logos.length} logo(s). Fichiers les plus parlants : ${s.sources.join(', ') || '—'}`);
    try { const pk = JSON.parse(readFileSync(path.join(p, 'package.json'), 'utf8')); nom ??= pk.displayName || pk.productName || null; } catch { /* pas de package.json */ }
  }
  if (opt.site) {
    console.log(`Lecture du site ${opt.site}…`);
    const s = await lireSite(String(opt.site), sortie);
    for (const [k, v] of s.poids) poids.set(k, (poids.get(k) || 0) + v);
    polices = [...s.polices, ...polices];
    if (s.logo) logos.unshift(s.logo);
    nom ??= s.nom;
    rapport.push(`Site lu : ${opt.site}${s.logo ? ' (logo récupéré)' : ' (logo non trouvé)'}`);
  }
  if (opt.couleurs) {
    String(opt.couleurs).split(/[,;\s]+/).map(normHex).filter(Boolean).forEach((h, i) => poids.set(h, (poids.get(h) || 0) + 1e6 / (i + 1)));
    rapport.push(`Couleurs données : ${opt.couleurs}`);
  }
  if (opt.polices) polices = [...String(opt.polices).split(',').map(x => x.trim()).filter(Boolean), ...polices];

  const choix = choisirCouleurs(poids);
  if (!choix.accent) quitter('ERREUR aucune couleur de marque trouvée (seulement du noir, du blanc ou des gris) : demandez à l\'utilisateur sa couleur principale (--couleurs "#…").');
  const { c, notes } = palette(choix.accent, choix);
  const titres = policeVideo(polices[0] || 'Inter'), texte = policeVideo(polices[1] || polices[0] || 'Inter');
  const charte = { nom: nom || 'Ma marque', couleurs: { ...c }, polices: { titres: titres.police, texte: texte.police } };

  // Logo : le plus parlant (SVG d'abord), classé clair/foncé pour fond sombre/clair
  const tries = [...new Set(logos)].sort((a, b) => (b.endsWith('.svg') - a.endsWith('.svg')) || a.length - b.length).slice(0, 6);
  for (const l of tries) {
    let info; try { info = await clarteLogo(l); } catch { continue; }
    const dest = async (n) => { const f = path.join(sortie, n + path.extname(l).toLowerCase()); if (path.resolve(l) !== path.resolve(f)) copyFileSync(l, f); await rogner(f).catch(() => {}); return path.basename(f); };
    if (info.fondPlein) { rapport.push(`ATTENTION logo ${path.basename(l)} sur fond plein (pas de transparence) : demandez un SVG ou un PNG transparent.`); continue; }
    if (info.clarte > 0.6 && !charte.logo) charte.logo = await dest('logo');
    else if (info.clarte <= 0.6 && !charte.logoClair) charte.logoClair = await dest('logo-clair');
    if (charte.logo && charte.logoClair) break;
  }
  if (!charte.logo && charte.logoClair) rapport.push('ATTENTION seul un logo foncé a été trouvé : il sert sur fond clair (affiches et documents en thème clair) ; sur fond sombre, le nom de la marque s\'affiche en texte. Demandez une version claire (blanche) du logo pour les vidéos.');
  if (!charte.logo && !charte.logoClair) rapport.push('ATTENTION aucun logo trouvé : demandez-le à l\'utilisateur (SVG ou PNG transparent) ; en attendant, le nom de la marque s\'affiche en texte.');
  if (policesFichiers.length) rapport.push(`Fichiers de police trouvés dans le projet (pour les affiches et PDF sans internet, voir « polices.fichiers ») : ${policesFichiers.slice(0, 4).map(f => path.basename(f)).join(', ')}`);
  for (const p of [titres, texte].filter((x, i, t) => t.findIndex(y => y.origine === x.origine) === i)) if (!p.exacte) rapport.push(`Police « ${p.origine} » indisponible dans le moteur vidéo : remplacée par « ${p.police} » (proche). Les affiches et PDF peuvent garder l'originale si c'est une police Google : mettez son nom exact dans la charte.`);
  notes.forEach(n => rapport.push('ATTENTION ' + n));
  charte.origine = { methode: [opt.projet && 'projet', opt.site && 'site', opt.couleurs && 'couleurs'].filter(Boolean).join(' + '), couleursTrouvees: choix.vives, aValider: true };
  writeFileSync(path.join(sortie, 'charte.json'), JSON.stringify(charte, null, 2) + '\n');

  // Aperçu : la même affiche en thème sombre et clair, avec la palette
  const { construire } = await import('./affiche.mjs');
  const { ouvrirPage } = await import('./html.mjs');
  const essai = { modele: 'liste', format: '4:5', charte: 'charte.json', surtitre: 'Aperçu de la charte', titre: `${charte.nom} : *exemple* de titre`, points: [{ titre: 'Titre de point', texte: 'Texte secondaire de démonstration.' }, { titre: 'Deuxième point', texte: 'Couleurs et polices de la charte.' }], appel: 'Bouton d’action', iconeAppel: 'fleche', contact: [{ icone: 'lien', texte: 'exemple.com' }] };
  const imgs = [];
  for (const theme of ['sombre', 'clair']) {
    const { html, f } = construire({ ...essai, theme }, sortie, '4:5');
    const { page, fermer } = await ouvrirPage(html, { w: f.w, h: f.h });
    imgs.push({ nom: `thème ${theme}`, src: 'data:image/png;base64,' + Buffer.from(await page.screenshot()).toString('base64') });
    await fermer();
  }
  const pastilles = Object.entries(charte.couleurs).map(([k, v]) => `<div style="display:flex;align-items:center;gap:14px;margin:8px 0"><div style="width:64px;height:40px;border-radius:8px;background:${v};border:1px solid #fff3"></div><b>${k}</b>&nbsp;${v}</div>`).join('');
  const { page, fermer } = await ouvrirPage(`<body style="margin:0;background:#2a2d33;color:#eee;font:18px sans-serif;padding:30px">${pastilles}<p style="margin-top:20px">Titres : ${charte.polices.titres}<br>Texte : ${charte.polices.texte}</p></body>`, { w: 540, h: 675 });
  imgs.push({ nom: 'palette', src: 'data:image/png;base64,' + Buffer.from(await page.screenshot()).toString('base64') });
  await fermer();
  await planche(imgs, path.join(sortie, 'apercu.png'), { colonnes: 3, largeur: 380 });

  console.log('\n' + rapport.join('\n'));
  console.log(`\nAccent : ${c.accent}${choix.second ? ` ; secondaire : ${choix.second}` : ''} ; fond : ${c.fond} ; polices : ${charte.polices.titres} / ${charte.polices.texte}${charte.logo ? ` ; logo : ${charte.logo}` : ''}`);
  console.log(`\n✓ ${path.relative(process.cwd(), path.join(sortie, 'charte.json'))} et apercu.png — montrez l'aperçu à l'utilisateur et faites valider (ou corriger) avant de produire.`);
}
