// Briques d'images : photo, galerie, vidéo, fiche produit, téléphone
// Règle : uniquement des images fournies par l'utilisateur ou sous licence libre vérifiée (créditer avec `credit`).
import { AbsoluteFill, Img, OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion';
import { Icone, OMBRE, Surtitre, T, ease, media, rgb, useCharte, useEchelle, useRebond, type NomIcone } from '../outils';

type Point = { x: number; y: number };

// Image plein cadre avec lent zoom et léger déplacement (effet Ken Burns) autour du point d'intérêt
const Plein = ({ src, focus, de = 1.04, a = 1.16, sens = 1 }: { src: string; focus?: Point; de?: number; a?: number; sens?: number }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const z = ease(frame, 0, durationInFrames, de, a);
  const x = ease(frame, 0, durationInFrames, 0, 2.2 * sens);
  const f = focus ?? { x: 0.5, y: 0.45 };
  return <Img src={media(src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${f.x * 100}% ${f.y * 100}%`, transform: `scale(${z}) translateX(${x}%)`, transformOrigin: `${f.x * 100}% ${f.y * 100}%` }} />;
};

const Legende = ({ titre, texte, credit }: { titre?: string; texte?: string; credit?: string }) => {
  const { c, titres, texte: police } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useCurrentFrame();
  return (
    <>
      {titre || texte ? (
        <div style={{ position: 'absolute', left: u(portrait ? 70 : 100), right: u(portrait ? 70 : 100), bottom: u(portrait ? 260 : 120), opacity: ease(frame, 8, 22, 0, 1), transform: `translateY(${ease(frame, 8, 22, u(24), 0)}px)` }}>
          {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(portrait ? 76 : 64), lineHeight: 1.12, color: c.accentClair, textShadow: '0 4px 24px #000c' }}><T>{titre}</T></div> : null}
          {texte ? <div style={{ marginTop: u(14), fontFamily: police, fontWeight: 500, fontSize: u(34), lineHeight: 1.4, color: c.texte, textShadow: '0 2px 14px #000c' }}><T>{texte}</T></div> : null}
        </div>
      ) : null}
      {credit ? <div style={{ position: 'absolute', right: u(30), bottom: u(24), fontFamily: police, fontSize: u(18), color: '#ffffffcc', padding: `${u(5)}px ${u(12)}px`, borderRadius: u(999), background: '#0008' }}><T>{credit}</T></div> : null}
    </>
  );
};
const Voile = () => {
  const { c } = useCharte();
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(${rgb(c.fond)},0.35) 0%, transparent 28%, transparent 50%, rgba(${rgb(c.fond)},0.92) 100%)` }} />;
};

// photo : photo plein cadre, zoom lent, titre et texte en bas
export const Photo = ({ image, focus, titre, texte, credit }: { image: string; focus?: Point; titre?: string; texte?: string; credit?: string }) => (
  <AbsoluteFill style={{ overflow: 'hidden' }}>
    <Plein src={image} focus={focus} />
    <Voile />
    <Legende titre={titre} texte={texte} credit={credit} />
  </AbsoluteFill>
);

// galerie : plusieurs photos, en diaporama (fondus enchaînés) ou en mosaïque qui se compose
export const Galerie = ({ images, disposition = 'diaporama', titre, texte, credit }: { images: (string | { image: string; focus?: Point })[]; disposition?: 'diaporama' | 'mosaique'; titre?: string; texte?: string; credit?: string }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { c } = useCharte();
  const { u, portrait } = useEchelle();
  const r = useRebond();
  const liste = images.map(x => (typeof x === 'string' ? { image: x } : x));
  if (disposition === 'mosaique') {
    const n = liste.length, cols = portrait ? 2 : Math.min(3, n), lignes = Math.ceil(n / cols);
    return (
      <AbsoluteFill style={{ padding: u(60), display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${lignes}, 1fr)`, gap: u(24) }}>
        {liste.map((x, i) => {
          const s = r(i * 6, 110, 16);
          return (
            <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: u(18), opacity: s, transform: `scale(${0.9 + s * 0.1})`, boxShadow: `0 ${u(20)}px ${u(50)}px #0009, 0 0 0 1px ${c.accent}33` }}>
              <Plein src={x.image} focus={x.focus} de={1.02} a={1.1} sens={i % 2 ? 1 : -1} />
            </div>
          );
        })}
        {titre || texte || credit ? <AbsoluteFill><Voile /><Legende titre={titre} texte={texte} credit={credit} /></AbsoluteFill> : null}
      </AbsoluteFill>
    );
  }
  const per = durationInFrames / liste.length, fondu = Math.min(18, per / 3);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {liste.map((x, i) => {
        const debut = i * per;
        const o = i === 0 ? 1 : ease(frame, debut - fondu / 2, debut + fondu / 2, 0, 1);
        if (frame < debut - fondu) return null;
        return <AbsoluteFill key={i} style={{ opacity: o }}><Plein src={x.image} focus={x.focus} sens={i % 2 ? 1 : -1} /></AbsoluteFill>;
      })}
      <Voile />
      <Legende titre={titre} texte={texte} credit={credit} />
    </AbsoluteFill>
  );
};

