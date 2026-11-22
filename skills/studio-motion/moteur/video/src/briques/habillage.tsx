// Ouverture, fermeture et carte de chapitre
import { AbsoluteFill } from 'remotion';
import { Filet, Logo, OMBRE, Surtitre, T, ease, useCharte, useEchelle, useRebond, useImage } from '../outils';

// intro : logo, surtitre, titre, sous-titre
export const Intro = ({ surtitre, titre, sousTitre }: { surtitre?: string; titre: string; sousTitre?: string }) => {
  const { c, titres, texte, logo } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const r = useRebond();
  const l = r(0, 90, 20), ti = r(32, 110, 18);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `0 ${u(90)}px` }}>
      {logo ? <Logo width={u(portrait ? 420 : 330)} style={{ opacity: l, transform: `translateY(${(1 - l) * u(30)}px) scale(${0.9 + l * 0.1})`, marginBottom: u(34) }} /> : null}
      <Filet t={ease(frame, 18, 40, 0, 1)} width={u(220)} />
      <Surtitre style={{ marginTop: u(34), letterSpacing: u(8), opacity: ease(frame, 24, 38, 0, 1) }}>{surtitre}</Surtitre>
      <div style={{ marginTop: u(18), fontFamily: titres, fontWeight: 600, fontSize: u(portrait ? 110 : 96), lineHeight: 1.1, color: c.accentClair, textShadow: OMBRE, opacity: ti, transform: `translateY(${(1 - ti) * u(40)}px)` }}>
        <T>{titre}</T>
      </div>
      {sousTitre ? <div style={{ marginTop: u(22), fontFamily: texte, fontWeight: 500, fontSize: u(34), lineHeight: 1.4, color: c.texteSecondaire, opacity: ease(frame, 50, 64, 0, 1) }}><T>{sousTitre}</T></div> : null}
    </AbsoluteFill>
  );
};

// outro : logo, « À suivre » + titre suivant, signature
export const Outro = ({ suite, surtitreSuite, signature }: { suite?: string; surtitreSuite?: string; signature?: string }) => {
  const ch = useCharte();
  const { c, titres, texte } = ch;
  const { u } = useEchelle();
  const frame = useImage();
  const l = useRebond()(0, 90, 20);
  const sig = signature ?? ch.signature;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `0 ${u(90)}px` }}>
      <Logo width={u(300)} style={{ opacity: l, transform: `scale(${0.9 + l * 0.1})`, marginBottom: u(40) }} />
      <Filet t={ease(frame, 12, 34, 0, 1)} width={u(220)} />
      {suite ? (
        <div style={{ marginTop: u(40), opacity: ease(frame, 20, 36, 0, 1) }}>
          <Surtitre>{surtitreSuite ?? 'À suivre'}</Surtitre>
          <div style={{ marginTop: u(14), fontFamily: titres, fontWeight: 600, fontSize: u(58), color: c.accentClair }}><T>{suite}</T></div>
        </div>
      ) : null}
      {sig ? <div style={{ marginTop: u(44), fontFamily: texte, fontWeight: 500, fontSize: u(28), color: c.texteSecondaire, opacity: ease(frame, 34, 50, 0, 1) }}><T>{sig}</T></div> : null}
    </AbsoluteFill>
  );
};

// chapitre : numéro et titre de partie, logo en filigrane qui tourne lentement
export const Chapitre = ({ numero, titre, surtitre }: { numero?: number; titre: string; surtitre?: string }) => {
  const { c, titres, logo } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const s = useRebond()(0, 110, 18);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${u(portrait ? 90 : 180)}px` }}>
      {logo ? <Logo width={u(820)} style={{ position: 'absolute', right: u(-160), top: u(120), opacity: 0.06, transform: `rotate(${frame * 0.12}deg)` }} /> : null}
      <Surtitre style={{ fontSize: u(30), letterSpacing: u(8) }}>{surtitre ?? (numero ? `Partie ${numero}` : undefined)}</Surtitre>
      <div style={{ marginTop: u(20), fontFamily: titres, fontWeight: 700, fontSize: u(portrait ? 96 : 110), lineHeight: 1.05, color: c.accentClair, textShadow: OMBRE, transform: `translateX(${(1 - s) * u(-60)}px)`, opacity: s }}><T>{titre}</T></div>
      <div style={{ marginTop: u(40), width: s * u(380), height: u(8), borderRadius: u(4), background: `linear-gradient(90deg, ${c.accent}, ${c.accentProfond})` }} />
    </AbsoluteFill>
  );
};
