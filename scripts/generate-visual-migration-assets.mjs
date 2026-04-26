#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRoot = join(root, 'public', 'assets', 'pixel-art');
const webRoot = '/assets/pixel-art';

const args = new Set(process.argv.slice(2));
const clean = args.has('--clean');
const dryRun = args.has('--dry-run');
const variantCountArg = process.argv.find((arg) => arg.startsWith('--variant-count='));
const variantCount = variantCountArg ? Number(variantCountArg.split('=')[1]) : 12;

if (!Number.isInteger(variantCount) || variantCount < 4) {
  throw new Error('--variant-count must be an integer >= 4');
}

const timePhases = ['dawn', 'day', 'dusk', 'night'];
const buildingIds = ['domus', 'canteen', 'dormitory', 'trainingGround', 'pleasureHall', 'infirmary'];
const buildingLevels = [0, 1, 2, 3];
const generatedAt = '2026-01-01T00:00:00.000Z';

const phasePalettes = {
  dawn: { sky: '#d99a79', ground: '#b9965c', grass: '#6f844b', light: '#ffd39a', shadow: '#5a3a36' },
  day: { sky: '#83b6c8', ground: '#bfa66d', grass: '#6f8f50', light: '#ffe8a5', shadow: '#4b3828' },
  dusk: { sky: '#7a536f', ground: '#a78355', grass: '#5f7544', light: '#ffaf62', shadow: '#38243a' },
  night: { sky: '#17283d', ground: '#69604f', grass: '#3f5542', light: '#ff9b45', shadow: '#101624' },
};

const buildingThemes = {
  domus: { wall: '#d7b179', roof: '#a84532', trim: '#60442f', accent: '#efd9a2', icon: 'columns' },
  canteen: { wall: '#cf9b66', roof: '#bf5b35', trim: '#60432d', accent: '#9a6536', icon: 'smoke' },
  dormitory: { wall: '#c99968', roof: '#8e3d43', trim: '#5b3f2d', accent: '#765031', icon: 'beds' },
  trainingGround: { wall: '#c69052', roof: '#7f5b35', trim: '#59402b', accent: '#af7642', icon: 'dummies' },
  pleasureHall: { wall: '#cfa574', roof: '#86508c', trim: '#593653', accent: '#d4a740', icon: 'curtain' },
  infirmary: { wall: '#d4b987', roof: '#6f9b91', trim: '#49645e', accent: '#b33a4b', icon: 'cross' },
};

const gladiatorPalettes = [
  { paletteId: 'terracotta', skin: '#c98a63', hair: '#2b1d18', tunic: '#9f4d36', armor: '#b67a38' },
  { paletteId: 'olive', skin: '#b9825f', hair: '#3a2a1f', tunic: '#5f7c45', armor: '#a26f3d' },
  { paletteId: 'bronze', skin: '#d09a70', hair: '#5a3722', tunic: '#b77b36', armor: '#c6964a' },
  { paletteId: 'indigo', skin: '#b77756', hair: '#1f2027', tunic: '#3f517a', armor: '#99805a' },
  { paletteId: 'sand', skin: '#c18b62', hair: '#4c3021', tunic: '#c19a54', armor: '#7f6b52' },
  { paletteId: 'ash', skin: '#aa7658', hair: '#61584f', tunic: '#746257', armor: '#9a8a6d' },
];

function ensureDir(path) {
  if (!dryRun) {
    mkdirSync(path, { recursive: true });
  }
}

function writeAsset(relativePath, content) {
  const outputPath = join(outputRoot, relativePath);
  if (!dryRun) {
    ensureDir(dirname(outputPath));
    writeFileSync(outputPath, content);
  }
  return `${webRoot}/${relativePath}`;
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">\n${body.trim()}\n</svg>\n`;
}

function rect(x, y, width, height, fill, extra = '') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
}

function ellipse(cx, cy, rx, ry, fill, extra = '') {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
}

