# Animation and Living Map Brief

## Goal

The map must feel alive even before complex pathfinding or detailed routine simulation is implemented.

The first visual version should use lightweight ambient loops and reusable character animation frames. The player should see motion in the scene within a few seconds of opening the map.

## Ambient Animations

### Clouds

- Use 2 to 4 cloud sprites.
- Move slowly across the sky/map layer using CSS transform.
- Vary delay, duration, scale, and opacity.
- Direction can be left-to-right by default.
- Pause/reduce movement under `prefers-reduced-motion`.

### Grass and Trees

- Use pseudo-elements or small generated grass sprites.
- Animate slight vertical/rotation movement.
- Keep duration slow and staggered.
- Do not animate every tree individually if it hurts performance.

### Banners

- Red/gold Roman banners should flutter subtly.
- Use `transform: skewX(...) translateY(...)` or frame opacity.
- Attach to Domus, arena, walls, and important buildings.

### Torches and Fire

- Torches are visible with higher opacity at dusk/night.
- Animate flame scale/brightness with a short alternate loop.
- Add small warm glow around torches at night.

### Smoke

- Canteen and torches can emit occasional smoke puffs.
- Use opacity and translateY animation.
- Keep subtle; avoid noisy motion.

### Arena Crowd

- Use tiny alternating colored dots/tiles in the arena stands.
- Animate very low opacity brightness or vertical jitter.
- This suggests crowd movement without rendering people individually.

## Character Animations

Minimum frames per animation:

- map idle: 2 frames;
- map walk: 2 frames;
- map train: 2 frames;
- map eat: 2 frames;
- map rest/sleep: 2 frames;
- map healing: 2 frames;
- combat idle: 2 frames;
- combat attack: 2 frames.

First implementation can alternate two image frames with CSS.

Example:

```tsx
<span className="sprite-frame-stack" data-frame-count="2">
  <img className="sprite-frame sprite-frame--0" src={frames[0]} alt="" />
  <img className="sprite-frame sprite-frame--1" src={frames[1]} alt="" />
</span>
```

```css
.sprite-frame--1 {
  opacity: 0;
  animation: sprite-frame-toggle var(--sprite-animation-duration, 1.2s) steps(1) infinite;
}

@keyframes sprite-frame-toggle {
  0%,
  49% {
    opacity: 0;
  }
  50%,
  100% {
    opacity: 1;
  }
}
```

## Map Movement vs Ambient Motion

The user explicitly asked for the map to feel alive without requiring full path movement. Therefore:

- ambient motion is mandatory in the first living-map PR;
- gladiator path movement can stay simple or static initially;
- character idle/action animation is mandatory;
- advanced pathfinding is not part of this visual migration unless already easy.

## Reduced Motion

Always add:

```css
@media (prefers-reduced-motion: reduce) {
  .ambient-cloud,
  .ambient-grass,
  .ambient-banner,
  .torch-flame,
  .sprite-frame {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Do not remove visual state entirely under reduced motion; show a static equivalent.
