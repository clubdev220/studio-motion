// Sous-titres calés sur la voix : groupes de 3 mots au plus, jamais à cheval sur deux phrases, mot prononcé en couleur
// d'accent. Styles : « karaoke » (texte seul, ombré) ou « pilule » (texte sur un bandeau).
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useCharte } from './charte';
import { typo } from './outils';

export type Mot = { w: string; s: number; e: number };
export type ReglagesSousTitres = { style?: 'karaoke' | 'pilule'; position?: 'bas' | 'milieu'; majuscules?: boolean; mots?: number };

type Groupe = { mots: (Mot & { fin: boolean })[]; debut: number; fin: number };

export function grouper(mots: Mot[], max = 3): Groupe[] {
  const ws: (Mot & { fin: boolean })[] = [];
  for (const x of mots) {
    if (/^[:;!?»,.…]+$/.test(x.w) && ws.length) { const l = ws[ws.length - 1]; l.e = x.e; l.w += x.w; l.fin = l.fin || /[.?!:…]/.test(x.w); continue; }
    ws.push({ ...x, fin: /[.?!:…]["»]?$/.test(x.w) });
  }
  const res: Groupe[] = [];
  let g: typeof ws = [];
  const vider = () => { if (g.length) res.push({ mots: g, debut: g[0].s - 0.05, fin: g[g.length - 1].e + 0.15 }); g = []; };
  for (const x of ws) { g.push(x); if (g.length >= max || x.fin) vider(); }
  vider();
  // un groupe reste affiché jusqu'au suivant s'il y a moins de 0,4 s d'écart (pas de clignotement)
  res.forEach((r, i) => { const n = res[i + 1]; if (n && n.debut - r.fin < 0.4) r.fin = n.debut; });
  return res;
}

export const SousTitres = ({ mots, reglages }: { mots: Mot[]; reglages: ReglagesSousTitres }) => {
  const { c, texte } = useCharte();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const k = Math.min(width, height) / 1080;
  const portrait = height > width * 1.2;
  const g = grouper(mots, reglages.mots ?? 3).find(x => t >= x.debut && t < x.fin);
  if (!g) return null;
  const pilule = reglages.style === 'pilule';
  const apparition = interpolate(t - g.debut, [0, 0.12], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bas = reglages.position === 'milieu' ? height * 0.42 : portrait ? 470 * k : 90 * k;
  const taille = (portrait ? 66 : 54) * k;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 70 * k, right: 70 * k, bottom: bas, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${taille * 0.28}px`, padding: pilule ? `${14 * k}px ${30 * k}px` : 0, borderRadius: 22 * k,
          background: pilule ? `${c.fond}e0` : 'transparent', transform: `scale(${apparition})`, fontFamily: texte, fontWeight: 800, fontSize: taille, lineHeight: 1.15,
          textTransform: reglages.majuscules ? 'uppercase' : 'none', textAlign: 'center' }}>
          {g.mots.map((m, i) => {
            const actif = t >= m.s - 0.03;
            return <span key={i} style={{ color: actif ? c.accent : c.texte, opacity: actif ? 1 : 0.92,
              textShadow: pilule ? 'none' : `0 ${4 * k}px ${18 * k}px rgba(0,0,0,.75), 0 0 ${3 * k}px rgba(0,0,0,.9)` }}>{typo(m.w)}</span>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