function makeMapBackground(phase) {
  const p = phasePalettes[phase];
  const torchOpacity = phase === 'night' ? 1 : phase === 'dusk' ? 0.75 : phase === 'dawn' ? 0.35 : 0.15;
  const starLayer = phase === 'night'
    ? Array.from({ length: 42 }, (_, i) => rect((i * 97) % 1440, 24 + ((i * 53) % 210), 3, 3, '#f2e4b8', 'opacity="0.7"')).join('\n')
    : '';

  return svg(1440, 980, `
    ${rect(0, 0, 1440, 980, p.sky)}
    ${starLayer}
    ${ellipse(1060, phase === 'night' ? 115 : 145, 58, 58, phase === 'night' ? '#d7d9c9' : '#ffe09a', 'opacity="0.9"')}
    <path d="M0 280 C180 190 300 260 460 205 C630 145 740 245 900 188 C1080 125 1210 220 1440 160 L1440 460 L0 460 Z" fill="#5f765f" opacity="0.55"/>
    <path d="M0 350 C260 270 420 335 650 265 C810 220 1040 350 1440 270 L1440 980 L0 980 Z" fill="${p.grass}"/>
    ${rect(0, 550, 1440, 430, p.ground)}
    <g opacity="0.16">
      ${Array.from({ length: 32 }, (_, i) => rect(i * 48, 550, 3, 430, '#604929')).join('\n')}
      ${Array.from({ length: 12 }, (_, i) => rect(0, 570 + i * 34, 1440, 2, '#604929')).join('\n')}
    </g>
    <path d="M560 910 L910 620 L980 650 L640 940 Z" fill="#9a6b43" opacity="0.82"/>
    <path d="M780 940 L1200 540 L1260 570 L850 960 Z" fill="#a37145" opacity="0.75"/>
    ${rect(510, 350, 820, 550, 'none', 'stroke="#5c4634" stroke-width="10"')}
    ${rect(522, 362, 796, 526, 'none', 'stroke="#d8bd79" stroke-width="3" opacity="0.75"')}
    <g opacity="${torchOpacity}">
      ${Array.from({ length: 8 }, (_, i) => `<g transform="translate(${560 + i * 105},388)">${rect(0,0,8,34,'#4b2f22')}${rect(-4,-10,16,12,p.light)}</g>`).join('\n')}
      ${Array.from({ length: 6 }, (_, i) => `<g transform="translate(${540 + i * 135},846)">${rect(0,0,8,34,'#4b2f22')}${rect(-4,-10,16,12,p.light)}</g>`).join('\n')}
    </g>
    <rect x="0" y="0" width="1440" height="980" fill="${p.shadow}" opacity="${phase === 'night' ? 0.24 : phase === 'dusk' ? 0.12 : 0.03}"/>
  `);
}

function makeHomepageBackground(phase = 'day') {
  const p = phasePalettes[phase === 'dusk' ? 'dusk' : 'day'];
  return svg(1440, 980, `
    ${rect(0, 0, 1440, 980, p.sky)}
    ${ellipse(1120, 125, 62, 62, '#ffe09a')}
    <path d="M0 260 C220 120 360 260 560 170 C760 80 880 240 1080 150 C1230 75 1320 145 1440 118 L1440 430 L0 430 Z" fill="#55715d" opacity="0.56"/>
    ${rect(0, 430, 1440, 550, '#b8a15f')}
    <path d="M545 820 L1265 390 L1312 425 L610 860 Z" fill="#a36a3d" opacity="0.9"/>
    <path d="M610 470 L1340 785 L1340 825 L610 510 Z" fill="#7c5237" opacity="0.8"/>
    ${rect(560, 370, 780, 530, 'none', 'stroke="#5d432e" stroke-width="10"')}
    ${rect(575, 385, 750, 500, 'none', 'stroke="#d7bd7d" stroke-width="4"')}
    <g transform="translate(760,435)">
      ${buildingMini('domus', 1, 1.8)}
    </g>
    <g transform="translate(1040,355)">
      ${arenaMini(1.2)}
    </g>
    <g transform="translate(630,575)">
      ${marketMini(1.1)}
    </g>
    <g transform="translate(830,690)">
      ${trainingMini(1.1)}
    </g>
    ${Array.from({ length: 34 }, (_, i) => treeSvg((i * 137) % 1320 + 20, 370 + ((i * 71) % 470), i % 2)).join('\n')}
    <rect x="0" y="0" width="1440" height="980" fill="#15110d" opacity="0.12"/>
  `);
}

