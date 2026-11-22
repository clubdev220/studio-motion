// Voix off calée au mot près : lit le texte « voix » de chaque scène, fait lire le tout d'une traite par ElevenLabs
// (prosodie continue), récupère l'instant de chaque mot, puis écrit voix/voix.mp3 et voix/voix.json. Le moteur vidéo
// s'en sert pour : la durée de chaque scène (elle suit la voix), le son, et les sous-titres mot à mot.
//
//   node moteur/outils/voix.mjs mon-projet/scenario.json            génère (ou réutilise le cache si le texte n'a pas changé)
//   node moteur/outils/voix.mjs mon-projet/scenario.json --forcer   régénère même si le cache est valable
//   node moteur/outils/voix.mjs mon-projet/scenario.json --essai    contrôle les textes, sans appel payant
//
// Clé : variable d'environnement ELEVENLABS_API_KEY (jamais écrite dans un fichier). Voir guides/voix.md.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { lireArgs, quitter } from './commun.mjs';
import { dureeMedia, ffmpeg, lancer } from './audio.mjs';

const DEFAUT = { fournisseur: 'elevenlabs', modele: 'eleven_multilingual_v2', vitesse: 1, stabilite: 0.6, similarite: 0.85, style: 0, debut: 0.35, fin: 1.2, avant: 0.08 };

// Clarté : voix plus nette et un peu moins grave (réglages validés sur une voix clonée masculine jugée trop sourde).
// Nécessite un ffmpeg complet (égaliseur, compresseur) ; « hauteur » demande en plus rubberband.
export const CLARTE = ['highpass=f=110', 'bass=g=-4:f=180', 'equalizer=f=250:t=q:w=1.1:g=-4', 'equalizer=f=500:t=q:w=1.4:g=-1.5',
  'equalizer=f=3200:t=q:w=1:g=5', 'treble=g=3.5:f=8000', 'acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=2', 'deesser=i=0.35'];

// Mots à faire vérifier : sigles, nombres, adresses, mots avec chiffres ou majuscules internes
const SUSPECTS = /^(?:[A-ZÀ-Ý]{2,}s?|.*\d.*|.*[@/].*|.*\.(?:com|fr|org|net|io|ai|ca|bf)\b.*|[a-zà-ÿ]+[A-Z]\w*)$/;

export const motsAffiches = (t) => String(t).replace(/\*/g, '').split(/\s+/).filter(Boolean);
const remplacer = (t, dico = {}) => Object.entries(dico).sort((a, b) => b[0].length - a[0].length)
  .reduce((acc, [de, vers]) => acc.replace(new RegExp(`(?<![\\wÀ-ÿ])${de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\wÀ-ÿ])`, 'g'), vers), t);

export function texteVoix(sc) {
  const v = { ...DEFAUT, ...(sc.voix || {}) };
  const scenes = sc.scenes.map(s => (typeof s.voix === 'string' && s.voix.trim() ? s.voix.trim().replace(/\*/g, '') : null));
  const lu = scenes.map(t => (t ? remplacer(t, v.prononciation) : null));
  const cle = createHash('sha1').update(JSON.stringify({ lu, voixId: v.voixId, modele: v.modele, vitesse: v.vitesse, stabilite: v.stabilite, similarite: v.similarite, style: v.style, traitement: v.traitement, hauteur: v.hauteur })).digest('hex').slice(0, 16);
  return { v, scenes, lu, cle };
}

export function dossierVoix(fichierScenario, sc) {
  return path.resolve(path.dirname(path.resolve(fichierScenario)), sc.voix?.dossier || 'voix');
}

