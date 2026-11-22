# Voix off, sous-titres et mixage

Une vidéo pour les réseaux sociaux se regarde souvent **avec le son** (TikTok, Reels) et souvent **sans** (fil
Facebook, LinkedIn, au bureau) : il faut donc une voix off **et** des sous-titres. Le pack fait lire le texte de
chaque scène par une voix de synthèse (ElevenLabs), récupère l'instant exact de chaque mot, et en déduit :
- la **durée de chaque scène** : elle suit la voix, les plans changent au moment où la phrase suivante commence ;
- les **sous-titres mot à mot**, le mot prononcé en couleur d'accent ;
- le **mixage** : la musique baisse sous la voix et remonte entre deux phrases ; le son final est normalisé.

À lire d'abord : [video.md](video.md) (le montage de scènes). Ce guide ajoute la voix par-dessus.

---

## 1. Écrire pour la voix

- **Une phrase ou deux par scène**, 8 à 25 mots. La scène dure le temps de sa phrase : une scène de liste ou de
  schéma doit avoir assez de texte parlé pour laisser l'animation se dérouler (sinon donnez-lui une `duree`
  minimale, voir plus bas).
- **L'écran ne répète pas la voix mot pour mot** : l'écran montre le mot-clé, le chiffre, l'image ; la voix
  explique. Les sous-titres reprennent, eux, exactement la voix.
- **Accroche dans les 2 premières secondes** (une question, un chiffre, une promesse tenue par la vidéo).
- **Fin = une action** : « Dis-moi en commentaire… », « Abonne-toi… », « Écrivez-nous sur WhatsApp ».
- Rythme : 2,5 à 3 mots par seconde à vitesse normale. Une vidéo de 45 s ≈ 110 à 130 mots.

### La prononciation (à vérifier à chaque vidéo)

La synthèse vocale devine mal les **sigles, noms propres, nombres, adresses de site et mots étrangers**. Ne la
laissez pas deviner : écrivez-les comme ils se disent dans `voix.prononciation`. Le texte affiché (sous-titres)
garde l'orthographe normale ; seul le texte lu change.

```json
"prononciation": { "NextGen": "Nekst-Djène", "SARL": "S.A.R.L.", "IA": "i-a", "2025": "deux mille vingt-cinq", "monsite.com": "mon site point com" }
```

`voix.mjs --essai` liste les mots suspects (sigles, nombres, adresses) avant tout appel payant. Écoutez toujours la
voix générée avant le rendu ; corrigez la prononciation et relancez (seul ce qui a changé est refacturé : le cache
est invalidé par toute modification du texte ou des réglages).

## 2. Le scénario

On ajoute `voix` en haut du scénario, et un texte `voix` dans chaque scène parlée :

```json
{
  "format": "9:16",
  "charte": "charte.json",
  "musique": "musique.wav",
  "voix": { "voixId": "IDENTIFIANT_ELEVENLABS", "vitesse": 1.05, "prononciation": { "IA": "i-a" } },
  "sousTitres": { "style": "karaoke" },
  "scenes": [
    { "brique": "titre", "texte": "Trois erreurs qui *tuent* vos plantes", "transition": "zoom",
      "voix": "Trois erreurs qui tuent vos plantes. Et presque tout le monde fait la première." },
    { "brique": "liste", "titre": "Les erreurs", "elements": ["Trop d'eau", "Pas assez de lumière", "Un pot sans trou"],
      "voix": "Trop d'eau, pas assez de lumière, et un pot sans trou.", "duree": 4 },
    { "brique": "appel", "titre": "Suivez-nous", "bouton": "S'abonner", "icone": "coeur",
      "voix": "Abonnez-vous pour d'autres astuces." }
  ]
}
```

- Une scène **sans** `voix` garde sa `duree` (scène muette : intro, logo final…).
- Une scène parlée prend la durée de sa phrase ; si vous lui donnez une `duree` plus longue, elle reste à l'écran
  ce temps-là (silence avant la phrase suivante).

Réglages de `voix` :

| Réglage | Défaut | Rôle |
| --- | --- | --- |
| `voixId` | — (obligatoire) | identifiant de la voix ElevenLabs (bibliothèque de voix du compte) |
| `modele` | `eleven_multilingual_v2` | modèle ElevenLabs (le multilingue gère bien le français) |
| `vitesse` | 1 | 0,7 à 1,2 ; 1,05–1,1 pour les réseaux sociaux |
| `stabilite`, `similarite`, `style` | 0,6 / 0,85 / 0 | réglages ElevenLabs de la voix |
| `prononciation` | — | mots à lire autrement (voir plus haut) |
| `traitement` | — | `clarte` : voix plus nette (coupe des basses, présence, compression, de-esser) ; demande un ffmpeg complet |
| `hauteur` | 1 | > 1 rend la voix un peu plus aiguë (1,03–1,06), timbre préservé ; demande ffmpeg avec rubberband |
| `tempo` | 1 | accélère la voix après coup sans changer sa hauteur (1,1–1,2) |
| `debut`, `fin` | 0,35 / 1,2 s | silence avant la première phrase et après la dernière |
| `dossier` | `voix` | dossier de sortie (à côté du scénario) |