function buildingMini(buildingId, level, scale = 1) {
  const t = buildingThemes[buildingId];
  const w = 90 * scale;
  const h = 70 * scale;
  return `<g>
    ${ellipse(w / 2, h - 3, w * 0.42, h * 0.09, '#3b2b20', 'opacity="0.25"')}
    <rect x="${18 * scale}" y="${30 * scale}" width="${54 * scale}" height="${35 * scale}" fill="${t.wall}" stroke="${t.trim}" stroke-width="${3 * scale}"/>
    <path d="M${8 * scale} ${34 * scale} L${45 * scale} ${10 * scale} L${82 * scale} ${34 * scale} L${72 * scale} ${42 * scale} L${18 * scale} ${42 * scale} Z" fill="${t.roof}" stroke="${t.trim}" stroke-width="${3 * scale}"/>
    <rect x="${39 * scale}" y="${48 * scale}" width="${12 * scale}" height="${17 * scale}" fill="${t.trim}"/>
    ${level >= 2 ? `<rect x="${24 * scale}" y="${40 * scale}" width="${8 * scale}" height="${10 * scale}" fill="#f4dfaa"/><rect x="${60 * scale}" y="${40 * scale}" width="${8 * scale}" height="${10 * scale}" fill="#f4dfaa"/>` : ''}
  </g>`;
}

function arenaMini(scale = 1) {
  const w = 150 * scale;
  return `<g>
    ${ellipse(w / 2, 74 * scale, 62 * scale, 10 * scale, '#3b2b20', 'opacity="0.25"')}
    <ellipse cx="${w / 2}" cy="${44 * scale}" rx="${64 * scale}" ry="${42 * scale}" fill="#806c5a"/>
    <ellipse cx="${w / 2}" cy="${44 * scale}" rx="${48 * scale}" ry="${31 * scale}" fill="#e8d0a2"/>
    <ellipse cx="${w / 2}" cy="${44 * scale}" rx="${31 * scale}" ry="${20 * scale}" fill="#c38c58"/>
  </g>`;
}

function marketMini(scale = 1) {
  return `<g>
    ${rect(0, 34 * scale, 86 * scale, 34 * scale, '#d7b16e', `stroke="#6b4930" stroke-width="${3 * scale}"`)}
    ${rect(-3 * scale, 20 * scale, 92 * scale, 18 * scale, '#b94733', `stroke="#79352b" stroke-width="${3 * scale}"`)}
    ${Array.from({ length: 4 }, (_, i) => rect((8 + i * 18) * scale, 23 * scale, 10 * scale, 14 * scale, i % 2 ? '#f2d58c' : '#c99645')).join('')}
  </g>`;
}

function trainingMini(scale = 1) {
  return `<g>
    ${rect(0, 20 * scale, 130 * scale, 76 * scale, '#c29152', `stroke="#65472e" stroke-width="${4 * scale}"`)}
    ${Array.from({ length: 4 }, (_, i) => `${rect((18 + i * 24) * scale, 32 * scale, 6 * scale, 45 * scale, '#5b3d28')}${rect((10 + i * 24) * scale, 44 * scale, 22 * scale, 5 * scale, '#5b3d28')}`).join('')}
  </g>`;
}

function treeSvg(x, y, tall = false) {
  if (tall) {
    return `<g transform="translate(${x},${y})">
      ${rect(12, 34, 8, 24, '#69482e')}
      <path d="M16 0 C4 14 3 32 8 48 L24 48 C29 31 28 14 16 0 Z" fill="#38573a"/>
      <path d="M16 8 C8 21 8 34 12 45 L22 45 C25 32 24 19 16 8 Z" fill="#4b6d42"/>
    </g>`;
  }
  return `<g transform="translate(${x},${y})">
    ${rect(18, 32, 7, 24, '#735034')}
    ${ellipse(21, 24, 20, 18, '#4f6f3e')}
    ${ellipse(12, 30, 14, 12, '#6b8c4b')}
    ${ellipse(29, 31, 15, 13, '#58783f')}
  </g>`;
}

