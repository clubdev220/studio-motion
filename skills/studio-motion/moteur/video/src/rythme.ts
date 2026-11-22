// Rythmes de montage : ils règlent les transitions, le mouvement de caméra et le temps de lecture minimal.
// « pose » : tutoriels, présentations, prospects qui doivent lire. « dynamique » : réseaux sociaux grand public.
// « nerveux » : vidéos courtes calées sur la voix, un plan toutes les 1 à 2 s.
import { createContext, useContext } from 'react';

export type NomRythme = 'pose' | 'dynamique' | 'nerveux';
export type Rythme = {
  nom: NomRythme;
  fondu: number; // images de transition
  transitions: string[]; // transitions par défaut, en alternance, quand une scène n'en précise pas
  respiration: number; // zoom lent continu sur chaque scène (0,04 = 4 %)
  pas: number; // images entre deux mots qui apparaissent (texte sans voix)
  vitesse: number; // accélération des animations d'entrée des briques
};

export const RYTHMES: Record<NomRythme, Rythme> = {
  pose: { nom: 'pose', fondu: 10, transitions: ['fondu'], respiration: 0, pas: 3, vitesse: 1 },
  dynamique: { nom: 'dynamique', fondu: 7, transitions: ['glisse', 'zoom', 'fondu', 'punch'], respiration: 0.035, pas: 3, vitesse: 1.4 },
  nerveux: { nom: 'nerveux', fondu: 4, transitions: ['punch', 'coupe', 'balayage', 'coupe', 'punch', 'glisse'], respiration: 0.06, pas: 4, vitesse: 2 },
};

export const RythmeCtx = createContext<Rythme>(RYTHMES.pose);
export const useRythme = () => useContext(RythmeCtx);
