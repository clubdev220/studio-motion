// Affiches et visuels pour les réseaux sociaux : un fichier JSON (modèle + textes + charte) -> PNG (et PDF pour l'impression).
//
//   node moteur/outils/affiche.mjs mon-projet/affiche.json mon-projet/affiche.png
//   node moteur/outils/affiche.mjs mon-projet/affiche.json mon-projet/affiche.png --formats 4:5,1:1,9:16
//   node moteur/outils/affiche.mjs mon-projet/affiche.json mon-projet/affiche.png --pdf        (impression : PDF vectoriel en plus)
//   node moteur/outils/affiche.mjs mon-projet/affiche.json --verifier                          (contrôle seul, rien n'est écrit)
//
// Modèles : annonce, offre, evenement, citation, chiffre, liste, libre (votre propre HTML). Voir guides/affiche.md.
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { lireArgs, quitter } from './commun.mjs';
import { chargerCharte, controlerPolices, echapper, icone, image, ouvrirPage, policesHtml, riche, variablesCss } from './html.mjs';

export const FORMATS = {
  '4:5': { w: 1080, h: 1350, nom: 'publication portrait (Instagram, Facebook, LinkedIn)' },
  '1:1': { w: 1080, h: 1080, nom: 'publication carrée' },
  '9:16': { w: 1080, h: 1920, nom: 'story, statut WhatsApp, couverture de Reel/TikTok' },
  '16:9': { w: 1920, h: 1080, nom: 'bannière, miniature YouTube, écran' },
  'a4': { w: 1240, h: 1754, echelle: 2, mm: [210, 297], nom: 'affiche A4 à imprimer (300 dpi)' },
  'a3': { w: 1240, h: 1754, echelle: 2.83, mm: [297, 420], nom: 'affiche A3 à imprimer (300 dpi)' },
};
export const MODELES = ['annonce', 'offre', 'evenement', 'citation', 'chiffre', 'liste', 'libre'];

const U = (n) => `calc(var(--u) * ${n})`;

// ---------- Morceaux communs ----------
const logoHtml = (a) => a.logo ? `<img class="logo" src="${a.logo}" alt="">` : (a.charte.nom ? `<div class="nom-marque">${echapper(a.charte.nom)}</div>` : '');
const surtitre = (t) => t ? `<div class="surtitre">${riche(t)}</div>` : '';
const bouton = (t, ic) => t ? `<div class="bouton">${icone(ic || '')}<span>${riche(t)}</span></div>` : '';
const infos = (liste) => liste?.length ? `<div class="infos">${liste.map(i => typeof i === 'string' ? `<div class="info">${riche(i)}</div>` : `<div class="info">${icone(i.icone)}<span>${riche(i.texte)}</span></div>`).join('')}</div>` : '';
function pied(a) {
  const contact = [].concat(a.contact || []);
  if (!contact.length && !a.mentions) return '';
  return `<footer class="pied">${contact.length ? `<div class="contact">${contact.map(x => typeof x === 'string' ? `<span>${riche(x)}</span>` : `<span>${icone(x.icone)}${riche(x.texte)}</span>`).join('')}</div>` : ''}${a.mentions ? `<div class="mentions" data-facultatif="1">${riche(a.mentions)}</div>` : ''}</footer>`;
}
const tete = (a, droite = '') => (a.logo || a.charte.nom || droite) && a.afficherLogo !== false ? `<header class="tete">${logoHtml(a)}${droite}</header>` : '';
const deuxCol = (a, texte, media) => a.paysage && media ? `<div class="col-texte">${texte}</div><div class="col-media">${media}</div>` : null;
const illustration = (src, cls = 'photo') => src ? `<div class="${cls}"><img src="${src}" alt=""></div>` : '';