function makeBuildingAsset(buildingId, level, layer) {
  const t = buildingThemes[buildingId];
  const isEmpty = level === 0;
  const wall = isEmpty ? '#9a8b74' : t.wall;
  const roof = isEmpty ? '#7c6c5b' : t.roof;
  const trim = isEmpty ? '#5d5349' : t.trim;
  const accent = isEmpty ? '#857561' : t.accent;
  const heightBonus = level * 5;

  if (layer === 'roof') {
    return svg(256, 192, `
      <path d="M24 ${78 - heightBonus} L128 ${28 - heightBonus} L232 ${78 - heightBonus} L212 ${104 - heightBonus} L44 ${104 - heightBonus} Z" fill="${roof}" stroke="${trim}" stroke-width="8"/>
      ${level >= 2 ? rect(122, 16 - heightBonus, 14, 28, trim) : ''}
      ${level >= 3 ? rect(42, 96 - heightBonus, 172, 8, accent) : ''}
    `);
  }

  if (layer === 'interior') {
    return svg(256, 192, `
      ${rect(34, 70, 188, 108, '#b88958', `stroke="${trim}" stroke-width="6"`)}
      ${interiorProps(buildingId, level)}
    `);
  }

  if (layer === 'props') {
    return svg(256, 192, `
      ${propDetails(buildingId, level)}
    `);
  }

  if (buildingId === 'trainingGround') {
    return svg(256, 192, `
      ${ellipse(128, 176, 98, 12, '#3c2b20', 'opacity="0.24"')}
      ${rect(24, 72, 208, 100, wall, `stroke="${trim}" stroke-width="8"`)}
      <g opacity="0.42">
        ${Array.from({ length: 6 }, (_, i) => rect(38 + i * 30, 88, 8, 68, '#7c5534')).join('\n')}
      </g>
      ${propDetails(buildingId, level)}
      ${isEmpty ? rect(36, 84, 184, 76, 'none', 'stroke="#604f40" stroke-width="5" stroke-dasharray="12 8"') : ''}
    `);
  }

  return svg(256, 192, `
    ${ellipse(128, 176, 88, 12, '#3c2b20', 'opacity="0.24"')}
    ${rect(42, 72 - heightBonus, 172, 104 + heightBonus, wall, `stroke="${trim}" stroke-width="8"`)}
    <path d="M24 ${82 - heightBonus} L128 ${26 - heightBonus} L232 ${82 - heightBonus} L212 ${104 - heightBonus} L44 ${104 - heightBonus} Z" fill="${roof}" stroke="${trim}" stroke-width="8"/>
    ${rect(108, 132, 40, 44, trim)}
    ${level >= 1 ? columnsSvg(accent, trim) : ''}
    ${level >= 2 ? `${rect(62, 102, 24, 22, '#f3dc9d', `stroke="${trim}" stroke-width="4"`)}${rect(170, 102, 24, 22, '#f3dc9d', `stroke="${trim}" stroke-width="4"`)}` : ''}
    ${level >= 3 ? `${rect(32, 160, 192, 10, accent)}${bannerSvg(116, 72, '#a33d30', '#d4a740')}` : ''}
    ${isEmpty ? rect(50, 84, 156, 84, 'none', 'stroke="#604f40" stroke-width="5" stroke-dasharray="12 8"') : ''}
    ${propDetails(buildingId, level)}
  `);
}

function columnsSvg(accent, trim) {
  return [58, 88, 166, 196].map((x) => `${rect(x, 105, 12, 66, accent)}${rect(x - 4, 99, 20, 8, trim)}${rect(x - 4, 168, 20, 8, trim)}`).join('\n');
}

function bannerSvg(x, y, fill, trim) {
  return `<g transform="translate(${x},${y})">${rect(0,0,28,46,fill,`stroke="${trim}" stroke-width="3"`)}<path d="M0 46 L14 34 L28 46 Z" fill="#6b2923"/><rect x="12" y="7" width="4" height="24" fill="${trim}"/><rect x="6" y="15" width="16" height="4" fill="${trim}"/></g>`;
}

function interiorProps(buildingId, level) {
  if (buildingId === 'canteen') {
    return `${rect(58, 98, 48, 18, '#7c5332')}${rect(62, 120, 12, 32, '#5e3d28')}${rect(88, 120, 12, 32, '#5e3d28')}${ellipse(154, 118, 28, 20, '#4a3a2d')}${rect(148, 90, 14, 24, '#c66d38')}`;
  }
  if (buildingId === 'dormitory') {
    return Array.from({ length: 3 + level }, (_, i) => `${rect(52 + (i % 3) * 54, 90 + Math.floor(i / 3) * 42, 40, 26, '#8c5d3d')}${rect(56 + (i % 3) * 54, 94 + Math.floor(i / 3) * 42, 32, 18, '#d5bd87')}`).join('');
  }
  if (buildingId === 'trainingGround') {
    return `${propDetails(buildingId, level)}`;
  }
  if (buildingId === 'pleasureHall') {
    return `${rect(60,96,120,20,'#7d4b6e')}${rect(72,130,34,20,'#a4703e')}${rect(132,130,34,20,'#a4703e')}${bannerSvg(108,78,'#8d2f3a','#d4a740')}`;
  }
  if (buildingId === 'infirmary') {
    return `${rect(56,94,54,30,'#f0dfbd')}${rect(132,94,54,30,'#f0dfbd')}${rect(106,134,48,20,'#6f8b65')}${rect(122,82,12,34,'#b33a4b')}${rect(110,94,36,10,'#b33a4b')}`;
  }
  return `${rect(72,100,112,24,'#8b5f39')}${rect(92,130,72,38,'#6c4630')}${rect(114,82,28,26,'#d7bd68')}`;
}

