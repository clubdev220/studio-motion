# Faire un document PDF mis en page

Plaquette de présentation, guide pratique, rapport, fiche produit, proposition commerciale, compte rendu : le
document est un **fichier JSON de blocs** (couverture, sections, textes, listes, chiffres, tableaux…) aux couleurs
de la **charte** (la même que pour les vidéos et les affiches). L'outil `document.mjs` **met en page tout seul** :
les blocs remplissent les pages dans l'ordre, les listes et tableaux trop longs sont coupés proprement (en-tête du
tableau répété), un intertitre n'est jamais laissé seul en bas de page, les pages sont numérotées et le sommaire
se remplit avec les bons numéros. Il produit un **PDF vectoriel** (texte sélectionnable, net à l'impression) et,
sur demande, une **image de chaque page** pour la vérification.

Toutes les commandes se lancent depuis le dossier du skill. Exemple complet : `exemples/document/` ; aperçu :
`catalogue/document.png`.

---

## 1. Cadrer la demande

| Question | Pourquoi |
| --- | --- |
| **Quel document**, pour **qui**, pour **quoi faire** ? (convaincre un client, former, rendre compte) | plan et ton |
| Quel **contenu existe** ? (textes, chiffres, photos, captures, tarifs, coordonnées) | rien d'inventé |
| **Imprimé** ou **à l'écran** ? | papier, marges, poids des images |
| Combien de **pages** au plus ? | densité, découpage en sections |

Plan type d'une plaquette (8 à 12 pages) : couverture ; sommaire ; le constat (le problème du lecteur) ; ce que
vous proposez ; comment ça marche (étapes) ; exemples ou réalisations (captures réelles) ; chiffres ou
témoignages réels ; offres ; contact.

## 2. Le fichier

```json
{
  "titre": "Guide de l'atelier",
  "titreCourt": "Maison Verte — guide de l'atelier",
  "charte": "charte.json",
  "papier": "A4",
  "blocs": [
    { "type": "couverture", "surtitre": "Guide pratique", "titre": "Prendre soin de ses plantes *sans stress*", "sousTitre": "…", "auteur": "Maison Verte", "date": "Édition 2025" },
    { "type": "sommaire" },
    { "type": "section", "titre": "Pourquoi ce guide", "intro": "…" },
    { "type": "texte", "texte": "Premier paragraphe…\n\nDeuxième paragraphe…" }
  ]
}
```

Réglages du document :

| Réglage | Rôle |
| --- | --- |
| `titre` | titre du PDF ; `titreCourt` : texte de l'en-tête et du pied de page |
| `charte` | fichier de charte (ou objet) |
| `papier` | `A4` (défaut), `A5` ou `lettre` ; `orientation` : `portrait` (défaut) ou `paysage` |
| `theme` | `clair` (défaut, papier blanc) ou `sombre` (fond de la charte : document à lire à l'écran) |
| `entete` | `false` retire l'en-tête (logo + titre court) |
| `marges` | `[haut, droite, bas, gauche]` en mm (défaut `[18, 18, 20, 18]`) |
| `taille` | taille du texte en points (défaut 10,5) ; `justifier` : `true` pour justifier les paragraphes |
| `tailleSection`, `tailleTitreCouverture` | tailles des titres en points (défaut 24 et 38) |
| `css` | quelques règles CSS en plus (avec parcimonie) |

Dans les textes : `*mot*` = mot en couleur d'accent ; `**mot**` = gras ; une ligne vide sépare deux paragraphes.
L'apostrophe et les espaces de la ponctuation française sont corrigés automatiquement.

## 3. Les blocs

| Bloc | Champs | Remarques |
| --- | --- | --- |
| `couverture` | `surtitre`, `titre`, `sousTitre`, `auteur`, `date`, `image`, `fond` | page entière aux couleurs sombres de la charte ; `image` = photo plein cadre assombrie ; `fond: "clair"` = couverture blanche |
| `sommaire` | `titre` | liste des `section` avec leur numéro de page, remplie automatiquement |
| `section` | `titre`, `intro`, `numero`, `nouvellePage` | ouvre une partie : grand numéro (01, 02…), titre, chapeau ; commence une nouvelle page sauf `nouvellePage: false` |
| `titre` | `texte`, `niveau` (3 ou 4) | intertitre, jamais seul en bas de page |
| `texte` | `texte`, `taille: "grand"` | un ou plusieurs paragraphes (séparés par une ligne vide) |
| `liste` | `points`, `puces` (`coches`, `numeros`, `points`), `icone` | `points` : textes, ou `{ "titre", "texte" }` ; coupée entre deux pages si besoin |
| `chiffres` | `items: [{ "valeur", "legende" }]`, `source` | 2 à 4 chiffres clés en cartes |
| `cartes` | `items: [{ "icone", "titre", "texte" }]`, `colonnes` | 2 à 4 cartes côte à côte (expertises, offres, avantages) |
| `etapes` | `items: [{ "titre", "texte" }]` | méthode, processus : étapes numérotées reliées par un trait |
| `tableau` | `colonnes`, `lignes`, `total`, `alignDroite` (numéros de colonnes), `legende` | tarifs, budget, comparatif ; coupé entre deux pages avec l'en-tête répété |
| `image` | `image`, `legende`, `largeur` (`pleine`, `moitie`), `hauteur` (mm), `cadrage` (`cover`, `contain`) | photo, capture d'écran réelle, schéma |
| `citation` | `texte`, `auteur`, `role` | témoignage réel uniquement |
| `encadre` | `ton` (`info`, `alerte`, `cle`, `conseil`), `titre`, `texte`, `icone` | mise en garde, conseil, point clé |
| `contact` | `titre`, `texte`, `items: [{ "icone", "texte" }]`, `nouvellePage` | bloc final aux couleurs sombres de la charte |
| `saut` | — | force une nouvelle page |
| `html` | `fichier` | fragment HTML libre (mêmes variables CSS que les affiches, unités en mm ou pt) |

Icônes : coche, fleche, etoile, calendrier, lieu, horloge, telephone, message, courriel, lien, info, alerte,
eclair, utilisateur, panier, cadeau, cle, coeur.

## 4. Produire et vérifier

```bash
node moteur/outils/document.mjs mon-projet/document.json --verifier
node moteur/outils/document.mjs mon-projet/document.json mon-projet/document.pdf --apercu /tmp/pages
```

`--apercu` écrit une image par page (`page-01.png`…) et `planche.png` (toutes les pages côte à côte). Regardez-la
(ou montrez-la à l'utilisateur si vous ne lisez pas les images).

| Message | Que faire |
| --- | --- |
| `INFO N pages` | vérifier que c'est le nombre attendu |
| `INFO page N remplie à X %` | le bloc suivant était trop grand : réduire une image (`hauteur`), déplacer un bloc ou l'accepter |
| `ATTENTION un bloc est plus haut qu'une page` | découper le texte en plusieurs blocs, réduire l'image |
| `ATTENTION page N vide` | deux `saut` ou `section` à la suite |
| `ATTENTION police non chargée` | pas d'internet : `polices.fichiers` dans la charte (voir [affiche.md](affiche.md#4-la-charte-compléments-pour-limpression)) |
| `ERREUR image introuvable` | chemin relatif au fichier JSON |

À regarder sur les aperçus : couverture lisible, logo visible sur fond clair (sinon `logoClair` dans la charte),
pas de page presque vide au milieu, tableaux lisibles, orthographe et accents, coordonnées exactes.

## 5. Règles apprises sur des documents livrés

1. **Police lisible pour le texte courant** (Inter, DM Sans, Manrope, Nunito…) : une police de titre très
   stylisée devient illisible en petit. Si la police de la marque l'est, gardez-la pour les titres seulement
   (`polices.titres`) et mettez une police sobre dans `polices.texte`.
2. **Captures réelles, jamais de maquette inventée** d'un logiciel ou d'un site : capturez-les
   (`moteur/outils/capturer.mjs`, données personnelles masquées) ; s'il manque une capture, laissez le bloc de
   côté et dites-le.
3. **Aucun chiffre, prix, client ou témoignage inventé.** Une donnée d'exemple est signalée comme telle.
4. **Une section = une idée**, annoncée par un chapeau d'une ou deux phrases ; des paragraphes courts (3 à 5
   lignes) ; une image ou un bloc visuel au moins toutes les deux pages.
5. **Le lecteur doit savoir quoi faire à la fin** : le bloc `contact` avec des coordonnées complètes et exactes.
6. **Un document à envoyer par WhatsApp ou par e-mail** doit rester léger : images en JPEG de 1600 px de large au
   plus ; visez moins de 10 Mo.

## 6. Livrer

Envoyez le PDF avec : nombre de pages, plan, éléments manquants (captures, chiffres, coordonnées à confirmer).
Gardez le JSON et les images dans le dossier du projet : une mise à jour ne demande que de modifier un bloc et de
relancer la commande.