// video : un extrait vidéo fourni (MP4), en plein cadre ou dans un cadre arrondi
export const Video = ({ video, debut = 0, cadre = false, son = false, titre, texte, credit }: { video: string; debut?: number; cadre?: boolean; son?: boolean; titre?: string; texte?: string; credit?: string }) => {
  const { fps } = useVideoConfig();
  const { c } = useCharte();
  const { u } = useEchelle();
  const e = useRebond()(0, 110, 18);
  const v = <OffthreadVideo src={media(video)} startFrom={Math.round(debut * fps)} muted={!son} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  return cadre ? (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '82%', height: '74%', borderRadius: u(24), overflow: 'hidden', opacity: e, transform: `scale(${0.94 + e * 0.06})`, boxShadow: `0 ${u(40)}px ${u(110)}px #000b, 0 0 0 1px ${c.accent}44` }}>{v}</div>
      <Legende titre={titre} texte={texte} credit={credit} />
    </AbsoluteFill>
  ) : (
    <AbsoluteFill>{v}<Voile /><Legende titre={titre} texte={texte} credit={credit} /></AbsoluteFill>
  );
};

// produit : photo du produit d'un côté, nom, accroche, points forts et prix (prix FOURNI uniquement) de l'autre
export const Produit = ({ image, focus, nom, accroche, points = [], prix, mention, surtitre }: { image: string; focus?: Point; nom: string; accroche?: string; points?: (string | { texte: string; icone?: NomIcone })[]; prix?: string; mention?: string; surtitre?: string }) => {
  const { c, titres, texte } = useCharte();
  const { u, portrait, carre } = useEchelle();
  const frame = useCurrentFrame();
  const r = useRebond();
  const e = r(0, 100, 18);
  const photo = (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: u(22), width: portrait || carre ? '100%' : u(720), height: portrait ? u(980) : carre ? u(430) : u(900), flexShrink: 0, opacity: e,
      transform: `translateY(${(1 - e) * u(40)}px)`, boxShadow: `0 ${u(40)}px ${u(110)}px #000b, 0 0 0 1px ${c.accent}44` }}>
      <Plein src={image} focus={focus} de={1.02} a={1.1} />
    </div>
  );
  return (
    <AbsoluteFill style={{ flexDirection: portrait || carre ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: u(portrait ? 50 : carre ? 30 : 90), padding: u(portrait ? 70 : carre ? 50 : 90) }}>
      {photo}
      <div style={{ flex: carre ? 'none' : 1, maxWidth: u(860), width: carre ? '100%' : undefined }}>
        <Surtitre style={{ marginBottom: u(16) }}>{surtitre}</Surtitre>
        <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(portrait ? 80 : carre ? 62 : 84), lineHeight: 1.08, color: c.accentClair, textShadow: OMBRE, opacity: ease(frame, 6, 18, 0, 1) }}><T>{nom}</T></div>
        {accroche ? <div style={{ marginTop: u(18), fontFamily: texte, fontWeight: 500, fontSize: u(36), lineHeight: 1.4, color: c.texteSecondaire, opacity: ease(frame, 12, 24, 0, 1) }}><T>{accroche}</T></div> : null}
        <div style={{ marginTop: u(34) }}>
          {points.map((p, i) => {
            const x = typeof p === 'string' ? { texte: p } : p;
            const a = r(22 + i * 10, 120, 16);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: u(18), marginBottom: u(18), opacity: a, transform: `translateX(${(1 - a) * u(30)}px)` }}>
                <Icone nom={x.icone ?? 'coche'} taille={u(38)} couleur={c.accent} epaisseur={5} />
                <div style={{ fontFamily: texte, fontWeight: 500, fontSize: u(34), color: c.texte }}><T>{x.texte}</T></div>
              </div>
            );
          })}
        </div>
        {prix ? (
          <div style={{ marginTop: u(30), display: 'inline-flex', alignItems: 'baseline', gap: u(14), padding: `${u(16)}px ${u(30)}px`, borderRadius: u(14), background: `${c.accent}22`, border: `1px solid ${c.accent}`, opacity: r(30 + points.length * 10, 130, 14) }}>
            <span style={{ fontFamily: titres, fontWeight: 800, fontSize: u(56), color: c.accentClair }}><T>{prix}</T></span>
            {mention ? <span style={{ fontFamily: texte, fontSize: u(26), color: c.texteSecondaire }}><T>{mention}</T></span> : null}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// telephone : une capture d'application ou de site mobile dans un téléphone, avec défilement facultatif
export const Telephone = ({ image, defilerDe = 0, defilerA = 0, titre, texte, cote = 'droite' }: { image: string; defilerDe?: number; defilerA?: number; titre?: string; texte?: string; cote?: 'droite' | 'gauche' }) => {
  const { c, titres, texte: police } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const e = useRebond()(0, 100, 18);
  const H = u(portrait ? 1250 : 900), W = H * 0.49;
  const y = ease(frame, durationInFrames * 0.2, durationInFrames * 0.75, defilerDe, defilerA);
  const tel = (
    <div style={{ width: W, height: H, borderRadius: u(64), padding: u(16), background: '#0b0b0e', boxShadow: `0 ${u(40)}px ${u(120)}px #000c, 0 0 0 ${u(3)}px ${c.accent}55`, opacity: e, transform: `translateY(${(1 - e) * u(80)}px)`, flexShrink: 0 }}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: u(50), overflow: 'hidden', background: '#fff' }}>
        <Img src={media(image)} style={{ position: 'absolute', left: 0, width: '100%', top: 0, transform: `translateY(${-y * 100}%)` }} />
        <div style={{ position: 'absolute', top: u(14), left: '50%', width: u(120), height: u(32), marginLeft: u(-60), borderRadius: u(16), background: '#0b0b0e' }} />
      </div>
    </div>
  );
  const txt = titre || texte ? (
    <div style={{ maxWidth: u(760), textAlign: portrait ? 'center' : 'left', opacity: ease(frame, 10, 24, 0, 1) }}>
      {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(70), lineHeight: 1.1, color: c.accentClair, textShadow: OMBRE }}><T>{titre}</T></div> : null}
      {texte ? <div style={{ marginTop: u(22), fontFamily: police, fontWeight: 500, fontSize: u(36), lineHeight: 1.45, color: c.texte }}><T>{texte}</T></div> : null}
    </div>
  ) : null;
  return (
    <AbsoluteFill style={{ flexDirection: portrait ? 'column' : cote === 'droite' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: u(portrait ? 50 : 110), padding: u(70) }}>
      {tel}{txt}
    </AbsoluteFill>
  );
};
