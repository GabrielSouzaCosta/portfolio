"""Split the hero engraving into a still landscape and three living creatures.

Outputs, in assets/images/hero-life/ (run from the repository root):
  plate-ink.webp / plate-sketch.webp   the landscape with the creatures lifted out
  <creature>-ink.webp / -sketch.webp   each creature, transparent, cropped to its box
  motion.webp                          where the landscape itself may move (see motion_map)

    python3 scripts/hero-life.py [debug-dir]

Coordinates are plate pixels (hero.png is 1672x941) and are mirrored in
js/hero-engraving.js; change them together.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from importlib import import_module

sketch = import_module('hero-sketch')
blur, luminance, underdraw = sketch.blur, sketch.luminance, sketch.underdraw

OUT = Path('assets/images/hero-life')
DEBUG = Path(sys.argv[1]) if len(sys.argv) > 1 else None

plate = np.asarray(Image.open('assets/images/hero.png').convert('RGB'), dtype=np.float32) / 255
H, W = plate.shape[:2]
lum = luminance(plate)
paper_lum = np.median(lum[lum > .74])
ink = np.clip((paper_lum - lum) / .42, 0, 1)
rng = np.random.default_rng(11)


def grow(mask, size):
    image = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(image.filter(ImageFilter.MaxFilter(size))) > 127


def shrink(mask, size):
    image = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(image.filter(ImageFilter.MinFilter(size))) > 127


def polygon(points, box=(0, 0, W, H)):
    x0, y0, x1, y1 = box
    image = Image.new('L', (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(image).polygon([(x - x0, y - y0) for x, y in points], fill=255)
    return np.asarray(image) > 127


def enclosed(lines):
    """Everything the paper cannot reach from the box edge: a filled silhouette."""
    # A copy: flood fill does not write through to an array-backed image.
    image = Image.fromarray(np.where(lines, 255, 0).astype(np.uint8)).copy()
    h, w = lines.shape
    for x in range(0, w, 3):
        for y in (0, h - 1):
            if image.getpixel((x, y)) == 0:
                ImageDraw.floodfill(image, (x, y), 128)
    for y in range(0, h, 3):
        for x in (0, w - 1):
            if image.getpixel((x, y)) == 0:
                ImageDraw.floodfill(image, (x, y), 128)
    return np.asarray(image) != 128


def geodesic(seed, allowed, steps):
    """Grow `seed` through `allowed` one pixel ring at a time."""
    mask = seed & allowed
    for _ in range(steps):
        grown = grow(mask, 3) & allowed
        if (grown == mask).all():
            break
        mask = grown
    return mask


def region(box):
    x0, y0, x1, y1 = box
    return (slice(y0, y1), slice(x0, x1))


# ---------------------------------------------------------------- creatures
# Each creature: its crop box, and how its silhouette is found inside it.

def strider():
    box = (600, 545, 890, 783)
    rows, cols = region(box)
    local = ink[rows, cols].copy()
    x0, y0 = box[:2]
    ys, xs = np.mgrid[y0:box[3], x0:box[2]]
    # The small cloud behind its tail and the peaks under its beard are not the beast.
    local[(xs < 700) & (ys < 622)] = 0
    local[(xs > 846) & (ys > 682)] = 0
    upper = ys < 704
    body = enclosed(grow(local > .3, 5) & upper) & upper
    body = shrink(body, 3)
    # Legs and tail: darker than the far mountains, followed down from the body.
    legs = geodesic(grow(body, 3), (local > .42) & (ys < 756) & (xs < 812), 80)
    # Through the dark shoreline only straight down each leg.
    columns = grow(legs[755 - y0][None, :].repeat(3, 0), 9)[1]
    lower = (ys >= 756) & (ys < 781) & columns[None, :]
    legs = geodesic(legs, legs | ((local > .38) & lower), 40)
    return box, body | grow(legs, 3) & ((local > .2) | body)


def turtle():
    box = (372, 672, 592, 781)
    rows, cols = region(box)
    local = ink[rows, cols]
    x0, y0 = box[:2]
    ys, xs = np.mgrid[y0:box[3], x0:box[2]]
    # Keeps the far peaks beside the shell out of the fill.
    outline = polygon([(378, 736), (396, 726), (414, 712), (432, 697), (452, 686), (476, 679), (496, 677),
                       (520, 683), (544, 695), (563, 710), (578, 726), (588, 744), (588, 781), (376, 781)], box)
    upper = ys < 748
    body = enclosed(grow(local > .3, 5) & upper & outline) & upper & outline
    body = shrink(body, 3)
    legs = geodesic(grow(body, 3), (local > .45) & outline & (ys < 777), 40)
    return box, body | grow(legs, 3) & ((local > .2) | body)


def bird():
    box = (896, 204, 1296, 458)
    rows, cols = region(box)
    local = ink[rows, cols].copy()
    x0, y0 = box[:2]
    ys, xs = np.mgrid[y0:box[3], x0:box[2]]
    # The knight's helmet reaches into the lower right of the box.
    stray = ((xs > 1278) & (ys > 332)) | ((xs > 1262) & (ys > 380)) | ((xs > 1240) & (ys < 218))
    local[stray] = 0
    lines = grow(local > .22, 7)
    shape = enclosed(lines) & grow(local > .22, 9) & ~stray
    return box, shrink(shape, 3)


CREATURES = {'strider': strider, 'turtle': turtle, 'bird': bird}
# A point inside each body: only what connects to it belongs to the creature.
CORES = {'strider': (730, 660), 'turtle': (500, 720), 'bird': (1180, 300)}


def cutout(name):
    box, silhouette = CREATURES[name]()
    core = np.zeros_like(silhouette)
    core[CORES[name][1] - box[1], CORES[name][0] - box[0]] = True
    silhouette = geodesic(grow(core, 9), silhouette, 400)
    rows, cols = region(box)
    local_ink = ink[rows, cols]
    solid = blur(shrink(silhouette, 5).astype(np.float32), 1.2)
    # Solid where the drawing is a body; ink-only on thin tendrils, so the sky shows between dashes.
    alpha = np.clip(np.maximum(solid, local_ink * 1.8), 0, 1) * blur(silhouette.astype(np.float32), .8)
    return box, silhouette, alpha


# ---------------------------------------------------------------- landscape

def donor(fill, mask, dx, dy):
    """Copy the plate from (x + dx, y + dy) wherever `mask` is set."""
    ys, xs = np.nonzero(mask)
    fill[ys, xs] = plate[ys + dy, xs + dx]


def lift(cut):
    """The landscape as it would be drawn without the creatures."""
    fill = plate.copy()
    holes = np.zeros((H, W), bool)
    ys, xs = np.mgrid[0:H, 0:W]
    for name, (box, silhouette, alpha) in cut.items():
        hole = np.zeros((H, W), bool)
        hole[region(box)] = grow(silhouette, 7)
        holes |= hole
        if name == 'bird':
            donor(fill, hole, -700, -150)
        else:
            horizon = 722 if name == 'strider' else 726
            donor(fill, hole & (ys < horizon), -450 if name == 'strider' else -250, -350 if name == 'strider' else -450)
            ys_b, xs_b = np.nonzero(hole & (ys >= horizon))
            # The shore past the strider's front foot, repeated: far peaks over a dark shoreline.
            fill[ys_b, xs_b] = plate[ys_b, 815 + (xs_b - box[0]) % 85]
    feather = np.clip(blur(holes.astype(np.float32), 1.5) * 1.4, 0, 1)[..., None]
    return plate * (1 - feather) + fill * feather


def motion_map():
    """Quarter-size RGB weights: R cape, G open water, B foliage or clouds.

    Foliage (x > 1490) and clouds never overlap, so they share a channel; no
    alpha, because browsers may drop colour under zero alpha on upload."""
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    cape = polygon([(1330, 345), (1400, 330), (1432, 380), (1452, 470), (1468, 560), (1480, 640), (1488, 708),
                    (1440, 712), (1398, 694), (1384, 600), (1380, 500), (1370, 420), (1340, 382)])
    cape = blur(grow(cape, 15).astype(np.float32), 4) * np.clip((ys - 380) / 320, 0, 1)
    rocks = grow(ink > .5, 5)
    water = ((ys > 786) & (xs < 1000) & ~rocks).astype(np.float32)
    water = blur(water, 2)
    tree = polygon([(1498, 296), (1660, 296), (1660, 440), (1600, 470), (1520, 520), (1498, 480)])
    tree = blur(tree.astype(np.float32), 6) * np.clip((520 - ys) / 220, 0, 1)
    clouds = np.zeros((H, W), np.float32)
    for x0, y0, x1, y1 in [(1120, 168, 1440, 222), (1152, 452, 1260, 492), (842, 492, 1098, 536), (522, 588, 702, 626)]:
        clouds[y0:y1, x0:x1] = 1
    clouds = blur(clouds, 5)
    rgb = np.stack([cape, water, np.maximum(tree, clouds)], axis=-1)
    image = Image.fromarray(np.clip(rgb * 255, 0, 255).astype(np.uint8), 'RGB')
    return image.resize((W // 4, H // 4), Image.LANCZOS)


def save(array, path, alpha=None, quality=86):
    rgb = np.clip(array * 255, 0, 255).astype(np.uint8)
    if alpha is None:
        image = Image.fromarray(rgb, 'RGB')
    else:
        image = Image.fromarray(np.dstack([rgb, np.clip(alpha * 255, 0, 255).astype(np.uint8)]), 'RGBA')
    png = path.with_suffix('.png')
    image.save(png)
    flags = ['-lossless', '-exact'] if path.name == 'motion.webp' else ['-q', str(quality), '-alpha_q', '100']
    subprocess.run(['cwebp', '-quiet', *flags, str(png), '-o', str(path)], check=True)
    png.unlink()


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    cut = {name: cutout(name) for name in CREATURES}
    landscape = lift(cut)
    full_sketch = underdraw(plate)
    save(landscape, OUT / 'plate-ink.webp', quality=84)
    save(underdraw(landscape), OUT / 'plate-sketch.webp', quality=80)
    for name, (box, silhouette, alpha) in cut.items():
        rows, cols = region(box)
        save(plate[rows, cols], OUT / f'{name}-ink.webp', alpha)
        # The pencil creature hides the landscape behind it, like the finished one.
        solid = np.maximum(alpha, blur(silhouette.astype(np.float32), .8) * .92)
        save(full_sketch[rows, cols], OUT / f'{name}-sketch.webp', solid, quality=80)
    motion = motion_map()
    motion.save(OUT / 'motion.png')
    subprocess.run(['cwebp', '-quiet', '-lossless', '-exact', str(OUT / 'motion.png'), '-o', str(OUT / 'motion.webp')], check=True)
    (OUT / 'motion.png').unlink()
    print(json.dumps({name: box for name, (box, _, _) in cut.items()}))
    if DEBUG:
        DEBUG.mkdir(parents=True, exist_ok=True)
        for name, (box, silhouette, alpha) in cut.items():
            rows, cols = region(box)
            rgb = plate[rows, cols]
            tint = rgb * .55 + np.array([.9, .2, .2]) * .45
            view = np.where(silhouette[..., None], tint, rgb)
            checker = ((np.indices(alpha.shape).sum(0) // 8) % 2)[..., None] * .25 + .6
            over = rgb * alpha[..., None] + checker * (1 - alpha[..., None])
            pair = np.concatenate([view, over], axis=1)
            Image.fromarray((pair * 255).astype(np.uint8)).resize(
                (pair.shape[1] * 2, pair.shape[0] * 2), Image.LANCZOS).save(DEBUG / f'cut-{name}.png')