// ---------- Programme ----------
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  const { pos, opt } = lireArgs();
  if (!pos[0]) quitter('Usage : node moteur/outils/voix.mjs scenario.json [--forcer] [--essai]');
  const fichier = path.resolve(pos[0]);
  const sc = JSON.parse(readFileSync(fichier, 'utf8'));
  if (!sc.voix) quitter('ERREUR le scénario n\'a pas de réglage « voix » (voir guides/voix.md).');
  const { v, scenes, lu, cle } = texteVoix(sc);
  if (!scenes.some(Boolean)) quitter('ERREUR aucune scène n\'a de texte « voix ».');
  if (v.fournisseur !== 'elevenlabs') quitter(`ERREUR fournisseur de voix non pris en charge : ${v.fournisseur} (elevenlabs).`);
  if (!v.voixId) quitter('ERREUR « voix.voixId » manquant : l\'identifiant de la voix ElevenLabs à utiliser.');

  // Contrôle des textes
  const texte = lu.filter(Boolean).join(' ');
  console.log(`Texte lu : ${texte.length} caractères (${motsAffiches(texte).length} mots, ≈ ${Math.round(motsAffiches(texte).length / 2.6 / (v.vitesse || 1))} s).`);
  const suspects = [...new Set(lu.filter(Boolean).flatMap(t => motsAffiches(t)).map(m => m.replace(/^[«"(']+|[»"),.;:!?']+$/g, '')).filter(m => SUSPECTS.test(m)))];
  if (suspects.length) console.log(`ATTENTION prononciation à vérifier (sigles, nombres, adresses) : ${suspects.join(', ')}\n  → au besoin, ajoutez-les dans « voix.prononciation » écrits comme ils se disent (ex. "IA": "i-a", "2025": "deux mille vingt-cinq").`);
  if (v.traitement === 'clarte' && !ffmpeg().complet) console.log('ATTENTION traitement « clarte » ignoré : le ffmpeg trouvé n\'a pas d\'égaliseur (installez ffmpeg, ou STUDIO_MOTION_FFMPEG=/chemin/ffmpeg).');
  if (opt.essai) process.exit(0);

  const dos = dossierVoix(fichier, sc);
  mkdirSync(dos, { recursive: true });
  const fAlign = path.join(dos, 'alignement.json'), fBrut = path.join(dos, 'voix-brute.mp3'), fVoix = path.join(dos, 'voix.mp3'), fJson = path.join(dos, 'voix.json');
  let al = existsSync(fAlign) ? JSON.parse(readFileSync(fAlign, 'utf8')) : null;
  if (!al || al.cle !== cle || opt.forcer || !existsSync(fBrut)) {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) quitter('ERREUR variable d\'environnement ELEVENLABS_API_KEY absente.');
    console.log('Génération de la voix (ElevenLabs)…');
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v.voixId)}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texte, model_id: v.modele, voice_settings: { stability: v.stabilite, similarity_boost: v.similarite, style: v.style, use_speaker_boost: true, speed: v.vitesse } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.audio_base64) quitter(`ERREUR ElevenLabs (${r.status}) : ${JSON.stringify(j).slice(0, 300)}`);
    writeFileSync(fBrut, Buffer.from(j.audio_base64, 'base64'));
    al = { cle, ...j.alignment };
    writeFileSync(fAlign, JSON.stringify(al));
  } else console.log('Voix inchangée : cache réutilisé (aucun appel payant).');

  // Traitement : hauteur (rubberband) et clarté si ffmpeg le permet ; sinon simple copie
  const f = ffmpeg();
  const filtres = [];
  let tempo = 1;
  if (v.hauteur && v.hauteur !== 1) {
    if (f.filtres.has('rubberband')) filtres.push(`rubberband=pitch=${v.hauteur}:formant=preserved`);
    else console.log('ATTENTION « hauteur » ignorée : ffmpeg sans rubberband.');
  }
  if (v.tempo && v.tempo !== 1) { tempo = v.tempo; filtres.push(f.filtres.has('rubberband') ? `rubberband=tempo=${tempo}` : `atempo=${tempo}`); }
  if (v.traitement === 'clarte' && f.complet) filtres.push(...CLARTE.filter(x => f.filtres.has(x.split('=')[0])));
  lancer(['-y', '-i', fBrut, ...(filtres.length ? ['-af', filtres.join(',')] : []), '-ar', '44100', '-b:a', '192k', fVoix]);

  // Mots -> scènes (positions des caractères dans le texte lu)
  const st = al.character_start_times_seconds.map(x => x / tempo), en = al.character_end_times_seconds.map(x => x / tempo);
  const mots = []; let cur = null;
  al.characters.forEach((c, i) => {
    if (/\s/.test(c)) { if (cur) { mots.push(cur); cur = null; } return; }
    if (!cur) cur = { w: '', s: st[i], e: en[i], pos: i };
    cur.w += c; cur.e = en[i];
  });
  if (cur) mots.push(cur);
  const duree = dureeMedia(fVoix) ?? en[en.length - 1];
  let acc = 0;
  const bornes = lu.map(t => { if (!t) return null; const b = [acc, acc + t.length]; acc += t.length + 1; return b; });
  const parScene = bornes.map(b => (b ? mots.filter(m => m.pos >= b[0] && m.pos < b[1]) : null));
  // Morceau de voix de chaque scène : de son premier mot (moins « avant ») au premier mot de la scène parlée suivante
  const parlees = parScene.map((m, i) => (m?.length ? i : -1)).filter(i => i >= 0);
  const res = parScene.map((m, i) => {
    if (!m?.length) return null;
    const k = parlees.indexOf(i);
    const debutMorceau = Math.max(0, m[0].s - v.avant);
    const suiv = parlees[k + 1];
    const finMorceau = suiv !== undefined ? Math.max(debutMorceau + 0.2, parScene[suiv][0].s - v.avant) : duree;
    const lead = k === 0 ? v.debut : 0.05;
    const tail = suiv === undefined ? v.fin : 0;
    // Mots affichés (texte de la scène) calés sur les mots lus (le texte lu peut différer : prononciation)
    const aff = motsAffiches(scenes[i]);
    const lus = m.map(x => ({ s: x.s - debutMorceau + lead, e: x.e - debutMorceau + lead }));
    const cales = aff.map((w, a) => {
      if (aff.length === lus.length) return { w, ...lus[a] };
      const p = a * lus.length / aff.length, q = (a + 1) * lus.length / aff.length;
      return { w, s: lus[Math.floor(p)].s, e: lus[Math.max(Math.floor(p), Math.ceil(q) - 1)].e };
    }).map(x => ({ w: x.w, s: +x.s.toFixed(3), e: +x.e.toFixed(3) }));
    return { debut: +debutMorceau.toFixed(3), fin: +finMorceau.toFixed(3), decalage: lead, duree: +(lead + finMorceau - debutMorceau + tail).toFixed(3), mots: cales };
  });
  writeFileSync(fJson, JSON.stringify({ cle, fichier: 'voix.mp3', duree: +duree.toFixed(3), scenes: res }, null, 1));
  const total = sc.scenes.reduce((s, x, i) => s + (res[i] ? Math.max(res[i].duree, x.duree || 0) : x.duree || 0), 0);
  console.log(`Voix : ${duree.toFixed(1)} s ; vidéo ≈ ${total.toFixed(1)} s.`);
  res.forEach((r, i) => console.log(`  scène ${i + 1} (${sc.scenes[i].brique}) : ${r ? `${r.duree.toFixed(2)} s — ${r.mots.map(m => m.w).join(' ').slice(0, 70)}` : `${sc.scenes[i].duree ?? '?'} s, sans voix`}`));
  console.log(`\nÉcrit : ${path.relative(process.cwd(), fVoix)} et ${path.relative(process.cwd(), fJson)}`);
}
