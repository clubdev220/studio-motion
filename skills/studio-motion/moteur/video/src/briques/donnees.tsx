// Briques de données : chiffre clé, graphique en barres, frise chronologique
// Règle : uniquement des chiffres FOURNIS par l'utilisateur ou vérifiés (source à citer avec `source`).
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { OMBRE, Surtitre, T, ease, useCharte, useEchelle, useRebond, useImage } from '../outils';

// Fait défiler la partie numérique d'un texte (« 12 500 FCFA », « −80 % », « 4,8/5 ») de 0 à sa valeur
const compter = (valeur: string, p: number) => {
  const m = valeur.match(/(\d[\d\s  ]*(?:[.,]\d+)?)/);
  if (!m) return valeur;
  const brut = m[1].replace(/[\s  ]/g, '');
  const dec = brut.includes(',') ? brut.split(',')[1].length : brut.includes('.') ? brut.split('.')[1].length : 0;
  const cible = parseFloat(brut.replace(',', '.'));
  const v = cible * p;
  const txt = v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/[  ]/g, ' ');
  return valeur.replace(m[1], txt);
};

// chiffre : un chiffre en très grand qui défile puis rebondit, avec sa légende
export const Chiffre = ({ valeur, legende, surtitre, source, compteur = true }: { valeur: string; legende?: string; surtitre?: string; source?: string; compteur?: boolean }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const s = useRebond()(0, 120, 14);
  const p = compteur ? ease(frame, 4, 40, 0, 1) : 1;
  const long = valeur.length > 9;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: `0 ${u(portrait ? 70 : 160)}px` }}>
      <Surtitre style={{ marginBottom: u(30) }}>{surtitre}</Surtitre>
      <div style={{ fontFamily: titres, fontWeight: 800, fontSize: u(long ? (portrait ? 120 : 150) : (portrait ? 220 : 230)), lineHeight: 1, color: c.accentClair, textShadow: OMBRE, transform: `scale(${0.7 + s * 0.3})`, opacity: s, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {compter(valeur, p)}
      </div>
      <div style={{ marginTop: u(28), width: ease(frame, 6, 22, 0, u(170)), height: u(6), borderRadius: u(3), background: c.accent }} />
      {legende ? <div style={{ marginTop: u(30), fontFamily: texte, fontWeight: 500, fontSize: u(46), lineHeight: 1.35, color: c.texte, opacity: ease(frame, 10, 22, 0, 1) }}><T>{legende}</T></div> : null}
      {source ? <div style={{ marginTop: u(24), fontFamily: texte, fontSize: u(24), color: c.texteSecondaire, opacity: ease(frame, 16, 28, 0, 0.9) }}><T>{`Source : ${source}`}</T></div> : null}
    </AbsoluteFill>
  );
};

