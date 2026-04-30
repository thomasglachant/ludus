#!/usr/bin/env node
import { deflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const variantsPath = join(root, 'src', 'game-data', 'gladiator-visual-variants.ts');
const outputRoot = join(root, 'public', 'assets', 'gladiators');
const webRoot = '/assets/gladiators';

const mapFrameKeys = [
  'map-idle',
  'map-walk',
  'map-train',
  'map-eat',
  'map-rest',
  'map-celebrate',
  'map-healing',
];
const combatFrameKeys = [
  'combat-idle',
  'combat-attack',
  'combat-hit',
  'combat-block',
  'combat-defeat',
  'combat-victory',
];

const colorByClothingColor = {
  madderRed: '#9f3f32',
  ochre: '#bd8131',
  olive: '#5f7440',
  indigo: '#3e4e7d',
  linenWhite: '#d7c49a',
};
const shadowByClothingColor = {
  madderRed: '#5f2724',
  ochre: '#775022',
  olive: '#374b2d',
  indigo: '#252d52',
  linenWhite: '#8d7651',
};
const skinByTone = {
  olive: '#a86f4c',
  tan: '#c2875d',
  bronze: '#b8734f',
  umber: '#855238',
  dark: '#5f3b2d',
};
const skinShadowByTone = {
  olive: '#704831',
  tan: '#7d5138',
  bronze: '#74452f',
  umber: '#523423',
  dark: '#34231d',
};
const hairByStyle = {
  cropped: '#2c2019',
  curly: '#3b261c',
  shaved: '#6f4c38',
  braidedBeard: '#251915',
  fullBeard: '#4b2e1e',
};
const metal = {
  bronze: '#b87936',
  bronzeLight: '#d6a34a',
  bronzeDark: '#68411f',
  iron: '#73716a',
  ironDark: '#403f3b',
  leather: '#6b432b',
  linen: '#d8c793',
  parchment: '#d6bd83',
  outline: '#241913',
  shadow: '#1b130f',
  red: '#9e342c',
  dust: '#c99b61',
};

function parseArrayConstant(source, name) {
  const match = source.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const;`));
  if (!match) {
    throw new Error(`Missing variant constant: ${name}`);
  }

  return Array.from(match[1].matchAll(/'([^']+)'/g), ([, value]) => value);
}

function parseNumberConstant(source, name) {
  const match = source.match(new RegExp(`export const ${name} = (\\d+);`));
  if (!match) {
    throw new Error(`Missing variant constant: ${name}`);
  }

  return Number(match[1]);
}

function readVariantConfig() {
  const source = readFileSync(variantsPath, 'utf8');
  return {
    maxVariantCount: parseNumberConstant(source, 'GLADIATOR_VISUAL_VARIANT_LIMIT'),
    clothingStyles: parseArrayConstant(source, 'GLADIATOR_CLOTHING_STYLES'),
    clothingColors: parseArrayConstant(source, 'GLADIATOR_CLOTHING_COLORS'),
    hairAndBeardStyles: parseArrayConstant(source, 'GLADIATOR_HAIR_AND_BEARD_STYLES'),
    headwearStyles: parseArrayConstant(source, 'GLADIATOR_HEADWEAR_STYLES'),
    bodyBuildStyles: parseArrayConstant(source, 'GLADIATOR_BODY_BUILD_STYLES'),
    skinTones: parseArrayConstant(source, 'GLADIATOR_SKIN_TONES'),
    markingStyles: parseArrayConstant(source, 'GLADIATOR_MARKING_STYLES'),
  };
}

function parseArgs(args) {
  const limitArg = args.find((arg) => arg.startsWith('--limit='));

  return {
    clean: args.includes('--clean'),
    dryRun: args.includes('--dry-run'),
    limit: limitArg ? Number(limitArg.slice('--limit='.length)) : undefined,
  };
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function color(value, alpha = 255) {
  const hex = value.replace('#', '');
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
    alpha,
  ];
}

class PixelImage {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, rgba) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) {
      return;
    }
    const offset = (py * this.width + px) * 4;
    this.data[offset] = rgba[0];
    this.data[offset + 1] = rgba[1];
    this.data[offset + 2] = rgba[2];
    this.data[offset + 3] = rgba[3];
  }

  rect(x, y, width, height, fill) {
    const rgba = color(fill);
    for (let py = Math.round(y); py < Math.round(y + height); py += 1) {
      for (let px = Math.round(x); px < Math.round(x + width); px += 1) {
        this.setPixel(px, py, rgba);
      }
    }
  }

  rectOutline(x, y, width, height, fill, outline = metal.outline, stroke = 2) {
    this.rect(x, y, width, height, outline);
    this.rect(x + stroke, y + stroke, width - stroke * 2, height - stroke * 2, fill);
  }

  ellipse(cx, cy, rx, ry, fill, alpha = 255) {
    const rgba = color(fill, alpha);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        if (((x - cx) * (x - cx)) / (rx * rx) + ((y - cy) * (y - cy)) / (ry * ry) <= 1) {
          this.setPixel(x, y, rgba);
        }
      }
    }
  }

  line(x0, y0, x1, y1, fill, thickness = 1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let index = 0; index <= steps; index += 1) {
      const t = steps === 0 ? 0 : index / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      this.rect(
        Math.round(x - thickness / 2),
        Math.round(y - thickness / 2),
        thickness,
        thickness,
        fill,
      );
    }
  }

  polygon(points, fill) {
    const rgba = color(fill);
    const minY = Math.floor(Math.min(...points.map((point) => point[1])));
    const maxY = Math.ceil(Math.max(...points.map((point) => point[1])));
    for (let y = minY; y <= maxY; y += 1) {
      const intersections = [];
      for (let i = 0; i < points.length; i += 1) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
          intersections.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i < intersections.length; i += 2) {
        for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1]); x += 1) {
          this.setPixel(x, y, rgba);
        }
      }
    }
  }

  blit(source, x, y) {
    for (let py = 0; py < source.height; py += 1) {
      for (let px = 0; px < source.width; px += 1) {
        const sourceOffset = (py * source.width + px) * 4;
        const alpha = source.data[sourceOffset + 3];
        if (alpha === 0) {
          continue;
        }
        const targetOffset = ((py + y) * this.width + (px + x)) * 4;
        source.data.copy(this.data, targetOffset, sourceOffset, sourceOffset + 4);
      }
    }
  }

  toPng() {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    const raw = Buffer.alloc((this.width * 4 + 1) * this.height);
    for (let y = 0; y < this.height; y += 1) {
      raw[y * (this.width * 4 + 1)] = 0;
      this.data.copy(
        raw,
        y * (this.width * 4 + 1) + 1,
        y * this.width * 4,
        (y + 1) * this.width * 4,
      );
    }
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

function writePng(relativePath, image, dryRun) {
  const outputPath = join(outputRoot, relativePath);
  if (!dryRun) {
    ensureDir(dirname(outputPath));
    writeFileSync(outputPath, image.toPng());
  }
  return `${webRoot}/${relativePath}`;
}

function variantId(index) {
  return `gladiator-${String(index + 1).padStart(2, '0')}`;
}

function buildVariants(config, limit) {
  const variants = [];
  for (const clothingStyle of config.clothingStyles) {
    for (const clothingColor of config.clothingColors) {
      for (const hairAndBeardStyle of config.hairAndBeardStyles) {
        for (const headwearStyle of config.headwearStyles) {
          const index = variants.length;
          variants.push({
            clothingStyle,
            clothingColor,
            hairAndBeardStyle,
            headwearStyle,
            bodyBuildStyle: config.bodyBuildStyles[index % config.bodyBuildStyles.length],
            skinTone: config.skinTones[(Math.floor(index / 3) + index) % config.skinTones.length],
            markingStyle:
              config.markingStyles[(Math.floor(index / 9) + index) % config.markingStyles.length],
          });
          if (variants.length >= limit) {
            return variants;
          }
        }
      }
    }
  }
  return variants;
}

function buildMeta(variant) {
  return {
    paletteId: `${variant.clothingColor}-${variant.skinTone}`,
    bodyType: variant.bodyBuildStyle,
    hairStyle: variant.headwearStyle === 'none' ? variant.hairAndBeardStyle : variant.headwearStyle,
    armorStyle:
      variant.clothingStyle === 'bronzeCuirass'
        ? 'bronze'
        : variant.clothingStyle === 'leatherHarness'
          ? 'leather'
          : variant.clothingStyle,
  };
}

function bodyMetrics(build, scale) {
  const metrics = {
    compact: { shoulder: 0, height: -2, width: 0 },
    lean: { shoulder: -2, height: 2, width: -2 },
    broad: { shoulder: 3, height: 0, width: 3 },
    tall: { shoulder: -1, height: 5, width: 0 },
    stocky: { shoulder: 3, height: -3, width: 4 },
  }[build];
  return {
    shoulder: Math.round(metrics.shoulder * scale),
    height: Math.round(metrics.height * scale),
    width: Math.round(metrics.width * scale),
  };
}

function drawHeadwear(image, variant, cx, y, scale) {
  const headwear = variant.headwearStyle;
  if (headwear === 'none') {
    return;
  }
  if (headwear === 'clothWrap') {
    image.rectOutline(
      cx - 10 * scale,
      y - 2 * scale,
      20 * scale,
      7 * scale,
      metal.linen,
      metal.outline,
      scale,
    );
    image.rect(cx + 8 * scale, y + 2 * scale, 5 * scale, 12 * scale, metal.linen);
    return;
  }
  const helmetColor = headwear === 'ironMask' ? metal.iron : metal.bronze;
  image.rectOutline(
    cx - 12 * scale,
    y - 2 * scale,
    24 * scale,
    13 * scale,
    helmetColor,
    metal.outline,
    scale,
  );
  image.rect(
    cx - 9 * scale,
    y + 7 * scale,
    18 * scale,
    5 * scale,
    headwear === 'ironMask' ? metal.ironDark : metal.bronzeDark,
  );
  if (headwear === 'crestedHelmet') {
    image.rect(cx - 3 * scale, y - 13 * scale, 6 * scale, 12 * scale, metal.red);
    image.rect(cx - 8 * scale, y - 9 * scale, 16 * scale, 4 * scale, metal.red);
  }
  if (headwear === 'ironMask') {
    image.rect(cx - 7 * scale, y + 8 * scale, 4 * scale, 2 * scale, metal.shadow);
    image.rect(cx + 3 * scale, y + 8 * scale, 4 * scale, 2 * scale, metal.shadow);
  }
}

function drawHair(image, variant, cx, y, scale) {
  if (variant.headwearStyle !== 'none' && variant.headwearStyle !== 'clothWrap') {
    return;
  }
  const hair = hairByStyle[variant.hairAndBeardStyle];
  if (variant.hairAndBeardStyle === 'shaved') {
    image.rect(cx - 8 * scale, y, 16 * scale, 3 * scale, hair);
    return;
  }
  image.rect(cx - 10 * scale, y - 4 * scale, 20 * scale, 9 * scale, hair);
  if (variant.hairAndBeardStyle === 'curly') {
    image.rect(cx - 13 * scale, y + 1 * scale, 5 * scale, 7 * scale, hair);
    image.rect(cx + 8 * scale, y + 1 * scale, 5 * scale, 7 * scale, hair);
  }
}

function drawMarkings(image, variant, cx, y, scale) {
  if (variant.markingStyle === 'cheekScar') {
    image.line(cx + 5 * scale, y + 13 * scale, cx + 10 * scale, y + 20 * scale, '#7b2f28', scale);
  }
  if (variant.markingStyle === 'browScar') {
    image.line(cx - 8 * scale, y + 10 * scale, cx - 1 * scale, y + 7 * scale, '#7b2f28', scale);
  }
  if (variant.markingStyle === 'warPaint') {
    image.rect(cx - 11 * scale, y + 12 * scale, 22 * scale, 2 * scale, metal.red);
  }
  if (variant.markingStyle === 'arenaDust') {
    image.rect(cx + 8 * scale, y + 22 * scale, 3 * scale, 3 * scale, metal.dust);
    image.rect(cx - 12 * scale, y + 19 * scale, 2 * scale, 3 * scale, metal.dust);
  }
}

function drawClothing(image, variant, cx, y, width, height, scale) {
  const cloth = colorByClothingColor[variant.clothingColor];
  const shadow = shadowByClothingColor[variant.clothingColor];
  if (variant.clothingStyle === 'subligaculum') {
    image.rectOutline(
      cx - width / 2,
      y,
      width,
      height * 0.56,
      skinByTone[variant.skinTone],
      metal.outline,
      scale,
    );
    image.rect(cx - width * 0.36, y + height * 0.42, width * 0.72, height * 0.25, cloth);
    image.rect(cx - width * 0.2, y + height * 0.35, width * 0.4, height * 0.34, shadow);
  } else {
    image.rectOutline(cx - width / 2, y, width, height, cloth, metal.outline, scale);
    image.rect(
      cx - width / 2 + scale,
      y + height - 5 * scale,
      width - 2 * scale,
      5 * scale,
      shadow,
    );
  }
  if (variant.clothingStyle === 'linenTunic') {
    image.rect(cx - width / 2 + 4 * scale, y + 5 * scale, width - 8 * scale, 4 * scale, '#ead9aa');
  }
  if (variant.clothingStyle === 'leatherHarness') {
    image.line(
      cx - width / 2 + 3 * scale,
      y + 2 * scale,
      cx + width / 2 - 3 * scale,
      y + height - 4 * scale,
      metal.leather,
      2 * scale,
    );
    image.line(
      cx + width / 2 - 3 * scale,
      y + 2 * scale,
      cx - width / 2 + 3 * scale,
      y + height - 4 * scale,
      metal.leather,
      2 * scale,
    );
  }
  if (variant.clothingStyle === 'paddedManica') {
    image.rect(cx - width / 2 - 6 * scale, y + 4 * scale, 7 * scale, height * 0.7, metal.linen);
  }
  if (variant.clothingStyle === 'bronzeCuirass') {
    image.rectOutline(
      cx - width / 2 + 3 * scale,
      y + 1 * scale,
      width - 6 * scale,
      height * 0.55,
      metal.bronze,
      metal.bronzeDark,
      scale,
    );
    image.rect(
      cx - width / 2 + 8 * scale,
      y + 5 * scale,
      width - 16 * scale,
      3 * scale,
      metal.bronzeLight,
    );
  }
}

function drawGladiator(image, variant, options) {
  const scale = options.scale;
  const cx = options.cx;
  const feetY = options.feetY;
  const metrics = bodyMetrics(variant.bodyBuildStyle, scale);
  const bounce = options.frame === 1 ? (options.bounce ?? 0) : 0;
  const bodyHeight = 28 * scale + metrics.height;
  const bodyWidth = 18 * scale + metrics.width;
  const headY = feetY - bodyHeight - 22 * scale + bounce;
  const torsoY = feetY - bodyHeight + bounce;
  const skin = skinByTone[variant.skinTone];
  const skinShadow = skinShadowByTone[variant.skinTone];
  const legSwing = (options.frame === 1 ? 2 : -2) * scale;
  const armSwing = (options.frame === 1 ? -3 : 2) * scale;
  image.ellipse(cx, feetY + 3 * scale, 20 * scale, 5 * scale, metal.shadow, 75);
  image.rectOutline(
    cx - 10 * scale,
    headY + 7 * scale,
    20 * scale,
    20 * scale,
    skin,
    metal.outline,
    scale,
  );
  image.rect(cx + 6 * scale, headY + 12 * scale, 3 * scale, 7 * scale, skinShadow);
  image.rect(cx - 6 * scale, headY + 15 * scale, 3 * scale, 2 * scale, metal.shadow);
  image.rect(cx + 4 * scale, headY + 15 * scale, 3 * scale, 2 * scale, metal.shadow);
  drawHair(image, variant, cx, headY + 7 * scale, scale);
  drawHeadwear(image, variant, cx, headY + 5 * scale, scale);
  drawMarkings(image, variant, cx, headY + 7 * scale, scale);
  if (variant.hairAndBeardStyle === 'braidedBeard' || variant.hairAndBeardStyle === 'fullBeard') {
    image.rect(
      cx - 7 * scale,
      headY + 24 * scale,
      14 * scale,
      variant.hairAndBeardStyle === 'fullBeard' ? 7 * scale : 4 * scale,
      hairByStyle[variant.hairAndBeardStyle],
    );
  }
  drawClothing(
    image,
    variant,
    cx,
    torsoY,
    bodyWidth + 8 * scale + metrics.shoulder,
    bodyHeight,
    scale,
  );
  image.rectOutline(
    cx - 17 * scale - metrics.shoulder + armSwing,
    torsoY + 5 * scale,
    7 * scale,
    22 * scale,
    skin,
    metal.outline,
    scale,
  );
  image.rectOutline(
    cx + 10 * scale + metrics.shoulder - armSwing,
    torsoY + 5 * scale,
    7 * scale,
    22 * scale,
    skin,
    metal.outline,
    scale,
  );
  image.rectOutline(
    cx - 8 * scale + legSwing,
    feetY - 13 * scale,
    7 * scale,
    13 * scale,
    skinShadow,
    metal.outline,
    scale,
  );
  image.rectOutline(
    cx + 2 * scale - legSwing,
    feetY - 13 * scale,
    7 * scale,
    13 * scale,
    skinShadow,
    metal.outline,
    scale,
  );
  if (options.activity === 'eat') {
    image.rect(cx + 14 * scale, torsoY + 3 * scale, 6 * scale, 5 * scale, metal.parchment);
  }
  if (options.activity === 'healing') {
    image.rect(cx - 15 * scale, torsoY + 15 * scale, 12 * scale, 3 * scale, '#eee2c7');
  }
  if (options.activity === 'celebrate') {
    image.rect(cx - 8 * scale, headY - 11 * scale, 16 * scale, 4 * scale, metal.bronzeLight);
  }
}

function drawMapFrame(variant, frameKey, frameIndex) {
  const image = new PixelImage(64, 96);
  const activity = frameKey.replace('map-', '');
  const rest = activity === 'rest';
  drawGladiator(image, variant, {
    activity,
    bounce: activity === 'celebrate' ? -5 : activity === 'walk' ? -2 : 0,
    cx: rest ? 29 : 32,
    feetY: rest ? 80 : 84,
    frame: frameIndex,
    scale: 1,
  });
  if (rest) {
    image.rect(18, 78, 31, 6, metal.parchment);
  }
  return image;
}

function drawCombatFrame(variant, frameKey, frameIndex) {
  const image = new PixelImage(120, 180);
  const activity = frameKey.replace('combat-', '');
  const defeated = activity === 'defeat';
  if (defeated) {
    image.ellipse(58, 159, 34, 6, metal.shadow, 90);
    image.rectOutline(
      35,
      130,
      50,
      18,
      colorByClothingColor[variant.clothingColor],
      metal.outline,
      2,
    );
    image.rectOutline(70, 118, 22, 20, skinByTone[variant.skinTone], metal.outline, 2);
    return image;
  }
  drawGladiator(image, variant, {
    activity: activity === 'victory' ? 'celebrate' : activity,
    bounce: activity === 'attack' ? -2 : activity === 'hit' ? 3 : 0,
    cx: activity === 'attack' && frameIndex === 1 ? 68 : 58,
    feetY: 158,
    frame: frameIndex,
    scale: 2,
  });
  if (activity === 'hit') {
    image.rect(82, 54, 9, 4, '#f4d073');
    image.rect(88, 61, 7, 3, '#f4d073');
  }
  return image;
}

function drawPortrait(variant) {
  const image = new PixelImage(128, 150);
  image.rect(0, 0, 128, 150, metal.parchment);
  image.rectOutline(6, 6, 116, 138, '#c49a62', '#4b3324', 3);
  image.rect(11, 11, 106, 128, '#d8bd83');
  drawGladiator(image, variant, {
    activity: 'idle',
    bounce: 0,
    cx: 64,
    feetY: 140,
    frame: 0,
    scale: 2,
  });
  image.rect(18, 126, 92, 4, '#7d5534');
  image.rect(26, 132, 76, 3, metal.bronzeLight);
  return image;
}

function createAtlas(frames, imageName, width, height, frameWidth, frameHeight, padding) {
  const entries = {};
  frames.forEach((name, index) => {
    entries[name] = {
      frame: { x: index * (frameWidth + padding), y: 0, w: frameWidth, h: frameHeight },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
      sourceSize: { w: frameWidth, h: frameHeight },
    };
  });
  return {
    frames: entries,
    meta: {
      app: 'ludus-gladiator-production-asset-pipeline',
      image: imageName,
      format: 'RGBA8888',
      size: { w: width, h: height },
      scale: '1',
    },
  };
}

function writeSpritesheet(variant, variantBasePath, mode, framePaths, dryRun) {
  const keys = mode === 'map' ? mapFrameKeys : combatFrameKeys;
  const frameWidth = mode === 'map' ? 64 : 120;
  const frameHeight = mode === 'map' ? 96 : 180;
  const frames = keys.flatMap((key) => [0, 1].map((frame) => `${key}-${frame}.png`));
  const padding = 2;
  const width = frames.length * frameWidth + (frames.length - 1) * padding;
  const sheet = new PixelImage(width, frameHeight);
  frames.forEach((name, index) => {
    const [key, frame] = name
      .replace('.png', '')
      .match(/(.+)-(\d)$/)
      .slice(1);
    const image =
      mode === 'map'
        ? drawMapFrame(variant, key, Number(frame))
        : drawCombatFrame(variant, key, Number(frame));
    sheet.blit(image, index * (frameWidth + padding), 0);
  });
  const imagePath = `${variantBasePath}/${mode}-spritesheet.png`;
  const atlasPath = `${variantBasePath}/${mode}-spritesheet.json`;
  writePng(imagePath, sheet, dryRun);
  if (!dryRun) {
    writeFileSync(
      join(outputRoot, atlasPath),
      `${JSON.stringify(createAtlas(frames, `${mode}-spritesheet.png`, width, frameHeight, frameWidth, frameHeight, padding), null, 2)}\n`,
    );
  }
  framePaths[`${mode}Spritesheet`] = `${webRoot}/${imagePath}`;
  framePaths[`${mode}Atlas`] = `${webRoot}/${atlasPath}`;
}

function generateAssets(variant, id, dryRun) {
  const variantBasePath = id;
  const frames = {};
  const sheetPaths = {};
  const portrait = writePng(`${variantBasePath}/portrait.png`, drawPortrait(variant), dryRun);

  for (const frameKey of mapFrameKeys) {
    frames[frameKey] = [];
    for (const frameIndex of [0, 1]) {
      frames[frameKey].push(
        writePng(
          `${variantBasePath}/map/${frameKey}-${frameIndex}.png`,
          drawMapFrame(variant, frameKey, frameIndex),
          dryRun,
        ),
      );
    }
  }

  for (const frameKey of combatFrameKeys) {
    frames[frameKey] = [];
    for (const frameIndex of [0, 1]) {
      frames[frameKey].push(
        writePng(
          `${variantBasePath}/combat/${frameKey}-${frameIndex}.png`,
          drawCombatFrame(variant, frameKey, frameIndex),
          dryRun,
        ),
      );
    }
  }

  writeSpritesheet(variant, variantBasePath, 'map', sheetPaths, dryRun);
  writeSpritesheet(variant, variantBasePath, 'combat', sheetPaths, dryRun);

  return {
    sourceQuality: 'production',
    portrait,
    mapSpritesheet: sheetPaths.mapSpritesheet,
    mapAtlas: sheetPaths.mapAtlas,
    combatSpritesheet: sheetPaths.combatSpritesheet,
    combatAtlas: sheetPaths.combatAtlas,
    frames,
    ...buildMeta(variant),
    clothingStyle: variant.clothingStyle,
    clothingColor: variant.clothingColor,
    hairAndBeardStyle: variant.hairAndBeardStyle,
    headwearStyle: variant.headwearStyle,
    bodyBuildStyle: variant.bodyBuildStyle,
    skinTone: variant.skinTone,
    markingStyle: variant.markingStyle,
  };
}

function generateProductionAssetManifest(dryRun) {
  if (dryRun) {
    return;
  }

  const result = spawnSync(process.execPath, [join(root, 'scripts', 'generate-production-asset-manifest.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error('Failed to regenerate production asset manifest.');
  }
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  const config = readVariantConfig();
  const limit = options.limit ?? config.maxVariantCount;

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('--limit must be a positive integer');
  }
  if (limit > config.maxVariantCount) {
    throw new Error(`--limit must be <= ${config.maxVariantCount}`);
  }

  const variants = buildVariants(config, limit);

  if (options.clean && !options.dryRun) {
    rmSync(outputRoot, { recursive: true, force: true });
  }
  if (!options.dryRun) {
    ensureDir(outputRoot);
  }

  variants.forEach((variant, index) => {
    generateAssets(variant, variantId(index), options.dryRun);
  });

  generateProductionAssetManifest(options.dryRun);

  console.log(
    `Generated ${variants.length} gladiator production asset sets${options.dryRun ? ' (dry run)' : ''}.`,
  );
}

run();
