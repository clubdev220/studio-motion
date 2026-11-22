// Socle commun des affiches et des documents PDF : charte -> CSS, polices, texte riche, rendu par Chrome sans interface.
// Les vidéos utilisent Remotion ; les affiches et les PDF sont du HTML/CSS imprimé par le même navigateur.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { dataUrl, ouvrirNavigateur, quitter } from './commun.mjs';

export const CHARTE_DEFAUT = {
  nom: 'Démo',
  couleurs: { fond: '#12151c', surface: '#1d2230', surfaceSombre: '#161a24', accent: '#5b8cff', accentClair: '#dde7ff', accentProfond: '#2c4fb3', texte: '#eef1f6', texteSecondaire: '#b3bccc' },
  polices: { titres: 'Sora', texte: 'Inter' },
};

// Graisses chargées pour chaque police Google (les mêmes que le moteur vidéo)
const GRAISSES = { 'Cormorant Garamond': '500;600;700', Fraunces: '500;600;700', Lora: '500;600;700', 'Playfair Display': '500;600;700', Sora: '400;600;700', 'JetBrains Mono': '400;600' };

const estImage = (f) => /\.(png|jpe?g|webp|svg)$/i.test(f);

// Charge la charte (fichier JSON ou objet) ; les chemins (logo, polices locales) deviennent absolus
export function chargerCharte(source, base) {
  let ch = source ?? CHARTE_DEFAUT, dossier = base;
  if (typeof source === 'string') {
    const f = path.resolve(base, source);
    if (!existsSync(f)) quitter(`ERREUR charte introuvable : ${f}`);
    ch = JSON.parse(readFileSync(f, 'utf8'));
    dossier = path.dirname(f);
  }
  const c = { ...CHARTE_DEFAUT.couleurs, ...(ch.couleurs || {}) };
  const polices = { ...CHARTE_DEFAUT.polices, ...(ch.polices || {}) };
  const logo = ch.logo ? path.resolve(dossier, ch.logo) : null;
  const logoClair = ch.logoClair ? path.resolve(dossier, ch.logoClair) : null;
  const fichiers = Object.fromEntries(Object.entries(polices.fichiers || {}).map(([nom, f]) => [nom, [].concat(f).map(x => path.resolve(dossier, x))]));
  return { ...ch, c, polices: { ...polices, fichiers }, logo, logoClair };
}