// ---------- Modèles ----------
const M = {
  annonce: (a) => {
    const t = (photo) => `${surtitre(a.surtitre)}
      <h1 class="titre" data-ajuster>${riche(a.titre)}</h1>
      ${a.sousTitre ? `<p class="sous-titre" data-facultatif="3">${riche(a.sousTitre)}</p>` : ''}
      ${photo}
      ${infos(a.infos)}
      ${bouton(a.appel, a.iconeAppel)}`;
    const dc = deuxCol({ ...a, paysage: a.paysage || (a.format === '1:1' && a.img) }, t(''), illustration(a.img));
    return `${tete(a)}<main class="corps annonce${dc ? ' deux' : ''}">${dc || t(illustration(a.img))}</main>${pied(a)}`;
  },

  offre: (a) => {
    const prod = a.img ? `<div class="produit"><img src="${a.img}" alt="">${a.badge ? `<div class="badge">${riche(a.badge)}</div>` : ''}</div>` : (a.badge ? `<div class="badge seul">${riche(a.badge)}</div>` : '');
    const t = `${surtitre(a.surtitre)}
      <h1 class="titre" data-ajuster>${riche(a.titre)}</h1>
      ${a.points?.length ? `<ul class="points">${a.points.map((p, i) => `<li${i >= 1 ? ` data-facultatif="${6 - Math.min(i, 2)}"` : ''}>${icone('coche')}<span>${riche(p)}</span></li>`).join('')}</ul>` : ''}
      <div class="achat">${a.prix ? `<div class="prix"><span class="montant">${riche(a.prix)}</span>${a.ancienPrix ? `<s>${riche(a.ancienPrix)}</s>` : ''}</div>` : ''}
      ${bouton(a.appel, a.iconeAppel)}</div>`;
    const dc = deuxCol({ ...a, paysage: a.paysage || a.format === "1:1" }, t, prod);
    return `${tete(a)}<main class="corps offre${dc ? ' deux' : ''}" style="--taille-titre:${a.tailleTitre || 88}">${dc || prod + t}</main>${pied(a)}`;
  },

  evenement: (a) => {
    const prog = a.programme?.length ? `<ol class="programme" data-facultatif="2">${a.programme.map(p => typeof p === 'string' ? `<li><span>${riche(p)}</span></li>` : `<li><b>${riche(p.heure)}</b><span>${riche(p.texte)}</span></li>`).join('')}</ol>` : '';
    if (a.paysage && (a.img || prog)) return `${tete(a)}<main class="corps evenement deux"><div class="col-texte">${surtitre(a.surtitre)}
      <div class="date-titre">${a.jour ? `<div class="date"><b>${riche(a.jour)}</b><span>${riche(a.mois || '')}</span></div>` : ''}<h1 class="titre" data-ajuster>${riche(a.titre)}</h1></div>
      ${a.sousTitre ? `<p class="sous-titre" data-facultatif="3">${riche(a.sousTitre)}</p>` : ''}${infos(a.infos)}${bouton(a.appel, a.iconeAppel)}</div>
      <div class="col-media">${a.img ? illustration(a.img) : ''}${prog}</div></main>${pied(a)}`;
    return `${tete(a)}
    <main class="corps evenement">
      ${surtitre(a.surtitre)}
      <div class="date-titre">
        ${a.jour ? `<div class="date"><b>${riche(a.jour)}</b><span>${riche(a.mois || '')}</span></div>` : ''}
        <h1 class="titre" data-ajuster>${riche(a.titre)}</h1>
      </div>
      ${a.sousTitre ? `<p class="sous-titre" data-facultatif="3">${riche(a.sousTitre)}</p>` : ''}
      ${illustration(a.img)}
      ${prog}
      ${infos(a.infos)}
      ${bouton(a.appel, a.iconeAppel)}
    </main>${pied(a)}`;
  },

  citation: (a) => `${tete(a)}
    <main class="corps citation">
      <div class="guillemet">«</div>
      <blockquote data-ajuster>${riche(a.citation)}</blockquote>
      <div class="auteur">${a.img ? `<img src="${a.img}" alt="">` : ''}<div><b>${riche(a.auteur || '')}</b>${a.role ? `<span>${riche(a.role)}</span>` : ''}</div></div>
    </main>${pied(a)}`,

  chiffre: (a) => `${tete(a)}
    <main class="corps chiffre">
      ${surtitre(a.surtitre)}
      <div class="grand-chiffre" data-ajuster>${riche(a.chiffre)}</div>
      <p class="legende">${riche(a.legende)}</p>
      ${a.autres?.length ? `<div class="autres" data-facultatif="2">${a.autres.map(x => `<div><b>${riche(x.chiffre)}</b><span>${riche(x.legende)}</span></div>`).join('')}</div>` : ''}
      ${a.source ? `<p class="source">Source : ${riche(a.source)}</p>` : ''}
    </main>${pied(a)}`,

  liste: (a) => `${tete(a)}
    <main class="corps liste">
      ${surtitre(a.surtitre)}
      <h1 class="titre" data-ajuster>${riche(a.titre)}</h1>
      <ol class="items">${(a.points || []).map((p, i) => `<li><div class="num">${a.puces === 'coches' ? icone('coche') : i + 1}</div><div>${typeof p === 'string' ? `<b>${riche(p)}</b>` : `<b>${riche(p.titre)}</b>${p.texte ? `<span>${riche(p.texte)}</span>` : ''}`}</div></li>`).join('')}</ol>
      ${bouton(a.appel, a.iconeAppel)}
    </main>${pied(a)}`,

  libre: (a) => a.contenuLibre,
};

