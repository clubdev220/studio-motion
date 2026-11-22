// Briques de texte : titre animé, citation, carte de conseil, appel à l'action
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Accent, Icone, OMBRE, PastilleIcone, Surtitre, T, ease, typo, useCharte, useEchelle, useRebond, type NomIcone } from '../outils';

// titre : grande phrase qui apparaît mot à mot ; *mots* en couleur d'accent
export const Titre = ({ texte, surtitre, sousTexte, alignement = 'centre', taille = 'grand' }: { texte: string; surtitre?: string; sousTexte?: string; alignement?: 'centre' | 'gauche'; taille?: 'grand' | 'moyen' | 'geant' }) => {
  const { c, titres, texte: police } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useCurrentFrame();
  const fs = { moyen: 72, grand: 100, geant: 140 }[taille] * (portrait ? 1.05 : 1);
  const n = texte.split(/\s+/).length;
  const gauche = alignement === 'gauche';
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: gauche ? 'flex-start' : 'center', textAlign: gauche ? 'left' : 'center', padding: `0 ${u(portrait ? 80 : 160)}px` }}>
      <Surtitre style={{ marginBottom: u(30) }}>{surtitre}</Surtitre>
      <Accent texte={texte} align={gauche ? 'left' : 'center'} style={{ fontFamily: titres, fontWeight: 700, fontSize: u(fs), lineHeight: 1.12, color: c.accentClair, textShadow: OMBRE, letterSpacing: u(-1) }} />
      {sousTexte ? <div style={{ marginTop: u(36), fontFamily: police, fontWeight: 500, fontSize: u(38), lineHeight: 1.45, color: c.texteSecondaire, maxWidth: u(1300), opacity: ease(frame, 8 + n * 3, 22 + n * 3, 0, 1) }}><T>{sousTexte}</T></div> : null}
    </AbsoluteFill>
  );
};

// citation : grand guillemet, phrase, auteur (citation réelle ou fournie par l'utilisateur uniquement)
export const Citation = ({ texte, auteur, role }: { texte: string; auteur?: string; role?: string }) => {
  const { c, titres, texte: police } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: `0 ${u(portrait ? 90 : 220)}px` }}>
      <div style={{ fontFamily: titres, fontSize: u(240), lineHeight: 0.6, height: u(120), color: c.accent, opacity: ease(frame, 0, 10, 0, 1) }}>“</div>
      <div style={{ fontFamily: titres, fontWeight: 500, fontStyle: 'italic', fontSize: u(portrait ? 60 : 58), lineHeight: 1.35, color: c.texte, textShadow: OMBRE, opacity: ease(frame, 4, 20, 0, 1), transform: `translateY(${ease(frame, 4, 20, u(20), 0)}px)` }}><T>{texte}</T></div>
      {auteur ? <div style={{ marginTop: u(40), fontFamily: police, fontWeight: 600, fontSize: u(32), color: c.accentClair, opacity: ease(frame, 16, 28, 0, 1) }}><T>{`— ${auteur}`}</T></div> : null}
      {role ? <div style={{ marginTop: u(8), fontFamily: police, fontSize: u(26), color: c.texteSecondaire, opacity: ease(frame, 20, 32, 0, 1) }}><T>{role}</T></div> : null}
    </AbsoluteFill>
  );
};

// carte : un conseil ou une mise en garde, lignes révélées une à une
export const Carte = ({ icone = 'info', titre, lignes }: { icone?: NomIcone; titre: string; lignes: string[] }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait, paysage } = useEchelle();
  const r = useRebond();
  const e = r(0, 100, 18);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: paysage ? u(1280) : '88%', padding: `${u(70)}px ${u(portrait ? 60 : 90)}px`, borderRadius: u(22), background: `${c.surface}ee`, border: `1px solid ${c.accent}66`,
        boxShadow: `0 ${u(40)}px ${u(110)}px #000a, 0 0 ${u(90)}px ${c.accent}1f`, opacity: e, transform: `translateY(${(1 - e) * u(50)}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: u(34), marginBottom: u(46) }}>
          <PastilleIcone nom={icone} taille={u(96)} delai={10} />
          <div style={{ fontFamily: titres, fontWeight: 600, fontSize: u(portrait ? 58 : 64), lineHeight: 1.15, color: c.accentClair }}><T>{titre}</T></div>
        </div>
        {lignes.map((l, i) => {
          const a = r(26 + i * 45, 120, 18);
          return (
            <div key={i} style={{ display: 'flex', gap: u(24), alignItems: 'baseline', marginBottom: u(22), opacity: a, transform: `translateX(${(1 - a) * u(30)}px)` }}>
              <div style={{ width: u(12), height: u(12), borderRadius: u(6), background: c.accent, flexShrink: 0, transform: `translateY(${-u(6)}px)` }} />
              <div style={{ fontFamily: texte, fontWeight: 500, fontSize: u(38), lineHeight: 1.45, color: c.texte }}><T>{l}</T></div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// appel : appel à l'action final (bouton qui pulse) et coordonnées FOURNIES par l'utilisateur
export const Appel = ({ titre, bouton, icone = 'fleche', details = [], surtitre }: { titre: string; bouton?: string; icone?: NomIcone; details?: { icone?: NomIcone; texte: string }[]; surtitre?: string }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useCurrentFrame();
  const r = useRebond();
  const b = r(24, 140, 12);
  const pulse = 1 + 0.035 * Math.sin(Math.max(0, frame - 40) / 7);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `0 ${u(portrait ? 80 : 200)}px` }}>
      <Surtitre style={{ marginBottom: u(26) }}>{surtitre}</Surtitre>
      <Accent texte={titre} style={{ fontFamily: titres, fontWeight: 700, fontSize: u(portrait ? 96 : 90), lineHeight: 1.12, color: c.accentClair, textShadow: OMBRE }} />
      {bouton ? (
        <div style={{ marginTop: u(56), display: 'flex', alignItems: 'center', gap: u(18), padding: `${u(26)}px ${u(48)}px`, borderRadius: u(999), background: c.accent, color: c.fond,
          fontFamily: texte, fontWeight: 700, fontSize: u(40), transform: `scale(${b * pulse})`, opacity: b, boxShadow: `0 ${u(20)}px ${u(60)}px ${c.accent}55` }}>
          <Icone nom={icone} taille={u(44)} couleur={c.fond} />{typo(bouton)}
        </div>
      ) : null}
      {details.length ? (
        <div style={{ marginTop: u(50), display: 'flex', flexDirection: portrait ? 'column' : 'row', gap: u(portrait ? 22 : 56), justifyContent: 'center' }}>
          {details.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: u(14), fontFamily: texte, fontWeight: 500, fontSize: u(32), color: c.texte, opacity: ease(frame, 40 + i * 8, 52 + i * 8, 0, 1) }}>
              {d.icone ? <Icone nom={d.icone} taille={u(36)} couleur={c.accent} /> : null}<T>{d.texte}</T>
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