function propDetails(buildingId, level) {
  if (buildingId === 'canteen') {
    return `${rect(34,146,28,20,'#8f6238')}${ellipse(204,145,15,20,'#7c5231')}${rect(198,98,16,28,'#4a372b')}${ellipse(206,92,24,11,'#3b3229')}`;
  }
  if (buildingId === 'trainingGround') {
    return `${Array.from({ length: 4 }, (_, i) => `${rect(54 + i * 38, 68, 8, 86, '#5b3c27')}${rect(42 + i * 38, 88, 32, 8, '#5b3c27')}`).join('')}${level >= 2 ? rect(32, 44, 92, 14, '#a06c3f') : ''}${level >= 3 ? rect(168, 42, 42, 42, '#7c5534', 'rx="2"') : ''}`;
  }
  if (buildingId === 'pleasureHall') {
    return `${bannerSvg(42,82,'#8d2f3a','#d4a740')}${bannerSvg(186,82,'#8d2f3a','#d4a740')}${rect(84,136,88,16,'#d4a740')}`;
  }
  if (buildingId === 'infirmary') {
    return `${rect(196,136,22,22,'#f2e5c2')}${rect(204,126,6,36,'#b33a4b')}${rect(190,140,34,6,'#b33a4b')}`;
  }
  if (buildingId === 'dormitory') {
    return `${rect(34,146,26,22,'#6d4a31')}${rect(198,146,22,18,'#6d4a31')}`;
  }
  return `${bannerSvg(36,96,'#9e3c2f','#d4a740')}${bannerSvg(192,96,'#9e3c2f','#d4a740')}`;
}

function makeLocationAsset(locationId, layer) {
  if (locationId === 'arena') {
    if (layer === 'combat-background') {
      return svg(1600, 900, `
        ${rect(0,0,1600,900,'#182435')}
        ${rect(0,0,1600,330,'#2b221b')}
        ${crowdDots(0, 20, 1600, 290)}
        ${rect(0,330,1600,90,'#79634f')}
        ${rect(0,420,1600,480,'#b88455')}
        <ellipse cx="800" cy="660" rx="620" ry="190" fill="#c59665"/>
        <ellipse cx="800" cy="660" rx="540" ry="150" fill="#b98658" opacity="0.8"/>
        ${rect(690,110,220,130,'#7b4134', 'stroke="#b47a33" stroke-width="8"')}
        ${rect(710,90,180,36,'#a23f30')}
        ${bannerSvg(760,130,'#9e3c2f','#d4a740')}
      `);
    }
    return svg(320, 240, `
      ${ellipse(160,208,118,16,'#3c2b20','opacity="0.24"')}
      <ellipse cx="160" cy="112" rx="128" ry="86" fill="#796858"/>
      <ellipse cx="160" cy="112" rx="104" ry="66" fill="#e0c69c"/>
      <ellipse cx="160" cy="112" rx="72" ry="42" fill="#bd8b58"/>
      ${crowdDots(52, 62, 216, 66)}
      ${rect(74,186,172,18,'#5e4938')}
    `);
  }

  return svg(280, 190, `
    ${ellipse(140,172,92,12,'#3c2b20','opacity="0.24"')}
    ${rect(34,82,212,72,'#d6b370','stroke="#6b4930" stroke-width="8"')}
    ${rect(28,56,224,34,'#b94733','stroke="#79352b" stroke-width="8"')}
    ${Array.from({ length: 6 }, (_, i) => rect(48 + i * 32, 62, 18, 26, i % 2 ? '#f2d58c' : '#c99645')).join('\n')}
    ${rect(110,112,50,42,'#6b4930')}
    ${rect(194,112,26,44,'#805934')}
    ${ellipse(207,108,22,12,'#4a3528')}
  `);
}

function crowdDots(x, y, w, h) {
  return Array.from({ length: 220 }, (_, i) => {
    const px = x + ((i * 37) % w);
    const py = y + ((i * 19) % h);
    const colors = ['#9c6042', '#3c5878', '#d2a451', '#6e4438', '#b98955'];
    return rect(px, py, 6, 8, colors[i % colors.length], 'opacity="0.86"');
  }).join('\n');
}

