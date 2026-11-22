# Rythme et mise en scène : du tutoriel posé à la vidéo nerveuse

Une même histoire peut se monter lentement (on lit tout) ou très vite (un plan par idée, le texte frappe au rythme
de la voix). Le pack propose **trois rythmes**, qui changent les transitions, le mouvement de caméra, la vitesse des
animations et le temps de lecture exigé par le vérificateur. Mais le rythme se construit surtout **à l'écriture** :
combien de scènes, combien de mots par scène, quelles images.

## 1. Choisir le rythme

```json
{ "format": "9:16", "rythme": "nerveux", "charte": "charte.json", "voix": { … }, "scenes": [ … ] }
```

| | `pose` (défaut) | `dynamique` | `nerveux` |
| --- | --- | --- | --- |
| Pour | tutoriels, présentations, prospects qui doivent lire, explications détaillées | réseaux sociaux grand public, promos, astuces | vidéos courtes TikTok/Reels/Shorts, accroches, séries d'astuces |
| Durée d'un plan | 4 à 13 s | 2 à 5 s | **1 à 3 s** |
| Texte à l'écran | phrases complètes | phrases courtes | **mots-clés** (la voix explique) |
| Voix off | facultative | conseillée | **indispensable** (avec sous-titres) |
| Transitions par défaut | fondu | glisse, zoom, fondu, punch en alternance | punch, coupe, balayage, glisse en alternance |
| Caméra | fixe | respiration lente (zoom de 3,5 %) | respiration marquée (6 %), alternée d'un plan à l'autre |
| Animations d'entrée des briques | normales | 1,4 × plus vite | 2 × plus vite |
| Temps de lecture minimal | 1,5 s + mots ÷ 3,3 | 0,9 s + mots ÷ 3,8 | 0,5 s + mots ÷ 4,5 |
| Musique (`musique.mjs`) | `doux`, `calme`, `pose` | `entrainant`, `clair` | `vif` |
| Voix (`vitesse`) | 1 | 1,05 | 1,1 |

Un plan peut toujours imposer sa transition (`"transition": "fondu"`), et une scène sa durée minimale (`duree`).

## 2. Écrire une vidéo nerveuse

Le secret : **beaucoup de scènes courtes**, chacune avec **3 à 12 mots de voix**. La scène change exactement au
moment où la phrase suivante commence (voir [voix.md](voix.md)). Une vidéo de 45 s compte 20 à 30 plans.

Structure qui marche (vidéos courtes publiées) :

| Moment | Durée | Ce qu'on montre |
| --- | --- | --- |
| **Accroche** | 1,5 à 3 s | une question, un chiffre, une promesse ; `cinetique` style `impact` |
| Annonce | 1 à 2 s | « 3 erreurs », « 5 niveaux » : `chiffre` ou `cinetique` style `mot` |
| Corps : un point = 2 à 4 plans | 4 à 8 s par point | le titre du point (`cinetique` `empile`), puis une **image** de l'idée (scène libre, `produit`, `ecran`, `schema`), puis la conséquence ou l'exemple |
| Le déclic | 2 à 4 s | la phrase à retenir, en grand |
| Fin | 2 à 3 s | une action simple : commenter un chiffre, enregistrer, s'abonner ; `appel` |

Règles :
- **Les 2 premières secondes décident** : pas de logo, pas de « bonjour », on entre directement dans le sujet.
- **Quelque chose change toutes les 1 à 2 s** : nouveau plan, mot qui apparaît, objet qui entre, zoom.
- **Un plan = une idée.** Si une phrase porte deux idées, coupez-la en deux scènes.
- **Montrer plutôt que répéter** : quand la voix dit « une facture », l'écran montre une facture (scène libre),
  pas le mot « facture ».
- **Varier** : ne pas enchaîner trois `cinetique` ; alterner texte, objet animé, chiffre, écran.
- **Les sous-titres** restent actifs, sauf sur les plans `cinetique` (coupés automatiquement) et ceux qui
  affichent déjà la phrase (`"sousTitres": false` sur la scène).

## 3. La typographie animée : brique `cinetique`

Le texte apparaît **mot à mot, à l'instant où la voix le prononce**.

```json
{ "brique": "cinetique", "style": "impact", "texte": "Tes plantes *meurent* ?", "voix": "Tes plantes meurent ?" }
```

| Réglage | Rôle |
| --- | --- |
| `style` | `empile` (la phrase se construit mot à mot), `impact` (1 à 3 mots énormes qui se remplacent, coupés à la ponctuation), `mot` (un seul mot géant à la fois) |
| `texte` | ce qui s'affiche (`*mots*` en accent, soulignés quand ils sont dits) ; sans `texte`, ce sont les mots de la voix |
| `majuscules` | vrai par défaut pour `impact` et `mot` |
| `taille`, `alignement` (`centre`, `gauche`), `couleur` (`texte`, `accent`), `surtitre`, `icone` | facultatifs |

Le `texte` peut être plus court que la voix (les mots-clés seulement) : les instants sont répartis sur la phrase.
Sans voix off, les mots arrivent à intervalle régulier selon le rythme.

## 4. Sortir du cadre : scènes libres calées sur la voix

Les briques sont un point de départ. Pour une vidéo qui ne ressemble à aucune autre, écrivez vos **scènes libres**
(voir [motion-design.md](motion-design.md)) et calez chaque mouvement sur un mot avec `useVoix()` :

```tsx
import { AbsoluteFill } from 'remotion';
import { useCharte, useEchelle, useVoix } from 'studio-motion';

export default function Facture() {
  const { c } = useCharte();
  const { u } = useEchelle();
  const { trouve, ressort } = useVoix();
  const photo = ressort(trouve('photo'));     // la carte entre quand la voix dit « photo »
  const tableau = ressort(trouve('tableau'));  // le tableau apparaît sur « tableau »
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `translateY(${(1 - photo) * u(600)}px) rotate(${(1 - photo) * -8}deg)`, opacity: photo /* … */ }} />
      <div style={{ transform: `scale(${tableau})` /* … */ }} />
    </AbsoluteFill>
  );
}
```

Idées de plans qui fonctionnent (à dessiner en code, aux couleurs de la charte) :
- **Objets qui entrent en ressort** sur le mot qui les nomme : carte, téléphone, document, icône, bulle de message.
- **Compteur** qui défile jusqu'au chiffre annoncé ; **jauge** ou **barre** qui se remplit.
- **Escalier ou niveaux** : un personnage (rond, pastille) qui monte d'une marche à chaque niveau cité.
- **Avant / après** : l'écran se coupe en deux, l'après glisse sur l'avant.
- **Liste qui se coche** : chaque coche tombe au moment où l'élément est dit.
- **Notification** qui glisse du haut de l'écran (heure, appli, message) pour une histoire « pendant que tu dors ».
- **Zoom-poing** (`punch`) sur le mot-clé, **flèche qui se trace** vers l'élément important.
- **Tableau qui se remplit** ligne par ligne, total en accent à la fin.

Jamais de fausse interface d'un vrai logiciel ou d'une vraie marque : dessinez des objets génériques, ou utilisez
de vraies captures (`ecran`, `telephone`).

## 5. Vérifier le rythme

- `verifier.mjs` signale, en `nerveux`, les plans de plus de 4,5 s (à découper).
- Images-tests (`--images-tests auto`) : chaque plan doit être compréhensible sur une seule image.
- Regardez la vidéo **sans le son** (les sous-titres et le texte suffisent-ils ?) puis **avec** (la voix et les
  images disent-elles la même chose au même moment ?).