Réglages de `sousTitres` (`true` = réglages par défaut) :

| Réglage | Défaut | Rôle |
| --- | --- | --- |
| `style` | `karaoke` | `karaoke` (texte ombré) ou `pilule` (texte sur un bandeau, plus lisible sur image chargée) |
| `position` | `bas` | `bas` (au-dessus de l'interface des réseaux en 9:16) ou `milieu` |
| `mots` | 3 | mots affichés à la fois (jamais à cheval sur deux phrases) |
| `majuscules` | `false` | tout en capitales |

Une scène peut couper ses sous-titres avec `"sousTitres": false` (par exemple quand l'écran affiche déjà la
phrase en grand).

## 3. Les commandes

```bash
node moteur/outils/voix.mjs mon-projet/scenario.json --essai     # contrôle du texte, mots suspects, sans appel payant
node moteur/outils/voix.mjs mon-projet/scenario.json             # génère voix/voix.mp3 et voix/voix.json
node moteur/outils/verifier.mjs mon-projet/scenario.json          # les durées viennent maintenant de la voix
node moteur/outils/video.mjs mon-projet/scenario.json /tmp/tests --images-tests auto
node moteur/outils/video.mjs mon-projet/scenario.json mon-projet/video.mp4
```

Clé : variable d'environnement `ELEVENLABS_API_KEY`, **jamais écrite dans un fichier** ni dans le scénario.
Si le texte change après la génération, le vérificateur bloque le rendu (« voix périmée ») : relancez `voix.mjs`.

**Voix clonée** : uniquement la voix de la personne qui l'a enregistrée et qui l'autorise. Jamais la voix d'une
personnalité ou d'un tiers.

## 4. Le mixage (règles validées sur des vidéos publiées)

| Élément | Réglage | Pourquoi |
| --- | --- | --- |
| Musique sous la voix | `volumeMusiqueVoix` 0,05 (défaut) | à 0,09 elle couvrait la voix ; 0,04–0,05 est le bon niveau |
| Musique sans voix | `volumeMusique` 0,1 avec voix, 0,16 sans | elle remonte entre les phrases et à la fin |
| Effets sonores (whoosh, pop) | discrets : crête au moins 12 dB sous celle de la voix | des whooshes trop forts sont le défaut le plus souvent relevé |
| Volume final | -14 LUFS, crêtes ≤ -1,5 dBTP | niveau des réseaux sociaux ; `video.mjs` le fait seul (deux passes), `"normaliser": false` pour l'éviter |

Après le rendu, `video.mjs` affiche le niveau obtenu et la crête. L'encodeur AAC fait parfois remonter les crêtes :
l'outil le mesure et baisse légèrement le volume si besoin (on peut alors finir vers -15 LUFS, c'est normal).

## 5. Une musique différente par vidéo

Dans une série, chaque vidéo a sa propre musique, adaptée à son propos. Deux façons :

1. **Gratuite et sans droits** : `musique.mjs` (6 styles) ; `--graine N` donne une variante du même style.
   ```bash
   node moteur/outils/musique.mjs vif 50 mon-projet/musique.wav --graine 3
   ```
2. **Plus riche (payante)** : ElevenLabs Music, instrumental composé à la durée exacte de la vidéo d'après une
   description de l'ambiance (en anglais) :
   ```bash
   node moteur/outils/musique-ia.mjs mon-projet/musique.mp3 --scenario mon-projet/scenario.json \
     --ambiance "Warm Afro-pop instrumental, kalimba and light percussion, positive, 105 BPM"
   ```
   À lancer **après** `voix.mjs` (la durée de la vidéo en dépend). Écrivez l'ambiance selon le propos : tension
   légère pour une arnaque à éviter, piano calme pour un conseil, Afro-pop joyeux pour une offre… Écoutez avant
   le rendu : une génération ratée se refait. Vérifiez que l'offre ElevenLabs du compte autorise l'usage
   commercial.

## 6. Vérifier avant de livrer

- Écouter la voix seule (`voix/voix.mp3`) : prononciation, ton, coupures.
- Images-tests : les sous-titres ne cachent rien d'important (sinon `position: "milieu"` ou `sousTitres: false`
  sur la scène).
- Vidéo finale : écouter le début, un changement de scène et la fin ; la musique ne doit jamais couvrir la voix.
