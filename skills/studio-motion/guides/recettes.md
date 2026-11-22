# Recettes

Des enchaînements éprouvés. Partez de la recette la plus proche, puis adaptez : ajoutez, retirez ou remplacez des
scènes, ou insérez une scène libre. Les durées sont indicatives ; le vérificateur ajuste selon vos textes.

| Recette | Format conseillé | Durée | Matériaux |
| --- | --- | --- | --- |
| [Tutoriel de logiciel](#tutoriel-de-logiciel) | 16:9 | 1 min 30 – 3 min 30 | captures d'écran |
| [Promo produit](#promo-produit) | 9:16 (et 1:1) | 25 – 45 s | photos du produit, prix fourni |
| [Vidéo explicative](#vidéo-explicative) | 16:9 ou 9:16 | 60 – 120 s | texte, schémas, icônes |
| [Chiffres clés / bilan](#chiffres-clés--bilan) | 16:9 ou 1:1 | 30 – 60 s | chiffres fournis |
| [Annonce (événement, offre, ouverture)](#annonce) | 9:16 ou 1:1 | 15 – 30 s | date, lieu, offre fournis |
| [Présentation d'entreprise](#présentation-dentreprise) | 16:9 | 60 – 90 s | photos, histoire, chiffres fournis |
| [Témoignage client](#témoignage-client) | 9:16 ou 1:1 | 15 – 30 s | avis réel, photo autorisée |

---

## Tutoriel de logiciel

Montre pas à pas comment utiliser un logiciel, un site ou un back-office. **Validée par un client** (série de six
tutoriels de back-office) : gardez ce rythme.

| Scène | Durée | Contenu |
| --- | --- | --- |
| `intro` | 5,5 s | surtitre « Tutoriel N », titre = l'action (« Se connecter ») |
| `carte` (facultatif) | 12–13 s | le principe à comprendre avant de commencer (`info`) |
| `ecran` × 2 à 6 | 13–35 s chacun | une action par repère, 6,5 à 8 s par repère ; `chapitre` sur chaque écran |
| `carte` | 12–13 s | la mise en garde importante (`alerte` ou `cle`) |
| `recap` | 10–11 s | 3 à 5 points à retenir |
| `outro` | 6 s | « Prochain tutoriel : … » |

**Captures** : 16:10 (1440×900), un fichier par état utile (formulaire vide, rempli, menu ouvert, fenêtre de
confirmation). Voir [video.md](video.md#captures-décran-logiciel-site).

**Zones** : fractions de l'image `{ "x": gauche, "y": haut, "w": largeur, "h": hauteur }`, de 0 à 1.

```bash
node moteur/outils/grille.mjs captures/accueil.png /tmp/grille.png
node moteur/outils/grille.mjs captures/accueil.png /tmp/controle.png --zones "0.402,0.471,0.196,0.038"
```

La première commande superpose une grille (traits roses tous les 0,1, bleus tous les 0,05) ; la seconde dessine
vos zones en rouge pour contrôle. Sans lecture d'images : calculez les fractions depuis les positions en pixels
(`x / 1440`, `y / 900`), par exemple avec `element.getBoundingClientRect()` dans le script de capture.

**Repères** (`reperes` de la brique `ecran`) :
- `at` : secondes depuis le début de la scène (le premier vaut 0).
- `zoom` : partie à agrandir (w et h ≥ 0,3). Il **reste actif** pour les repères suivants ; plein cadre :
  `{ "x": 0, "y": 0, "w": 1, "h": 1 }`. **Piège** : quand un repère change d'`image`, redonnez un `zoom` adapté,
  sinon l'ancien peut viser une zone vide (écran blanc).
- `zone` : l'élément à encadrer ; `clic: true` : un curseur vient cliquer dessus (boutons, liens, menus).
- `titre` : 2 à 6 mots (48 caractères max) ; `texte` : une ou deux phrases (150 caractères max).

**Écriture** : une action par repère, à l'impératif, boutons nommés exactement comme à l'écran entre guillemets
français (« Cliquez sur « Enregistrer ». »). Dites ce qui se passe ensuite. Signalez les données fictives d'une
capture et les actions irréversibles.

Exemple complet : `exemples/tutoriel/`.

## Promo produit

Donne envie et pousse à commander. Format vertical pour les réseaux sociaux ; refaites-la en 1:1 avec
`--format 1:1` pour les publications.

| Scène | Durée | Contenu |
| --- | --- | --- |
| `titre` (transition `zoom`) | 3,5–4,5 s | l'accroche : le bénéfice, pas le nom (« Le mug qui garde votre thé *chaud* ») |
| `photo` ou `galerie` | 4–9 s | le produit en situation |
| `produit` | 8–9 s | nom, 2 à 3 points forts, prix fourni |
| `chiffre` ou scène libre | 4–5 s | une preuve fournie (note, nombre de clients, durée…) |
| `liste` (`icones`) | 7–8 s | 3 raisons d'acheter |
| `appel` | 5–6 s | bouton (« Écrire sur WhatsApp ») et coordonnées fournies |

Règles : l'accroche dans les 2 premières secondes ; un message par scène ; pas de prix, de promotion ou de délai
non fournis. Musique `vif` ou `entrainant`. Exemple complet : `exemples/promo-verticale/`.

## Vidéo explicative

Fait comprendre une idée, un service ou un fonctionnement, sans captures.

| Scène | Durée | Contenu |
| --- | --- | --- |
| `intro` ou `titre` | 4–5,5 s | la question posée (« Comment commander sur mesure ? ») |
| `titre` | 4–5 s | le problème, en une phrase |
| `schema` / `etapes` / `liste` | 6–8 s chacune | la solution, une étape par scène ; `etapes` répétée avec `active` 0, 1, 2… |
| `chiffre` ou `carte` | 5–12 s | la preuve ou le conseil important |
| `recap` | 10 s | l'essentiel |
| `appel` ou `outro` | 5–6 s | quoi faire maintenant |

Variez les briques d'une scène à l'autre ; une scène libre (formes, icônes animées) rend la vidéo unique.
Musique `doux` ou `clair`.

## Chiffres clés / bilan

| Scène | Durée | Contenu |
| --- | --- | --- |
| `intro` | 5,5 s | « Notre année 2025 » |
| `chiffre` × 2 à 4 | 5–6 s chacune | un chiffre fort par scène, avec `source` si public |
| `barres` | 7 s | une comparaison |
| `frise` | 8 s | les grandes dates |
| `titre` ou `citation` | 5–7 s | le message ou un mot du dirigeant (réel) |
| `outro` | 6 s | remerciement, signature |

Tous les chiffres viennent de l'utilisateur ou d'une source vérifiée. Musique `clair` ou `doux`.

## Annonce

Événement, ouverture, nouvelle collection, offre limitée.

| Scène | Durée | Contenu |
| --- | --- | --- |
| `titre` (`taille: "geant"`, transition `zoom`) | 3,5 s | « Grande *ouverture* » |
| `photo` ou `galerie` | 4–6 s | le lieu, la collection |
| `liste` (`icones` : calendrier, horloge, lieu) | 6–7 s | date, heure, lieu fournis |
| `appel` | 5 s | réserver, venir, écrire |

Musique `vif`. Gardez 15 à 30 s.

## Présentation d'entreprise

| Scène | Durée | Contenu |
| --- | --- | --- |
| `intro` | 5,5 s | nom et promesse |
| `photo` / `galerie` | 5–9 s | l'équipe, l'atelier, les produits (photos autorisées) |
| `frise` | 8 s | l'histoire (dates fournies) |
| `liste` (`icones`) | 8 s | ce que vous faites |
| `chiffre` × 1 à 2 | 5–6 s | preuves fournies |
| `citation` | 7 s | un client ou le fondateur (propos réels) |
| `appel` + `outro` | 6 + 6 s | contact |

Musique `doux` ou `calme`.

## Témoignage client

| Scène | Durée | Contenu |
| --- | --- | --- |
| `titre` | 3,5 s | « Elles nous font confiance » |
| `photo` | 4 s | photo du client **avec son accord**, ou du produit |
| `citation` | 7–9 s | l'avis réel, nom et rôle autorisés |
| `chiffre` (facultatif) | 5 s | note moyenne réelle |
| `appel` | 5 s | « À votre tour » |

Jamais d'avis inventé ni de photo de personne trouvée sur internet.
