import { createContext, useContext } from 'react';
import { loadFont as cormorant } from '@remotion/google-fonts/CormorantGaramond';
import { loadFont as dmSans } from '@remotion/google-fonts/DMSans';
import { loadFont as fraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as jetbrains } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as inter } from '@remotion/google-fonts/Inter';
import { loadFont as lora } from '@remotion/google-fonts/Lora';
import { loadFont as manrope } from '@remotion/google-fonts/Manrope';
import { loadFont as montserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as nunito } from '@remotion/google-fonts/Nunito';
import { loadFont as outfit } from '@remotion/google-fonts/Outfit';
import { loadFont as playfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as poppins } from '@remotion/google-fonts/Poppins';
import { loadFont as raleway } from '@remotion/google-fonts/Raleway';
import { loadFont as sora } from '@remotion/google-fonts/Sora';
import { loadFont as spaceGrotesk } from '@remotion/google-fonts/SpaceGrotesk';
import type { Charte } from './types';

// Polices disponibles (Google Fonts, licence SIL OFL). Pour en ajouter une : l'importer ici et l'ajouter à la table.
const W = { subsets: ['latin', 'latin-ext'] as ('latin' | 'latin-ext')[] };
export const POLICES: Record<string, () => string> = {
  'Cormorant Garamond': () => cormorant('normal', { weights: ['500', '600', '700'], ...W }).fontFamily,
  'DM Sans': () => dmSans('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  Fraunces: () => fraunces('normal', { weights: ['500', '600', '700'], ...W }).fontFamily,
  'JetBrains Mono': () => jetbrains('normal', { weights: ['400', '600'], ...W }).fontFamily,
  Inter: () => inter('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  Lora: () => lora('normal', { weights: ['500', '600', '700'], ...W }).fontFamily,
  Manrope: () => manrope('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  Montserrat: () => montserrat('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  Nunito: () => nunito('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  Outfit: () => outfit('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  'Playfair Display': () => playfair('normal', { weights: ['500', '600', '700'], ...W }).fontFamily,
  Poppins: () => poppins('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  Raleway: () => raleway('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
  Sora: () => sora('normal', { weights: ['400', '600', '700'], ...W }).fontFamily,
  'Space Grotesk': () => spaceGrotesk('normal', { weights: ['400', '500', '600', '700'], ...W }).fontFamily,
};
const cache: Record<string, string> = {};
export const police = (nom: string) => {
  if (!POLICES[nom]) throw new Error(`Police inconnue : « ${nom} ». Polices disponibles : ${Object.keys(POLICES).join(', ')}`);
  return (cache[nom] ??= POLICES[nom]());
};

export const CHARTE_DEFAUT: Charte = {
  nom: 'Démo',
  couleurs: { fond: '#12151c', surface: '#1d2230', surfaceSombre: '#161a24', accent: '#5b8cff', accentClair: '#dde7ff', accentProfond: '#2c4fb3', texte: '#eef1f6', texteSecondaire: '#b3bccc' },
  polices: { titres: 'Sora', texte: 'Inter' },
};

export type CharteActive = { c: Charte['couleurs']; titres: string; texte: string; code: string; logo?: string; signature?: string };
export const CharteCtx = createContext<CharteActive>({ c: CHARTE_DEFAUT.couleurs, titres: 'serif', texte: 'sans-serif', code: 'monospace' });
export const useCharte = () => useContext(CharteCtx);
