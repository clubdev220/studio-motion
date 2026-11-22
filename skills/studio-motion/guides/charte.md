# La charte de l'utilisateur (à faire avant toute création)

Vidéos, affiches et documents prennent tous leurs couleurs, polices et logo dans **une même charte**
(`charte.json`). Le pack n'en impose aucune : il faut **celle de l'utilisateur**. Ne commencez jamais une
création avec une charte inventée sans le dire.

## Dans quel ordre la chercher

1. **Une charte existe déjà** : un `charte.json` dans le dossier du projet ou fourni par l'utilisateur → utilisez-la.
2. **L'agent travaille dans le code d'un site ou d'une application de l'utilisateur** : scannez-le (variables CSS,
   configuration Tailwind, thème, polices, fichiers de logo).
   ```bash
   node moteur/outils/charte.mjs mon-projet/charte --projet /chemin/du/code
   ```
3. **L'utilisateur a un site web** : lisez-le (couleurs des boutons et des fonds, variables CSS, polices des titres
   et du texte, logo de l'en-tête).
   ```bash
   node moteur/outils/charte.mjs mon-projet/charte --site https://son-site.com
   ```
4. **Rien de tout cela** : **posez les questions** ci-dessous, puis construisez la charte à partir des réponses.
   ```bash
   node moteur/outils/charte.mjs mon-projet/charte --couleurs "#0a6cff,#ffb703" --nom "Nom de la marque" --logo logo.svg --polices "Poppins,Inter"
   ```
5. **L'utilisateur n'a aucune identité visuelle** et ne veut pas en choisir : proposez une charte sobre (une
   couleur d'accent adaptée au secteur, Inter) **en le disant clairement**, et suggérez de la valider.

Les options se combinent (`--site` + `--logo` + `--nom`, `--projet` + `--couleurs`…) : ce que l'utilisateur
donne explicitement passe avant ce qui est détecté.

## Les questions à poser (cas 4)

Posez-les en une seule fois, simplement :

| Question | Pourquoi |
| --- | --- |
| Le nom de la marque (tel qu'il doit s'écrire) ? | titres, pied de page, écran de fin |
| Le logo ? Idéalement en SVG, sinon PNG sur fond transparent ; une version claire et une version foncée si elles existent | vidéo et affiches sombres = logo clair ; documents et affiches claires = logo foncé |
| La ou les couleurs de la marque (code `#…`, ou « comme sur mon site / ma carte de visite ») ? | couleur d'accent ; une seconde couleur éventuelle |
| Les polices ? (ou « je ne sais pas ») | titres et texte ; à défaut, des polices proches et lisibles |
| Le site web ou une page de réseau social ? | on peut y lire la charte automatiquement |
| Une phrase de signature ou un slogan ? | écran de fin des vidéos |

Si l'utilisateur envoie une **image** (carte de visite, ancienne affiche, capture de son site) et que vous lisez
les images : relevez-y les couleurs et le style, puis passez-les à `--couleurs`.

## Ce que fait l'outil

- Repère la **couleur d'accent** (la plus utilisée parmi les couleurs vives, avec un poids fort pour les noms
  `primary`, `brand`, `accent`, `cta`, et pour les boutons d'un site) et une **seconde couleur** de teinte
  différente.
- Construit la palette complète du pack : **fond sombre** teinté de la marque (ou le fond sombre déjà utilisé par
  la marque), surfaces, texte clair, nuances de l'accent. Signale un accent peu lisible sur le fond.
- Trouve les **polices** (déclarations `font-family`, Google Fonts, `next/font`, Tailwind, polices des titres
  d'un site) et les rapproche de celles du moteur vidéo s'il ne les a pas.
- Trouve le **logo**, le **recadre** au plus près, et le classe : logo clair (pour fond sombre : `logo`) ou logo
  foncé (pour fond clair : `logoClair`). Sans logo clair, le nom de la marque s'affiche en texte sur fond sombre.
- Écrit `charte.json` (avec un champ `origine` : méthode et couleurs trouvées) et **`apercu.png`** : une affiche
  d'essai en thème sombre et en thème clair, et la palette.

## Faire valider

Montrez `apercu.png` à l'utilisateur (ou décrivez la palette si vous ne lisez pas les images) avec ce qui manque
ou a été remplacé (logo, police). Corrigez à sa demande : modifiez `charte.json` directement (une couleur, une
police) ou relancez l'outil avec `--couleurs` / `--polices` / `--logo`. Quand il a validé, retirez
`"aValider": true` du champ `origine`.

Le détail des champs de la charte : [video.md](video.md#2-la-charte-chartejson) (couleurs et polices du moteur
vidéo) et [affiche.md](affiche.md#4-la-charte-compléments-pour-limpression) (logo clair, papier, polices locales).

## Plusieurs marques

Un utilisateur qui gère plusieurs marques garde **une charte par marque**, dans un dossier à lui (par exemple
`~/chartes/<marque>/charte.json`), et indique la bonne dans chaque projet. Ne mélangez jamais deux chartes dans
une même création.
