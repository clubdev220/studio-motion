# Faire une affiche ou un visuel pour les réseaux sociaux

Une affiche studio-motion est un **fichier JSON** : un **modèle** de mise en page, vos **textes** et la **charte**
(la même que pour les vidéos). L'outil `affiche.mjs` la met en page en HTML/CSS, **ajuste seul** la taille des
titres, **contrôle** le résultat (débordement, texte trop petit, contraste, zones cachées par l'interface des
réseaux) puis l'imprime en PNG avec Chrome. Pour l'impression, il produit aussi un **PDF vectoriel**.

Ne passez pas par un modèle de génération d'images pour l'affiche elle-même : le texte y est déformé et les
informations inventées. Une image générée n'est acceptable qu'avec l'accord de l'utilisateur, pour une ambiance
de fond, jamais pour un produit réel, une personne réelle ou du texte.

Toutes les commandes se lancent depuis le dossier du skill. Exemples complets : `exemples/affiches/` ;
aperçu de tous les modèles : `catalogue/affiches.png`.

---

## 1. Cadrer la demande

| Question | Pourquoi |
| --- | --- |
| Quel **message unique** ? (une offre, un événement, un conseil, un chiffre, un avis) | choisit le modèle |
| Pour **où** ? (Instagram, Facebook, statut WhatsApp, story, impression) | choisit le format |
| Quelle **action** attendue ? (commander, s'inscrire, enregistrer, venir) | texte du bouton |
| Quelles **informations exactes** ? (prix, date, heure, lieu, téléphone, site) | rien d'inventé |
| Quels **visuels** ? (photo du produit, photo du lieu, logo) | image du modèle |

Règle des 3 secondes : quelqu'un qui fait défiler son fil doit comprendre l'affiche en 3 secondes. Un message,
un titre court (3 à 8 mots), une action.

## 2. Formats

| `format` | Taille | Usage |
| --- | --- | --- |
| `4:5` | 1080 × 1350 | publication Instagram, Facebook, LinkedIn (le plus visible dans le fil) |
| `1:1` | 1080 × 1080 | publication carrée, miniature |
| `9:16` | 1080 × 1920 | story, statut WhatsApp, couverture de Reel ou de TikTok |
| `16:9` | 1920 × 1080 | bannière, miniature YouTube, écran |
| `a4`, `a3` | 300 dpi | affiche à imprimer (ajoutez `--pdf` et `"theme": "clair"`) |

En `9:16`, le haut (≈ 220 px) et le bas (≈ 320 px) sont cachés par l'interface des réseaux : l'outil y garde le
contenu à l'écart et signale ce qui déborde. Pour un statut WhatsApp, où rien ne cache l'image, mettez
`"zonesReseaux": false`.

## 3. Les modèles

Champs communs à tous les modèles :

| Champ | Rôle |
| --- | --- |
| `modele` | `annonce`, `offre`, `evenement`, `citation`, `chiffre`, `liste` ou `libre` |
| `format` | voir ci-dessus (ou `--formats` en ligne de commande pour décliner) |
| `charte` | fichier de charte (ou objet), comme pour les vidéos |
| `theme` | `sombre` (défaut, fond de la charte) ou `clair` (papier blanc : impression, documents) |
| `fond` | `charte` (défaut : fond + halos de couleur), `uni`, ou `{ "image": "images/fond.jpg", "assombrir": 0.6 }` |
| `decor` | `false` retire les cercles décoratifs |
| `surtitre` | petite pastille au-dessus du titre (« Nouveau », « Atelier gratuit ») |
| `appel`, `iconeAppel` | texte du bouton et son icône |
| `contact` | liste de `"texte"` ou `{ "icone": "telephone", "texte": "+226 …" }` (pied de page) |
| `mentions` | petite ligne en bas (conditions, « prix de l'exemple »…) |
| `alignement` | `centre` (défaut) ou `haut` |
| `tailleTitre`, `tailleLogo` | tailles de départ en px (base 1080) si le défaut ne convient pas |
| `css` | quelques règles CSS en plus (à utiliser avec parcimonie) |

`*mot*` = mot en couleur d'accent ; `**mot**` = gras ; `\n` = retour à la ligne.
Icônes : coche, fleche, etoile, calendrier, lieu, horloge, telephone, message, courriel, lien, info, alerte,
eclair, utilisateur, panier, cadeau, cle, coeur.

### `annonce` — ouverture, nouveauté, information
```json
{ "modele": "annonce", "format": "4:5", "charte": "charte.json", "surtitre": "Ouverture",
  "titre": "La boutique ouvre *samedi*", "sousTitre": "Plantes, pots et conseils, au cœur du quartier.",
  "image": "images/boutique.jpg",
  "infos": [{ "icone": "calendrier", "texte": "Samedi 6 décembre" }, { "icone": "lieu", "texte": "Rue …" }],
  "appel": "Venez nous voir", "iconeAppel": "fleche" }
```

### `offre` — produit, promotion, prix
```json
{ "modele": "offre", "format": "4:5", "charte": "charte.json", "badge": "-20 %", "surtitre": "Nouveau",
  "titre": "Le mug qui garde votre thé *chaud*", "image": "images/mug.png",
  "points": ["45 min de chaleur", "Lavable en machine"], "prix": "12 500 FCFA", "ancienPrix": "15 600 FCFA",
  "appel": "Commander sur WhatsApp", "iconeAppel": "message",
  "contact": [{ "icone": "telephone", "texte": "+226 00 00 00 00" }] }
```
Photo du produit **détourée** (PNG transparent) de préférence : elle flotte sur un halo de la couleur d'accent.

### `evenement` — atelier, formation, lancement
```json
{ "modele": "evenement", "format": "4:5", "charte": "charte.json", "surtitre": "Atelier gratuit",
  "jour": "14", "mois": "déc.", "titre": "Rempoter sans *stress*", "sousTitre": "Deux heures pour …",
  "programme": [{ "heure": "9 h 00", "texte": "Accueil" }, { "heure": "9 h 30", "texte": "…" }],
  "infos": [{ "icone": "lieu", "texte": "…" }, { "icone": "horloge", "texte": "9 h – 11 h" }],
  "appel": "Je m'inscris", "iconeAppel": "fleche" }
```

### `citation` — témoignage, parole forte
```json
{ "modele": "citation", "format": "1:1", "charte": "charte.json",
  "citation": "J'ai enfin compris pourquoi mes plantes *jaunissaient*.",
  "auteur": "Awa T.", "role": "cliente depuis 2024", "image": "images/awa.jpg" }
```
Uniquement un avis **réel**, avec l'accord de la personne pour son nom et sa photo.

### `chiffre` — un chiffre clé, un bilan
```json
{ "modele": "chiffre", "format": "1:1", "charte": "charte.json", "surtitre": "Bilan 2025",
  "chiffre": "1 240", "legende": "plantes adoptées cette année",
  "autres": [{ "chiffre": "38", "legende": "ateliers" }], "source": "registre de l'association" }
```

### `liste` — conseils, étapes, raisons (carrousel, astuce)
```json
{ "modele": "liste", "format": "4:5", "charte": "charte.json", "surtitre": "Astuce",
  "titre": "3 erreurs qui *tuent* vos plantes",
  "points": [{ "titre": "Trop d'eau", "texte": "Arrosez quand la terre est sèche." }, "Pas assez de lumière"],
  "puces": "numeros", "appel": "Enregistre ce post", "iconeAppel": "etoile" }
```
`puces` : `numeros` (défaut) ou `coches`. 3 à 5 points.

### `libre` — votre propre mise en page
Quand aucun modèle ne convient, écrivez un **fragment HTML** (avec sa balise `<style>`) et appelez-le :
```json
{ "modele": "libre", "format": "4:5", "charte": "charte.json", "fichier": "libre.html" }
```
Le fragment est placé dans la page, sur le fond de la charte. Il dispose :
- des variables CSS `--fond`, `--surface`, `--texte`, `--texteSecondaire`, `--titres`, `--accent`, `--accentFort`,
  `--accentDoux`, `--filet`, `--police-titres`, `--police-texte` ;
- de l'unité `--u` (1 unité = 1 px pour une largeur de 1080) : écrivez `calc(var(--u) * 40)`, jamais `40px` ;
- des classes du pack : `titre`, `sous-titre`, `surtitre`, `bouton`, `em.a`, `info`, `ic`.

Mêmes règles que les scènes libres des vidéos : aucune couleur ni police écrite en dur, images du projet par
chemin relatif (`src="images/…"`), rien de chargé depuis internet à part les polices.

## 4. La charte (compléments pour l'impression)

La charte des vidéos suffit. Pour les affiches et documents, elle accepte en plus :

| Champ | Rôle |
| --- | --- |
| `logoClair` | logo pour fond clair (le `logo` des vidéos est souvent prévu pour un fond sombre) |
| `couleurs.papier`, `couleurs.encre`, `couleurs.encreSecondaire`, `couleurs.surfaceClaire` | thème clair (défaut : blanc, `fond` de la charte, gris) |
| `polices.fichiers` | polices locales, sans internet : `{ "Inter": ["polices/Inter-Regular.ttf", "polices/Inter-Bold.ttf"] }` (la graisse est lue dans le nom du fichier) |

Sans `polices.fichiers`, les polices viennent de Google Fonts : il faut internet. L'outil signale toute police
non chargée.

## 5. Contrôler, puis produire

```bash
node moteur/outils/affiche.mjs mon-projet/affiche.json --verifier
node moteur/outils/affiche.mjs mon-projet/affiche.json mon-projet/affiche.png
node moteur/outils/affiche.mjs mon-projet/affiche.json mon-projet/affiche.png --formats 4:5,1:1,9:16
node moteur/outils/affiche.mjs mon-projet/affiche-a4.json mon-projet/affiche-a4.png --pdf
```

Ce que fait l'outil, dans l'ordre :
1. réduit les titres (`data-ajuster`) jusqu'à 85 % s'ils ne tiennent pas ;
2. si ça ne suffit pas, **retire les éléments secondaires** dans cet ordre : mentions, programme / chiffres
   secondaires, sous-titre, points au-delà du premier (il le dit : `INFO élément retiré faute de place`) ;
3. réduit encore jusqu'à 62 % ; au-delà, **ERREUR** et rien n'est écrit.

| Message | Que faire |
| --- | --- |
| `ERREUR le contenu déborde` | raccourcir le titre, retirer un élément, ou un format plus haut |
| `INFO élément retiré` | normal en déclinaison carrée ou 16:9 ; si l'élément est indispensable, raccourcissez le reste |
| `ATTENTION texte petit` | moins de 22 px (base 1080) : illisible sur téléphone ; raccourcir |
| `ATTENTION texte sous l'interface des réseaux` | en 9:16 : remonter ou raccourcir (ou `zonesReseaux: false` pour un statut) |
| `ATTENTION contraste faible` / `l'accent se lit mal` | foncer `accent` ou éclaircir `fond` dans la charte, ou passer au thème sombre |
| `ATTENTION police non chargée` | pas d'internet : ajouter `polices.fichiers` |

Puis **regardez l'image** (ou montrez-la à l'utilisateur si vous ne lisez pas les images) : hiérarchie claire,
rien de coupé, photo bien cadrée, orthographe et accents, coordonnées exactes.

## 6. Principes de mise en page (pour le modèle libre et les choix de textes)

1. **Un seul élément dominant** (titre, chiffre ou produit), lisible de loin ; tout le reste plus petit.
2. **Trois niveaux de texte au plus** : titre, texte, détails. Une ou deux polices (celles de la charte).
3. **Accent avec parcimonie** : un ou deux mots du titre, le bouton, les icônes.
4. **Marges généreuses** (80 px en 1080) et alignement à gauche par défaut : plus lisible que le centré.
5. **L'action en bas**, sous forme de bouton, avec un verbe (« Commander », « Je m'inscris »).
6. **Coordonnées complètes et exactes** dans le pied : celles fournies, jamais devinées.
7. **Une série** (carrousel, campagne) : même modèle, même charte, même position du logo ; ne changent que les
   textes et les images.

## 7. Livrer

Envoyez les images (et le PDF pour l'impression) avec : format, ce qui a été retiré ou réduit automatiquement,
points à valider (prix, dates, coordonnées, données d'exemple). Pour une publication, proposez aussi la légende
(voir [publication.md](publication.md)).
