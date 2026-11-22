# Faire une vidéo

Une vidéo studio-motion est un **montage de scènes**. Chaque scène est une **brique** animée de la bibliothèque
(titre, chiffre, liste, photo, écran de logiciel, appel à l'action…) ou une **scène libre** que vous écrivez en
code quand aucune brique ne convient. Tout prend les couleurs, polices et logo de la **charte** ; la musique est
composée par le pack. Formats : `16:9` (YouTube, site, présentation), `9:16` (TikTok, Reels, Shorts, statuts),
`1:1` (publications carrées).

Toutes les commandes se lancent **depuis le dossier du skill** (celui qui contient `SKILL.md`). Si
`moteur/node_modules` n'existe pas : `node preparer.mjs`.

Exemples complets dans `exemples/` : `tutoriel/` (16:9, captures d'écran), `promo-verticale/` (9:16, sans aucune
capture, avec une scène libre), `catalogue/` (toutes les briques). Lisez celui qui ressemble à votre demande.

---

## 1. Cadrer la demande

Répondez à ces questions (demandez à l'utilisateur ce qui manque, **n'inventez rien**) :

| Question | Pourquoi |
| --- | --- |
| Quel **type** de vidéo ? | choisit la recette (voir [recettes.md](recettes.md)) |
| Pour **où** ? (YouTube, site, TikTok/Reels, WhatsApp, présentation) | choisit le format et la durée |
| Pour **qui**, et quelle **action** attendue à la fin ? | ton, appel à l'action |
| Quels **matériaux** existent ? (captures, photos, vidéos, logo, chiffres, textes) | choisit les briques |
| Quelles **informations exactes** ? (prix, coordonnées, dates, chiffres) | rien d'inventé |

Durées de référence : réseaux sociaux 15–45 s ; promo 30–60 s ; explicative 60–120 s ; tutoriel 1 min 30 à
3 min 30 par sujet. Pour une série : une **vidéo pilote** d'abord, validée par l'utilisateur, puis les autres à
l'identique (en changeant la musique d'une vidéo à l'autre).

Travaillez dans **un dossier de projet** à vous (hors du dossier du skill) :

```
mon-projet/
  charte.json  logo.svg        # étape 2
  images/  captures/  videos/  # étape 3
  scenes/                      # scènes libres éventuelles (.tsx)
  promo.json                   # le scénario (étape 4)
  musique.wav                  # étape 5
```

## 2. La charte (`charte.json`)

```json
{
  "nom": "Ma Marque",
  "couleurs": {
    "fond": "#1a0f09", "surface": "#2e1e14", "surfaceSombre": "#24170f",
    "accent": "#c9995a", "accentClair": "#f1dfbd", "accentProfond": "#875628",
    "texte": "#eee6d8", "texteSecondaire": "#cdbba3"
  },
  "polices": { "titres": "Playfair Display", "texte": "Manrope" },
  "logo": "logo.svg",
  "signature": "Une question ? Notre équipe vous accompagne."
}
```

- La vidéo est **sur fond sombre** : `fond` très foncé, `texte` très clair, `accent` = couleur de la marque
  (cadres, puces, boutons), `accentClair` = titres, `accentProfond` = reflets du fond.
- Reprenez la charte réelle de l'utilisateur : `moteur/outils/charte.mjs` la trouve dans son code ou sur son site,
  ou la construit à partir de ses réponses, avec un aperçu à faire valider (voir [charte.md](charte.md)).
- Polices : Cormorant Garamond, DM Sans, Fraunces, Inter, JetBrains Mono, Lora, Manrope, Montserrat, Nunito,
  Outfit, Playfair Display, Poppins, Raleway, Sora, Space Grotesk (`polices.code` facultatif pour le code).
  Pour en ajouter une : `moteur/video/src/charte.ts`.
- `logo` : SVG ou PNG transparent **lisible sur fond sombre**. `signature` : phrase de l'écran de fin (facultative).

## 3. Les matériaux

**Il n'est pas nécessaire d'avoir des captures d'écran.** Selon le sujet :

| Matériau | Briques | D'où il vient |
| --- | --- | --- |
| Texte seul (idée, message, offre) | `titre`, `liste`, `carte`, `citation`, `appel`, `chapitre` | l'utilisateur |
| Chiffres | `chiffre`, `barres`, `frise` | l'utilisateur, ou une source vérifiée (citer `source`) |
| Photos de produits, de lieux, d'équipe | `photo`, `galerie`, `produit` | l'utilisateur ; ou banque libre (licence vérifiée, `credit`) |
| Vidéos courtes (MP4) | `video` | l'utilisateur |
| Logiciel, site, back-office | `ecran` (16:10), `telephone` (mobile) | captures (ci-dessous) |
| Code, commandes | `code`, `terminal` | l'utilisateur |
| Processus, organisation | `schema`, `etapes`, `frise` | l'utilisateur |
| Illustration, icônes, formes | icônes intégrées (`icone`) ; dessins SVG ; scène libre | dessinés en code |

- Icônes intégrées : cle, info, alerte, coche, etoile, coeur, telephone, message, panier, calendrier, lieu,
  horloge, cadeau, fleche, utilisateur, courriel, lien, eclair.
- Pas de photo ? Préférez le texte animé et les formes dessinées en code à une image générée. Une image générée
  par IA n'est acceptable qu'avec l'accord de l'utilisateur, pour un fond ou une ambiance, **jamais** pour un
  produit réel, une personne réelle ou du texte.
- Formats d'image : PNG, JPEG, WebP ou SVG ; vidéo : MP4.

### Captures d'écran (logiciel, site)

- Écran d'ordinateur (brique `ecran`, **16:10 obligatoire, 1440×900**) :
  `node moteur/outils/capturer.mjs https://… mon-projet/captures/accueil.png`
- Téléphone (brique `telephone`) : `node moteur/outils/capturer.mjs https://… mobile.png --mobile`
- Masquer des données personnelles : `--masquer "Awa Traoré=>Client Démo;+22670112233=>+226 00 00 00 00"`
- Pages protégées : petit script Puppeteer ou Playwright **dans un dossier temporaire**, mot de passe lu dans une
  variable d'environnement, jamais écrit. Environnement de test quand il existe ; aucune donnée réelle créée ou
  modifiée sans accord (nommer toute donnée de démonstration « DÉMO »). Le navigateur du pack s'obtient avec
  `cheminNavigateur()` de `moteur/outils/commun.mjs`.
- Fenêtre ou e-mail plus petit que l'écran : `node moteur/outils/cadrer.mjs entree.png sortie.png`.
- Zones à encadrer : voir la recette « Tutoriel » dans [recettes.md](recettes.md) (outil `grille.mjs`).

## 4. Le scénario

Choisissez une recette dans [recettes.md](recettes.md), adaptez-la, puis écrivez le scénario. Chaque brique et
ses réglages : [briques.md](briques.md).

```json
{
  "titre": "Promo mug Forêt",
  "format": "9:16",
  "charte": "charte.json",
  "musique": "musique.wav",
  "scenes": [
    { "brique": "titre", "duree": 4, "texte": "Le mug qui garde votre thé *chaud*", "transition": "zoom" },
    { "brique": "produit", "duree": 8.5, "image": "images/mug.jpg", "nom": "Mug Forêt", "points": ["Garde la chaleur"], "prix": "12 500 FCFA" },
    { "brique": "libre", "duree": 4.5, "fichier": "scenes/Anneaux.tsx", "mot": "45 min" },
    { "brique": "appel", "duree": 6, "titre": "Commandez le *vôtre*", "bouton": "Écrire sur WhatsApp", "icone": "message" }
  ]
}
```

Réglages communs à toutes les scènes :

| Réglage | Rôle |
| --- | --- |
| `brique` | nom de la brique, ou `libre` (avec `fichier`) |
| `duree` | secondes ; les scènes s'enchaînent dans l'ordre |
| `chapitre` | ouvre un chapitre : pastille en haut à gauche et barre de progression (vidéos longues) |
| `transition` | `fondu`, `glisse`, `zoom`, `coupe`, `punch` (zoom-poing) ou `balayage` (bande de couleur) ; par défaut, celles du rythme |
| `fond` | `charte` (défaut), `uni`, ou `{ "image": "images/fond.jpg", "assombrir": 0.65 }` |

Haut du scénario : `format`, `rythme` (`pose` par défaut, `dynamique` ou `nerveux` : voir [rythme.md](rythme.md)), `charte` (fichier ou objet), `musique`, `volumeMusique` (0,16 par défaut),
`reperes` (`true`/`false` : pastille, logo discret et barre ; par défaut s'il y a des chapitres).

**Écriture** : phrases courtes, une idée par scène, verbes d'action, mêmes mots que l'écran ou le produit. Mettez
un ou deux mots-clés entre `*astérisques*` (couleur d'accent). Vouvoiement par défaut ; ne genrez pas le
spectateur. Signalez les données fictives (« prix de l'exemple »).

**Rythme** (calibré sur des vidéos validées par un client) : chaque scène reste à l'écran au moins
**1,5 s + nombre de mots ÷ 3,3**, plus le temps de son animation. Le vérificateur le calcule pour vous.

Rien ne convient ? Écrivez une **scène libre** : [motion-design.md](motion-design.md).

## 5. La musique

```bash
node moteur/outils/musique.mjs vif 50 mon-projet/musique.wav
```

Durée = durée de la vidéo + quelques secondes. Styles : `doux` (posé), `entrainant` (marimba), `clair` (cloches,
création), `calme` (piano lent), `vif` (rythmé : promos, réseaux sociaux), `pose` (très calme). Une musique
différente par vidéo d'une série ; `--graine N` donne une variante du même style. Musique plus riche générée
selon le propos de la vidéo (ElevenLabs) : voir [voix.md](voix.md#5-une-musique-différente-par-vidéo).

**Voix off et sous-titres** : ajoutez un texte `voix` à chaque scène ; les scènes prennent alors la durée de la
voix, la musique baisse sous la voix et les sous-titres s'affichent mot à mot. Voir [voix.md](voix.md).

## 6. Vérifier, images-tests, rendu

```bash
node moteur/outils/verifier.mjs mon-projet/promo.json
```

Corrigez toutes les ERREUR ; traitez les ATTENTION (souvent : durée trop courte pour le texte).

```bash
node moteur/outils/video.mjs mon-projet/promo.json /tmp/tests --images-tests auto
```

`auto` = une image au milieu de chaque scène (et de chaque repère d'écran), réunies dans `/tmp/tests/planche.png`
avec le nom de chaque scène. Regardez-la (ou montrez-la à l'utilisateur si vous ne lisez pas les images) :
texte qui déborde ou coupé, élément trop petit, zone mal encadrée, écran vide, donnée personnelle visible.
`--format 9:16` permet d'essayer le même scénario dans un autre format.

Puis le rendu complet (environ 3 à 6 min par minute de vidéo sur une petite machine ; lancez-le en arrière-plan
si vos commandes ont un délai) :

```bash
node moteur/outils/video.mjs mon-projet/promo.json mon-projet/promo.mp4
```

**Un seul rendu à la fois.**

## 7. Livrer

- Contrôlez la durée du fichier et regardez quelques images de la vidéo finale.
- Envoyez la vidéo avec un résumé : format, durée, déroulé, musique (originale, composée par le pack), points à
  valider (données fictives, informations à confirmer).
- Pour une publication : proposez la légende de chaque réseau ([publication.md](publication.md)) et une
  couverture 9:16 ([affiche.md](affiche.md)).
- Série : envoyez chaque vidéo dès qu'elle est prête.

## Dépannage

| Symptôme | Remède |
| --- | --- |
| `Navigateur introuvable` | Pas d'internet pour télécharger Chrome : `STUDIO_MOTION_NAVIGATEUR=/chemin/vers/chromium`. |
| « Brique inconnue » à l'écran | Nom de brique mal écrit : voir [briques.md](briques.md). |
| Texte coupé ou qui déborde | Raccourcir, découper en deux scènes, ou `taille: "moyen"` pour un titre. |
| Écran presque blanc dans un tutoriel | Zoom hérité du repère précédent : donner un `zoom` au repère qui change d'image. |
| Téléphone tout blanc ou minuscule | Capture prise en mode ordinateur : refaire avec `--mobile`. |
| « Police inconnue » | Choisir une police de la liste, ou l'ajouter dans `moteur/video/src/charte.ts`. |
| Scène libre en erreur | Lire le message du rendu ; voir [motion-design.md](motion-design.md). |
| Rendu tué faute de mémoire | Fermer les autres rendus ; garder `--concurrence 1`. |
