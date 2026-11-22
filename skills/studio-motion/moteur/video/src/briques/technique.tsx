// Briques techniques : code, terminal, schéma (repris de la bibliothèque Studio Motion, adaptés à la charte et aux formats)
import type { ReactNode } from 'react';
import { AbsoluteFill, spring, useVideoConfig } from 'remotion';
import { OMBRE, Surtitre, T, ease, useCharte, useEchelle, useRebond, useImage } from '../outils';

const SYNTAXE = { kw: '#c4a7ff', str: '#f7c27d', num: '#7fd6ea', com: '#7c7b92', fn: '#ffd479', vr: '#8fe3c0', txt: '#ecebf3' };
const KW = /^(const|let|var|if|else|return|true|false|null|undefined|async|await|function|new|import|from|export|for|of|in|while|try|catch|def|class|print|echo)$/;
const colorer = (ligne: string, accent: string) => {
  const re = /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|(\$[\w.]+)|(\b\d+(?:\.\d+)*\b)|([A-Za-z_]\w*(?=\())|([A-Za-z_]\w*)|(\s+|.)/g;
  const out: { t: string; c: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(ligne))) {
    const [, com, str, vr, num, fn, mot, reste] = m;
    out.push(com ? { t: com, c: SYNTAXE.com } : str ? { t: str, c: SYNTAXE.str } : vr ? { t: vr, c: SYNTAXE.vr } : num ? { t: num, c: SYNTAXE.num } : fn ? { t: fn, c: SYNTAXE.fn }
      : mot ? { t: mot, c: KW.test(mot) ? SYNTAXE.kw : SYNTAXE.txt } : { t: reste, c: SYNTAXE.txt });
  }
  void accent;
  return out;
};

const Fenetre = ({ titre, largeur, hauteur, children }: { titre: ReactNode; largeur: number; hauteur: number; children: ReactNode }) => {
  const { c, texte } = useCharte();
  const { u } = useEchelle();
  const e = useRebond()(0, 120, 18);
  return (
    <div style={{ width: largeur, height: hauteur, borderRadius: u(20), overflow: 'hidden', background: '#0e0e15', opacity: e, transform: `translateY(${(1 - e) * u(70)}px) scale(${0.95 + e * 0.05})`,
      boxShadow: `0 ${u(40)}px ${u(120)}px #000c, 0 0 0 1px ${c.accent}40, 0 0 ${u(90)}px ${c.accent}22` }}>
      <div style={{ height: u(54), background: '#191924', display: 'flex', alignItems: 'center', gap: u(12), padding: `0 ${u(22)}px`, borderBottom: '1px solid #ffffff12' }}>
        {['#ff5f56', '#ffbd2e', '#27c93f'].map(x => <div key={x} style={{ width: u(15), height: u(15), borderRadius: u(8), background: x }} />)}
        <div style={{ marginLeft: u(18), fontFamily: texte, fontSize: u(21), color: '#b9b8cc', display: 'flex', alignItems: 'center', gap: u(10) }}>{titre}</div>
      </div>
      <div style={{ position: 'relative', height: hauteur - u(54) }}>{children}</div>
    </div>
  );
};

// code : lignes révélées une à une, lignes surlignées et annotations
export const Code = ({ code, fichier = '', surligner = [], annotations = [], titre }: { code: string; fichier?: string; surligner?: number[]; annotations?: { ligne: number; texte: string }[]; titre?: string }) => {
  const { c, code: mono, texte, titres } = useCharte();
  const { u, portrait, paysage, width } = useEchelle();
  const frame = useImage();
  const { durationInFrames, fps } = useVideoConfig();
  const lignes = code.replace(/\t/g, '  ').split('\n');
  const n = lignes.length;
  const L = paysage ? u(1560) : width - u(80), Hmax = portrait ? u(1100) : u(titre ? 760 : 860);
  const fs = Math.min(u(38), (Hmax - u(120)) / (n * 1.55), (L - u(140)) / (Math.max(...lignes.map(l => l.length), 20) * 0.62));
  const H = Math.min(Hmax, Math.max(u(360), n * fs * 1.55 + u(130)));
  const per = Math.min(5, (durationInFrames * 0.3) / n);
  const finRevele = 10 + n * per;
  const hl = new Set(surligner);
  const hlOn = hl.size ? ease(frame, finRevele + 6, finRevele + 20, 0, 1) : 0;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: u(40) }}>
      {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(56), color: c.accentClair, textShadow: OMBRE, opacity: ease(frame, 0, 12, 0, 1) }}><T>{titre}</T></div> : null}
      <Fenetre titre={<span style={{ color: '#ecebf3' }}>{fichier}</span>} largeur={L} hauteur={H}>
        <div style={{ position: 'absolute', inset: 0, padding: `${u(30)}px 0`, fontFamily: mono, fontSize: fs, lineHeight: 1.55 }}>
          {lignes.map((l, i) => {
            const a = ease(frame, 10 + i * per, 10 + i * per + 8, 0, 1);
            const on = hl.has(i + 1);
            const note = annotations.find(x => x.ligne === i + 1);
            const ni = note ? spring({ frame: frame - (finRevele + 22 + annotations.indexOf(note) * 10), fps, config: { damping: 16 } }) : 0;
            return (
              <div key={i} style={{ position: 'relative', display: 'flex', opacity: a * (hl.size ? 1 - hlOn * (on ? 0 : 0.6) : 1), transform: `translateX(${(1 - a) * -20}px)` }}>
                {on ? <div style={{ position: 'absolute', inset: 0, background: `${c.accent}38`, borderLeft: `${u(5)}px solid ${c.accent}`, transform: `scaleX(${hlOn})`, transformOrigin: 'left' }} /> : null}
                <span style={{ width: u(80), textAlign: 'right', paddingRight: u(26), color: '#55546a', position: 'relative' }}>{i + 1}</span>
                <span style={{ whiteSpace: 'pre', position: 'relative' }}>{colorer(l, c.accent).map((x, k) => <span key={k} style={{ color: x.c }}>{x.t}</span>)}</span>
                {note ? <span style={{ position: 'relative', marginLeft: u(30), alignSelf: 'center', opacity: ni, transform: `translateX(${(1 - ni) * 30}px)`, fontFamily: texte, fontSize: Math.max(u(22), fs * 0.8), fontWeight: 600, color: c.fond, background: c.accent, padding: `${u(4)}px ${u(16)}px`, borderRadius: u(10), whiteSpace: 'nowrap' }}>← {note.texte}</span> : null}
              </div>
            );
          })}
        </div>
      </Fenetre>
    </AbsoluteFill>
  );
};