// ---------- Styles ----------
function css(a, f) {
  const paysage = f.w > f.h, story = a.format === '9:16' && a.zonesReseaux !== false;
  const haut = story ? 220 : 80, bas = story ? 320 : 80;
  const fond = a.fond ?? 'charte';
  let fondCss = 'background:var(--fond);';
  if (fond === 'charte' || fond === 'degrade')
    fondCss += `background-image:radial-gradient(ellipse 70% 55% at 88% 8%, color-mix(in srgb, var(--accentFort) ${a.theme === 'clair' ? 22 : 70}%, transparent), transparent 70%),radial-gradient(ellipse 60% 45% at 5% 100%, color-mix(in srgb, var(--accent) ${a.theme === 'clair' ? 14 : 28}%, transparent), transparent 70%);`;
  return `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${f.w}px;height:${f.h}px;overflow:hidden}
body{--u:${Math.min(f.w, f.h) / 1080 * (a.format === '9:16' ? 1.12 : paysage ? 1.12 : 1)}px;${fondCss}color:var(--texte);font-family:var(--police-texte);font-size:${U(34)};line-height:1.35;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.fond-image{position:absolute;inset:0;background-size:cover;background-position:center}
.fond-image::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,${(a.fond?.assombrir ?? 0.6) * 0.75}),rgba(0,0,0,${a.fond?.assombrir ?? 0.6}))}
.cadre-deco{position:absolute;width:${U(900)};height:${U(900)};right:${U(-380)};top:${U(-380)};border:${U(2)} solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:50%}
.cadre-deco.b{width:${U(620)};height:${U(620)};right:${U(-240)};top:${U(-240)}}
.page{position:relative;width:100%;height:100%;padding:${U(haut)} ${U(paysage ? 110 : 80)} ${U(bas)};display:flex;flex-direction:column;gap:${U(36)}}
.tete{display:flex;align-items:center;justify-content:space-between;gap:${U(24)};flex:none}
.logo{height:${U(a.tailleLogo || 84)};max-width:${U(420)};object-fit:contain;object-position:left}
.nom-marque{font-family:var(--police-titres);font-weight:700;font-size:${U(36)};color:var(--titres)}
.corps{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:${a.alignement === 'haut' ? 'flex-start' : 'center'};gap:${U(34)}}
.surtitre{align-self:flex-start;font-weight:700;font-size:${U(26)};letter-spacing:.12em;text-transform:uppercase;color:var(--accent);padding:${U(10)} ${U(22)};border:${U(2)} solid var(--accent);border-radius:${U(100)}}
.titre{font-family:var(--police-titres);font-weight:700;font-size:${U(a.tailleTitre || (paysage ? 104 : 112))}}
.offre .titre{font-size:calc(var(--u) * var(--taille-titre));line-height:1.04;letter-spacing:-.02em;color:var(--titres);text-wrap:balance}
em.a{font-style:normal;color:var(--accent)}
strong{font-weight:700}
.sous-titre{font-size:${U(40)};color:var(--texteSecondaire);max-width:${U(880)};text-wrap:pretty}
.photo{flex:1 1 ${U(200)};min-height:${U(160)};border-radius:${U(32)};overflow:hidden;box-shadow:0 ${U(24)} ${U(60)} rgba(0,0,0,.35)}
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.infos{display:flex;flex-wrap:wrap;gap:${U(16)}}
.info{display:flex;align-items:center;gap:${U(14)};font-size:${U(32)};font-weight:600;padding:${U(14)} ${U(24)};border-radius:${U(18)};background:color-mix(in srgb,var(--surface) 85%,transparent);border:${U(1.5)} solid var(--filet)}
.ic{width:${U(38)};height:${U(38)};flex:none;color:var(--accent)}
.bouton{align-self:flex-start;display:flex;align-items:center;gap:${U(16)};background:var(--accent);color:var(--surBouton);font-weight:700;font-size:${U(38)};padding:${U(26)} ${U(46)};border-radius:${U(100)};box-shadow:0 ${U(14)} ${U(40)} color-mix(in srgb,var(--accent) 40%,transparent)}
.bouton .ic{color:var(--surBouton)}
.pied{flex:none;display:flex;flex-direction:column;gap:${U(12)};padding-top:${U(24)};border-top:${U(1.5)} solid var(--filet)}
.contact{display:flex;flex-wrap:wrap;gap:${U(14)} ${U(40)};font-size:${U(30)};font-weight:600}
.contact span{display:flex;align-items:center;gap:${U(12)}}
.contact .ic{width:${U(32)};height:${U(32)}}
.mentions{font-size:${U(22)};color:var(--texteSecondaire)}
/* offre */
.badge{position:absolute;top:${U(4)};right:${U(4)};z-index:2;background:var(--accent);color:var(--surBouton);font-family:var(--police-titres);font-weight:700;font-size:${U(36)};width:${U(150)};height:${U(150)};border-radius:50%;display:grid;place-items:center;text-align:center;line-height:1;transform:rotate(-10deg);box-shadow:0 ${U(12)} ${U(40)} rgba(0,0,0,.3)}
.badge.seul{position:static;align-self:flex-end;margin-bottom:${U(-60)}}
.produit{flex:1 1 ${U(300)};min-height:${U(250)};display:grid;place-items:center;position:relative}
.produit::before{content:"";position:absolute;height:90%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 45%,transparent),transparent 68%)}
.produit img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 ${U(30)} ${U(40)} rgba(0,0,0,.45))}
.points{list-style:none;display:flex;flex-direction:column;gap:${U(12)};font-size:${U(34)}}
.points li{display:flex;gap:${U(16)};align-items:flex-start}
.points .ic{margin-top:${U(4)}}
.achat{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:${U(24)} ${U(30)}}
.achat .bouton{align-self:auto;font-size:${U(34)};padding:${U(22)} ${U(38)}}
.prix{display:flex;align-items:baseline;gap:${U(22)}}
.montant{font-family:var(--police-titres);font-weight:700;font-size:${U(80)};color:var(--accent);line-height:1}
.montant,.prix s{white-space:nowrap}
.prix s{font-size:${U(44)};color:var(--texteSecondaire)}
/* événement */
.date-titre{display:flex;gap:${U(36)};align-items:center}
.date{flex:none;width:${U(200)};padding:${U(22)} 0;border-radius:${U(28)};background:var(--accent);color:var(--surBouton);display:flex;flex-direction:column;align-items:center;line-height:1}
.date b{font-family:var(--police-titres);font-size:${U(104)}}
.date span{font-weight:700;font-size:${U(32)};text-transform:uppercase;letter-spacing:.08em;margin-top:${U(8)}}
.programme{list-style:none;display:flex;flex-direction:column;gap:${U(12)};font-size:${U(32)}}
.programme li{display:flex;gap:${U(22)}}
.programme b{color:var(--accent);min-width:${U(120)}}
/* citation */
.citation{justify-content:center}
.guillemet{font-family:var(--police-titres);font-size:${U(260)};line-height:.6;color:var(--accent);height:${U(120)}}
blockquote{font-family:var(--police-titres);font-weight:600;font-size:${U(a.tailleTitre || 72)};line-height:1.18;color:var(--titres);text-wrap:pretty}
.auteur{display:flex;align-items:center;gap:${U(24)}}
.auteur img{width:${U(120)};height:${U(120)};border-radius:50%;object-fit:cover;border:${U(4)} solid var(--accent)}
.auteur b{display:block;font-size:${U(36)}}
.auteur span{font-size:${U(30)};color:var(--texteSecondaire)}
/* chiffre */
.chiffre{justify-content:center}
.grand-chiffre{font-family:var(--police-titres);font-weight:700;font-size:${U(a.tailleTitre || 300)};line-height:.95;letter-spacing:-.04em;color:var(--accent)}
.legende{font-size:${U(48)};font-weight:600;color:var(--titres);max-width:${U(900)};text-wrap:balance}
.autres{display:flex;gap:${U(50)};padding-top:${U(20)};border-top:${U(1.5)} solid var(--filet)}
.autres b{display:block;font-family:var(--police-titres);font-size:${U(72)};color:var(--titres)}
.autres span{font-size:${U(28)};color:var(--texteSecondaire)}
.source{font-size:${U(24)};color:var(--texteSecondaire)}
/* liste */
.items{list-style:none;display:flex;flex-direction:column;gap:${U(26)}}
.items li{display:flex;gap:${U(26)};align-items:center}
.num{flex:none;width:${U(84)};height:${U(84)};border-radius:${U(24)};background:color-mix(in srgb,var(--accent) 18%,transparent);border:${U(2)} solid var(--accent);color:var(--accent);font-family:var(--police-titres);font-weight:700;font-size:${U(42)};display:grid;place-items:center}
.num .ic{width:${U(46)};height:${U(46)}}
.items b{display:block;font-size:${U(40)};line-height:1.2;color:var(--titres)}
.items span{display:block;font-size:${U(30)};color:var(--texteSecondaire);margin-top:${U(4)}}
.corps.deux{display:grid;grid-template-columns:1.05fr .95fr;column-gap:${U(80)};align-items:stretch}
.col-texte{display:flex;flex-direction:column;justify-content:center;gap:${U(30)};min-height:0}
.col-media{display:flex;flex-direction:column;justify-content:center;gap:${U(30)};min-height:0}
.col-media>.photo,.col-media>.produit{flex:1 1 auto;min-height:0}
.deux .titre{font-size:${U(a.tailleTitre || 92)}}
.deux.offre .titre{font-size:calc(var(--u) * var(--taille-titre) * .86)}
.deux .sous-titre{font-size:${U(34)}}
.deux .points{font-size:${U(30)}}
.deux .info{font-size:${U(27)};padding:${U(10)} ${U(18)}}
.deux .bouton{font-size:${U(31)};padding:${U(20)} ${U(36)}}
.deux .montant{font-size:${U(66)}}
.deux .date{width:${U(160)}}
.deux .date b{font-size:${U(80)}}
.deux .programme{font-size:${U(30)}}
`;
}

