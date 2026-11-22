// Composition « Montage » : enchaîne les scènes du scénario (briques ou scènes libres) avec transitions,
// fond de charte, repères de chapitre, logo discret, barre de progression et musique.
import { AbsoluteFill, Audio, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CharteCtx, police, useCharte, type CharteActive } from './charte';
import { PLEIN_CADRE, trouverBrique } from './briques';
import { Logo, media, rgb } from './outils';
import type { Montage as MontageProps, Scene } from './types';

const FONDU = 10;

const FondCharte = () => {
  const { c } = useCharte();
  const frame = useCurrentFrame();
  const d = Math.sin(frame / 90) * 4;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at ${22 + d}% 0%, ${c.accent}26 0%, transparent 55%), radial-gradient(ellipse at ${88 - d}% 100%, ${c.accentProfond}30 0%, transparent 52%), ${c.fond}` }} />;
};

const FondScene = ({ fond }: { fond: Scene['fond'] }) => {
  const { c } = useCharte();
  if (!fond || fond === 'charte') return null; // le fond de charte global est déjà là
  if (fond === 'uni') return <AbsoluteFill style={{ background: c.fond }} />;
  return (
    <AbsoluteFill>
      <Img src={media(fond.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <AbsoluteFill style={{ background: `rgba(${rgb(c.fond)},${fond.assombrir ?? 0.65})` }} />
    </AbsoluteFill>
  );
};

// Entrée et sortie de chaque scène
const Transition = ({ duree, type, children }: { duree: number; type: Scene['transition']; children: React.ReactNode }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  if (type === 'coupe') return <AbsoluteFill>{children}</AbsoluteFill>;
  const o = interpolate(frame, [0, FONDU, duree - FONDU, duree], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const entree = interpolate(frame, [0, FONDU + 4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tr = type === 'glisse' ? `translateX(${entree * width * 0.08}px)` : type === 'zoom' ? `scale(${1 + entree * 0.08})` : undefined;
  return <AbsoluteFill style={{ opacity: o, transform: tr }}>{children}</AbsoluteFill>;
};

const Introuvable = ({ nom }: { nom: string }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: '#400', color: '#fff', fontSize: 48, fontFamily: 'sans-serif' }}>Brique inconnue : {nom}</AbsoluteFill>
);

// Pastille de chapitre, logo discret, barre de progression (masqués sur l'intro et la fin)
const Reperes = ({ chapitres, debut, fin }: { chapitres: { titre: string; start: number }[]; debut: number; fin: number }) => {
  const { c, texte } = useCharte();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const k = Math.min(width, height) / 1080;
  const t = frame / fps;
  const visible = interpolate(t, [debut, debut + 0.4, fin - 0.4, fin], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const idx = chapitres.reduce((acc, ch, i) => (t >= ch.start ? i : acc), -1);
  const cur = chapitres[idx];
  const o = cur ? interpolate((t - cur.start) * fps, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  const portrait = height > width * 1.2;
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      {cur ? (
        <div style={{ position: 'absolute', left: 80 * k, top: (portrait ? 90 : 34) * k, display: 'flex', alignItems: 'center', gap: 14 * k, padding: `${10 * k}px ${22 * k}px`, borderRadius: 999, background: `${c.surface}cc`,
          border: `1px solid ${c.accent}40`, opacity: o, fontFamily: texte, fontSize: 22 * k, fontWeight: 600, color: c.texte }}>
          <span style={{ color: c.accent }}>{String(idx + 1).padStart(2, '0')}</span>{cur.titre}
        </div>
      ) : null}
      <Logo width={120 * k} style={{ position: 'absolute', right: 80 * k, top: (portrait ? 80 : 22) * k, opacity: 0.9 }} />
      {chapitres.length ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6 * k, display: 'flex', gap: 4, background: '#00000055' }}>
          {chapitres.map((ch, i) => {
            const end = chapitres[i + 1]?.start ?? fin;
            const fill = Math.max(0, Math.min(1, (t - ch.start) / Math.max(0.1, end - ch.start)));
            return <div key={i} style={{ flex: end - ch.start, background: `${c.texte}1f`, position: 'relative' }}><div style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, background: i === idx ? c.accentClair : c.accent }} /></div>;
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Montage = ({ charte, scenes, musique, volumeMusique, reperes }: MontageProps) => {
  const active: CharteActive = { c: charte.couleurs, titres: police(charte.polices.titres), texte: police(charte.polices.texte), code: police(charte.polices.code ?? 'JetBrains Mono'), logo: charte.logo, signature: charte.signature };
  const { fps, durationInFrames } = useVideoConfig();
  const starts: number[] = [];
  scenes.reduce((s, sc, i) => { starts[i] = s; return s + sc.duree; }, 0);
  const chapitres = scenes.map((s, i) => (s.chapitre ? { titre: s.chapitre, start: starts[i] } : null)).filter(Boolean) as { titre: string; start: number }[];
  const iDebut = scenes.findIndex(s => s.brique !== 'intro');
  const iFin = scenes.map(s => s.brique).lastIndexOf('outro');
  const debut = starts[Math.max(0, iDebut)] ?? 0;
  const fin = iFin > 0 ? starts[iFin] : durationInFrames / fps;
  const montrer = reperes ?? chapitres.length > 0;
  return (
    <CharteCtx.Provider value={active}>
      <AbsoluteFill style={{ background: charte.couleurs.fond }}>
        <FondCharte />
        {scenes.map((sc, i) => {
          const from = Math.round(starts[i] * fps);
          const to = i === scenes.length - 1 ? durationInFrames : Math.round((starts[i] + sc.duree) * fps);
          const d = Math.max(1, to - from + (sc.transition === 'coupe' ? 0 : FONDU));
          const { brique, duree: _d, chapitre: _c, transition, fond, ...reglages } = sc;
          const Comp = trouverBrique(brique, brique === 'libre' ? (sc.fichier as string) : undefined);
          return (
            <Sequence key={i} from={from} durationInFrames={d} name={`${i + 1}. ${brique}`}>
              <Transition duree={d} type={transition}>
                {PLEIN_CADRE.has(brique) ? null : <FondScene fond={fond} />}
                {Comp ? <Comp {...reglages} /> : <Introuvable nom={brique} />}
              </Transition>
            </Sequence>
          );
        })}
        {montrer ? <Reperes chapitres={chapitres} debut={debut} fin={fin} /> : null}
        {musique ? <Audio src={media(musique)} volume={(f) => (volumeMusique ?? 0.16) * interpolate(f, [0, 30, durationInFrames - 60, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} /> : null}
      </AbsoluteFill>
    </CharteCtx.Provider>
  );
};
