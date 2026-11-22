# Les briques

Chaque brique s'adapte seule aux formats 16:9, 9:16 et 1:1 et prend les couleurs de la charte. Aperçus :
`catalogue/briques-16x9.png`, `briques-9x16.png`, `briques-1x1.png` (scénario : `exemples/catalogue/scenario.json`).

Conventions : `*mot*` = mot en couleur d'accent (titres) ; `<b>…</b>` = gras (récapitulatif) ; chemins de fichiers
relatifs au scénario ; `icone` = un nom de la liste de [video.md](video.md#3-les-matériaux) ; durées en secondes.
Les durées indiquées sont des minimums confortables.

---

## Ouverture et fermeture

### `intro` — logo, surtitre, titre (5,5 s)
```json
{ "brique": "intro", "duree": 5.5, "surtitre": "Tutoriel 2", "titre": "Gérer les commandes", "sousTitre": "De l'arrivée à la livraison" }
```

### `outro` — logo, « À suivre », signature (6 s)
```json
{ "brique": "outro", "duree": 6, "suite": "Créer un produit", "surtitreSuite": "Prochain tutoriel", "signature": "Une question ? Écrivez-nous." }
```
Tout est facultatif ; `signature` remplace celle de la charte.

### `chapitre` — carte de partie, logo en filigrane (3 s)
```json
{ "brique": "chapitre", "duree": 3, "numero": 2, "titre": "Le paiement" }
```
`surtitre` remplace « Partie N ».

## Texte

### `titre` — grande phrase qui apparaît mot à mot (4–6 s)
```json
{ "brique": "titre", "duree": 4.5, "surtitre": "Nouveauté", "texte": "Le mug qui garde votre thé *chaud*", "sousTexte": "Disponible dès aujourd'hui.", "alignement": "centre", "taille": "grand" }
```
`alignement` : centre | gauche ; `taille` : moyen | grand | geant. 4 à 10 mots.

### `citation` — citation réelle et son auteur (6–8 s)
```json
{ "brique": "citation", "duree": 7, "texte": "…", "auteur": "Awa K.", "role": "Cliente depuis 2024" }
```
Uniquement une citation fournie par l'utilisateur (avis réel, propos réel).

### `carte` — conseil ou mise en garde, 2 à 4 lignes (12–13 s)
```json
{ "brique": "carte", "duree": 12.5, "icone": "alerte", "titre": "À ne pas faire", "lignes": ["…", "…", "…"] }
```

### `appel` — appel à l'action final (5–7 s)
```json
{ "brique": "appel", "duree": 6, "surtitre": "Offre de lancement", "titre": "Commandez le *vôtre*", "bouton": "Écrire sur WhatsApp", "icone": "message",
  "details": [{ "icone": "telephone", "texte": "+226 00 00 00 00" }, { "icone": "lieu", "texte": "Ouagadougou" }] }
```
Coordonnées **fournies** uniquement.

## Données

### `chiffre` — chiffre qui défile puis rebondit (5–6 s)
```json
{ "brique": "chiffre", "duree": 5.5, "surtitre": "En 2025", "valeur": "12 500", "legende": "clientes servies", "source": "registre de la boutique", "compteur": true }
```
La partie numérique de `valeur` défile (« 4,9/5 », « −30 % », « 2 000 FCFA » fonctionnent).

### `barres` — graphique en barres horizontales (6–8 s)
```json
{ "brique": "barres", "duree": 7, "titre": "Ventes par catégorie", "unite": "%", "source": "…",
  "donnees": [{ "libelle": "Tuniques", "valeur": 52, "enAvant": true }, { "libelle": "Ensembles", "valeur": 31 }, { "libelle": "Accessoires", "valeur": 17 }] }
```
`affichage` (texte) remplace la valeur affichée d'une barre. 2 à 6 barres.

### `frise` — 2 à 5 dates sur une ligne (verticale en 9:16) (7–9 s)
```json
{ "brique": "frise", "duree": 8, "titre": "Notre histoire", "etapes": [{ "date": "2019", "libelle": "Premier atelier" }, { "date": "2023", "libelle": "Boutique" }] }
```

## Listes

### `liste` — éléments qui apparaissent un à un (6–9 s)
```json
{ "brique": "liste", "duree": 8, "titre": "Pourquoi nous choisir", "style": "icones",
  "elements": [{ "texte": "Fait main", "icone": "coeur", "detail": "dans notre atelier" }, "Livraison rapide", "Retouches offertes"] }
```
`style` : puces | numeros | icones. 2 à 6 éléments (texte simple ou objet).

### `etapes` — parcours, étape en cours mise en avant (5–7 s)
```json
{ "brique": "etapes", "duree": 6, "titre": "Votre commande", "etapes": ["Choisir", "Envoyer", "Payer", "Recevoir"], "active": 1 }
```
Répétez la brique avec `active` 0, 1, 2… pour faire avancer le parcours.

### `recap` — points à retenir cochés (10–11 s)
```json
{ "brique": "recap", "duree": 11, "titre": "À retenir", "items": ["Adresse : <b>admin.exemple.com</b>", "…"], "surtitre": "Récapitulatif" }
```
3 à 5 points.

## Images

### `photo` — photo plein cadre, zoom lent (4–6 s)
```json
{ "brique": "photo", "duree": 5, "image": "images/atelier.jpg", "focus": { "x": 0.5, "y": 0.4 }, "titre": "Notre atelier", "texte": "…", "credit": "Photo : …" }
```
`focus` : point d'intérêt (fractions) gardé dans le cadre pendant le zoom.

### `galerie` — plusieurs photos (3 s par photo)
```json
{ "brique": "galerie", "duree": 9, "disposition": "diaporama", "images": ["images/a.jpg", { "image": "images/b.jpg", "focus": { "x": 0.5, "y": 0.3 } }], "titre": "La collection" }
```
`disposition` : diaporama (fondus enchaînés) | mosaique (2 à 6 photos en grille).

### `video` — extrait vidéo fourni (MP4)
```json
{ "brique": "video", "duree": 6, "video": "videos/defile.mp4", "debut": 2, "cadre": false, "son": false, "titre": "…" }
```
`debut` : seconde de départ dans le fichier ; `cadre: true` : vidéo dans un cadre arrondi ; `son: true` : garde le son.

### `produit` — fiche produit : photo, nom, points forts, prix (8–9 s)
```json
{ "brique": "produit", "duree": 8.5, "image": "images/tunique.jpg", "focus": { "x": 0.5, "y": 0.35 }, "nom": "Tunique NH16", "accroche": "Brodée à la main.",
  "points": ["Coupe ample", { "texte": "Sur mesure", "icone": "etoile" }], "prix": "45 000 FCFA", "mention": "à partir de", "surtitre": "Nouveauté" }
```
`prix` **fourni** uniquement ; sinon l'omettre.

### `telephone` — capture mobile dans un téléphone (6–8 s)
```json
{ "brique": "telephone", "duree": 7, "image": "captures/mobile.png", "defilerDe": 0, "defilerA": 0.3, "titre": "Commandez depuis votre téléphone", "texte": "…", "cote": "droite" }
```
Capture prise avec `capturer.mjs --mobile` (page entière). `defilerA` : fraction de la hauteur de la capture à faire défiler.

## Écrans de logiciel

### `ecran` — capture 16:10, zooms, cadre, curseur, explications (6,5–8 s par repère)
```json
{ "brique": "ecran", "duree": 33, "image": "captures/connexion.png", "adresse": "admin.exemple.com",
  "reperes": [
    { "at": 0, "titre": "Ouvrez le back-office", "texte": "…" },
    { "at": 7, "image": "captures/connexion-remplie.png", "zoom": { "x": 0.3, "y": 0.28, "w": 0.4, "h": 0.44 }, "zone": { "x": 0.402, "y": 0.471, "w": 0.196, "h": 0.038 }, "titre": "Votre adresse e-mail", "texte": "…" },
    { "at": 13.5, "zone": { "x": 0.402, "y": 0.582, "w": 0.196, "h": 0.038 }, "clic": true, "titre": "Connectez-vous", "texte": "Cliquez sur « Continuer »." }
  ] }
```
Mode d'emploi complet (zones, zoom, pièges) : recette « Tutoriel » de [recettes.md](recettes.md).

## Technique

### `code` — code qui s'écrit, lignes surlignées, annotations (6–8 s)
```json
{ "brique": "code", "duree": 7, "titre": "…", "fichier": "prix.js", "code": "const total = prix * quantite;\nreturn total;", "surligner": [1], "annotations": [{ "ligne": 1, "texte": "calcul du total" }] }
```

### `terminal` — commandes tapées une à une (5–7 s)
```json
{ "brique": "terminal", "duree": 6, "shell": "bash", "dossier": "~/projet", "commandes": ["npm install"], "sortie": ["added 120 packages"] }
```
`sortie` : réelle uniquement (jamais inventée) ; `shell` : bash | powershell.

### `schema` — boîtes reliées par des flèches (6–8 s)
```json
{ "brique": "schema", "duree": 7, "titre": "Comment ça marche", "disposition": "chaine",
  "noeuds": [{ "id": "a", "libelle": "Commande" }, { "id": "b", "libelle": "Atelier" }], "liens": [{ "de": "a", "a": "b", "libelle": "WhatsApp" }] }
```
`disposition` : chaine | etoile (le premier nœud au centre) | comparaison (identifiants `g…` à gauche, `d…` à droite, `titres: ["Avant", "Après"]`).

## Scène libre

### `libre` — votre propre animation en code
```json
{ "brique": "libre", "duree": 5, "fichier": "scenes/Anneaux.tsx", "mot": "45 min", "phrase": "de chaleur" }
```
Tous les autres réglages sont transmis au composant. Voir [motion-design.md](motion-design.md).
