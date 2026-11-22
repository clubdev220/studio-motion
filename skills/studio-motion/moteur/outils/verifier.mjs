// Vérifie un scénario AVANT le rendu : format, charte, briques et réglages, temps de lecture, zones, fichiers.
// Usage : node outils/verifier.mjs chemin/scenario.json
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RACINE, lireArgs, tailleImage } from './commun.mjs';
import { dossierVoix, texteVoix } from './voix.mjs';

export const FICHIER_MEDIA = /\.(png|jpe?g|webp|gif|svg|mp4|mov|webm|wav|mp3|m4a|ogg)$/i;
const IMAGES = /\.(png|jpe?g|webp|gif|svg)$/i;

// Réglages obligatoires de chaque brique (la liste complète des réglages est dans guides/briques.md)
export const BRIQUES = {
  intro: ['titre'], outro: [], chapitre: ['titre'],
  titre: ['texte'], citation: ['texte'], carte: ['titre', 'lignes'], appel: ['titre'],
  chiffre: ['valeur'], barres: ['donnees'], frise: ['etapes'],
  liste: ['elements'], etapes: ['etapes'], recap: ['titre', 'items'],
  photo: ['image'], galerie: ['images'], video: ['video'], produit: ['image', 'nom'], telephone: ['image'],
  ecran: ['image', 'reperes'],
  code: ['code'], terminal: ['commandes'], schema: ['noeuds'],
  libre: ['fichier'],
};
const ICONES = [...readFileSync(path.join(RACINE, 'video/src/outils.tsx'), 'utf8').matchAll(/^\s+(\w+): <(?:path|>|circle|rect)/gm)].map(m => m[1]);

const mots = (s = '') => String(s).replace(/<[^>]+>/g, ' ').replace(/\*/g, '').split(/\s+/).filter(Boolean).length;
// Temps de lecture calibré sur des tutoriels validés par un client : ~3,3 mots/s + 1,5 s pour situer l'écran
const lecture = (n) => 1.5 + n / 3.3;
// Tous les textes affichés d'une scène (hors chemins de fichiers et réglages techniques)
const TECH = new Set(['voix', 'sousTitres', 'brique', 'duree', 'chapitre', 'transition', 'fond', 'fichier', 'image', 'images', 'video', 'focus', 'zoom', 'zone', 'at', 'clic', 'icone', 'style', 'disposition', 'alignement', 'taille', 'cote', 'id', 'de', 'a', 'shell', 'dossier', 'code', 'surligner', 'valeur', 'compteur', 'enAvant', 'debut', 'cadre', 'son', 'defilerDe', 'defilerA', 'active', 'adresse', 'reperes']);
const textes = (o, cle = '') => {
  if (typeof o === 'string') return TECH.has(cle) || FICHIER_MEDIA.test(o) ? '' : o;
  if (Array.isArray(o)) return o.map(x => textes(x, cle)).join(' ');
  if (o && typeof o === 'object') return Object.entries(o).map(([k, v]) => (TECH.has(k) ? '' : textes(v, k))).join(' ');
  return '';
};

export function chargerScenario(fichier) {
  const dossier = path.dirname(path.resolve(fichier));
  const sc = JSON.parse(readFileSync(fichier, 'utf8'));
  let dossierCharte = dossier;
  if (typeof sc.charte === 'string') {
    const fc = path.resolve(dossier, sc.charte);
    dossierCharte = path.dirname(fc);
    sc.charte = JSON.parse(readFileSync(fc, 'utf8'));
  }
  // Voix off : la durée des scènes parlées vient de voix/voix.json (produit par outils/voix.mjs)
  if (sc.voix) {
    const dos = dossierVoix(fichier, sc), fj = path.join(dos, 'voix.json');
    if (!existsSync(fj)) sc._voixErreur = 'Voix non générée : lancez « node moteur/outils/voix.mjs <scénario> » (ou retirez « voix »).';
    else {
      const vj = JSON.parse(readFileSync(fj, 'utf8'));
      if (vj.cle !== texteVoix(sc).cle) sc._voixErreur = 'Voix périmée (textes « voix » ou réglages modifiés depuis la génération) : relancez « node moteur/outils/voix.mjs <scénario> ».';
      else {
        sc.scenes.forEach((s, i) => { const v = vj.scenes[i]; if (v) s.duree = Math.max(v.duree, Number(s.duree) || 0); });
        sc.pisteVoix = { src: path.relative(dossier, path.join(dos, vj.fichier)).split(path.sep).join('/'), scenes: vj.scenes };
      }
    }
  }
  return { sc, dossier, dossierCharte };
}

