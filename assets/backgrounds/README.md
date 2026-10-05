# Stage artwork

- `stage-01.png` through `stage-08.png`: fixed artwork, 180 × 390 pixels.
- `stage-XX-KIND.png`: transparent, cropped animation overlays.
- `manifest.json`: overlay positions on the native 180 × 390 grid.
- Source: Figma file VE0eKAjlKzfMy5Zl9ilfqr, stage 1 node 107:2 and stages 2–8 in 137:2.

Edit the Figma source, export fixed artwork without effect groups, and replace the matching PNG. Export at 540 × 1170 and reduce with nearest-neighbor to avoid blended edges. Stages 4 and 5 have no clouds; stage 4's moon has been extracted into `moon.png`. Stages 3 and 4 use foreground overlays to hide the moving moon behind mountains. Preserve names, native dimensions and manifest positions when replacing files.

The game loads only these PNG assets and the manifest. The old SVGs and composition script are backed up under `artifacts/stage-backgrounds/legacy-stage1-svg` and `legacy-stage1-background.js`.

Animation behavior lives in `js/backgrounds.js`: stage 5 spawns temporary fireworks at random positions; stage 6 uses the hand-drawn `stage-06-meteor.png` sprites with shorter flames, random sizes and repeated diagonal falls, two erupting distant mountain vents, and integer screen shake; stage 7 uses streaks without stars; stage 8 keeps the hole artwork fixed while dots move inward and fade at its center. The previous `stage-06-nova.png` is retained but is not loaded.

Stage 3 raises the moon over three seconds after stage entry; stage 4 lowers it over four seconds, continuing from its last stage 3 position. Moon movement uses sine ease-in-out with fade-in during rise and fade-out during descent. The background preview repeats these motions every fourteen seconds.

Stage 7 streaks mix blue and pink, keeping each streak a single hue. Rope colors are defined in `renderer.js` (`getRopePalette`): dark brown on 1–2, yellow brown on 3–5, existing fire colors on 6, fluorescent magenta on 7, and alternating bright blue/pink with light peaks on 8. Stage 8 keeps the same light colors in front of and behind the player.
