# Gabriel — monochrome floating knight

Researched and implemented 7 September 2026 for Goiaba Lunar. Research and browser verification used ego-browser. The user authorized choosing the historical reference.

## Historical direction

German Gothic field armor, approximately 1480: a sallet with a swept rear tail, separate bevor, shaped breastplate, articulated waist and limb defenses, gauntlets, mail at the gaps, and pointed sabatons. The pale grayscale illustration uses nib-like contours and crosshatching to remain visible against the existing dark galaxy.

Primary museum sources consulted:

- [The Met — Sallet, German, ca. 1480, 14.25.576](https://www.metmuseum.org/art/collection/search/27122). Dated helmet reference; steel and leather. The object photograph guided the rounded skull, narrow eye slit and rear protection.
- [The Met — Sallet and Bevor, German, 1480, 29.158.6a, b](https://www.metmuseum.org/art/collection/search/34258). Reference for the helmet and separate chin/throat defense. The final direction avoids the later stacked neck collar produced in the initial sketch.
- [The Met — German Gothic Gauntlet for the Left Hand, ca. 1480, 14.25.909](https://www.metmuseum.org/art/collection/search/22347). The museum identifies diagonal fluting and cusped plate edges as characteristics of late-fifteenth-century German Gothic armor.
- [The Met — Gothic Armor, 29.150.8b–s](https://www.metmuseum.org/art/collection/search/23081). General silhouette and articulation reference only. The museum explicitly dates extensive restoration to around 1926 and states that approximately half the ensemble is restoration. It is not an intact surviving 1480 harness.

The result is a research-informed illustration, not an archaeological reconstruction or a copy of a particular complete suit. Small fastening details are interpretive. The floating pose is invented for the galaxy: tilted head, relaxed open hands, unevenly flexed knees and unsupported feet. No claim is made that this is a measured neutral posture in microgravity. No cape, sword, shield, insignia or extra props distract from that silhouette.

## Integration

- The portfolio anchor, accessible name and external destination are preserved.
- The knight is a transparent HTML image, independent of WebGL availability. Its `data-model` hook and renderer factory branch were removed; planets and Morfeu retain their existing rendering.
- The character is approximately 22% smaller than the first illustration integration. The galaxy uses an 18-second ambient drift; dragging adds a short follow-through, spring-driven tilt and a small lift in scale. A quick release throws the knight with decaying momentum and a soft rebound at the screen edges; holding before release places him. He can be caught again during flight. Project headers retain a static compact illustration, and returning to the galaxy restores the current position.
- `js/knight.js` uses pointer capture for mouse/touch, a movement threshold to preserve normal clicks, and keyboard impulses (arrows, Shift for a stronger impulse, Escape to reset). Position is clamped above the navigation rail and below the header, and checked after resize. Pause, reduced motion and a hidden tab stop inertia; reduced motion still allows direct dragging. A drag never activates the external portfolio link.
- Original production PNG: `goiaba-lunar/source/illustration/knight-floating.png`. Runtime image: `goiaba-lunar/assets/drawn/knight-floating.webp`. The built-in image tool produced the illustration; cwebp produced the smaller web asset while preserving alpha.
- The previous procedural knight and its geometry tests remain as historical source; the live scene no longer imports or instantiates it.
- [Full production prompt](knight-prompts.md).

## Verification

Studio production build and all 14 existing tests passed. Browser checks cover desktop and mobile galaxy layouts, the compact product header, loading of the transparent asset, preserved portfolio destination, absence of a 3D knight hook, pause/resume and reduced motion. Screenshots are in `docs/studio/screenshots/knight/`.
