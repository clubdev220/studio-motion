// Installe le pack studio-motion dans les agents de cette machine (lien vers ce dépôt : un « git pull » suffit
// ensuite à mettre tous les agents à jour), puis prépare le moteur.
//
//   node installer.mjs                       agents détectés automatiquement
//   node installer.mjs --agents claude,hermes
//   node installer.mjs --dossier /chemin/vers/le/dossier/skills/de/mon/agent
//   node installer.mjs --copier              copie au lieu d'un lien (si les liens sont impossibles)
import { cpSync, existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(ici, 'skills', 'studio-motion');
const h = os.homedir();

// Dossiers où chaque agent lit ses skills (format standard SKILL.md)
const AGENTS = {
  claude: { nom: 'Claude Code', racine: path.join(h, '.claude'), dossier: path.join(h, '.claude', 'skills') },
  codex: { nom: 'Codex', racine: path.join(h, '.codex'), dossier: path.join(process.env.CODEX_HOME || path.join(h, '.codex'), 'skills') },
  agents: { nom: 'Dossier commun ~/.agents (OpenClaw, Codex et autres)', racine: path.join(h, '.agents'), dossier: path.join(h, '.agents', 'skills') },
  hermes: { nom: 'Hermes Agent', racine: path.join(h, '.hermes'), dossier: path.join(h, '.hermes', 'skills') },
  openclaw: { nom: 'OpenClaw', racine: path.join(h, '.openclaw'), dossier: path.join(h, '.openclaw', 'skills') },
};

const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const copier = args.includes('--copier');
let cibles = [];
if (val('--dossier')) cibles.push({ nom: 'Dossier choisi', dossier: path.resolve(val('--dossier')) });
if (val('--agents')) for (const a of val('--agents').split(',')) {
  if (!AGENTS[a]) { console.error(`Agent inconnu : ${a}. Choix : ${Object.keys(AGENTS).join(', ')}, ou --dossier.`); process.exit(1); }
  cibles.push(AGENTS[a]);
}
if (!cibles.length) cibles = Object.values(AGENTS).filter(a => existsSync(a.racine));
if (!cibles.length) {
  console.error('Aucun agent détecté. Précisez --agents claude,codex,hermes,openclaw,agents ou --dossier <chemin>.');
  process.exit(1);
}

for (const c of cibles) {
  const dest = path.join(c.dossier, 'studio-motion');
  mkdirSync(c.dossier, { recursive: true });
  if (existsSync(dest) || (() => { try { return lstatSync(dest).isSymbolicLink(); } catch { return false; } })()) {
    const lien = lstatSync(dest).isSymbolicLink() ? readlinkSync(dest) : null;
    if (lien && path.resolve(c.dossier, lien) === source) { console.log(`✓ ${c.nom} : déjà installé (${dest})`); continue; }
    rmSync(dest, { recursive: true, force: true });
  }
  try {
    if (copier) throw new Error('copie demandée');
    symlinkSync(source, dest, process.platform === 'win32' ? 'junction' : 'dir');
    console.log(`✓ ${c.nom} : lien ${dest} → ${source}`);
  } catch {
    cpSync(source, dest, { recursive: true, filter: (f) => !f.includes(`${path.sep}node_modules`) });
    console.log(`✓ ${c.nom} : copié dans ${dest} (relancez l'installation après chaque mise à jour)`);
    spawnSync(process.execPath, [path.join(dest, 'preparer.mjs')], { stdio: 'inherit' });
  }
}

console.log('\nPréparation du moteur…');
const r = spawnSync(process.execPath, [path.join(source, 'preparer.mjs')], { stdio: 'inherit' });
process.exit(r.status ?? 0);
