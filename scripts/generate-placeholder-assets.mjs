import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetRoot = join(root, 'public', 'assets');

const buildingThemes = {
  domus: { wall: '#d9b17c', roof: '#a84031', trim: '#6e4f36', accent: '#f2dfb5' },
  canteen: { wall: '#d8ad78', roof: '#c65e38', trim: '#6e4f36', accent: '#8f5f35' },
  dormitory: { wall: '#d2a06f', roof: '#8f3942', trim: '#674a34', accent: '#6d4a31' },
  trainingGround: { wall: '#c49352', roof: '#8c623b', trim: '#65462f', accent: '#b7834c' },
  pleasureHall: { wall: '#d0a871', roof: '#8d4c8e', trim: '#61405c', accent: '#c59635' },
  infirmary: { wall: '#d7bb8b', roof: '#6f9b91', trim: '#4f6b64', accent: '#b33a4b' },
};

const portraitThemes = {
  'portrait-bronze-crop': { tunic: '#a56d35', hair: '#2f211b', skin: '#c88d64', bg: '#ead49a' },
  'portrait-red-crest': { tunic: '#a84031', hair: '#3b251d', skin: '#b97957', bg: '#ebc37e' },
  'portrait-olive-scarf': { tunic: '#5f7b45', hair: '#30251d', skin: '#c49068', bg: '#d9c680' },
  'portrait-blue-tunic': { tunic: '#374b76', hair: '#1f2027', skin: '#b9815f', bg: '#d8c087' },
  'portrait-gold-helm': { tunic: '#b88932', hair: '#5a3b22', skin: '#cf956b', bg: '#efd799' },
  'portrait-ash-beard': { tunic: '#7a6657', hair: '#5d554d', skin: '#bd825f', bg: '#d4be87' },
  'portrait-sand-wrap': { tunic: '#c19b57', hair: '#4f3222', skin: '#c18862', bg: '#e5ca8b' },
  'portrait-iron-mask': { tunic: '#6e7681', hair: '#242426', skin: '#b9805a', bg: '#d2ba82' },
};

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeAsset(relativePath, content) {
  const outputPath = join(assetRoot, relativePath);
  ensureDir(dirname(outputPath));
  writeFileSync(outputPath, content);
}