function makeAmbientAsset(name) {
  if (name.startsWith('cloud')) {
    return svg(160, 72, `
      ${ellipse(44,42,36,18,'#f5e8c6','opacity="0.86"')}
      ${ellipse(78,32,42,24,'#f5e8c6','opacity="0.9"')}
      ${ellipse(114,44,34,18,'#e8d6b0','opacity="0.82"')}
      ${rect(36,42,90,20,'#f5e8c6','opacity="0.8"')}
    `);
  }
  if (name === 'grass-tuft-01') {
    return svg(32, 32, `<path d="M4 30 L10 12 L14 30 L18 8 L22 30 L28 14 L30 30 Z" fill="#587b45"/>`);
  }
  if (name === 'banner-red') {
    return svg(42, 72, `${rect(18,0,6,72,'#5c3826')}${bannerSvg(2,8,'#9e3c2f','#d4a740')}`);
  }
  if (name === 'torch-on') {
    return svg(32, 64, `${rect(14,22,6,42,'#4b2f22')}${rect(10,16,14,10,'#8c4a25')}${rect(8,5,18,16,'#ff9b45')}${rect(12,0,10,12,'#ffd36a')}`);
  }
  if (name === 'smoke-puff') {
    return svg(40, 40, `${ellipse(14,26,10,7,'#d8d0bf','opacity="0.45"')}${ellipse(24,18,12,8,'#d8d0bf','opacity="0.35"')}${ellipse(19,10,8,5,'#d8d0bf','opacity="0.25"')}`);
  }
  return svg(20, 20, `${rect(6,6,8,8,'#b98955')}`);
}

function makeUiAsset(name) {
  if (name === 'parchment-tile') {
    return svg(64, 64, `${rect(0,0,64,64,'#e5d1a3')}${rect(0,0,64,4,'#f1dfb5')}${rect(0,60,64,4,'#b98c55')}${rect(12,18,2,2,'#c59b63','opacity="0.55"')}${rect(42,38,2,2,'#c59b63','opacity="0.55"')}`);
  }
  if (name === 'bronze-frame-tile') {
    return svg(64,64,`${rect(0,0,64,64,'#2a2118')}${rect(0,0,64,6,'#b47a33')}${rect(0,58,64,6,'#6a4526')}${rect(0,0,6,64,'#b47a33')}${rect(58,0,6,64,'#6a4526')}`);
  }
  if (name === 'roman-divider') {
    return svg(180,24,`${rect(0,10,180,4,'#b47a33')}${rect(82,2,16,20,'#d6a34a')}${rect(88,0,4,24,'#7d4f2b')}`);
  }
  if (name === 'laurel-left' || name === 'laurel-right') {
    const mirror = name.endsWith('right') ? ' scale(-1 1) translate(-64 0)' : '';
    return svg(64,96,`<g transform="${mirror}">${Array.from({length:8},(_,i)=>`<ellipse cx="${18+i*3}" cy="${82-i*9}" rx="6" ry="12" fill="#d6a34a" transform="rotate(${-35+i*3} ${18+i*3} ${82-i*9})"/>`).join('')}<path d="M44 90 C18 70 12 36 20 8" fill="none" stroke="#b47a33" stroke-width="5"/></g>`);
  }
  return svg(32,32,`${rect(6,6,20,20,'#d6a34a')}`);
}

function makePortrait(variant) {
  const p = gladiatorPalettes[variant % gladiatorPalettes.length];
  const hairStyle = ['crop', 'crest', 'curly', 'bald', 'beard', 'wrapped'][variant % 6];
  const scar = variant % 4 === 0;
  return svg(128, 150, `
    ${rect(0,0,128,150,'#d8bf83')}
    ${rect(6,6,116,138,'none','stroke="#5e432d" stroke-width="6"')}
    ${rect(44,20,40,22,p.hair)}
    ${hairStyle === 'crest' ? rect(54,8,28,18,'#9e3c2f') : ''}
    ${hairStyle === 'wrapped' ? rect(34,18,60,18,'#d8c18c') : ''}
    ${rect(38,32,52,50,p.skin,'stroke="#4d3425" stroke-width="4"')}
    ${rect(48,52,8,6,'#1f1714')}
    ${rect(72,52,8,6,'#1f1714')}
    ${scar ? rect(64,40,4,28,'#8e4336') : ''}
    ${rect(58,70,18,5,'#71362c')}
    ${rect(30,88,68,56,p.tunic,'stroke="#4d3425" stroke-width="4"')}
    ${rect(20,98,20,40,p.tunic,'stroke="#4d3425" stroke-width="4"')}
    ${rect(88,98,20,40,p.tunic,'stroke="#4d3425" stroke-width="4"')}
    ${rect(42,92,44,14,p.armor)}
    ${hairStyle === 'beard' ? rect(45,76,38,12,p.hair) : ''}
  `);
}

