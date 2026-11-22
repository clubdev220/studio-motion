// Musique instrumentale générée par ElevenLabs Music, à la durée exacte de la vidéo (option payante, à côté des
// musiques composées gratuitement par musique.mjs). Une musique différente par vidéo, choisie selon son propos.
//
//   node moteur/outils/musique-ia.mjs mon-projet/musique.mp3 --duree 48 --ambiance "Warm Afro-pop instrumental, kalimba, light percussion, 105 BPM"
//   node moteur/outils/musique-ia.mjs mon-projet/musique.mp3 --scenario mon-projet/scenario.json --ambiance "…"   (durée lue dans le scénario)
//
// L'ambiance s'écrit en anglais (meilleurs résultats) : style, instruments, énergie, tempo, et toujours
// « background for voice-over, no vocals ». Clé : ELEVENLABS_API_KEY. Le résultat est normalisé (-16 LUFS) avec un
// fondu final ; vérifiez la licence de votre offre ElevenLabs pour un usage commercial.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { lireArgs, quitter } from './commun.mjs';
import { lancer } from './audio.mjs';
import { chargerScenario } from './verifier.mjs';

const { pos, opt } = lireArgs();
const sortie = pos[0] && path.resolve(pos[0]);
if (!sortie || !opt.ambiance || !(opt.duree || opt.scenario)) quitter('Usage : node moteur/outils/musique-ia.mjs sortie.mp3 --ambiance "…" (--duree S | --scenario scenario.json)');
let duree = Number(opt.duree);
if (opt.scenario) {
  const { sc } = chargerScenario(path.resolve(opt.scenario));
  if (sc._voixErreur) quitter('ERREUR ' + sc._voixErreur);
  duree = sc.scenes.reduce((s, x) => s + (Number(x.duree) || 0), 0);
}
if (!(duree > 3 && duree <= 300)) quitter(`ERREUR durée invalide (${duree}) : entre 3 et 300 s.`);
const key = process.env.ELEVENLABS_API_KEY;
if (!key) quitter('ERREUR variable d\'environnement ELEVENLABS_API_KEY absente.');
let ambiance = String(opt.ambiance);
if (!/no vocals/i.test(ambiance)) ambiance += ', background for voice-over, no vocals';

console.log(`Composition (${duree.toFixed(1)} s) : ${ambiance}`);
const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
  method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: ambiance, music_length_ms: Math.ceil(duree + 1.5) * 1000, force_instrumental: true }),
});
if (!r.ok) quitter(`ERREUR ElevenLabs Music (${r.status}) : ${(await r.text()).slice(0, 300)}`);
mkdirSync(path.dirname(sortie), { recursive: true });
const brut = sortie.replace(/(\.\w+)$/, '.brut$1');
writeFileSync(brut, Buffer.from(await r.arrayBuffer()));
const fondu = Math.max(0, duree - 1.8);
lancer(['-y', '-i', brut, '-af', `loudnorm=I=-16:TP=-2,afade=t=out:st=${fondu.toFixed(2)}:d=1.8`, '-ar', '44100', '-b:a', '192k', sortie]);
rmSync(brut, { force: true });
console.log(`Musique : ${path.relative(process.cwd(), sortie)}`);
