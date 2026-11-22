// cinetique : typographie animée calée sur la voix. Chaque mot apparaît à l'instant où il est prononcé.
// Styles : « empile » (la phrase se construit mot à mot), « impact » (groupes de 1 à 3 mots, très gros, qui se
// remplacent), « mot » (un seul mot géant à la fois). *mots* en couleur d'accent, soulignés quand ils sont dits.
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OMBRE, PastilleIcone, Surtitre, typo, useCharte, useEchelle, useRythme, useVoix, type NomIcone } from '../outils';

type Jeton = { w: string; acc: boolean; debut: number; fin: boolean };

export const Cinetique = ({ texte, style = 'empile', taille, alignement = 'centre', majuscules, surtitre, icone, couleur = 'texte' }: {
  texte?: string; style?: 'empile' | 'impact' | 'mot'; taille?: number; alignement?: 'centre' | 'gauche'; majuscules?: boolean;
  surtitre?: string; icone?: NomIcone; couleur?: 'texte' | 'accent';
}) => {
  const { c, titres } = useCharte();
  const { u, portrait } = useEchelle();
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  const { mots, avecVoix } = useVoix();
  const rythme = useRythme();

  // Jetons : le texte donné (avec *accents*), sinon les mots de la voix ; instants pris sur la voix si elle existe
  let on = false;
  const source = texte ? typo(texte).split(/\s+/).filter(Boolean) : mots.map(m => m.w);
  const jetons: Jeton[] = source.map((w, i) => {
    const ouvre = w.startsWith('*'); const acc = on || ouvre;
    if (ouvre) on = true;
    if (/\*[.,!?:;…»]*$/.test(w)) on = false;
    let debut = 6 + i * rythme.pas;
    if (avecVoix) { const k = Math.min(mots.length - 1, Math.floor(i * mots.length / source.length)); debut = Math.round(mots[k].s * fps); }
    return { w: w.replace(/\*/g, ''), acc, debut, fin: /[.?!:…]$/.test(w.replace(/\*/g, '')) };
  });
  const maj = majuscules ?? style !== 'empile';
  const gauche = alignement === 'gauche';
  const couleurBase = couleur === 'accent' ? c.accent : c.accentClair;
  const pop = (d: number, raideur = 260, amorti = 13) => spring({ frame: frame - d, fps, config: { stiffness: raideur, damping: amorti } });

  const motEl = (j: Jeton, k: number, fs: number, entree: number) => {
    const s = pop(j.debut);
    const dit = frame >= j.debut;
    const sous = j.acc ? interpolate(frame - j.debut, [2, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
    return (
      <span key={k} style={{ position: 'relative', display: 'inline-block', opacity: dit ? Math.min(1, s * 1.4) : 0,
        transform: `translateY(${(1 - s) * entree}em) scale(${0.7 + 0.3 * s})`, color: j.acc ? c.accent : couleurBase, fontSize: fs }}>
        {j.w}
        {j.acc ? <span style={{ position: 'absolute', left: 0, bottom: '-0.06em', height: '0.09em', width: `${sous * 100}%`, background: c.accent, borderRadius: 99 }} /> : null}
      </span>
    );
  };

  const commun = { fontFamily: titres, fontWeight: 800, lineHeight: 1.05, textShadow: OMBRE, textTransform: maj ? 'uppercase' as const : 'none' as const, letterSpacing: u(-1) };
  let contenu;
  if (style === 'empile') {
    const fs = u(taille ?? (portrait ? 104 : 96));
    contenu = (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: gauche ? 'flex-start' : 'center', gap: `0 ${fs * 0.26}px`, maxWidth: u(portrait ? 920 : 1500), ...commun }}>
        {jetons.map((j, k) => motEl(j, k, fs, 0.5))}
      </div>
    );
  } else {
    // Groupes (impact : 3 mots au plus, coupés à la ponctuation ; mot : un mot)
    const max = style === 'mot' ? 1 : 3;
    const groupes: Jeton[][] = [];
    let g: Jeton[] = [];
    jetons.forEach(j => { g.push(j); if (g.length >= max || j.fin) { groupes.push(g); g = []; } });
    if (g.length) groupes.push(g);
    const idx = groupes.reduce((a, gr, i) => (frame >= gr[0].debut ? i : a), 0);
    const gr = groupes[idx] || [];
    const suivant = groupes[idx + 1]?.[0].debut ?? durationInFrames;
    const longueur = Math.max(...gr.map(j => j.w.length), 4);
    // Taille : la plus grande qui tient en largeur (capitales plus larges), marge pour le zoom de respiration
    const dispo = width - 2 * u(portrait ? 80 : 160);
    const fs = taille ? u(taille) : Math.min(u(style === 'mot' ? 230 : 165), dispo / (longueur * (maj ? 0.78 : 0.62)) / (1 + rythme.respiration) * 0.94);
    const entree = pop(gr[0]?.debut ?? 0, 320, 15);
    const sortie = interpolate(frame, [suivant - 3, suivant], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    contenu = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: gauche ? 'flex-start' : 'center', ...commun,
        transform: `scale(${1.35 - 0.35 * entree})`, opacity: Math.min(entree * 1.5, 1) * (idx < groupes.length - 1 ? sortie : 1) }}>
        {gr.map((j, k) => <span key={`${idx}-${k}`} style={{ fontSize: fs, color: j.acc ? c.accent : couleurBase }}>{j.w}</span>)}
      </div>
    );
  }
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: gauche ? 'flex-start' : 'center', textAlign: gauche ? 'left' : 'center', padding: `0 ${u(portrait ? 80 : 160)}px`, gap: u(36) }}>
      {icone ? <PastilleIcone nom={icone} taille={u(130)} delai={(jetons[0]?.debut ?? 0) * rythme.vitesse} /> : null}
      {surtitre ? <Surtitre>{surtitre}</Surtitre> : null}
      {contenu}
    </AbsoluteFill>
  );
};
