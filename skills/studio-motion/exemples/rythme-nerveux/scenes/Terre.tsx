import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { useCharte, useEchelle, useVoix } from 'studio-motion';

// Une jauge de terre qui sèche, calée sur la voix : « deux centimètres » fait apparaître la mesure, « sèche » vire la couleur
export default function Terre() {
  const { c, titres, texte } = useCharte();
  const { u } = useEchelle();
  const frame = useCurrentFrame();
  const { trouve, ressort, image } = useVoix();
  const iSeche = trouve('sèche'), iDeux = trouve('deux');
  const sec = interpolate(frame, [image(iSeche), image(iSeche) + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const mesure = ressort(iDeux);
  const entree = ressort(0, 140, 16);
  const H = u(760), W = u(420);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: W, height: H, transform: `translateY(${(1 - entree) * u(200)}px)`, opacity: entree }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: u(40), overflow: 'hidden', border: `${u(4)}px solid ${c.accentClair}55` }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', background: `linear-gradient(${c.accentProfond}, #3b2a1d)` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: H * 0.18 * mesure, background: `rgba(222, 190, 140, ${0.35 + sec * 0.6})` }} />
        </div>
        <div style={{ position: 'absolute', left: W + u(30), top: 0, height: H * 0.18 * mesure, borderLeft: `${u(5)}px solid ${c.accent}` }} />
        <div style={{ position: 'absolute', left: W + u(60), top: H * 0.09 - u(60), fontFamily: titres, fontWeight: 800, fontSize: u(110), color: c.accent, opacity: mesure, transform: `scale(${0.6 + 0.4 * mesure})`, whiteSpace: 'nowrap' }}>2 cm</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: -u(130), textAlign: 'center', fontFamily: texte, fontWeight: 700, fontSize: u(54), color: sec > 0.5 ? c.accent : c.texte }}>{sec > 0.5 ? 'SÈCHE → on arrose' : 'humide → on attend'}</div>
      </div>
    </AbsoluteFill>
  );
}