// Polices : fichiers locaux de la charte (« polices.fichiers ») sinon Google Fonts (accès internet nécessaire)
export function policesHtml(ch) {
  const noms = [...new Set([ch.polices.titres, ch.polices.texte, ch.polices.code].filter(Boolean))];
  const locales = ch.polices.fichiers || {};
  let css = '';
  const web = [];
  for (const nom of noms) {
    if (locales[nom]) {
      for (const f of locales[nom]) {
        const m = path.basename(f).match(/(thin|extralight|light|regular|medium|semibold|bold|extrabold|black|[1-9]00)/i);
        const poids = { thin: 100, extralight: 200, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 }[m?.[1].toLowerCase()] ?? (Number(m?.[1]) || 400);
        const ext = path.extname(f).slice(1).toLowerCase();
        const fmt = { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' }[ext];
        css += `@font-face{font-family:"${nom}";font-weight:${poids};font-display:block;src:url(data:font/${ext};base64,${readFileSync(f).toString('base64')}) format("${fmt}")}\n`;
      }
    } else web.push(`family=${encodeURIComponent(nom).replace(/%20/g, '+')}:wght@${GRAISSES[nom] || '400;500;600;700;800'}`);
  }
  const lien = web.length ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${web.join('&')}&display=block">` : '';
  return { lien, css, noms };
}

// Thème : « sombre » (fond de la charte, comme les vidéos) ou « clair » (papier, pour l'impression et les documents)
export function variablesCss(ch, theme = 'sombre') {
  const c = ch.c;
  const v = theme === 'clair'
    ? { fond: c.papier || '#ffffff', surface: c.surfaceClaire || '#f4f2ee', texte: c.encre || c.fond, texteSecondaire: c.encreSecondaire || '#55595f', titres: c.encre || c.fond, accent: c.accent, accentFort: c.accentProfond, accentDoux: c.accentClair, filet: '#e3e0da', surBouton: c.fond }
    : { fond: c.fond, surface: c.surface, texte: c.texte, texteSecondaire: c.texteSecondaire, titres: c.accentClair, accent: c.accent, accentFort: c.accentProfond, accentDoux: c.accentClair, filet: 'rgba(255,255,255,.12)', surBouton: c.fond };
  return `:root{${Object.entries(v).map(([k, x]) => `--${k}:${x}`).join(';')};--police-titres:"${ch.polices.titres}",sans-serif;--police-texte:"${ch.polices.texte}",sans-serif;--police-code:"${ch.polices.code || 'JetBrains Mono'}",monospace}`;
}

// Texte : échappement, typographie française (espaces fines insécables), *mots* en couleur d'accent, **gras**
export const echapper = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const typo = (t) => t.replace(/ ([:;?!»%])/g, '\u202f$1').replace(/« /g, '«\u202f').replace(/(\d)[ \u202f](?=\d{3}\b)/g, '$1\u00a0');
export function riche(t) {
  if (t == null) return '';
  return typo(echapper(t))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="a">$1</em>')
    .replace(/\n/g, '<br>');
}

// Image du projet -> data URL (le rendu ne dépend d'aucun serveur) ; renvoie null si absente
export function image(chemin, base, erreurs) {
  if (!chemin) return null;
  if (/^(https?:|data:)/.test(chemin)) return chemin;
  const f = path.resolve(base, chemin);
  if (!existsSync(f)) { erreurs?.push(`ERREUR image introuvable : ${chemin}`); return null; }
  if (!estImage(f)) { erreurs?.push(`ERREUR format d'image non pris en charge : ${chemin} (PNG, JPEG, WebP ou SVG)`); return null; }
  return dataUrl(f);
}

// Icônes simples (traits) pour les puces et pastilles
export const ICONES = {
  coche: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  etoile: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
  calendrier: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  lieu: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0113 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  horloge: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  telephone: '<path d="M6.5 3.5h3l1.5 4.5-2 1.3a11 11 0 005.7 5.7l1.3-2 4.5 1.5v3a2 2 0 01-2.2 2A16.5 16.5 0 014.5 5.7a2 2 0 012-2.2z"/>',
  message: '<path d="M4 5.5h16v10.5H9l-5 4z"/>',
  courriel: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  lien: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
  alerte: '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4.5M12 17v.3"/>',
  eclair: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  utilisateur: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>',
  panier: '<path d="M3.5 4.5h2.5l2.2 10.5h10l2-7.5H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
  cadeau: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1.5-4-6-4-5-1.2.6 1.4 5 1.2 5 1.2zm0 0c1.5-4 6-4 5-1.2-.6 1.4-5 1.2-5 1.2z"/>',
  cle: '<circle cx="8" cy="12" r="3.8"/><path d="M11.8 12H21M17.5 12v3.5M20.5 12v2.5"/>',
  coeur: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.4 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/>',
};
export const icone = (nom, cls = 'ic') => ICONES[nom] ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[nom]}</svg>` : '';

// Ouvre une page HTML de taille fixe, attend polices et images, et renvoie la page (à fermer avec fermer())
export async function ouvrirPage(html, { w, h, echelle = 1 }) {
  const nav = await ouvrirNavigateur();
  const page = await nav.newPage();
  await page.setViewport({ width: Math.round(w), height: Math.round(h), deviceScaleFactor: echelle });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
  return { nav, page, fermer: () => nav.close() };
}

// Polices réellement chargées ? (sinon le navigateur a pris une police de secours : on le signale)
export async function controlerPolices(page, noms) {
  const manquantes = await page.evaluate(async (n) => {
    const res = [];
    for (const x of n) { try { await document.fonts.load(`700 40px "${x}"`); } catch {} if (![...document.fonts].some(f => f.family.replace(/"/g, '') === x && f.status === 'loaded')) res.push(x); }
    return res;
  }, noms);
  return manquantes.map(x => `ATTENTION police « ${x} » non chargée (pas d'internet ?) : police de secours utilisée. Ajoutez ses fichiers dans « polices.fichiers » de la charte.`);
}

// Planche : plusieurs images (data URL) côte à côte, avec leur nom
export async function planche(images, sortie, { colonnes = 4, largeur = 360 } = {}) {
  const html = `<!doctype html><html><body style="margin:0;background:#2a2d33;font:14px sans-serif;color:#eee">
  <div style="display:grid;grid-template-columns:repeat(${colonnes},${largeur}px);gap:18px;padding:18px">
  ${images.map(({ nom, src }) => `<figure style="margin:0"><img src="${src}" style="width:${largeur}px;display:block;box-shadow:0 2px 10px #0008"><figcaption style="padding-top:6px">${echapper(nom)}</figcaption></figure>`).join('')}
  </div></body></html>`;
  const { page, fermer } = await ouvrirPage(html, { w: colonnes * (largeur + 18) + 18, h: 400 });
  await page.screenshot({ path: sortie, fullPage: true });
  await fermer();
}
