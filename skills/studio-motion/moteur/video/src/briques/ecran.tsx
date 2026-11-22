// Brique « ecran » : capture réelle (16:10) dans une fenêtre de navigateur, zooms par repères, zone encadrée,
// curseur qui clique, panneau d'explication (à droite en 16:9, en dessous en 9:16 et 1:1)
import type { ReactNode } from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OMBRE, T, clamp, ease, media, rgb, useCharte, useEchelle } from '../outils';
import type { Zone } from '../types';

export type Repere = { at: number; image?: string; zoom?: Zone; zone?: Zone; clic?: boolean; titre: string; texte?: string };

const Fenetre = ({ adresse, x, y, w, h, children }: { adresse: string; x: number; y: number; w: number; h: number; children: ReactNode }) => {
  const { c, texte } = useCharte();
  const { u } = useEchelle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 20, stiffness: 110 } });
  const b = u(50);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h + b, borderRadius: u(16), overflow: 'hidden', background: c.surface, opacity: e,
      transform: `translateY(${(1 - e) * u(50)}px) scale(${0.96 + e * 0.04})`, boxShadow: `0 ${u(40)}px ${u(110)}px #000b, 0 0 0 1px ${c.accent}40, 0 0 ${u(80)}px ${c.accent}22` }}>
      <div style={{ height: b, display: 'flex', alignItems: 'center', gap: u(10), padding: `0 ${u(20)}px`, background: c.surface, borderBottom: `1px solid ${c.accent}30` }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: u(13), height: u(13), borderRadius: u(7), background: i ? `${c.texteSecondaire}55` : `${c.accent}aa` }} />)}
        <div style={{ marginLeft: u(18), flex: 1, maxWidth: u(620), display: 'flex', alignItems: 'center', gap: u(10), padding: `${u(6)}px ${u(18)}px`, borderRadius: u(999), background: c.surfaceSombre, fontFamily: texte, fontSize: u(19), color: c.texteSecondaire, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <svg width={u(14)} height={u(16)} viewBox="0 0 14 16"><rect x="1" y="7" width="12" height="8" rx="2" fill={c.accent} /><path d="M4 7V5a3 3 0 0 1 6 0v2" stroke={c.accent} strokeWidth="2" fill="none" /></svg>
          {adresse}
        </div>
      </div>
      <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: '#f4f4f5' }}>{children}</div>
    </div>
  );
};

const Curseur = ({ x, y, clic, taille }: { x: number; y: number; clic: number; taille: number }) => {
  const { c } = useCharte();
  return <>
    {clic > 0 && clic < 1 ? <div style={{ position: 'absolute', left: x - 40 * taille * clic, top: y - 40 * taille * clic, width: 80 * taille * clic, height: 80 * taille * clic, borderRadius: '50%', border: `3px solid ${c.accent}`, opacity: 1 - clic }} /> : null}
    <svg width={34 * taille} height={44 * taille} viewBox="0 0 34 44" style={{ position: 'absolute', left: x - 4 * taille, top: y - 2 * taille, transform: `scale(${clic > 0 && clic < 0.4 ? 0.88 : 1})`, transformOrigin: '4px 2px', filter: 'drop-shadow(0 4px 6px #0007)' }}>
      <path d="M4 2 L4 34 L12 26 L18 40 L24 37 L18 24 L29 24 Z" fill="#fff" stroke={c.fond} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  </>;
};

const PLEIN: Zone = { x: 0, y: 0, w: 1, h: 1 };
const lerp = (a: Zone, b: Zone, k: number): Zone => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k });