// ---------- Construction et contrôle ----------
export function construire(a, base, format) {
  const f = FORMATS[format];
  if (!f) quitter(`ERREUR format inconnu : ${format}. Formats : ${Object.keys(FORMATS).join(', ')}`);
  const erreurs = [];
  if (!MODELES.includes(a.modele)) erreurs.push(`ERREUR modèle inconnu : « ${a.modele} ». Modèles : ${MODELES.join(', ')}`);
  const charte = chargerCharte(a.charte, base);
  const theme = a.theme || 'sombre';
  const logoFichier = theme === 'clair' ? (charte.logoClair || charte.logo) : charte.logo;
  const d = { ...a, format, theme, charte, paysage: f.w > f.h, logo: a.afficherLogo === false ? null : image(logoFichier, base, erreurs), img: image(a.image, base, erreurs) };
  if (a.modele === 'libre') {
    if (!a.fichier) erreurs.push('ERREUR modèle « libre » : indiquez « fichier » (fragment HTML)');
    else {
      const fl = path.resolve(base, a.fichier);
      if (!existsSync(fl)) erreurs.push(`ERREUR fichier introuvable : ${a.fichier}`);
      else d.contenuLibre = readFileSync(fl, 'utf8').replace(/src="(?!https?:|data:)([^"]+)"/g, (m, p) => `src="${image(p, path.dirname(fl), erreurs) || p}"`);
    }
  }
  const requis = { annonce: ['titre'], offre: ['titre'], evenement: ['titre'], citation: ['citation', 'auteur'], chiffre: ['chiffre', 'legende'], liste: ['titre', 'points'] }[a.modele] || [];
  for (const k of requis) if (!a[k] || (Array.isArray(a[k]) && !a[k].length)) erreurs.push(`ERREUR modèle « ${a.modele} » : « ${k} » manquant`);
  const pol = policesHtml(charte);
  const fondImg = a.fond?.image ? image(a.fond.image, base, erreurs) : null;
  const html = `<!doctype html><html lang="${a.langue || 'fr'}"><head><meta charset="utf-8">${pol.lien}
<style>${pol.css}${variablesCss(charte, theme)}${css(d, f)}${a.css || ''}</style></head>
<body>${fondImg ? `<div class="fond-image" style="background-image:url('${fondImg}')"></div>` : ''}${(a.fond ?? 'charte') === 'charte' && a.decor !== false ? '<div class="cadre-deco"></div><div class="cadre-deco b"></div>' : ''}
<div class="page modele-${a.modele}">${erreurs.length ? '' : M[a.modele](d)}</div></body></html>`;
  return { html, f, erreurs, polices: pol.noms };
}

