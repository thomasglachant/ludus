import type { CSSProperties } from 'react';
import { PIXI_PRODUCTION_ASSET_MANIFEST } from '../rendering/pixi/assets/pixi-asset-manifest';
import { pixiTextureAliases } from '../rendering/pixi/assets/texture-aliases';

type PixiUiChromeVariable = `--pixi-ui-${string}`;
type PixiUiChromeStyle = CSSProperties & Partial<Record<PixiUiChromeVariable, string>>;

const uiChromeAssets: [PixiUiChromeVariable, string][] = [
  ['--pixi-ui-parchment-tile', 'parchment-tile'],
  ['--pixi-ui-bronze-frame-tile', 'bronze-frame-tile'],
  ['--pixi-ui-roman-divider', 'roman-divider'],
  ['--pixi-ui-panel-corner', 'panel-corner'],
];

function getProductionUiAssetUrl(assetId: string) {
  const texture = PIXI_PRODUCTION_ASSET_MANIFEST.textures[pixiTextureAliases.coreUi(assetId)];

  return texture?.src ? `url("${texture.src}")` : undefined;
}

export const pixiUiChromeStyle = Object.fromEntries(
  uiChromeAssets.flatMap(([property, assetId]) => {
    const assetUrl = getProductionUiAssetUrl(assetId);

    return assetUrl ? [[property, assetUrl]] : [];
  }),
) as PixiUiChromeStyle;
