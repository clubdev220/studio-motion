// Documents PDF mis en page (plaquette, guide, rapport, fiche, proposition) : un fichier JSON de blocs + la charte -> PDF.
//
//   node moteur/outils/document.mjs mon-projet/document.json mon-projet/document.pdf
//   node moteur/outils/document.mjs mon-projet/document.json mon-projet/document.pdf --apercu /tmp/pages   (PNG de chaque page + planche.png)
//   node moteur/outils/document.mjs mon-projet/document.json --verifier
//
// La mise en page est automatique : les blocs remplissent les pages dans l'ordre ; un bloc qui ne tient plus passe à la
// page suivante (les listes, tableaux et textes longs sont coupés proprement) ; un intertitre n'est jamais laissé seul
// en bas de page. Voir guides/document.md.
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { lireArgs, quitter } from './commun.mjs';
import { chargerCharte, controlerPolices, echapper, icone, image, ouvrirPage, planche, policesHtml, riche, variablesCss } from './html.mjs';

const PAPIERS = { A4: [210, 297], A5: [148, 210], lettre: [215.9, 279.4] };
export const BLOCS = ['couverture', 'sommaire', 'section', 'titre', 'texte', 'liste', 'chiffres', 'cartes', 'image', 'citation', 'encadre', 'tableau', 'etapes', 'contact', 'saut', 'html'];

