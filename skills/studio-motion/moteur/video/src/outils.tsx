// Aides communes à toutes les briques. C'est aussi l'API offerte aux scènes « libres » écrites par l'agent :
//   import { useCharte, useEchelle, ease, rebond, T, Accent, Logo, Filet, Icone, media } from 'studio-motion';
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useCharte } from './charte';

export { useCharte };
export { useRythme } from './rythme';
import { RythmeCtx as RythmeCtxInterne } from './rythme';

// Mots de la voix off de la scène en cours (instants en secondes depuis le début de la scène). Vide sans voix.
export type MotVoix = { w: string; s: number; e: number };
export const VoixCtx = createContext<MotVoix[]>([]);
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9%]/g, '');
// Caler une animation sur la voix : image(i) = image où le mot i commence ; trouve("riz") = index du premier mot
// qui contient « riz » ; ressort(i) = ressort 0 → 1 qui part au mot i ; actuel = index du mot prononcé.
export const useVoix = () => {
  const mots = useContext(VoixCtx);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const image = (i: number) => (mots.length ? Math.round(mots[Math.max(0, Math.min(i, mots.length - 1))].s * fps) : 0);
  const trouve = (motif: string, apres = 0) => { const n = norm(motif); const k = mots.findIndex((m, j) => j >= apres && norm(m.w).includes(n)); return k; };
  const ressort = (i: number, raideur = 160, amorti = 14) => spring({ frame: frame - image(i), fps, config: { damping: amorti, stiffness: raideur } });
  const t = frame / fps;
  let actuel = -1;
  mots.forEach((m, j) => { if (t >= m.s - 0.03) actuel = j; });
  return { mots, image, trouve, ressort, actuel, t, avecVoix: mots.length > 0 };
};
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Transition douce d'une valeur entre deux images (frames)
export const ease = (f: number, a: number, b: number, from: number, to: number) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: Easing.inOut(Easing.cubic) });

// Ressort (0 → 1) qui démarre à l'image `debut`
// Image en cours, accélérée selon le rythme (les animations d'entrée vont plus vite en « dynamique » et « nerveux »)
export const useImage = () => {
  const frame = useCurrentFrame();
  return frame * useContext(RythmeCtxInterne).vitesse;
};
export const useRebond = () => {
  const frame = useImage();
  const { fps } = useVideoConfig();
  return (debut = 0, raideur = 120, amorti = 18) => spring({ frame: frame - debut, fps, config: { damping: amorti, stiffness: raideur } });
};

// Échelle : toutes les tailles sont pensées pour un côté court de 1080 px. `u(40)` = 40 px en 1080p.
// `portrait` est vrai en 9:16, `carre` en 1:1.
export const useEchelle = () => {
  const { width, height } = useVideoConfig();
  // En vertical, on grossit un peu tout : la vidéo est regardée sur un téléphone
  const k = (Math.min(width, height) / 1080) * (height > width * 1.2 ? 1.12 : 1);
  return { u: (n: number) => n * k, width, height, portrait: height > width * 1.2, carre: Math.abs(width - height) < 10, paysage: width > height * 1.2 };
};

export const OMBRE = '0 6px 28px rgba(0,0,0,0.55)';
export const rgb = (hex: string) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h.slice(0, 6), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};
export const media = (a: string) => (/^https?:/.test(a) ? a : staticFile(a));

// Typographie française : espaces insécables avant « : ; ? ! » et dans les guillemets ; mots à trait d'union insécables
export const typo = (t: string) => t.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');
export const T = ({ children }: { children: string }) => (
  <>{typo(children).split(/(\S*-\S*)/).map((m, i) => (/-/.test(m) ? <span key={i} style={{ whiteSpace: 'nowrap' }}>{m}</span> : m))}</>
);

// Texte qui apparaît mot à mot ; les mots entre *astérisques* passent en couleur d'accent
export const Accent = ({ texte, style, delai = 0, pas = 3, align = 'center' }: { texte: string; style?: CSSProperties; delai?: number; pas?: number; align?: 'center' | 'left' }) => {
  const { c } = useCharte();
  const r = useRebond();
  let on = false;
  const mots = typo(texte).split(/ +/).filter(Boolean).map((w) => {
    const ouvre = w.startsWith('*'); const acc = on || ouvre;
    if (ouvre) on = true;
    if (/\*[.,!?:; »]*$/.test(w)) on = false;
    return { w: w.replace(/\*/g, ''), acc };
  });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: '0 0.28em', ...style }}>
      {mots.map((x, i) => {
        const s = r(delai + i * pas, 150, 16);
        return <span key={i} style={{ display: 'inline-block', opacity: s, transform: `translateY(${(1 - s) * 0.4}em)`, color: x.acc ? c.accent : undefined }}>{x.w}</span>;
      })}
    </div>
  );
};

// Surtitre en petites capitales espacées
export const Surtitre = ({ children, style }: { children?: string; style?: CSSProperties }) => {
  const { c, texte } = useCharte();
  const { u } = useEchelle();
  const frame = useCurrentFrame();
  if (!children) return null;
  return <div style={{ fontFamily: texte, fontWeight: 700, fontSize: u(26), letterSpacing: u(6), textTransform: 'uppercase', color: c.accent, opacity: ease(frame, 0, 12, 0, 1), ...style }}><T>{children}</T></div>;
};

