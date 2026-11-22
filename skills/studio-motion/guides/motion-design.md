# Motion design : principes et scènes libres

## Principes (valables pour toute scène)

1. **Un message par scène.** Si une scène dit deux choses, faites-en deux.
2. **Le temps de lecture d'abord.** 1,5 s + mots ÷ 3,3, plus l'animation. Mieux vaut trop long que trop court.
3. **Hiérarchie** : un élément dominant (titre, chiffre, produit), le reste plus petit et plus pâle
   (`texteSecondaire`). Au plus deux tailles de texte par scène, plus un surtitre.
4. **Entrées échelonnées** : les éléments arrivent l'un après l'autre (décalage de 3 à 10 images), jamais tous
   ensemble. Puis ils **restent immobiles** pour être lus ; le mouvement lent continu (zoom de 4 à 12 %,
   rotation lente) garde la scène vivante.
5. **Courbes douces** : ressorts (`useRebond`) ou `ease` ; jamais de mouvement linéaire brusque, jamais de
   clignotement.
6. **Couleur d'accent avec parcimonie** : un ou deux mots, un bouton, un cadre. Le reste en `texte` et
   `accentClair`.
7. **Marges** : rien à moins de 70 px (en 1080p) des bords ; en 9:16, gardez le haut (≈ 220 px) et le bas
   (≈ 320 px) dégagés pour l'interface des réseaux sociaux.
8. **Variété** : alternez les briques et les dispositions d'une scène à l'autre ; évitez trois scènes de texte
   centré à la suite.
9. **Cohérence** : mêmes transitions, mêmes couleurs, même musique d'un bout à l'autre ; tout vient de la charte.

## Scènes libres

Quand aucune brique ne convient, écrivez un composant React (fichier `.tsx` dans votre dossier de projet) et
appelez-le avec la brique `libre` :

```json
{ "brique": "libre", "duree": 5, "fichier": "scenes/Anneaux.tsx", "mot": "45 min", "phrase": "de chaleur, *testé* à l'atelier" }
```

Les autres réglages de la scène arrivent en **props** du composant. Le fichier :

```tsx
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Accent, ease, useCharte, useEchelle, useRebond } from 'studio-motion';

export default function Anneaux({ mot, phrase }: { mot: string; phrase?: string }) {
  const { c, titres, texte } = useCharte();  // couleurs et polices de la charte
  const { u } = useEchelle();                // u(40) = 40 px en 1080p, quel que soit le format
  const frame = useCurrentFrame();           // image en cours depuis le début de la scène (30 par seconde)
  const r = useRebond();                     // r(debut) : ressort de 0 à 1 qui démarre à l'image `debut`
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2, 3].map(i => {
        const s = r(i * 6, 70, 14);
        const taille = u(320 + i * 190) * s;
        return <div key={i} style={{ position: 'absolute', width: taille, height: taille, borderRadius: '50%',
          border: `${u(3)}px solid ${c.accent}`, opacity: 0.6 - i * 0.12, transform: `rotate(${frame * 0.4}deg)` }} />;
      })}
      <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(130), color: c.accentClair }}>{mot}</div>
      {phrase ? <Accent texte={phrase} delai={24} style={{ position: 'absolute', bottom: u(380), fontFamily: texte, fontSize: u(44), color: c.texte }} /> : null}
    </AbsoluteFill>
  );
}
```

### Ce que l'on peut importer

- `react` et `remotion` (`AbsoluteFill`, `useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `Easing`,
  `Img`, `OffthreadVideo`, `Sequence`…). Aucun autre paquet.
- `studio-motion`, l'API du pack :

| Élément | Rôle |
| --- | --- |
| `useCharte()` | `{ c, titres, texte, code, logo, signature }` ; `c` = couleurs (`fond`, `surface`, `surfaceSombre`, `accent`, `accentClair`, `accentProfond`, `texte`, `texteSecondaire`) |
| `useEchelle()` | `{ u, width, height, portrait, carre, paysage }` ; dimensionnez tout avec `u()` |
| `useRebond()` | `r(debut, raideur = 120, amorti = 18)` → 0 à 1 avec rebond (accéléré selon le rythme) |
| `useVoix()` | `{ mots, trouve("mot"), image(i), ressort(i), actuel, avecVoix }` : caler une animation sur un mot de la voix off (voir [rythme.md](rythme.md#4-sortir-du-cadre--scènes-libres-calées-sur-la-voix)) |
| `useRythme()` | `{ nom, vitesse, respiration, pas }` : adapter une scène libre au rythme choisi |
| `useImage()` | image en cours accélérée selon le rythme (pour des entrées plus vives en `dynamique` et `nerveux`) |
| `ease(frame, a, b, de, vers)` | transition douce entre les images a et b |
| `Accent` | texte mot à mot, `*mots*` en couleur d'accent (`texte`, `style`, `delai`, `pas`, `align`) |
| `T` | texte avec typographie française (`<T>{texte}</T>`) |
| `Surtitre`, `Logo`, `Filet`, `Icone`, `PastilleIcone` | éléments de la charte ; `NOMS_ICONES` liste les icônes |
| `media(chemin)` | adresse d'un fichier du projet pour `Img` / `OffthreadVideo` (les chemins passés en réglages sont déjà convertis : utilisez `media(props.image)`) |
| `OMBRE`, `rgb(hex)` | ombre de texte standard ; couleur « r,g,b » pour `rgba()` |

### Règles des scènes libres

- **Aucune couleur ni police écrite en dur** : tout vient de `useCharte()`. Aucune taille en pixels bruts : `u()`.
- Testez les trois formats si la vidéo sera déclinée (`--format 9:16`, `--format 1:1`).
- Animation **déterministe** : uniquement fonction de `frame` (pas de `Math.random()` sans graine, pas de
  minuterie, pas de requête réseau).
- Le fond de la charte est déjà dessiné derrière la scène ; une scène libre n'a pas besoin de fond.
- Images-tests obligatoires : une scène libre n'a pas été vérifiée par d'autres avant vous.
- Si une scène libre sert souvent, proposez à l'utilisateur d'en faire une brique du pack
  (`moteur/video/src/briques/`, à déclarer dans `briques/index.ts` et dans `outils/verifier.mjs`).