// Réduit les éléments « data-ajuster » tant que la page déborde ; puis liste les problèmes visibles
async function ajusterEtControler(page, a, f) {
  return page.evaluate(({ story, w, h }) => {
    const pb = [];
    const corps = document.querySelector('.corps') || document.querySelector('.page');
    // Débordement réel : un enfant (dans le flux) dépasse de son conteneur, ou un texte à ajuster dépasse en largeur
    const sort = (parent) => { const r = parent.getBoundingClientRect(); return [...parent.children].some(e => { if (getComputedStyle(e).position === 'absolute') return false; const b = e.getBoundingClientRect(); return b.bottom > r.bottom + 2 || b.top < r.top - 2 || b.right > r.right + 2; }); };
    const deborde = () => [...document.querySelectorAll('.page, .corps, .col-texte, .col-media')].some(sort)
      || [...document.querySelectorAll('[data-ajuster]')].some(e => e.scrollWidth > e.clientWidth + 2);
    const els = [...document.querySelectorAll('[data-ajuster]')].map(el => ({ el, t0: parseFloat(getComputedStyle(el).fontSize) }));
    const reduire = (min) => { for (const x of els) { let t = parseFloat(x.el.style.fontSize) || x.t0; while (deborde() && t > x.t0 * min) { t *= 0.96; x.el.style.fontSize = t + 'px'; } } };
    reduire(0.85);
    const fac = [...document.querySelectorAll('[data-facultatif]')].sort((p, q) => p.dataset.facultatif - q.dataset.facultatif);
    for (const el of fac) { if (!deborde()) break; for (const x of els) x.el.style.fontSize = ''; el.remove(); pb.push(`INFO élément retiré faute de place : « ${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)} »`); reduire(0.85); }
    reduire(0.62);
    for (const x of els) { const t = parseFloat(x.el.style.fontSize); if (t && t < x.t0 * 0.999) pb.push(`INFO texte « ${x.el.textContent.trim().slice(0, 40)}… » réduit à ${Math.round(t / x.t0 * 100)} % pour tenir`); }
    if (deborde()) pb.push('ERREUR le contenu déborde de l\'affiche : raccourcissez les textes, retirez un élément ou choisissez un format plus haut');
    // Texte trop petit pour être lu sur un téléphone (équivalent < 22 px en 1080)
    const u = Math.min(w, h) / 1080;
    for (const el of document.querySelectorAll('.page *')) {
      if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (parseFloat(getComputedStyle(el).fontSize) < 22 * u && !el.closest('.mentions,.source')) pb.push(`ATTENTION texte petit (${Math.round(parseFloat(getComputedStyle(el).fontSize) / u)} px en 1080) : « ${el.textContent.trim().slice(0, 40)} »`);
      if (r.left < 0 || r.top < 0 || r.right > w + 1 || r.bottom > h + 1) pb.push(`ERREUR texte hors de l'image : « ${el.textContent.trim().slice(0, 40)} »`);
      else if (story && (r.top < 200 * u || r.bottom > h - 300 * u) && !el.closest('.tete')) pb.push(`ATTENTION texte sous l'interface des réseaux (haut 220 px / bas 320 px) : « ${el.textContent.trim().slice(0, 40)} »`);
    }
    // Contraste texte / fond (sur les couleurs de la charte)
    const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const cs = getComputedStyle(document.body), probe = document.createElement('div');
    document.body.append(probe);
    const col = (v) => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
    const paires = [['--texte', '--fond', 'texte / fond'], ['--titres', '--fond', 'titres / fond'], ['--surBouton', '--accent', 'texte du bouton / accent']];
    for (const [x, y, nom] of paires) { const r = ratio(col(x), col(y)); if (r < 4.5) pb.push(`ATTENTION contraste faible ${nom} : ${r.toFixed(1)} (4,5 minimum conseillé)`); }
    { const r = ratio(col('--accent'), col('--fond')); if (r < 3) pb.push(`ATTENTION l'accent se lit mal sur le fond (contraste ${r.toFixed(1)}, 3 minimum pour les grands titres) : réservez-le aux grands mots ou foncez-le dans la charte (« accent »)`); }
    probe.remove();
    return [...new Set(pb)];
  }, { story: a.format === '9:16' && a.zonesReseaux !== false, w: f.w, h: f.h });
}

