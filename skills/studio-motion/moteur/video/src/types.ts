export type Zone = { x: number; y: number; w: number; h: number }; // fractions 0–1 d'une image
export type Format = '16:9' | '9:16' | '1:1';
export const FORMATS: Record<Format, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
};

export type Charte = {
  nom: string;
  couleurs: {
    fond: string; surface: string; surfaceSombre: string;
    accent: string; accentClair: string; accentProfond: string;
    texte: string; texteSecondaire: string;
  };
  polices: { titres: string; texte: string; code?: string };
  logo?: string;
  signature?: string;
};

// Une scène : une brique de la bibliothèque (ou « libre ») et ses réglages
export type Scene = {
  brique: string;
  duree: number; // secondes
  chapitre?: string; // ouvre un chapitre (pastille en haut, barre de progression)
  transition?: 'fondu' | 'glisse' | 'zoom' | 'coupe';
  fond?: 'charte' | 'uni' | { image: string; assombrir?: number };
  [reglage: string]: unknown;
};

export type Montage = {
  titre?: string;
  format: Format;
  charte: Charte;
  scenes: Scene[];
  musique?: string;
  volumeMusique?: number;
  reperes?: boolean; // pastille de chapitre, logo discret et barre de progression (oui par défaut s'il y a des chapitres)
  duree?: number; // calculée
};
