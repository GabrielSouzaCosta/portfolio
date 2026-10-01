"""Derive the hero's pencil underdrawing from the finished engraving.

The underdrawing keeps the parchment and only thin contours of the plate, so the
cursor can engrave the full plate over it. Run from the repository root:

    python3 scripts/hero-sketch.py && cwebp -q 80 assets/images/hero-sketch.png -o assets/images/hero-sketch.webp

`scripts/hero-life.py` reuses `underdraw` for the landscape and each creature.
"""
import numpy as np
from PIL import Image, ImageFilter


def blur(values, radius):
    image = Image.fromarray(np.clip(values * 255, 0, 255).astype(np.uint8))
    return np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255


def shift(values, dy, dx):
    height, width = values.shape
    out = np.zeros_like(values)
    out[max(dy, 0):height + min(dy, 0), max(dx, 0):width + min(dx, 0)] = \
        values[max(-dy, 0):height + min(-dy, 0), max(-dx, 0):width + min(-dx, 0)]
    return out


def luminance(rgb):
    return rgb @ np.array([.299, .587, .114], dtype=np.float32)


def underdraw(rgb, seed=7):
    """Turn an engraving (float RGB, 0-1) into a pencil study on the same paper."""
    lum = luminance(rgb)

    # Parchment: the plate's colour wherever it is bare, spread under the ink.
    bare = (lum > .74).astype(np.float32)
    # Far from any bare paper (the dark cliff), fall back to the sheet's average tone.
    mean = rgb[bare > 0].mean(axis=0)
    weight = blur(bare, 40)
    paper = np.stack([(blur(rgb[..., c] * bare, 40) + mean[c] * .03) / (weight + .03) for c in range(3)], axis=-1)
    paper = mean + np.clip(paper - mean, -.035, .035)
    grain_source = lum - blur(lum, 1.5)
    grain_level = grain_source[lum > .74].std()
    rng = np.random.default_rng(seed)
    grain = blur(np.clip(.5 + rng.normal(0, grain_level, lum.shape), 0, 1), .7) - .5
    # Real grain only well away from ink, so no pale halos hug the old lines.
    grain = np.where(blur(bare, 3) > .97, grain_source, grain)
    paper = np.clip(paper + grain[..., None] * .9, 0, 1)

    # Soften the hatching away, then trace thin contours where the tone turns
    # (a small Canny: gradient, non-maximum suppression, soft threshold).
    tone = blur(lum, 2.8)
    gy, gx = np.gradient(tone)
    magnitude = np.hypot(gx, gy)
    direction = (np.round(np.arctan2(gy, gx) / (np.pi / 4)) % 4).astype(np.int8)
    steps = {0: (0, 1), 1: (1, 1), 2: (1, 0), 3: (1, -1)}
    crest = np.zeros_like(magnitude, dtype=bool)
    for index, (dy, dx) in steps.items():
        ahead, behind = shift(magnitude, dy, dx), shift(magnitude, -dy, -dx)
        crest |= (direction == index) & (magnitude >= ahead) & (magnitude >= behind)
    contour = np.where(crest, np.clip((magnitude - .004) / .02, 0, 1), 0) ** .9
    # A second, offset pass reads as a pencil searching for the form.
    contour = np.maximum(contour, shift(contour, 2, -1) * .3)
    contour = np.clip(blur(contour, .55) * 1.7, 0, 1) * .72
    # A faint wash keeps the large masses legible before they are cut.
    wash = np.clip((.7 - blur(lum, 9)) / .55, 0, 1) * .085

    graphite = np.array([.42, .38, .32], dtype=np.float32)
    out = paper * (1 - wash[..., None]) + graphite * wash[..., None]
    return out * (1 - contour[..., None]) + graphite * contour[..., None]


if __name__ == '__main__':
    plate = np.asarray(Image.open('assets/images/hero.png').convert('RGB'), dtype=np.float32) / 255
    out = underdraw(plate)
    Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8)).save('assets/images/hero-sketch.png')