export async function rendreAffiche(a, base, format, sortie, { pdf = false } = {}) {
  const { html, f, erreurs, polices } = construire(a, base, format);
  if (erreurs.length) return erreurs;
  const { page, fermer } = await ouvrirPage(html, { w: f.w, h: f.h, echelle: f.echelle || 1 });
  try {
    const pb = [...await controlerPolices(page, polices), ...await ajusterEtControler(page, { ...a, format }, f)];
    if (sortie && !pb.some(p => p.startsWith('ERREUR'))) {
      mkdirSync(path.dirname(sortie), { recursive: true });
      await page.screenshot({ path: sortie, type: sortie.endsWith('.jpg') ? 'jpeg' : 'png', quality: sortie.endsWith('.jpg') ? 92 : undefined });
      if (pdf) {
        const [wm, hm] = f.mm || [f.w / 96 * 25.4, f.h / 96 * 25.4];
        await page.pdf({ path: sortie.replace(/\.(png|jpe?g)$/i, '.pdf'), width: `${wm}mm`, height: `${hm}mm`, printBackground: true, pageRanges: '1', scale: wm / 25.4 * 96 / f.w });
      }
    }
    if (process.env.STUDIO_MOTION_HTML) writeFileSync(sortie.replace(/\.\w+$/, '.html'), html);
    return pb;
  } finally { await fermer(); }
}

