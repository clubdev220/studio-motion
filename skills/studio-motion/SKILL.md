---
name: studio-motion
description: Fabrique des vidéos en motion design de qualité professionnelle (MP4, formats 16:9, 9:16 et 1:1) rendues par du code (Remotion), sans modèle de génération vidéo — tutoriels à captures d'écran, promos produit pour TikTok/Reels/Shorts, vidéos explicatives, chiffres clés, annonces, présentations, témoignages. Bibliothèque de briques animées aux couleurs de la marque, recettes éprouvées, scènes libres en code, musique originale sans droits. À utiliser pour toute demande de vidéo, d'animation, de motion design ou de contenu vidéo pour les réseaux sociaux. Pack évolutif : affiches et documents PDF à venir.
---

# studio-motion

Ce pack produit des visuels de qualité professionnelle **par le code** : l'agent écrit un scénario (JSON) et,
si besoin, ses propres scènes animées (React) ; un moteur éprouvé fabrique l'image. Ne jamais passer par un modèle
de génération vidéo (Veo, Sora, Kling…) : le texte y est déformé, les écrans et les produits inventés, la charte
non respectée.

## Capacités

| Demande | Lire d'abord |
| --- | --- |
| Toute vidéo (tutoriel, promo, explicative, chiffres, annonce, présentation…) | [guides/video.md](guides/video.md) |
| Affiche, visuel pour réseaux sociaux (4:5, 1:1, 9:16, 16:9, A4/A3 à imprimer) | [guides/affiche.md](guides/affiche.md) |
| Document PDF mis en page (plaquette, guide, rapport, proposition, fiche) | [guides/document.md](guides/document.md) |

`guides/video.md` renvoie ensuite vers : [guides/recettes.md](guides/recettes.md) (enchaînements éprouvés),
[guides/briques.md](guides/briques.md) (toutes les briques et leurs réglages) et
[guides/motion-design.md](guides/motion-design.md) (principes et scènes libres).
Catalogue en images : `catalogue/briques-16x9.png`, `briques-9x16.png`, `briques-1x1.png`.

## Avant la première utilisation

Depuis le dossier de ce skill :

```bash
node preparer.mjs
```

Il installe le moteur (`moteur/node_modules`) et télécharge le navigateur de rendu. Il faut Node.js 18 ou plus.
Si un Chrome ou Chromium est déjà installé, on peut l'imposer avec `STUDIO_MOTION_NAVIGATEUR=/chemin/vers/chrome`.

## Règles qui valent pour tout

1. **Aucune information inventée.** Prix, délais, coordonnées, chiffres, avis clients, citations, fonctions d'un
   logiciel : uniquement ce que l'utilisateur fournit ou ce qui est visible sur ses documents. Sinon, demander.
2. **Matériaux réels et autorisés.** Captures, photos et vidéos de l'utilisateur, ou images sous licence libre
   vérifiée et créditée. Données personnelles de vrais clients masquées. Jamais de mot de passe écrit dans un
   fichier : le passer par une variable d'environnement.
3. **Vérifier avant de livrer** : vérificateur automatique, puis images-tests regardées (par vous si vous lisez
   les images, sinon par l'utilisateur), puis rendu complet.
4. **Un rendu à la fois** (`--concurrence 1` par défaut) : les rendus consomment beaucoup de mémoire.
5. **Musique** : uniquement celle composée par `moteur/outils/musique.mjs` (originale, sans droits de tiers), ou
   un fichier fourni par l'utilisateur avec sa licence.
6. **Langue** : textes à l'écran dans la langue de l'utilisateur, orthographe et accents corrects. Le moteur
   ajoute seul les espaces insécables du français.
7. **Licence Remotion** : le moteur vidéo utilise Remotion, gratuit pour les particuliers et les structures de
   3 personnes au plus ; au-delà, une licence d'entreprise est nécessaire (remotion.pro).