// ---------- Blocs -> HTML ----------
// Chaque bloc devient un ou plusieurs éléments « .b » (unités de mise en page). data-suite : ne pas séparer du suivant.
function blocHtml(b, ctx) {
  const { base, erreurs } = ctx;
  const img = (p) => image(p, base, erreurs);
  switch (b.type) {
    case 'couverture': {
      const src = img(b.image);
      return `<div class="b couverture${b.fond === 'clair' ? ' clair' : ''}" data-pleine>
        ${src ? `<div class="couv-image" style="background-image:url('${src}')"></div>` : '<div class="couv-deco"></div>'}
        <div class="couv-haut">${ctx.logoCouv ? `<img class="couv-logo" src="${ctx.logoCouv}" alt="">` : `<b class="couv-marque">${echapper(ctx.charte.nom || '')}</b>`}</div>
        <div class="couv-milieu">${b.surtitre ? `<div class="surtitre">${riche(b.surtitre)}</div>` : ''}<h1>${riche(b.titre)}</h1>${b.sousTitre ? `<p>${riche(b.sousTitre)}</p>` : ''}</div>
        <div class="couv-bas">${[b.auteur, b.date].filter(Boolean).map(x => `<span>${riche(x)}</span>`).join('')}</div></div>`;
    }
    case 'sommaire':
      return `<div class="b sommaire"><h2>${riche(b.titre || 'Sommaire')}</h2><ol class="som-liste"></ol></div>`;
    case 'section': {
      ctx.section = (ctx.section || 0) + 1;
      const n = b.numero ?? String(ctx.section).padStart(2, '0');
      return `<div class="b section${b.nouvellePage === false ? '' : ' nouvelle-page'}" data-suite data-section="${echapper(typo2(b.titre))}">
        <div class="sec-num">${riche(String(n))}</div><h2>${riche(b.titre)}</h2>${b.intro ? `<p class="chapeau">${riche(b.intro)}</p>` : ''}</div>`;
    }
    case 'titre':
      return `<h${b.niveau === 4 ? 4 : 3} class="b intertitre" data-suite>${riche(b.texte)}</h${b.niveau === 4 ? 4 : 3}>`;
    case 'texte':
      return String(b.texte || '').split(/\n\s*\n/).filter(p => p.trim()).map(p => `<p class="b para${b.taille === 'grand' ? ' grand' : ''}">${riche(p.trim())}</p>`).join('');
    case 'liste': {
      const tag = b.puces === 'numeros' ? 'ol' : 'ul';
      const puce = (i) => b.puces === 'numeros' ? `<span class="puce-num">${i + 1}</span>` : b.puces === 'points' ? '<span class="puce-point"></span>' : icone(b.icone || 'coche', 'ic puce');
      return `<${tag} class="b liste" data-coupable>${(b.points || []).map((p, i) => `<li>${puce(i)}<div>${typeof p === 'string' ? riche(p) : `<b>${riche(p.titre)}</b>${p.texte ? ` ${riche(p.texte)}` : ''}`}</div></li>`).join('')}</${tag}>`;
    }
    case 'chiffres':
      return `<div class="b chiffres" style="--n:${Math.min((b.items || []).length, 4)}">${(b.items || []).map(x => `<div><b>${riche(x.valeur)}</b><span>${riche(x.legende)}</span></div>`).join('')}</div>${b.source ? `<p class="b source">Source : ${riche(b.source)}</p>` : ''}`;
    case 'cartes':
      return `<div class="b cartes" style="--n:${b.colonnes || Math.min((b.items || []).length, 3)}">${(b.items || []).map(x => `<div class="carte">${x.icone ? `<div class="pastille">${icone(x.icone)}</div>` : ''}<b>${riche(x.titre)}</b>${x.texte ? `<p>${riche(x.texte)}</p>` : ''}</div>`).join('')}</div>`;
    case 'image': {
      const src = img(b.image);
      return src ? `<figure class="b figure ${b.largeur || 'pleine'}"><img src="${src}" alt="" style="${b.hauteur ? `height:${b.hauteur}mm;object-fit:${b.cadrage || 'cover'}` : ''}">${b.legende ? `<figcaption>${riche(b.legende)}</figcaption>` : ''}</figure>` : '';
    }
    case 'citation':
      return `<blockquote class="b citation"><p>${riche(b.texte)}</p>${b.auteur ? `<cite>${riche(b.auteur)}${b.role ? `, <span>${riche(b.role)}</span>` : ''}</cite>` : ''}</blockquote>`;
    case 'encadre': {
      const ton = b.ton || 'info';
      return `<aside class="b encadre ${ton}">${icone(b.icone || { info: 'info', alerte: 'alerte', cle: 'cle', conseil: 'etoile' }[ton] || 'info')}<div>${b.titre ? `<b>${riche(b.titre)}</b>` : ''}<p>${riche(b.texte)}</p></div></aside>`;
    }
    case 'tableau':
      return `<table class="b tableau" data-coupable><thead><tr>${(b.colonnes || []).map((c, i) => `<th${b.alignDroite?.includes(i) ? ' class="d"' : ''}>${riche(c)}</th>`).join('')}</tr></thead>
        <tbody>${(b.lignes || []).map(l => `<tr>${l.map((c, i) => `<td${b.alignDroite?.includes(i) ? ' class="d"' : ''}>${riche(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        ${b.total ? `<tfoot><tr>${b.total.map((c, i) => `<td${b.alignDroite?.includes(i) ? ' class="d"' : ''}>${riche(c)}</td>`).join('')}</tr></tfoot>` : ''}</table>${b.legende ? `<p class="b source">${riche(b.legende)}</p>` : ''}`;
    case 'etapes':
      return `<ol class="b etapes" data-coupable>${(b.items || []).map((x, i) => `<li><span class="et-num">${i + 1}</span><div><b>${riche(x.titre)}</b>${x.texte ? `<p>${riche(x.texte)}</p>` : ''}</div></li>`).join('')}</ol>`;
    case 'contact':
      return `<div class="b contact-bloc nouvelle-page-si-${b.nouvellePage ? 'oui' : 'non'}"><h2>${riche(b.titre || 'Nous contacter')}</h2>${b.texte ? `<p>${riche(b.texte)}</p>` : ''}
        <div class="contact-items">${(b.items || []).map(x => `<div>${icone(x.icone || 'info')}<span>${riche(x.texte)}</span></div>`).join('')}</div></div>`;
    case 'saut':
      return '<div class="b saut"></div>';
    case 'html': {
      const f = path.resolve(base, b.fichier || '');
      if (!b.fichier || !existsSync(f)) { erreurs.push(`ERREUR bloc html : fichier introuvable (${b.fichier})`); return ''; }
      return `<div class="b libre">${readFileSync(f, 'utf8').replace(/src="(?!https?:|data:)([^"]+)"/g, (m, p) => `src="${image(p, path.dirname(f), erreurs) || p}"`)}</div>`;
    }
    default:
      erreurs.push(`ERREUR bloc inconnu : « ${b.type} ». Blocs : ${BLOCS.join(', ')}`);
      return '';
  }
}
const typo2 = (t) => String(t || '').replace(/\*+/g, '');

// ---------- Styles ----------
function css(d, [W, H]) {
  const m = d.marges || [18, 18, 20, 18]; // haut, droite, bas, gauche (mm)
  return `
@page{size:${W}mm ${H}mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#9aa0a6}
body{font-family:var(--police-texte);color:var(--texte);font-size:${d.taille || 10.5}pt;line-height:1.5;-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact}
#source{position:absolute;left:-10000mm;top:0;width:${W - m[1] - m[3]}mm}
.feuille{width:${W}mm;height:${H}mm;background:var(--fond);position:relative;overflow:hidden;break-after:page;margin:0 auto 6mm;display:flex;flex-direction:column}
@media print{html,body{background:none}.feuille{margin:0}}
.entete{flex:none;height:${m[0]}mm;margin:0 ${m[1]}mm 0 ${m[3]}mm;display:flex;align-items:center;justify-content:space-between;font-size:8pt;color:var(--texteSecondaire);border-bottom:.3mm solid var(--filet)}
.entete img{height:${Math.min(m[0] * 0.42, 8)}mm}
.contenu{flex:1;min-height:0;padding:6mm ${m[1]}mm 4mm ${m[3]}mm;display:flex;flex-direction:column;gap:3.6mm}
.pied{flex:none;height:${m[2] * 0.7}mm;margin:0 ${m[1]}mm ${m[2] * 0.3}mm ${m[3]}mm;display:flex;align-items:center;justify-content:space-between;font-size:8pt;color:var(--texteSecondaire);border-top:.3mm solid var(--filet)}
.pied .num{font-weight:700;color:var(--titres)}
em.a{font-style:normal;color:var(--accentFort);font-weight:600}
strong{font-weight:700;color:var(--titres)}
h1,h2,h3,h4{font-family:var(--police-titres);color:var(--titres);line-height:1.15;text-wrap:balance}
.surtitre{display:inline-block;font-size:9pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
/* couverture */
.feuille.pleine{background:var(--fond-couv)}
.feuille.pleine .contenu{padding:0}
.couverture{position:relative;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:22mm ${m[3] + 4}mm;color:var(--texte-couv);background:var(--fond-couv)}
.couverture.clair{--fond-couv:var(--fond);--texte-couv:var(--texte);--titres-couv:var(--titres)}
.couv-image{position:absolute;inset:0;background-size:cover;background-position:center}
.couv-image::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.25) 40%,rgba(0,0,0,.8))}
.couv-deco{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 90% 5%,color-mix(in srgb,var(--accent-couv) 55%,transparent),transparent 70%),radial-gradient(ellipse 60% 50% at 0% 100%,color-mix(in srgb,var(--accent) 25%,transparent),transparent 70%)}
.couverture>div:not(.couv-image):not(.couv-deco){position:relative}
.couv-logo{height:16mm;max-width:70mm;object-fit:contain;object-position:left}
.couv-marque{font-family:var(--police-titres);font-size:16pt;color:var(--titres-couv)}
.couv-milieu{display:flex;flex-direction:column;gap:6mm}
.couv-milieu h1{font-size:${d.tailleTitreCouverture || 38}pt;color:var(--titres-couv);letter-spacing:-.01em}
.couv-milieu h1 em.a{color:var(--accent)}
.couv-milieu p{font-size:14pt;max-width:140mm;opacity:.9}
.couv-bas{display:flex;gap:10mm;font-size:10pt;opacity:.85;border-top:.3mm solid color-mix(in srgb,var(--texte-couv) 30%,transparent);padding-top:5mm}
/* sommaire */
.sommaire h2{font-size:24pt;margin-bottom:6mm}
.som-liste{list-style:none;display:flex;flex-direction:column}
.som-liste li{display:flex;align-items:baseline;gap:4mm;padding:3.2mm 0;border-bottom:.3mm solid var(--filet);font-size:12pt}
.som-liste .n{font-family:var(--police-titres);font-weight:700;color:var(--accent);min-width:10mm}
.som-liste .t{flex:1}
.som-liste .p{font-weight:700;color:var(--titres)}
/* section */
.section{padding:2mm 0 3mm;display:flex;flex-direction:column;gap:3mm}
.sec-num{font-family:var(--police-titres);font-weight:700;font-size:30pt;line-height:1;color:var(--accent)}
.section h2{font-size:${d.tailleSection || 24}pt}
.chapeau{font-size:12.5pt;color:var(--texteSecondaire);max-width:150mm}
.intertitre{font-size:14pt;margin-top:2.5mm}
h4.intertitre{font-size:11.5pt}
.para{text-align:${d.justifier ? 'justify' : 'left'};hyphens:auto;text-wrap:pretty}
.para.grand{font-size:12.5pt}
/* listes */
.liste{list-style:none;display:flex;flex-direction:column;gap:2mm}
.liste li{display:flex;gap:3mm;align-items:flex-start}
.ic{width:4.6mm;height:4.6mm;flex:none;color:var(--accent)}
.puce{margin-top:.6mm}
.puce-num{flex:none;width:6mm;height:6mm;border-radius:50%;background:var(--accent);color:var(--surBouton);font-weight:700;font-size:8.5pt;display:grid;place-items:center}
.puce-point{flex:none;width:2mm;height:2mm;border-radius:50%;background:var(--accent);margin-top:2.2mm}
/* chiffres */
.chiffres{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:4mm}
.chiffres div{background:var(--surface);border-radius:3mm;padding:5mm 5mm 4mm;border-top:1mm solid var(--accent)}
.chiffres b{display:block;font-family:var(--police-titres);font-size:24pt;line-height:1.1;color:var(--titres)}
.chiffres span{font-size:9pt;color:var(--texteSecondaire)}
.source{font-size:8pt;color:var(--texteSecondaire)}
/* cartes */
.cartes{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:4mm}
.carte{background:var(--surface);border-radius:3mm;padding:5mm;display:flex;flex-direction:column;gap:2mm;break-inside:avoid}
.carte b{font-family:var(--police-titres);font-size:12pt;color:var(--titres);line-height:1.25}
.carte p{font-size:9.5pt;color:var(--texteSecondaire);line-height:1.45}
.pastille{width:10mm;height:10mm;border-radius:2.5mm;background:color-mix(in srgb,var(--accent) 16%,transparent);display:grid;place-items:center}
.pastille .ic{width:5.5mm;height:5.5mm}
/* image */
.figure img{width:100%;border-radius:2.5mm;display:block}
.figure.moitie{width:60%}
.figure figcaption{font-size:8.5pt;color:var(--texteSecondaire);margin-top:1.5mm}
/* citation, encadré */
.citation{border-left:1.2mm solid var(--accent);padding:2mm 0 2mm 6mm}
.citation p{font-family:var(--police-titres);font-size:14pt;line-height:1.35;color:var(--titres)}
.citation cite{display:block;font-style:normal;font-weight:700;font-size:9.5pt;margin-top:2mm}
.citation cite span{font-weight:400;color:var(--texteSecondaire)}
.encadre{display:flex;gap:4mm;padding:4.5mm 5mm;border-radius:3mm;background:color-mix(in srgb,var(--accent) 10%,var(--fond));border:.35mm solid color-mix(in srgb,var(--accent) 45%,transparent)}
.encadre.alerte{background:color-mix(in srgb,#d9822b 12%,var(--fond));border-color:color-mix(in srgb,#d9822b 55%,transparent)}
.encadre.alerte .ic{color:#c2611a}
.encadre .ic{width:6mm;height:6mm}
.encadre b{display:block;color:var(--titres);margin-bottom:.5mm}
/* tableau */
.tableau{width:100%;border-collapse:collapse;font-size:9.5pt}
.tableau thead tr{background:var(--accentFort)}
.tableau th{text-align:left;font-weight:700;color:#fff;padding:2.4mm 3mm;border:none}
.tableau td{padding:2.2mm 3mm;border-bottom:.3mm solid var(--filet)}
.tableau tbody tr:nth-child(even) td{background:color-mix(in srgb,var(--surface) 60%,transparent)}
.tableau tfoot td{font-weight:700;color:var(--titres);border-top:.6mm solid var(--accentFort);border-bottom:none}
.tableau .d{text-align:right;white-space:nowrap}
/* étapes */
.etapes{list-style:none;display:flex;flex-direction:column;gap:0}
.etapes li{display:flex;gap:5mm;position:relative;padding-bottom:4mm}
.etapes li:not(:last-child)::before{content:"";position:absolute;left:4.5mm;top:10mm;bottom:0;width:.4mm;background:var(--filet)}
.et-num{flex:none;width:9mm;height:9mm;border-radius:50%;border:.5mm solid var(--accent);color:var(--accent);font-weight:700;display:grid;place-items:center;font-family:var(--police-titres)}
.etapes b{display:block;font-family:var(--police-titres);color:var(--titres);font-size:11.5pt;margin-top:1.5mm}
.etapes p{color:var(--texteSecondaire);font-size:9.5pt}
/* contact */
.contact-bloc{background:var(--fond-couv);color:var(--texte-couv);border-radius:4mm;padding:9mm;display:flex;flex-direction:column;gap:4mm}
.contact-bloc h2{color:var(--titres-couv);font-size:20pt}
.contact-items{display:flex;flex-direction:column;gap:2.5mm;font-weight:600}
.contact-items div{display:flex;gap:3mm;align-items:center}
.contact-bloc .ic{color:var(--accent)}
.libre{display:block}
`;
}

// ---------- Pagination (dans le navigateur) ----------
export function paginer({ titreCourt, logo, avecEntete, papier }) {
  const pb = [];
  const source = document.getElementById('source');
  const blocs = [...source.children];
  const pages = [];
  const nouvelle = (pleine) => {
    const f = document.createElement('section');
    f.className = 'feuille' + (pleine ? ' pleine' : '');
    f.innerHTML = pleine ? '<div class="contenu"></div>' : `${avecEntete ? `<header class="entete">${logo ? `<img src="${logo}">` : '<span></span>'}<span>${titreCourt}</span></header>` : ''}<div class="contenu"></div><footer class="pied"><span>${titreCourt}</span><span class="num"></span></footer>`;
    document.body.append(f);
    pages.push(f);
    return f.querySelector('.contenu');
  };
  const deborde = (c) => c.scrollHeight > c.clientHeight + 1;
  let c = null;
  const vide = (x) => !x || !x.children.length;
  for (let i = 0; i < blocs.length; i++) {
    const b = blocs[i];
    if (b.hasAttribute('data-pleine')) { nouvelle(true).append(b); c = null; continue; }
    if (b.classList.contains('saut')) { c = null; continue; }
    if (!c || (b.classList.contains('nouvelle-page') && !vide(c)) || b.classList.contains('nouvelle-page-si-oui') && !vide(c)) c = nouvelle(false);
    c.append(b);
    if (!deborde(c)) continue;
    // Le bloc ne tient pas : le couper s'il est coupable (lignes de liste ou de tableau), sinon le passer à la page suivante
    if (b.hasAttribute('data-coupable')) {
      const corps = b.tagName === 'TABLE' ? b.tBodies[0] : b;
      const lignes = [...corps.children];
      const reste = b.cloneNode(true);
      delete reste.dataset.recoupe;
      const corpsR = reste.tagName === 'TABLE' ? reste.tBodies[0] : reste;
      corpsR.innerHTML = '';
      if (reste.tagName === 'TABLE' && reste.tFoot) reste.tFoot.remove();
      let n = lignes.length;
      while (deborde(c) && n > 0) { corpsR.prepend(lignes[--n]); }
      if (b.tagName === 'TABLE' && n > 0 && b.tFoot) { reste.append(b.tFoot); }
      if (n === 0) { b.remove(); corps.append(...corpsR.children); }
      else { if (b.tagName === 'OL') reste.setAttribute('start', n + 1); blocs.splice(i + 1, 0, reste); continue; }
    } else b.remove();
    // Ne pas laisser d'intertitre seul en bas de page
    const aDeplacer = [b];
    while (c.lastElementChild && c.lastElementChild.hasAttribute('data-suite')) aDeplacer.unshift(c.lastElementChild);
    c = nouvelle(false);
    c.append(...aDeplacer);
    // Toujours trop haut sur une page neuve : on le recoupe (une seule fois par bloc, pour ne pas boucler)
    if (deborde(c) && b.hasAttribute('data-coupable') && !b.dataset.recoupe) { b.dataset.recoupe = '1'; i--; continue; }
    if (deborde(c)) pb.push(`ATTENTION un bloc est plus haut qu'une page et sera coupé : « ${b.textContent.trim().slice(0, 50)} » (découpez-le ou réduisez l'image)`);
  }
  // Numéros de page, sommaire
  const total = pages.length;
  pages.forEach((p, k) => { const n = p.querySelector('.pied .num'); if (n) n.textContent = `${k + 1} / ${total}`; });
  const som = document.querySelector('.som-liste');
  if (som) {
    const secs = [...document.querySelectorAll('.feuille [data-section]')];
    som.innerHTML = secs.map(s => `<li><span class="n">${s.querySelector('.sec-num')?.textContent || ''}</span><span class="t">${s.dataset.section}</span><span class="p">${pages.indexOf(s.closest('.feuille')) + 1}</span></li>`).join('');
    if (!secs.length) pb.push('ATTENTION sommaire vide : aucun bloc « section »');
  }
  pages.forEach((p, k) => { const ct = p.querySelector('.contenu'); if (ct && !ct.children.length) pb.push(`ATTENTION page ${k + 1} vide`); });
  // Pages presque vides (hors dernière et couverture)
  pages.forEach((p, k) => {
    const ct = p.querySelector('.contenu');
    if (!ct || p.classList.contains('pleine') || k === total - 1) return;
    const der = ct.lastElementChild; if (!der) return;
    const rempli = (der.getBoundingClientRect().bottom - ct.getBoundingClientRect().top) / ct.clientHeight;
    const suivante = pages[k + 1]?.querySelector('.contenu')?.firstElementChild;
    if (rempli < 0.45 && !suivante?.classList.contains('nouvelle-page') && !pages[k + 1]?.classList.contains('pleine')) pb.push(`INFO page ${k + 1} remplie à ${Math.round(rempli * 100)} % (bloc suivant trop grand pour y tenir)`);
  });
  source.remove();
  return { pb, total };
}

// ---------- Construction ----------
export function construire(d, base) {
  const erreurs = [];
  const charte = chargerCharte(d.charte, base);
  const theme = d.theme || 'clair';
  const ctx = { base, erreurs, charte };
  const logoPage = image(theme === 'clair' ? (charte.logoClair || charte.logo) : charte.logo, base, erreurs);
  const couvClaire = (d.blocs || []).find(b => b.type === 'couverture')?.fond === 'clair';
  ctx.logoCouv = image(couvClaire ? (charte.logoClair || charte.logo) : charte.logo, base, erreurs);
  if (!Array.isArray(d.blocs) || !d.blocs.length) erreurs.push('ERREUR « blocs » manquant ou vide');
  const corps = (d.blocs || []).map(b => blocHtml(b, ctx)).join('\n');
  const papier = PAPIERS[d.papier || 'A4'];
  if (!papier) quitter(`ERREUR papier inconnu : ${d.papier} (${Object.keys(PAPIERS).join(', ')})`);
  const dims = d.orientation === 'paysage' ? [papier[1], papier[0]] : papier;
  const pol = policesHtml(charte);
  const c = charte.c;
  const couv = `:root{--fond-couv:${c.fond};--texte-couv:${c.texte};--titres-couv:${c.accentClair};--accent-couv:${c.accentProfond}}`;
  const html = `<!doctype html><html lang="${d.langue || 'fr'}"><head><meta charset="utf-8"><title>${echapper(d.titre || 'Document')}</title>${pol.lien}
<style>${pol.css}${variablesCss(charte, theme)}${couv}${css(d, dims)}${d.css || ''}</style></head>
<body><div id="source">${corps}</div></body></html>`;
  return { html, erreurs, dims, polices: pol.noms, logoPage, charte };
}

export async function rendreDocument(d, base, sortie, { apercu } = {}) {
  const { html, erreurs, dims, polices, logoPage } = construire(d, base);
  if (erreurs.length) return erreurs;
  const px = (mm) => Math.round(mm / 25.4 * 96);
  const { page, fermer } = await ouvrirPage(html, { w: px(dims[0]), h: px(dims[1]), echelle: 1.5 });
  try {
    const pbPol = await controlerPolices(page, polices);
    const { pb, total } = await page.evaluate(paginer, { titreCourt: echapper(d.titreCourt || d.titre || ''), logo: logoPage, avecEntete: d.entete !== false, papier: dims });
    pb.unshift(`INFO ${total} page${total > 1 ? 's' : ''}`);
    if (sortie) {
      mkdirSync(path.dirname(sortie), { recursive: true });
      await page.pdf({ path: sortie, preferCSSPageSize: true, printBackground: true });
    }
    if (apercu) {
      mkdirSync(apercu, { recursive: true });
      await page.emulateMediaType('print');
      const feuilles = await page.$$('.feuille');
      const imgs = [];
      for (let k = 0; k < feuilles.length; k++) {
        const f = path.join(apercu, `page-${String(k + 1).padStart(2, '0')}.png`);
        await feuilles[k].screenshot({ path: f });
        imgs.push({ nom: `page ${k + 1}`, src: `data:image/png;base64,${readFileSync(f).toString('base64')}` });
      }
      await planche(imgs, path.join(apercu, 'planche.png'), { colonnes: Math.min(4, imgs.length), largeur: 300 });
    }
    return [...pbPol, ...pb];
  } finally { await fermer(); }
}

// ---------- Ligne de commande ----------
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const { pos, opt } = lireArgs();
  if (!pos[0]) quitter('Usage : node moteur/outils/document.mjs document.json sortie.pdf [--apercu dossier] [--verifier]');
  const fichier = path.resolve(pos[0]);
  const d = JSON.parse(readFileSync(fichier, 'utf8'));
  if (!opt.verifier && !pos[1]) quitter('Indiquez le fichier PDF de sortie, ou --verifier.');
  const pb = await rendreDocument(d, path.dirname(fichier), opt.verifier ? null : path.resolve(pos[1]), { apercu: opt.apercu ? path.resolve(opt.apercu) : (opt.verifier ? null : undefined) });
  pb.forEach(p => console.log(p));
  const err = pb.some(p => p.startsWith('ERREUR'));
  if (!err && !opt.verifier) console.log(`✓ ${path.relative(process.cwd(), path.resolve(pos[1]))}${opt.apercu ? ` (aperçus dans ${opt.apercu})` : ''}`);
  process.exit(err ? 1 : 0);
}
