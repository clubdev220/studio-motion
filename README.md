# studio-motion

Pack de compétences (« skill ») pour agents IA : vidéos en motion design de qualité professionnelle, fabriquées
**par le code** — tutoriels à captures d'écran, promos produit pour TikTok/Reels/Shorts, vidéos explicatives,
chiffres clés, annonces, présentations, témoignages — en 16:9, 9:16 et 1:1. Aucun modèle de génération vidéo :
le texte reste net, les écrans et les produits sont exacts, la charte est respectée.

Comment ça marche : l'agent écrit un **scénario** (JSON) qui enchaîne des **briques** animées (22 briques : titres,
chiffres, graphiques, listes, photos, fiche produit, téléphone, écran de logiciel, code, schémas, appel à
l'action…) aux couleurs d'une **charte** ; il peut écrire ses propres **scènes libres** en React quand aucune brique
ne convient. Des **recettes** éprouvées guident les modèles moins puissants ; un **vérificateur** et des
**images-tests** contrôlent le résultat avant le rendu ; une **musique originale** est composée par le pack.

Compatible avec tout agent qui lit le format standard des skills (`SKILL.md`) : Claude Code, Codex, Hermes Agent,
OpenClaw, OpenCode, Cursor, Gemini CLI… quel que soit le modèle utilisé (Claude, GPT, DeepSeek, Qwen…).

| Capacité | État |
| --- | --- |
| Vidéos (MP4 16:9, 9:16, 1:1 ; 22 briques, recettes, scènes libres, musique originale) | disponible |
| Affiches et visuels réseaux sociaux (PNG 4:5, 1:1, 9:16, 16:9 ; A4/A3 + PDF ; 6 modèles + mise en page libre) | disponible |
| Documents PDF mis en page (plaquette, guide, rapport : mise en page automatique, sommaire, tableaux) | disponible |
| Voix off calée au mot (ElevenLabs), sous-titres mot à mot, musique qui baisse sous la voix, son normalisé (-14 LUFS) | disponible |
| Trois rythmes (posé, dynamique, nerveux), typographie animée calée sur la voix, scènes libres synchronisées (`useVoix`) | disponible |
| Charte de l'utilisateur trouvée automatiquement (code du projet ou site web) ou construite à partir de ses réponses, avec aperçu à valider | disponible |
| Légendes et hashtags par réseau | disponible |

## Installation

Prérequis : **Node.js 18 ou plus**, **git**, ~1 Go d'espace disque, accès internet la première fois
(téléchargement des dépendances et d'un Chrome de rendu). Facultatif : **ffmpeg** complet (traitement de clarté de
la voix) et une clé **ElevenLabs** dans la variable d'environnement `ELEVENLABS_API_KEY` (voix off, musique
générée).

```bash
git clone <adresse-du-depot> studio-motion
cd studio-motion
node installer.mjs
```

`installer.mjs` détecte les agents installés (`~/.claude`, `~/.codex`, `~/.agents`, `~/.hermes`, `~/.openclaw`),
y crée un lien vers le skill, puis installe le moteur. Variantes :

```bash
node installer.mjs --agents claude,hermes          # agents précis
node installer.mjs --dossier ~/mon-agent/skills    # autre agent : son dossier de skills
node installer.mjs --copier                        # copie au lieu d'un lien
```

Mise à jour : `git pull` (les agents installés par lien voient la nouvelle version tout de suite).

Ensuite, demandez simplement à votre agent : « Fais une promo verticale pour ce produit », « Fais un tutoriel
qui montre comment … », « Fais une vidéo de nos chiffres 2025 »… Il lit `skills/studio-motion/SKILL.md` puis les
guides.

## Contenu

```
skills/studio-motion/
  SKILL.md              point d'entrée lu par l'agent
  guides/video.md       méthode complète pas à pas
  guides/recettes.md    enchaînements éprouvés (tutoriel, promo, explicative, chiffres, annonce…)
  guides/briques.md     les 22 briques et leurs réglages
  guides/motion-design.md  principes d'animation et scènes libres (API « studio-motion »)
  guides/rythme.md      rythmes, typographie animée, mise en scène libre calée sur la voix
  guides/voix.md        voix off calée au mot, sous-titres, mixage, musique propre à chaque vidéo
  guides/affiche.md     affiches et visuels pour les réseaux sociaux
  guides/document.md    documents PDF mis en page
  guides/publication.md légendes et hashtags par réseau
  guides/charte.md      trouver ou construire la charte de l'utilisateur
  catalogue/            aperçu de toutes les briques en 16:9, 9:16 et 1:1
  preparer.mjs          installe le moteur et le navigateur
  moteur/               moteur de rendu (Remotion) et outils en ligne de commande
    video/src/briques/    les briques (React)
    outils/video.mjs      rendu (images-tests + planche, ou MP4 ; --format pour décliner)
    outils/verifier.mjs   contrôle automatique du scénario (temps de lecture, zones, fichiers)
    outils/grille.mjs     grille de coordonnées sur une capture
    outils/cadrer.mjs     mise au format 16:10
    outils/capturer.mjs   capture d'une page web (avec masquage de données)
    outils/musique.mjs    musique d'ambiance originale (6 styles)
    outils/musique-ia.mjs musique instrumentale ElevenLabs à la durée de la vidéo
    outils/voix.mjs       voix off ElevenLabs calée au mot (cache : pas de double facturation)
    outils/audio.mjs      ffmpeg, normalisation du son (-14 LUFS)
    outils/charte.mjs     charte détectée (projet, site) ou construite (couleurs données) + aperçu
    outils/affiche.mjs    affiches (PNG, PDF) à partir d'un modèle et d'une charte
    outils/document.mjs   documents PDF (blocs + charte -> PDF, aperçus des pages)
    outils/html.mjs       socle commun des affiches et documents (charte -> CSS, polices, rendu Chrome)
  exemples/            tutoriel (16:9), promo-verticale (9:16, scène libre), catalogue (toutes les briques),
                       affiches (un exemple par modèle), document (guide de 6 pages)
```

Essai rapide :

```bash
cd skills/studio-motion
node moteur/outils/musique.mjs vif 46 exemples/promo-verticale/musique.wav
node moteur/outils/video.mjs exemples/promo-verticale/scenario.json /tmp/promo.mp4
```

## Licences

- Moteur vidéo : [Remotion](https://www.remotion.dev/license). Gratuit pour les particuliers, les
  associations et les entreprises de **3 personnes au plus** ; au-delà, chaque entreprise qui l'utilise doit
  acheter une licence Remotion.
- Polices : Google Fonts (SIL Open Font License).
- Musiques : composées par `musique.mjs` par synthèse, sans morceau ni échantillon extérieur.
- Code du pack : privé, partagé avec les collaborateurs invités sur le dépôt.
