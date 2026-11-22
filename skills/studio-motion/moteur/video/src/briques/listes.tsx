// Briques de listes : liste à puces / numérotée / à icônes, étapes, récapitulatif
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { Icone, OMBRE, Surtitre, T, ease, typo, useCharte, useEchelle, useRebond, type NomIcone, useImage } from '../outils';

type Element = string | { texte: string; detail?: string; icone?: NomIcone };
const norm = (e: Element) => (typeof e === 'string' ? { texte: e } : e);

// liste : éléments qui apparaissent l'un après l'autre (puces, numéros ou icônes)
export const Liste = ({ titre, surtitre, elements, style = 'puces' }: { titre?: string; surtitre?: string; elements: Element[]; style?: 'puces' | 'numeros' | 'icones' }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const { durationInFrames } = useVideoConfig();
  const r = useRebond();
  const pas = Math.min(36, (durationInFrames * 0.5) / Math.max(1, elements.length));
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${u(portrait ? 80 : 260)}px` }}>
      <Surtitre style={{ marginBottom: u(16) }}>{surtitre}</Surtitre>
      {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(portrait ? 76 : 70), lineHeight: 1.12, color: c.accentClair, textShadow: OMBRE, marginBottom: u(56), opacity: ease(frame, 0, 12, 0, 1) }}><T>{titre}</T></div> : null}
      {elements.map((brut, i) => {
        const e = norm(brut);
        const a = r(12 + i * pas, 120, 16);
        const marque = style === 'numeros'
          ? <div style={{ width: u(64), height: u(64), borderRadius: u(32), background: c.accent, color: c.fond, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: titres, fontWeight: 700, fontSize: u(32), flexShrink: 0 }}>{i + 1}</div>
          : style === 'icones'
            ? <div style={{ width: u(72), height: u(72), borderRadius: u(18), background: `${c.accent}22`, border: `1px solid ${c.accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icone nom={e.icone ?? 'coche'} taille={u(42)} couleur={c.accent} /></div>
            : <div style={{ width: u(16), height: u(16), borderRadius: u(8), background: c.accent, flexShrink: 0, marginTop: u(4) }} />;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: u(32), marginBottom: u(34), opacity: a, transform: `translateX(${(1 - a) * u(40)}px)` }}>
            {marque}
            <div>
              <div style={{ fontFamily: texte, fontWeight: 600, fontSize: u(44), lineHeight: 1.3, color: c.texte }}><T>{e.texte}</T></div>
              {e.detail ? <div style={{ marginTop: u(6), fontFamily: texte, fontSize: u(30), lineHeight: 1.4, color: c.texteSecondaire }}><T>{e.detail}</T></div> : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// etapes : parcours numéroté ; les étapes passées sont cochées, l'étape `active` est mise en avant
export const Etapes = ({ titre, etapes, active = 0 }: { titre?: string; etapes: string[]; active?: number }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const r = useRebond();
  const pop = r(14 + etapes.length * 4, 140, 14);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${u(portrait ? 70 : 220)}px` }}>
      <Surtitre style={{ marginBottom: u(18) }}>{`Étape ${active + 1} sur ${etapes.length}`}</Surtitre>
      {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(62), color: c.accentClair, textShadow: OMBRE, marginBottom: u(46), opacity: ease(frame, 2, 14, 0, 1) }}><T>{titre}</T></div> : null}
      {etapes.map((it, i) => {
        const a = r(8 + i * 4, 120, 18);
        const fait = i < active, encours = i === active;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: u(28), padding: `${u(18)}px ${u(28)}px`, marginBottom: u(14), borderRadius: u(16), opacity: a * (fait || encours ? 1 : 0.45),
            transform: `translateX(${(1 - a) * u(40)}px) scale(${encours ? 1 + pop * 0.02 : 1})`, transformOrigin: 'left', background: encours ? c.surface : 'transparent',
            borderLeft: `${u(6)}px solid ${encours ? c.accent : 'transparent'}`, boxShadow: encours ? `0 ${u(18)}px ${u(50)}px #0008` : 'none' }}>
            <div style={{ width: u(56), height: u(56), borderRadius: u(28), flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: titres, fontWeight: 700, fontSize: u(28),
              background: fait || encours ? c.accent : 'transparent', border: fait || encours ? 'none' : `2px solid ${c.texteSecondaire}`, color: fait || encours ? c.fond : c.texteSecondaire }}>
              {fait ? <Icone nom="coche" taille={u(30)} couleur={c.fond} epaisseur={6} /> : i + 1}
            </div>
            <div style={{ fontFamily: texte, fontWeight: encours ? 700 : 500, fontSize: u(38), color: fait ? c.texteSecondaire : c.texte }}><T>{it}</T></div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// recap : points à retenir, cochés un par un (<b>…</b> autorisé pour mettre un mot en gras)
export const Recap = ({ titre, items, surtitre }: { titre: string; items: string[]; surtitre?: string }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const { durationInFrames } = useVideoConfig();
  const r = useRebond();
  const step = Math.min(30, (durationInFrames * 0.5) / Math.max(1, items.length));
  const t = ease(frame, 0, 14, 0, 1);
  return (
    <AbsoluteFill style={{ padding: `0 ${u(portrait ? 80 : 300)}px`, justifyContent: 'center' }}>
      <Surtitre style={{ marginBottom: u(16) }}>{surtitre ?? 'Récapitulatif'}</Surtitre>
      <div style={{ fontFamily: titres, fontWeight: 600, fontSize: u(72), lineHeight: 1.12, color: c.accentClair, textShadow: OMBRE, opacity: t, marginBottom: u(56) }}><T>{titre}</T></div>
      {items.map((it, i) => {
        const a = r(14 + i * step, 120, 16);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: u(30), marginBottom: u(30), opacity: a, transform: `translateY(${(1 - a) * u(20)}px)` }}>
            <div style={{ width: u(54), height: u(54), borderRadius: u(27), border: `2px solid ${c.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${a})`, flexShrink: 0 }}>
              <Icone nom="coche" taille={u(28)} couleur={c.accent} epaisseur={5} />
            </div>
            <div style={{ fontFamily: texte, fontWeight: 500, fontSize: u(42), lineHeight: 1.3, color: c.texte }} dangerouslySetInnerHTML={{ __html: typo(it) }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