// terminal : commandes tapées une à une ; la sortie n'apparaît que si elle est fournie (jamais inventée)
export const Terminal = ({ commandes, sortie = [], dossier = '~', shell = 'bash', titre }: { commandes: string[]; sortie?: string[]; dossier?: string; shell?: 'bash' | 'powershell'; titre?: string }) => {
  const { c, code: mono, titres } = useCharte();
  const { u, portrait, paysage, width } = useEchelle();
  const frame = useImage();
  const { durationInFrames } = useVideoConfig();
  const ps = shell === 'powershell';
  const invite = ps ? `PS ${dossier}>` : `${dossier} $`;
  const total = commandes.reduce((s, x) => s + x.length, 0) + commandes.length * 14;
  const cpf = Math.max(1.05, total / (durationInFrames * 0.7 - 12));
  let t = 12;
  const lignes: ReactNode[] = [];
  commandes.forEach((cmd, i) => {
    const tape = Math.max(0, Math.min(cmd.length, Math.floor((frame - t) * cpf)));
    if (frame >= t - 4) lignes.push(
      <div key={'c' + i} style={{ whiteSpace: 'pre-wrap' }}>
        <span style={{ color: ps ? '#7fb8ff' : '#6fdc9a' }}>{invite} </span>{cmd.slice(0, tape)}
        {(tape < cmd.length || i === commandes.length - 1) && Math.floor(frame / 15) % 2 === 0 ? <span style={{ background: '#f2f2f2', color: '#0b0b12' }}>&nbsp;</span> : null}
      </div>);
    t += cmd.length / cpf + 10;
    if (i === commandes.length - 1 && sortie.length && frame >= t) sortie.forEach((o, k) => { if (frame >= t + k * 4) lignes.push(<div key={'o' + k} style={{ color: '#c9c8d6' }}>{o}</div>); });
    t += 14;
  });
  const nl = commandes.length + sortie.length;
  const L = paysage ? u(1500) : width - u(80), H = Math.min(portrait ? u(1000) : u(titre ? 680 : 760), Math.max(u(360), nl * u(portrait ? 30 : 34) * 1.6 + u(150)));
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: u(40) }}>
      {titre ? <div style={{ fontFamily: titres, fontWeight: 700, fontSize: u(56), color: c.accentClair, textShadow: OMBRE, opacity: ease(frame, 0, 12, 0, 1) }}><T>{titre}</T></div> : null}
      <Fenetre titre={<span>{ps ? 'Windows PowerShell' : 'Terminal'}</span>} largeur={L} hauteur={H}>
        <div style={{ position: 'absolute', inset: 0, padding: `${u(34)}px ${u(40)}px`, fontFamily: mono, fontSize: u(portrait ? 30 : 34), lineHeight: 1.6, color: '#f2f2f2', background: '#0b0b12' }}>{lignes}</div>
      </Fenetre>
    </AbsoluteFill>
  );
};