// barres : graphique en barres horizontales qui se remplissent (valeurs numériques + libellé affiché)
export const Barres = ({ titre, donnees, unite = '', source, surtitre }: { titre?: string; donnees: { libelle: string; valeur: number; affichage?: string; enAvant?: boolean }[]; unite?: string; source?: string; surtitre?: string }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const r = useRebond();
  const max = Math.max(...donnees.map(d => d.valeur), 1);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${u(portrait ? 70 : 200)}px` }}>
      <Surtitre style={{ marginBottom: u(16) }}>{surtitre}</Surtitre>
      {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(64), lineHeight: 1.15, color: c.accentClair, marginBottom: u(54), opacity: ease(frame, 0, 12, 0, 1) }}><T>{titre}</T></div> : null}
      {donnees.map((d, i) => {
        const a = r(10 + i * 8, 110, 18);
        const w = ease(frame, 14 + i * 8, 44 + i * 8, 0, d.valeur / max);
        const couleur = d.enAvant ? c.accent : `${c.accent}88`;
        return (
          <div key={i} style={{ marginBottom: u(30), opacity: a }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: texte, fontSize: u(32), color: c.texte, marginBottom: u(10) }}>
              <span style={{ fontWeight: d.enAvant ? 700 : 500 }}><T>{d.libelle}</T></span>
              <span style={{ fontWeight: 700, color: d.enAvant ? c.accentClair : c.texteSecondaire, fontVariantNumeric: 'tabular-nums' }}>{d.affichage ?? `${Math.round(w * max).toLocaleString('fr-FR').replace(/[  ]/g, ' ')}${unite ? ` ${unite}` : ''}`}</span>
            </div>
            <div style={{ height: u(26), borderRadius: u(13), background: `${c.texte}14`, overflow: 'hidden' }}>
              <div style={{ width: `${w * 100}%`, height: '100%', borderRadius: u(13), background: couleur, boxShadow: d.enAvant ? `0 0 ${u(24)}px ${c.accent}88` : 'none' }} />
            </div>
          </div>
        );
      })}
      {source ? <div style={{ marginTop: u(16), fontFamily: texte, fontSize: u(24), color: c.texteSecondaire }}><T>{`Source : ${source}`}</T></div> : null}
    </AbsoluteFill>
  );
};

// frise : 2 à 5 dates le long d'une ligne qui se trace (verticale en 9:16)
export const Frise = ({ titre, etapes }: { titre?: string; etapes: { date: string; libelle: string }[] }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useImage();
  const { durationInFrames } = useVideoConfig();
  const r = useRebond();
  const items = etapes.slice(0, 5);
  const per = Math.max(10, Math.floor((durationInFrames * 0.55) / items.length));
  const trace = ease(frame, 0, per * items.length, 0, 1);
  const Point = ({ i }: { i: number }) => <div style={{ width: u(40), height: u(40), borderRadius: u(20), background: c.fond, border: `${u(6)}px solid ${i % 2 ? c.accentClair : c.accent}`, flexShrink: 0 }} />;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: `0 ${u(portrait ? 90 : 150)}px` }}>
      {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(60), color: c.accentClair, marginBottom: u(portrait ? 60 : 90), textAlign: portrait ? 'left' : 'center', opacity: ease(frame, 0, 12, 0, 1) }}><T>{titre}</T></div> : null}
      {portrait ? (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: u(17), top: u(20), width: u(6), height: `calc(${trace * 100}% - ${u(40)}px)`, background: `linear-gradient(${c.accent}, ${c.accentProfond})`, borderRadius: u(3) }} />
          {items.map((it, i) => {
            const s = r(i * per, 140, 15);
            return (
              <div key={i} style={{ display: 'flex', gap: u(36), alignItems: 'flex-start', marginBottom: u(60), opacity: s, transform: `translateX(${(1 - s) * u(30)}px)` }}>
                <Point i={i} />
                <div><div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(52), color: c.accentClair }}><T>{it.date}</T></div>
                  <div style={{ marginTop: u(8), fontFamily: texte, fontSize: u(34), lineHeight: 1.35, color: c.texteSecondaire }}><T>{it.libelle}</T></div></div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', height: u(6), borderRadius: u(3), background: `${c.texte}1a` }}>
            <div style={{ width: `${trace * 100}%`, height: '100%', borderRadius: u(3), background: `linear-gradient(90deg, ${c.accent}, ${c.accentProfond})` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: u(-23) }}>
            {items.map((it, i) => {
              const s = r(i * per, 140, 15);
              return (
                <div key={i} style={{ width: `${100 / items.length}%`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', opacity: s, transform: `translateY(${(1 - s) * u(30)}px)` }}>
                  <Point i={i} />
                  <div style={{ marginTop: u(30), fontFamily: titres, fontWeight: 700, fontSize: u(46), color: c.accentClair }}><T>{it.date}</T></div>
                  <div style={{ marginTop: u(14), fontFamily: texte, fontSize: u(30), color: c.texteSecondaire, maxWidth: u(400), lineHeight: 1.3 }}><T>{it.libelle}</T></div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
