import { Container } from 'pixi.js';

export type PixiRenderLayerMap<TLayerId extends string> = Record<TLayerId, Container>;

export interface PixiRenderLayerSetup<TLayerId extends string> {
  root: Container;
  layers: PixiRenderLayerMap<TLayerId>;
}

export function createRenderLayerSetup<TLayerId extends string>(
  layerIds: readonly TLayerId[],
  options: Partial<Record<TLayerId, { sortableChildren?: boolean }>> = {},
): PixiRenderLayerSetup<TLayerId> {
  const root = new Container();
  const layers = {} as PixiRenderLayerMap<TLayerId>;

  root.label = 'render-layers';

  for (const layerId of layerIds) {
    const layer = new Container();

    layer.label = layerId;
    layer.sortableChildren = options[layerId]?.sortableChildren ?? false;

    layers[layerId] = layer;
    root.addChild(layer);
  }

  return { root, layers };
}
