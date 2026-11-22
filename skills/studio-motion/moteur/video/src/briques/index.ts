// Registre des briques : nom utilisé dans le scénario (« brique ») → composant
import type { FC } from 'react';
import { LIBRES } from '../libre/_genere';
import { Barres, Chiffre, Frise } from './donnees';
import { Ecran } from './ecran';
import { Chapitre, Intro, Outro } from './habillage';
import { Galerie, Photo, Produit, Telephone, Video } from './images';
import { Etapes, Liste, Recap } from './listes';
import { Code, Schema, Terminal } from './technique';
import { Appel, Carte, Citation, Titre } from './texte';
import { Cinetique } from './cinetique';

export const BRIQUES: Record<string, FC<any>> = {
  intro: Intro, outro: Outro, chapitre: Chapitre,
  titre: Titre, citation: Citation, carte: Carte, appel: Appel,
  chiffre: Chiffre, barres: Barres, frise: Frise,
  liste: Liste, etapes: Etapes, recap: Recap,
  photo: Photo, galerie: Galerie, video: Video, produit: Produit, telephone: Telephone,
  ecran: Ecran,
  code: Code, terminal: Terminal, schema: Schema,
  cinetique: Cinetique,
};

// Briques qui couvrent tout l'écran avec une image : pas de fond de charte derrière
export const PLEIN_CADRE = new Set(['photo', 'galerie', 'video']);

export const trouverBrique = (nom: string, fichier?: string): FC<any> | null => {
  if (nom === 'libre') return fichier ? LIBRES[fichier] ?? null : null;
  return BRIQUES[nom] ?? null;
};