function svg(width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${content}</svg>\n`;
}

function buildingSvg(buildingId, level) {
  const theme = buildingThemes[buildingId];
  const isEmpty = level === 0;
  const heightBonus = Math.min(level, 8) * 2;
  const roofY = buildingId === 'trainingGround' ? 34 : 16 - Math.min(level, 4);
  const baseY = buildingId === 'trainingGround' ? 42 : 34 - heightBonus;
  const baseHeight = buildingId === 'trainingGround' ? 34 : 44 + heightBonus;
  const wall = isEmpty ? '#c8b896' : theme.wall;
  const roof = isEmpty ? '#9b8b75' : theme.roof;
  const trim = isEmpty ? '#756a5b' : theme.trim;
  const accent = isEmpty ? '#8f8170' : theme.accent;

  if (buildingId === 'trainingGround') {
    return svg(
      128,
      96,
      `
<rect width="128" height="96" fill="none"/>
<rect x="14" y="54" width="100" height="30" fill="${wall}" stroke="${trim}" stroke-width="4"/>
<rect x="20" y="60" width="88" height="18" fill="${accent}"/>
<rect x="50" y="36" width="8" height="48" fill="${trim}"/>
<rect x="82" y="36" width="8" height="48" fill="${trim}"/>
<rect x="28" y="42" width="70" height="8" fill="${roof}"/>
<rect x="32" y="48" width="8" height="8" fill="${trim}"/>
<rect x="96" y="48" width="8" height="8" fill="${trim}"/>
<rect x="28" y="18" width="${16 + level * 5}" height="8" fill="${accent}"/>
<rect x="28" y="26" width="${16 + level * 5}" height="6" fill="${trim}"/>
`,
    );
  }

  return svg(
    128,
    96,
    `
<rect width="128" height="96" fill="none"/>
<ellipse cx="64" cy="86" rx="48" ry="7" fill="#5b422f" opacity="0.24"/>
<rect x="24" y="${baseY}" width="80" height="${baseHeight}" fill="${wall}" stroke="${trim}" stroke-width="4"/>
<path d="M14 ${roofY + 28} L64 ${roofY} L114 ${roofY + 28} L104 ${roofY + 36} L24 ${roofY + 36} Z" fill="${roof}" stroke="${trim}" stroke-width="4"/>
<rect x="37" y="${baseY + 16}" width="9" height="${baseHeight - 18}" fill="${accent}"/>
<rect x="54" y="${baseY + 16}" width="9" height="${baseHeight - 18}" fill="${accent}"/>
<rect x="71" y="${baseY + 16}" width="9" height="${baseHeight - 18}" fill="${accent}"/>
<rect x="88" y="${baseY + 16}" width="9" height="${baseHeight - 18}" fill="${accent}"/>
<rect x="52" y="${baseY + baseHeight - 24}" width="24" height="24" fill="${trim}"/>
${level >= 3 ? `<rect x="32" y="${baseY + 6}" width="12" height="10" fill="#f3e0ad"/><rect x="84" y="${baseY + 6}" width="12" height="10" fill="#f3e0ad"/>` : ''}
${level >= 6 ? `<rect x="18" y="${baseY + baseHeight - 12}" width="92" height="8" fill="${accent}"/>` : ''}
${isEmpty ? `<rect x="26" y="${baseY + 4}" width="76" height="${baseHeight - 8}" fill="none" stroke="#6d6252" stroke-width="3" stroke-dasharray="8 6"/>` : ''}
`,
  );
}

function locationSvg(locationId) {
  if (locationId === 'arena') {
    return svg(
      160,
      120,
      `
<rect width="160" height="120" fill="none"/>
<ellipse cx="80" cy="96" rx="62" ry="10" fill="#5b422f" opacity="0.24"/>
<ellipse cx="80" cy="58" rx="62" ry="44" fill="#8a705e"/>
<ellipse cx="80" cy="58" rx="50" ry="34" fill="#e9c79a"/>
<ellipse cx="80" cy="58" rx="36" ry="24" fill="#b78a65"/>
<ellipse cx="80" cy="58" rx="24" ry="14" fill="#c98d58"/>
<rect x="34" y="92" width="92" height="8" fill="#6b5241"/>
`,
    );
  }

  return svg(
    140,
    100,
    `
<rect width="140" height="100" fill="none"/>
<ellipse cx="70" cy="88" rx="48" ry="7" fill="#5b422f" opacity="0.24"/>
<rect x="22" y="44" width="96" height="38" fill="#d9bd7a" stroke="#715333" stroke-width="4"/>
<rect x="18" y="30" width="104" height="20" fill="#c6573b" stroke="#8a3d31" stroke-width="4"/>
<rect x="28" y="34" width="14" height="14" fill="#f4d793"/>
<rect x="50" y="34" width="14" height="14" fill="#cda35c"/>
<rect x="72" y="34" width="14" height="14" fill="#f4d793"/>
<rect x="94" y="34" width="14" height="14" fill="#cda35c"/>
<rect x="56" y="56" width="28" height="26" fill="#715333"/>
`,
  );
}

function menuBackgroundSvg() {
  return svg(
    1440,
    980,
    `
<rect width="1440" height="980" fill="#94b9c8"/>
<circle cx="1064" cy="138" r="58" fill="#ffe09a"/>
<rect x="0" y="334" width="1440" height="646" fill="#c7b779"/>
<ellipse cx="560" cy="414" rx="264" ry="190" fill="#67854f"/>
<ellipse cx="1012" cy="418" rx="296" ry="182" fill="#79925c"/>
<rect x="0" y="706" width="1440" height="274" fill="#9b8755" opacity="0.6"/>
<path d="M574 822 L1226 362 L1284 394 L632 858 Z" fill="#b46b3c"/>
<path d="M566 462 L1328 776 L1328 806 L566 492 Z" fill="#8b583b"/>
<rect x="560" y="364" width="778" height="536" fill="none" stroke="#704f34" stroke-width="10"/>
<rect x="572" y="376" width="754" height="512" fill="none" stroke="#e8d196" stroke-width="4"/>
<ellipse cx="1192" cy="496" rx="142" ry="90" fill="#8a705e"/>
<ellipse cx="1192" cy="496" rx="108" ry="66" fill="#f0d2a6"/>
<ellipse cx="1192" cy="496" rx="72" ry="44" fill="#c98d58"/>
<circle cx="888" cy="644" r="42" fill="#e5dcc6"/>
<circle cx="888" cy="644" r="24" fill="#5c7883"/>
<g opacity="0.14">
${Array.from({ length: 40 }, (_, index) => `<rect x="${index * 38}" y="334" width="2" height="646" fill="#5e4a2e"/>`).join('')}
${Array.from({ length: 24 }, (_, index) => `<rect x="0" y="${334 + index * 28}" width="1440" height="2" fill="#5e4a2e"/>`).join('')}
</g>
`,
  );
}

function portraitSvg(id, theme) {
  return svg(
    96,
    112,
    `
<rect width="96" height="112" fill="${theme.bg}"/>
<rect x="6" y="6" width="84" height="100" fill="none" stroke="#6b4b32" stroke-width="6"/>
<rect x="30" y="18" width="36" height="16" fill="${theme.hair}"/>
<rect x="28" y="28" width="40" height="36" fill="${theme.skin}" stroke="#4f3728" stroke-width="4"/>
<rect x="34" y="42" width="8" height="6" fill="#2c211c"/>
<rect x="54" y="42" width="8" height="6" fill="#2c211c"/>
<rect x="42" y="58" width="12" height="4" fill="#7b3d32"/>
<rect x="24" y="70" width="48" height="36" fill="${theme.tunic}" stroke="#4f3728" stroke-width="4"/>
<rect x="18" y="76" width="12" height="30" fill="${theme.tunic}" stroke="#4f3728" stroke-width="4"/>
<rect x="66" y="76" width="12" height="30" fill="${theme.tunic}" stroke="#4f3728" stroke-width="4"/>
<rect x="58" y="8" width="16" height="10" fill="#f2d176" opacity="0.78"/>
`,
  );
}

function spriteSvg(id, theme) {
  return svg(
    48,
    64,
    `
<rect width="48" height="64" fill="none"/>
<ellipse cx="24" cy="58" rx="16" ry="4" fill="#2e2119" opacity="0.28"/>
<rect x="16" y="8" width="16" height="12" fill="${theme.hair}"/>
<rect x="14" y="16" width="20" height="18" fill="${theme.skin}" stroke="#4f3728" stroke-width="3"/>
<rect x="13" y="34" width="22" height="22" fill="${theme.tunic}" stroke="#4f3728" stroke-width="3"/>
<rect x="8" y="38" width="8" height="16" fill="${theme.tunic}" stroke="#4f3728" stroke-width="3"/>
<rect x="32" y="38" width="8" height="16" fill="${theme.tunic}" stroke="#4f3728" stroke-width="3"/>
<rect x="17" y="54" width="7" height="8" fill="#5b3827"/>
<rect x="25" y="54" width="7" height="8" fill="#5b3827"/>
`,
  );
}

for (const buildingId of Object.keys(buildingThemes)) {
  for (let level = 0; level <= 8; level += 1) {
    writeAsset(`buildings/${buildingId}-level-${level}.svg`, buildingSvg(buildingId, level));
  }
}

for (const locationId of ['market', 'arena']) {
  writeAsset(`locations/${locationId}.svg`, locationSvg(locationId));
}

writeAsset('backgrounds/main-menu-ludus.svg', menuBackgroundSvg());

for (const [id, theme] of Object.entries(portraitThemes)) {
  writeAsset(`portraits/${id}.svg`, portraitSvg(id, theme));
  writeAsset(`sprites/${id.replace('portrait', 'sprite')}.svg`, spriteSvg(id, theme));
}