export const Ecran = ({ image, adresse = '', reperes }: { image: string; adresse?: string; reperes: Repere[] }) => {
  const { c, titres, texte } = useCharte();
  const { u, width, height, paysage, carre } = useEchelle();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Mise en page selon le format
  const W = paysage ? u(1180) : carre ? u(860) : width - u(80);
  const H = Math.round(W / 1.6);
  const X = paysage ? u(80) : Math.round((width - W) / 2);
  const Y = paysage ? Math.round((height - H - u(50)) / 2) + u(10) : carre ? u(60) : Math.round(height * 0.2);
  const R = reperes;
  const k = R.reduce((acc, r, i) => (t >= r.at ? i : acc), 0);
  const cur = R[k];
  const depuis = (t - cur.at) * fps;

  const zoomDe = (i: number): Zone => (i < 0 ? PLEIN : R[i].zoom ?? (i > 0 ? zoomDe(i - 1) : PLEIN));
  const Z = lerp(zoomDe(k - 1), zoomDe(k), k === 0 ? 1 : ease(depuis, 0, 27, 0, 1));
  const sc = Math.min(2.3, Math.max(1, Math.min(1 / Z.w, 1 / Z.h) * 0.92));
  const tx = Math.min(0, Math.max(W - sc * W, W / 2 - sc * (Z.x + Z.w / 2) * W));
  const ty = Math.min(0, Math.max(H - sc * H, H / 2 - sc * (Z.y + Z.h / 2) * H));
  const aEcran = (z: Zone) => ({ x: tx + sc * z.x * W, y: ty + sc * z.y * H, w: sc * z.w * W, h: sc * z.h * H });

  const imageDe = (i: number): string => { for (let j = i; j >= 0; j--) if (R[j].image) return R[j].image!; return image; };
  const imgCourante = imageDe(k), imgAvant = k > 0 ? imageDe(k - 1) : imgCourante;
  const fondu = imgAvant === imgCourante ? 1 : ease(depuis, 0, 10, 0, 1);
  const img = (a: string, o: number) => <Img key={a} src={media(a)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: o, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})` }} />;

  const zoneT = cur.zone ? ease(depuis, 22, 34, 0, 1) : 0;
  const z = cur.zone ? aEcran(cur.zone) : null;
  const pad = u(9);
  const pulse = 0.5 + 0.5 * Math.sin((depuis / fps) * Math.PI * 1.6);
  const cible = cur.clic && z ? { x: z.x + z.w / 2, y: z.y + z.h / 2 } : null;
  const prec = k > 0 && R[k - 1].clic && R[k - 1].zone ? aEcran(R[k - 1].zone!) : null;
  const depart = prec ? { x: prec.x + prec.w / 2, y: prec.y + prec.h / 2 } : { x: W * 0.62, y: H * 0.86 };
  const m = ease(depuis, 26, 50, 0, 1);
  const clic = cible ? interpolate(depuis, [54, 72], [0, 1], clamp) : 0;

  const p = spring({ frame: depuis, fps, config: { damping: 20, stiffness: 120 } });
  const numero = R.length > 1 ? `Étape ${k + 1} sur ${R.length}` : '';
  const panneau = paysage
    ? { left: X + W + u(70), top: 0, bottom: 0, width: width - (X + W + u(70)) - u(80) }
    : { left: u(70), right: u(70), top: Y + H + u(50) + u(carre ? 36 : 60), bottom: u(40) };
  return (
    <AbsoluteFill>
      <Fenetre adresse={adresse} x={X} y={Y} w={W} h={H}>
        {imgAvant !== imgCourante && fondu < 1 ? img(imgAvant, 1) : null}
        {img(imgCourante, fondu)}
        {z ? <div style={{ position: 'absolute', left: z.x - pad, top: z.y - pad, width: z.w + pad * 2, height: z.h + pad * 2, borderRadius: u(12), border: `${u(4)}px solid ${c.accent}`, opacity: zoneT, transform: `scale(${1.08 - 0.08 * zoneT})`,
          boxShadow: `0 0 0 4000px rgba(${rgb(c.fond)},${0.42 * zoneT}), 0 0 ${u(18 + 16 * pulse)}px ${c.accent}cc` }} /> : null}
        {cible ? <Curseur x={depart.x + (cible.x - depart.x) * m} y={depart.y + (cible.y - depart.y) * m} clic={clic} taille={u(1)} /> : null}
      </Fenetre>
      <div style={{ position: 'absolute', ...panneau, display: 'flex', flexDirection: 'column', justifyContent: paysage ? 'center' : 'flex-start' }}>
        <div style={{ opacity: p, transform: `translateY(${(1 - p) * u(34)}px)` }}>
          {numero ? <div style={{ fontFamily: texte, fontWeight: 700, fontSize: u(22), letterSpacing: u(5), textTransform: 'uppercase', color: c.accent, marginBottom: u(20) }}>{numero}</div> : null}
          <div style={{ fontFamily: titres, fontWeight: 600, fontSize: u(paysage ? 54 : carre ? 46 : 64), lineHeight: 1.15, color: c.accentClair, textShadow: OMBRE }}><T>{cur.titre}</T></div>
          <div style={{ width: u(70) * ease(depuis, 6, 22, 0, 1), height: u(3), background: c.accent, margin: `${u(carre ? 18 : 28)}px 0` }} />
          {cur.texte ? <div style={{ fontFamily: texte, fontWeight: 500, fontSize: u(paysage ? 32 : carre ? 30 : 38), lineHeight: 1.45, color: c.texte }}><T>{cur.texte}</T></div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