export const Logo = ({ width, style }: { width: number; style?: CSSProperties }) => {
  const { logo } = useCharte();
  return logo ? <Img src={staticFile(logo)} style={{ width, ...style }} /> : null;
};

// Filet de la couleur d'accent qui se déploie (t de 0 à 1)
export const Filet = ({ t, width = 160, centre = true }: { t: number; width?: number; centre?: boolean }) => {
  const { c } = useCharte();
  return <div style={{ width: width * t, height: 2, background: centre ? `linear-gradient(90deg, transparent, ${c.accent}, transparent)` : c.accent, margin: centre ? '0 auto' : 0 }} />;
};

export type NomIcone = 'cle' | 'info' | 'alerte' | 'coche' | 'etoile' | 'coeur' | 'telephone' | 'message' | 'panier' | 'calendrier' | 'lieu' | 'horloge' | 'cadeau' | 'fleche' | 'utilisateur' | 'courriel' | 'lien' | 'eclair';
const TRACES: Record<NomIcone, ReactNode> = {
  cle: <><circle cx="16" cy="30" r="8" /><path d="M22 24 L38 8 M32 14 L37 19 M28 18 L32 22" /></>,
  info: <><circle cx="24" cy="24" r="17" /><path d="M24 22 V33 M24 15 V15.5" /></>,
  alerte: <><path d="M24 7 L42 39 H6 Z" /><path d="M24 19 V28 M24 33 V33.5" /></>,
  coche: <path d="M10 25 L20 35 L38 13" />,
  etoile: <path d="M24 6 L29.5 18 L42 19.5 L32.5 28 L35.5 41 L24 34.5 L12.5 41 L15.5 28 L6 19.5 L18.5 18 Z" />,
  coeur: <path d="M24 40 C10 30 6 22 9 15 C12 9 20 9 24 16 C28 9 36 9 39 15 C42 22 38 30 24 40 Z" />,
  telephone: <path d="M15 7 L20 7 L23 16 L18.5 19 C20.5 24 24 27.5 29 29.5 L32 25 L41 28 L41 33 C41 37 38 40 34 39.5 C19 37.5 10.5 29 8.5 14 C8 10 11 7 15 7 Z" />,
  message: <><path d="M8 10 H40 V32 H22 L13 39 V32 H8 Z" /><path d="M15 19 H33 M15 25 H27" /></>,
  panier: <><path d="M6 9 H11 L15 31 H37 L41 16 H13" /><circle cx="18" cy="38" r="2.5" /><circle cx="34" cy="38" r="2.5" /></>,
  calendrier: <><rect x="8" y="11" width="32" height="29" rx="3" /><path d="M8 19 H40 M16 7 V14 M32 7 V14" /></>,
  lieu: <><path d="M24 42 C14 30 10 23 10 18 A14 14 0 0 1 38 18 C38 23 34 30 24 42 Z" /><circle cx="24" cy="18" r="5" /></>,
  horloge: <><circle cx="24" cy="24" r="17" /><path d="M24 13 V24 L31 29" /></>,
  cadeau: <><rect x="8" y="18" width="32" height="22" rx="2" /><path d="M6 18 H42 M24 18 V40 M24 18 C20 9 12 10 14 16 M24 18 C28 9 36 10 34 16" /></>,
  fleche: <path d="M8 24 H38 M28 14 L38 24 L28 34" />,
  utilisateur: <><circle cx="24" cy="17" r="8" /><path d="M9 41 C10 31 17 28 24 28 C31 28 38 31 39 41" /></>,
  courriel: <><rect x="7" y="11" width="34" height="26" rx="3" /><path d="M8 13 L24 26 L40 13" /></>,
  lien: <path d="M20 28 L28 20 M18 22 L13 27 A6 6 0 0 0 21 35 L26 30 M30 26 L35 21 A6 6 0 0 0 27 13 L22 18" />,
  eclair: <path d="M27 5 L11 27 H23 L20 43 L37 20 H25 Z" />,
};
export const NOMS_ICONES = Object.keys(TRACES) as NomIcone[];
export const Icone = ({ nom, taille, couleur, epaisseur = 4 }: { nom: NomIcone; taille: number; couleur: string; epaisseur?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" stroke={couleur} strokeWidth={epaisseur} strokeLinecap="round" strokeLinejoin="round">{TRACES[nom] ?? TRACES.info}</svg>
);

// Pastille ronde de la couleur d'accent avec une icône
export const PastilleIcone = ({ nom, taille, delai = 8 }: { nom: NomIcone; taille: number; delai?: number }) => {
  const { c } = useCharte();
  const r = useRebond();
  const s = r(delai, 140, 10);
  return (
    <div style={{ width: taille, height: taille, borderRadius: taille / 2, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`, flexShrink: 0 }}>
      <Icone nom={nom} taille={taille * 0.54} couleur={c.fond} />
    </div>
  );
};