function makeMapSprite(variant, animation, frame) {
  const p = gladiatorPalettes[variant % gladiatorPalettes.length];
  const isCelebrating = animation === 'celebrate';
  const dy = frame === 1 ? (animation === 'rest' ? 1 : isCelebrating ? -6 : -2) : 0;
  const armOffset = isCelebrating ? (frame === 1 ? -8 : -5) : frame === 1 ? 3 : -2;
  const legOffset = frame === 1 ? 2 : -2;
  const weapon = animation === 'train' || animation === 'combat' || animation === 'attack';
  const leftArmY = isCelebrating ? 32 + dy : 46 + dy;
  const rightArmY = isCelebrating ? 30 + dy : 46 + dy;
  const celebrationMarker = isCelebrating ? `${rect(26, 6 + dy, 14, 4, '#d6a34a')}\n    ` : '';
  const weaponSprite = weapon ? `<rect x="${50 - armOffset}" y="${24 + dy}" width="5" height="38" fill="#d7c7a1" transform="rotate(35 ${50 - armOffset} ${24 + dy})"/>` : '';
  return svg(64, 80, `
    ${ellipse(32,74,18,5,'#201813','opacity="0.28"')}
    ${rect(23,9 + dy,18,14,p.hair)}
    ${rect(21,20 + dy,22,22,p.skin,'stroke="#4d3425" stroke-width="3"')}
    ${rect(20,42 + dy,24,24,p.tunic,'stroke="#4d3425" stroke-width="3"')}
    ${rect(15 + armOffset,leftArmY,8,18,p.skin,'stroke="#4d3425" stroke-width="3"')}
    ${rect(42 - armOffset,rightArmY,8,18,p.skin,'stroke="#4d3425" stroke-width="3"')}
    ${rect(23 + legOffset,64,7,12,'#5b3929')}
    ${rect(34 - legOffset,64,7,12,'#5b3929')}
    ${rect(24,44 + dy,20,8,p.armor)}
    ${celebrationMarker}${weaponSprite}
  `);
}

function makeCombatSprite(variant, animation, frame) {
  const p = gladiatorPalettes[variant % gladiatorPalettes.length];
  const lunge = animation === 'attack' && frame === 1 ? 14 : 0;
  const arm = frame === 1 ? 8 : -2;
  return svg(128, 160, `
    ${ellipse(64 + lunge,148,34,8,'#201813','opacity="0.32"')}
    ${rect(48 + lunge,18,34,22,p.hair)}
    ${rect(44 + lunge,38,42,44,p.skin,'stroke="#4d3425" stroke-width="5"')}
    ${rect(40 + lunge,84,50,54,p.tunic,'stroke="#4d3425" stroke-width="5"')}
    ${rect(28 + lunge + arm,90,16,42,p.skin,'stroke="#4d3425" stroke-width="4"')}
    ${rect(86 + lunge + arm,88,16,42,p.skin,'stroke="#4d3425" stroke-width="4"')}
    ${rect(48 + lunge,134,14,26,'#5b3929')}
    ${rect(70 + lunge,134,14,26,'#5b3929')}
    ${rect(42 + lunge,86,46,16,p.armor)}
    <rect x="${98 + lunge + arm}" y="${56}" width="8" height="68" fill="#d7c7a1" transform="rotate(42 ${98 + lunge + arm} 56)"/>
    <rect x="${18 + lunge}" y="94" width="22" height="38" fill="#795638" stroke="#d7a64a" stroke-width="4"/>
  `);
}

function variantMeta(index) {
  const p = gladiatorPalettes[index % gladiatorPalettes.length];
  return {
    paletteId: p.paletteId,
    bodyType: ['compact', 'broad', 'lean'][index % 3],
    hairStyle: ['cropped', 'crest', 'curly', 'shaved', 'beard', 'wrapped'][index % 6],
    armorStyle: ['cloth', 'leather', 'bronze', 'training'][index % 4],
  };
}

if (clean && !dryRun) {
  rmSync(outputRoot, { recursive: true, force: true });
}
ensureDir(outputRoot);