// ---------- Ligne de commande ----------
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const { pos, opt } = lireArgs();
  if (!pos[0]) quitter('Usage : node moteur/outils/affiche.mjs affiche.json sortie.png [--formats 4:5,1:1,9:16] [--pdf] [--verifier]');
  const fichier = path.resolve(pos[0]), base = path.dirname(fichier);
  const a = JSON.parse(readFileSync(fichier, 'utf8'));
  const formats = String(opt.formats || a.format || '4:5').split(',').map(s => s.trim());
  let echec = false;
  for (const fmt of formats) {
    let sortie = null;
    if (!opt.verifier) {
      if (!pos[1]) quitter('Indiquez le fichier de sortie (.png ou .jpg), ou --verifier.');
      sortie = path.resolve(pos[1]);
      if (formats.length > 1) sortie = sortie.replace(/(\.\w+)$/, `-${fmt.replace(':', 'x')}$1`);
    }
    const pb = await rendreAffiche(a, base, fmt, sortie, { pdf: !!opt.pdf });
    const err = pb.filter(p => p.startsWith('ERREUR'));
    console.log(`\n[${fmt}] ${FORMATS[fmt]?.nom || ''}`);
    pb.forEach(p => console.log('  ' + p));
    if (err.length) { echec = true; console.log('  → rien n\'a été écrit pour ce format.'); }
    else console.log(`  ✓ ${sortie ? path.relative(process.cwd(), sortie) : 'contrôle réussi'}${opt.pdf && sortie ? ' (+ PDF)' : ''}`);
  }
  process.exit(echec ? 1 : 0);
}
