// Keeps the profile pointed at your newest public repos. Run by .github/workflows/profile.yml.
//  - assets/banner.svg: terminal banner with ASCII-art "aero" and "→ building <newest repo>"
//  - README.md: the text between <!-- recent --> and <!-- /recent --> becomes your two newest repos
//   node .github/scripts/update-profile.mjs                  (looks your repos up)
//   node .github/scripts/update-profile.mjs --repos a,b      (use specific names)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = 'AeroUp';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'assets', 'banner.svg');
const README = path.join(ROOT, 'README.md');
const SKIP = new Set([USER.toLowerCase()]); // the profile repo itself

// "aero" in the ANSI Shadow figlet font.
const ART = [
  ' █████╗ ███████╗██████╗  ██████╗ ',
  '██╔══██╗██╔════╝██╔══██╗██╔═══██╗',
  '███████║█████╗  ██████╔╝██║   ██║',
  '██╔══██║██╔══╝  ██╔══██╗██║   ██║',
  '██║  ██║███████╗██║  ██║╚██████╔╝',
  '╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ',
];

// Your public repos, newest first (no forks, no archived, not the profile repo).
async function newestRepos() {
  const arg = process.argv.indexOf('--repos');
  if (arg > 0 && process.argv[arg + 1]) return process.argv[arg + 1].split(',').map((name) => ({ name, html_url: `https://github.com/${USER}/${name}` }));
  const headers = { accept: 'application/vnd.github+json', 'user-agent': `${USER}-profile` };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/users/${USER}/repos?type=owner&sort=created&direction=desc&per_page=30`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return (await res.json()).filter((r) => !r.fork && !r.archived && !r.private && !SKIP.has(r.name.toLowerCase()));
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Solid blocks get the bright gradient, box-drawing "shadow" characters a darker purple.
function artLine(line) {
  return line.replace(/(█+)|([^█]+)/g, (m, solid) => (solid ? `<tspan class="b">${m}</tspan>` : `<tspan class="s">${esc(m)}</tspan>`));
}

function svg(building) {
  const W = 1200;
  const H = 352;
  const x = 60;
  const artTop = 130;
  const lh = 27; // ASCII line height
  const right = 560; // tagline column
  const typed = `→ building ${building}`;
  const mono = "ui-monospace, 'Cascadia Mono', 'JetBrains Mono', SFMono-Regular, Consolas, 'DejaVu Sans Mono', Menlo, monospace";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="aero: backend, discord bots, ai tools. building ${esc(building)}">
  <title>aero</title>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e9d5ff"/>
      <stop offset="0.5" stop-color="#c084fc"/>
      <stop offset="1" stop-color="#9333ea"/>
    </linearGradient>
    <filter id="glow" x="-5%" y="-20%" width="110%" height="140%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ffffff" opacity="0.025"/>
    </pattern>
    <style>
      text { font-family: ${mono}; white-space: pre; }
      .b { fill: url(#g); }
      .s { fill: #5b3a8c; }
      .cursor { animation: blink 1.1s steps(1) infinite; }
      @keyframes blink { 50% { opacity: 0; } }
      .type { animation: type 2.6s steps(${typed.length}) 0.6s both; }
      @keyframes type { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
    </style>
  </defs>

  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="#0b0a12" stroke="#2b2540" stroke-width="2"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="url(#scan)"/>
  <path d="M1 44 H${W - 1}" stroke="#1d1a2b" stroke-width="2"/>
  <circle cx="30" cy="23" r="6.5" fill="#3b3452"/>
  <circle cx="52" cy="23" r="6.5" fill="#3b3452"/>
  <circle cx="74" cy="23" r="6.5" fill="#a855f7"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="14" fill="#6f6889">aero@github: ~</text>

  <text x="${x}" y="78" font-size="20"><tspan fill="#c084fc">~/aero</tspan><tspan fill="#8b85a3"> $ </tspan><tspan fill="#e9e6f5">whoami</tspan></text>

  <g filter="url(#glow)" font-size="22">
${ART.map((line, i) => `    <text x="${x}" y="${artTop + i * lh}" xml:space="preserve">${artLine(line)}</text>`).join('\n')}
  </g>

  <text x="${right}" y="${artTop + 2 * lh + 4}" font-size="26" fill="#e9e6f5">backend <tspan fill="#a855f7">·</tspan> discord bots <tspan fill="#a855f7">·</tspan> ai tools</text>
  <text class="type" x="${right}" y="${artTop + 3 * lh + 14}" font-size="19" fill="#8b85a3" xml:space="preserve"><tspan fill="#a855f7">→</tspan>${esc(typed.slice(1))}</text>

  <text x="${x}" y="${H - 30}" font-size="20"><tspan fill="#c084fc">~/aero</tspan><tspan fill="#8b85a3"> $ </tspan><tspan class="cursor" fill="#e9e6f5">█</tspan></text>
</svg>
`;
}

function writeIfChanged(file, content, label) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return console.log(`${label}: unchanged`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`${label}: updated`);
}

let repos;
try {
  repos = await newestRepos();
} catch (e) {
  console.warn(`couldn't look up repos (${e.message}); leaving the profile as it is`);
  process.exit(0);
}
if (!repos.length) {
  console.log('no public repos yet; nothing to update');
  process.exit(0);
}

// Banner: the newest repo.
const building = repos[0].name.toLowerCase();
writeIfChanged(OUT, svg(building), `banner (building ${building})`);

// README: the two newest repos, between <!-- recent --> and <!-- /recent -->.
const recent = repos.slice(0, 2).map((r) => `[${r.name.toLowerCase()}](${r.html_url})`).join(' + ');
const readme = fs.readFileSync(README, 'utf8');
if (/<!-- recent -->[\s\S]*?<!-- \/recent -->/.test(readme)) {
  writeIfChanged(README, readme.replace(/<!-- recent -->[\s\S]*?<!-- \/recent -->/, `<!-- recent -->${recent}<!-- /recent -->`), `README (${recent})`);
} else {
  console.log('README has no <!-- recent --> markers; skipped');
}