const manifest = {
  version: 1,
  generatedAt,
  homepage: { backgrounds: {}, lastSaveThumbnail: '' },
  map: { backgrounds: {}, ambient: {} },
  buildings: {},
  locations: { market: {}, arena: {} },
  gladiators: {},
  ui: {},
};

manifest.homepage.backgrounds.day = writeAsset('homepage/homepage-background-day.svg', makeHomepageBackground('day'));
manifest.homepage.backgrounds.dusk = writeAsset('homepage/homepage-background-dusk.svg', makeHomepageBackground('dusk'));
manifest.homepage.lastSaveThumbnail = writeAsset('homepage/last-save-thumbnail.svg', makeHomepageBackground('day'));

for (const phase of timePhases) {
  manifest.map.backgrounds[phase] = writeAsset(`map/backgrounds/ludus-map-${phase}.svg`, makeMapBackground(phase));
}

for (const name of ['cloud-01', 'cloud-02', 'grass-tuft-01', 'banner-red', 'torch-on', 'smoke-puff', 'crowd-dot']) {
  manifest.map.ambient[name] = writeAsset(`map/ambient/${name}.svg`, makeAmbientAsset(name));
}

for (const buildingId of buildingIds) {
  manifest.buildings[buildingId] = {};
  for (const level of buildingLevels) {
    const levelKey = `level-${level}`;
    const basePath = `buildings/${buildingId}/${levelKey}`;
    manifest.buildings[buildingId][levelKey] = {
      exterior: writeAsset(`${basePath}/exterior.svg`, makeBuildingAsset(buildingId, level, 'exterior')),
      roof: writeAsset(`${basePath}/roof.svg`, makeBuildingAsset(buildingId, level, 'roof')),
      interior: writeAsset(`${basePath}/interior.svg`, makeBuildingAsset(buildingId, level, 'interior')),
      props: writeAsset(`${basePath}/props.svg`, makeBuildingAsset(buildingId, level, 'props')),
      width: buildingId === 'trainingGround' ? 300 : buildingId === 'domus' ? 280 : 250,
      height: buildingId === 'trainingGround' ? 210 : 180,
    };
  }
}

manifest.locations.market.exterior = writeAsset('locations/market/exterior.svg', makeLocationAsset('market', 'exterior'));
manifest.locations.market.props = writeAsset('locations/market/props.svg', makeLocationAsset('market', 'props'));
manifest.locations.arena.exterior = writeAsset('locations/arena/exterior.svg', makeLocationAsset('arena', 'exterior'));
manifest.locations.arena.crowd = writeAsset('locations/arena/crowd.svg', makeLocationAsset('arena', 'crowd'));
manifest.locations.arena.combatBackground = writeAsset('locations/arena/combat-background.svg', makeLocationAsset('arena', 'combat-background'));

for (let index = 0; index < variantCount; index += 1) {
  const variantId = `gladiator-${String(index + 1).padStart(2, '0')}`;
  const basePath = `characters/gladiators/${variantId}`;
  const meta = variantMeta(index);
  const frames = {};

  const frameAnimations = ['map-idle', 'map-walk', 'map-train', 'map-eat', 'map-rest', 'map-celebrate', 'map-healing', 'combat-idle', 'combat-attack'];

  for (const animation of frameAnimations) {
    frames[animation] = [];
    for (const frame of [0, 1]) {
      const asset = animation.startsWith('combat')
        ? makeCombatSprite(index, animation.replace('combat-', ''), frame)
        : makeMapSprite(index, animation.replace('map-', ''), frame);
      frames[animation].push(writeAsset(`${basePath}/${animation}-${frame}.svg`, asset));
    }
  }

  manifest.gladiators[variantId] = {
    portrait: writeAsset(`${basePath}/portrait.svg`, makePortrait(index)),
    frames,
    ...meta,
  };
}

for (const name of ['parchment-tile', 'bronze-frame-tile', 'roman-divider', 'laurel-left', 'laurel-right', 'panel-corner', 'resource-icons']) {
  manifest.ui[name] = writeAsset(`ui/${name}.svg`, makeUiAsset(name));
}

writeAsset('asset-manifest.visual-migration.json', `${JSON.stringify(manifest, null, 2)}\n`);

if (dryRun) {
  console.log(JSON.stringify(manifest, null, 2));
} else {
  console.log(`Generated visual migration assets in ${outputRoot}`);
  console.log(`Manifest: ${join(outputRoot, 'asset-manifest.visual-migration.json')}`);
}