// schema : boîtes reliées par des flèches qui se tracent (chaîne, étoile ou comparaison)
export const Schema = ({ disposition = 'chaine', noeuds, liens = [], titres: entetes, titre }: { disposition?: 'chaine' | 'etoile' | 'comparaison'; noeuds: { id: string; libelle: string }[]; liens?: { de: string; a: string; libelle?: string }[]; titres?: [string, string]; titre?: string }) => {
  const { c, titres, texte } = useCharte();
  const { width, height, portrait, u } = useEchelle();
  const frame = useImage();
  const { fps } = useVideoConfig();
  const W = width, H = height;
  const nT = (i: number) => spring({ frame: frame - 6 - i * 7, fps, config: { damping: 15, stiffness: 130 } });
  const pos: Record<string, { x: number; y: number }> = {};
  const cy = H / 2 + (titre ? u(50) : 0);
  if (disposition === 'chaine') {
    if (portrait) { const gap = Math.min(u(300), (H - u(500)) / Math.max(1, noeuds.length - 1)); noeuds.forEach((n, i) => (pos[n.id] = { x: W / 2, y: cy - ((noeuds.length - 1) * gap) / 2 + i * gap })); }
    else { const gap = Math.min(u(430), (W - u(360)) / Math.max(1, noeuds.length - 1)); noeuds.forEach((n, i) => (pos[n.id] = { x: W / 2 - ((noeuds.length - 1) * gap) / 2 + i * gap, y: cy })); }
  } else if (disposition === 'etoile') {
    pos[noeuds[0].id] = { x: W / 2, y: cy };
    const rx = portrait ? W * 0.32 : W * 0.29, ry = portrait ? H * 0.26 : H * 0.31;
    noeuds.slice(1).forEach((n, i, arr) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / arr.length; pos[n.id] = { x: W / 2 + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }; });
  } else {
    const G = noeuds.filter(n => n.id.startsWith('g')), D = noeuds.filter(n => n.id.startsWith('d'));
    G.forEach((n, i) => (pos[n.id] = { x: W * 0.27, y: cy - u(150) + i * u(150) }));
    D.forEach((n, i) => (pos[n.id] = { x: W * 0.73, y: cy - u(150) + i * u(150) }));
  }
  const bw = portrait ? u(380) : u(300), bh = u(96);
  const lT = (i: number) => ease(frame, 6 + noeuds.length * 7 + i * 8, 6 + noeuds.length * 7 + i * 8 + 14, 0, 1);
  const bord = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const p = Math.min(Math.abs(bw / 2 / (ux || 1e-6)), Math.abs(bh / 2 / (uy || 1e-6)));
    return { x1: a.x + ux * (p + 4), y1: a.y + uy * (p + 4), x2: b.x - ux * (p + 10), y2: b.y - uy * (p + 10) };
  };
  return (
    <AbsoluteFill>
      {titre ? <div style={{ position: 'absolute', top: u(portrait ? 200 : 110), width: '100%', textAlign: 'center', fontFamily: titres, fontWeight: 700, fontSize: u(60), color: c.accentClair, opacity: ease(frame, 0, 12, 0, 1) }}><T>{titre}</T></div> : null}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
        {disposition === 'comparaison' && entetes ? entetes.map((t, i) => <text key={i} x={i ? W * 0.73 : W * 0.27} y={cy - u(270)} textAnchor="middle" fontFamily={titres} fontWeight={700} fontSize={u(46)} fill={i ? c.accent : c.accentClair} opacity={ease(frame, 0, 12, 0, 1)}>{t}</text>) : null}
        {disposition === 'comparaison' ? <line x1={W / 2} y1={cy - u(320)} x2={W / 2} y2={cy + u(320)} stroke="#ffffff22" strokeWidth={2} /> : null}
        {liens.map((l, i) => {
          if (!pos[l.de] || !pos[l.a]) return null;
          const { x1, y1, x2, y2 } = bord(pos[l.de], pos[l.a]); const t = lT(i);
          const len = Math.hypot(x2 - x1, y2 - y1), ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.texteSecondaire} strokeWidth={u(3)} strokeDasharray={len} strokeDashoffset={len * (1 - t)} />
              {t > 0.95 ? <polygon points={`0,${-u(10)} ${u(20)},0 0,${u(10)}`} fill={c.texteSecondaire} transform={`translate(${x2} ${y2}) rotate(${ang}) translate(${-u(14)} 0)`} /> : null}
              {l.libelle && t >= 1 ? <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - u(16)} textAnchor="middle" fontFamily={texte} fontSize={u(24)} fill={c.texteSecondaire}>{l.libelle}</text> : null}
            </g>
          );
        })}
        {noeuds.map((n, i) => {
          const p = pos[n.id]; const t = nT(i); const centre = disposition === 'etoile' && i === 0;
          if (!p) return null;
          return (
            <g key={n.id} transform={`translate(${p.x} ${p.y}) scale(${0.85 + 0.15 * t})`} opacity={t}>
              <rect x={-bw / 2 - (centre ? u(20) : 0)} y={-bh / 2 - (centre ? u(14) : 0)} width={bw + (centre ? u(40) : 0)} height={bh + (centre ? u(28) : 0)} rx={u(22)} fill={centre ? c.accent : c.surface} stroke={centre ? '#ffffff55' : c.accent} strokeWidth={u(2.5)} />
              <text textAnchor="middle" dominantBaseline="central" fontFamily={centre ? titres : texte} fontWeight={centre ? 700 : 600} fontSize={u(centre ? 38 : 30)} fill={centre ? c.fond : c.texte}>{n.libelle}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
void Surtitre;