export function verifier(fichier) {
  const erreurs = [], alertes = [];
  const E = (m) => erreurs.push(m), A = (m) => alertes.push(m);
  let sc, dossier, dossierCharte;
  try { ({ sc, dossier, dossierCharte } = chargerScenario(fichier)); } catch (e) { return { erreurs: [`Scénario ou charte illisible : ${e.message}`], alertes, duree: 0 }; }

  if (sc._voixErreur) E(sc._voixErreur);
  if (!['16:9', '9:16', '1:1'].includes(sc.format)) E('« format » doit valoir "16:9", "9:16" ou "1:1".');

  // Charte
  const ch = sc.charte;
  if (!ch?.couleurs || !ch?.polices) E('La charte doit contenir « couleurs » et « polices ».');
  else {
    for (const k of ['fond', 'surface', 'surfaceSombre', 'accent', 'accentClair', 'accentProfond', 'texte', 'texteSecondaire'])
      if (!/^#[0-9a-fA-F]{6}$/.test(ch.couleurs[k] || '')) E(`Charte : couleur « ${k} » absente ou pas au format #rrggbb.`);
    const dispo = [...readFileSync(path.join(RACINE, 'video/src/charte.ts'), 'utf8').matchAll(/^\s+'?([A-Z][\w ]+?)'?: \(\) =>/gm)].map(m => m[1]);
    for (const k of ['titres', 'texte', 'code']) if (ch.polices[k] && !dispo.includes(ch.polices[k])) E(`Charte : police « ${ch.polices[k]} » indisponible. Choix : ${dispo.join(', ')}.`);
    if (ch.logo && !existsSync(path.resolve(dossierCharte, ch.logo))) E(`Charte : logo introuvable : ${ch.logo}`);
    if (!ch.logo) A('La charte n\'a pas de logo : l\'intro, la fin et le coin de l\'écran n\'afficheront pas de logo.');
  }

  const S = sc.scenes || [];
  if (!S.length) E('Aucune scène (« scenes »).');
  const fichierOk = (rel, nom) => { if (!existsSync(path.resolve(dossier, rel))) { E(`${nom} : fichier introuvable : ${rel}`); return false; } return true; };
  const zoneOk = (z, nom, min = 0) => {
    if (!z) return;
    const ok = ['x', 'y', 'w', 'h'].every(k => typeof z[k] === 'number' && z[k] >= 0 && z[k] <= 1) && z.x + z.w <= 1.001 && z.y + z.h <= 1.001;
    if (!ok) E(`${nom} : zone hors de l'image (fractions entre 0 et 1, x+w ≤ 1, y+h ≤ 1).`);
    if (min && (z.w < min || z.h < min)) A(`${nom} : zoom très serré (w ou h < ${min}) : l'agrandissement est plafonné.`);
  };
  const capture1610 = (rel, nom) => {
    if (!fichierOk(rel, nom)) return;
    const t = tailleImage(path.resolve(dossier, rel));
    if (!t) return E(`${nom} : ${rel} doit être un PNG ou un JPEG.`);
    if (Math.abs(t.w / t.h - 1.6) > 0.02) E(`${nom} : ${rel} fait ${t.w}×${t.h} ; la brique « ecran » demande du 16:10 (1440×900). Utilisez outils/cadrer.mjs.`);
  };
  const parcourirFichiers = (o, nom) => {
    if (typeof o === 'string') { if (FICHIER_MEDIA.test(o) && !/^https?:/.test(o)) fichierOk(o, nom); return; }
    if (Array.isArray(o)) o.forEach(x => parcourirFichiers(x, nom));
    else if (o && typeof o === 'object') Object.values(o).forEach(x => parcourirFichiers(x, nom));
  };

  let t0 = 0;
  S.forEach((s, i) => {
    const nom = `Scène ${i + 1} (${s.brique}, à ${t0.toFixed(1)} s)`;
    t0 += Number(s.duree) || 0;
    if (!BRIQUES[s.brique]) return E(`${nom} : brique inconnue. Choix : ${Object.keys(BRIQUES).join(', ')}.`);
    if (!(s.duree > 0) && !(sc.voix && s.voix)) E(`${nom} : « duree » (secondes) manquante.`);
    for (const r of BRIQUES[s.brique]) if (s[r] === undefined || s[r] === '' || (Array.isArray(s[r]) && !s[r].length)) E(`${nom} : réglage « ${r} » obligatoire.`);
    if (s.transition && !['fondu', 'glisse', 'zoom', 'coupe'].includes(s.transition)) E(`${nom} : transition inconnue (fondu, glisse, zoom, coupe).`);
    if (s.icone && !ICONES.includes(s.icone)) E(`${nom} : icône « ${s.icone} » inconnue. Choix : ${ICONES.join(', ')}.`);
    parcourirFichiers(s, nom);
    if (s.fond && typeof s.fond === 'object' && s.fond.image) fichierOk(s.fond.image, nom);

    if (s.brique === 'libre') {
      if (s.fichier && fichierOk(s.fichier, nom) && !/\.tsx$/.test(s.fichier)) E(`${nom} : une scène libre est un fichier .tsx.`);
    } else if (s.brique === 'ecran') {
      if (s.image) capture1610(s.image, nom);
      const R = s.reperes || [];
      if (R.length && R[0].at !== 0) E(`${nom} : le premier repère doit avoir « at »: 0.`);
      R.forEach((r, k) => {
        const nr = `${nom}, repère ${k + 1} « ${r.titre} »`;
        const fin = k + 1 < R.length ? R[k + 1].at : s.duree;
        if (k > 0 && !(r.at > R[k - 1].at)) E(`${nr} : « at » doit croître d'un repère à l'autre.`);
        if (r.at >= s.duree) E(`${nr} : « at » (${r.at} s) dépasse la durée de la scène (${s.duree} s).`);
        const besoin = lecture(mots(r.titre) + mots(r.texte)) + (r.clic ? 1 : 0);
        if (fin - r.at < besoin - 0.05) A(`${nr} : ${(fin - r.at).toFixed(1)} s à l'écran pour ${mots(r.titre) + mots(r.texte)} mots ; prévoir au moins ${besoin.toFixed(1)} s.`);
        if ((r.titre || '').length > 48) A(`${nr} : titre long (${r.titre.length} caractères, 48 conseillés).`);
        if ((r.texte || '').length > 150) A(`${nr} : texte long (${r.texte.length} caractères, 150 conseillés).`);
        if (r.image) capture1610(r.image, nr);
        zoneOk(r.zone, `${nr} (zone)`); zoneOk(r.zoom, `${nr} (zoom)`, 0.25);
        if (r.clic && !r.zone) E(`${nr} : « clic » demande une « zone ».`);
        if (r.image && !r.zoom && k > 0 && R.slice(0, k).some(x => x.zoom)) A(`${nr} : nouvelle image sans « zoom » : l'ancien zoom reste actif (risque d'écran vide).`);
      });
    } else {
      const n = mots(textes(s));
      const base = { galerie: 3 * (s.images?.length || 1), photo: 3, video: 2, intro: 5, outro: 5, chapitre: 2.5 }[s.brique] || 0;
      const animation = { liste: 0.6 * (s.elements?.length || 0), recap: 0.6 * (s.items?.length || 0), carte: 0.8 * (s.lignes?.length || 0), etapes: 1, frise: 2, barres: 1.5, chiffre: 1.2, schema: 2, code: 2, terminal: 2 }[s.brique] || 0;
      const besoin = Math.max(base, lecture(n) + animation);
      if (s.duree < besoin - 0.05 && !sc.pisteVoix?.scenes[i]) A(`${nom} : ${s.duree} s pour ${n} mots${animation ? ' et une animation' : ''} ; prévoir au moins ${besoin.toFixed(1)} s.`);
    }
    if (s.brique === 'carte' && s.lignes?.length > 4) A(`${nom} : plus de 4 lignes, la carte sera chargée.`);
    if (s.brique === 'recap' && s.items?.length > 5) A(`${nom} : plus de 5 points, le récapitulatif risque de dépasser.`);
    if (s.brique === 'liste' && s.elements?.length > 6) A(`${nom} : plus de 6 éléments, la liste risque de dépasser.`);
    if (s.brique === 'titre' && (s.texte || '').length > 90) A(`${nom} : titre très long (${s.texte.length} caractères) : visez 60 au plus.`);
  });
  const duree = t0;
  if (sc.format === '9:16' && duree > 90) A(`Vidéo verticale de ${duree.toFixed(0)} s : sur les réseaux sociaux, visez 15 à 60 s.`);

  if (sc.musique) {
    const f = path.resolve(dossier, sc.musique);
    if (!existsSync(f)) E(`Musique introuvable : ${sc.musique}`);
    else if (f.endsWith('.wav')) {
      const b = readFileSync(f); const d = (statSync(f).size - 44) / b.readUInt32LE(28);
      if (d < duree) A(`La musique dure ${d.toFixed(0)} s, moins que la vidéo (${duree.toFixed(0)} s) : elle s'arrêtera avant la fin.`);
    }
  } else A('Pas de musique (« musique »). Voir outils/musique.mjs.');
  if (sc.sousTitres && !sc.voix) A('« sousTitres » demande une voix off (« voix ») : ignoré.');
  void IMAGES;
  return { erreurs, alertes, duree };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { pos } = lireArgs();
  if (!pos[0]) { console.error('Usage : node outils/verifier.mjs scenario.json'); process.exit(1); }
  const { erreurs, alertes, duree } = verifier(pos[0]);
  for (const m of erreurs) console.log('ERREUR    ' + m);
  for (const m of alertes) console.log('ATTENTION ' + m);
  console.log(`\nDurée totale : ${duree.toFixed(1)} s.`);
  console.log(erreurs.length ? `${erreurs.length} erreur(s) : à corriger avant le rendu.` : `Aucune erreur${alertes.length ? `, ${alertes.length} point(s) d'attention` : ''}.`);
  process.exit(erreurs.length ? 1 : 0);
}
