import type { Container, DestroyOptions } from 'pixi.js';

export const PIXI_DISPLAY_OBJECT_DESTROY_OPTIONS: DestroyOptions = {
  children: true,
  context: true,
  style: true,
  texture: false,
  textureSource: false,
};

export function destroyDisplayObject(displayObject: Container | null | undefined): void {
  if (!displayObject || displayObject.destroyed) {
    return;
  }

  displayObject.parent?.removeChild(displayObject);
  displayObject.destroy(PIXI_DISPLAY_OBJECT_DESTROY_OPTIONS);
}

export function destroyDisplayObjectMap<TDisplay extends Container>(
  displayObjects: Map<string, TDisplay>,
): void {
  for (const displayObject of displayObjects.values()) {
    destroyDisplayObject(displayObject);
  }

  displayObjects.clear();
}
