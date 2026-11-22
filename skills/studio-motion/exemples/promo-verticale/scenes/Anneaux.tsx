// Scène libre d'exemple : anneaux concentriques qui s'ouvrent autour d'un mot clé.
// Une scène libre importe « remotion » et l'API « studio-motion » (charte, échelle, animations, textes).
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Accent, ease, useCharte, useEchelle, useRebond } from 'studio-motion';

export default function Anneaux({ mot, phrase }: { mot: string; phrase?: string }) {
  const { c, titres, texte } = useCharte();
  const { u } = useEchelle();
  const frame = useCurrentFrame();
  const r = useRebond();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2, 3].map(i => {
        const s = r(i * 6, 70, 14);
        const taille = u(320 + i * 190) * s;
        return <div key={i} style={{ position: 'absolute', width: taille, height: taille, borderRadius: '50%', border: `${u(3)}px solid ${c.accent}`, opacity: 0.6 - i * 0.12, transform: `rotate(${frame * (i % 2 ? 0.4 : -0.4)}deg)` }} />;
      })}
      <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(130), color: c.accentClair, transform: `scale(${0.6 + 0.4 * r(10, 120, 12)})` }}>{mot}</div>
      {phrase ? <Accent texte={phrase} delai={24} style={{ position: 'absolute', bottom: u(380), left: u(90), right: u(90), fontFamily: texte, fontWeight: 500, fontSize: u(44), color: c.texte, opacity: ease(frame, 20, 30, 0, 1) }} /> : null}
    </AbsoluteFill>
  );
}
