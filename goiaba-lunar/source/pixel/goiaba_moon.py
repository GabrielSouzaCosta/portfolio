"""Goiaba lunar: the brand's guava crescent with Juquinha asleep on its top horn,
authored as real pixel art on a fixed grid. Writes a horizontal sprite sheet
(one frame per breath/twinkle step) to assets/drawn/goiaba-moon.png.

The brand mark (assets/brand/goiaba-lunar.webp) is the design reference; its
pixels are not grid-aligned, so the sprite is drawn here instead of traced.
Juquinha follows the owner's photo: black coat and mask, white blaze, muzzle,
chest and paws, pink nose.
"""
import math, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
W, H = 104, 96
FRAMES = 8

def hexa(value, alpha=255):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)

C = {
    'outline': hexa('1b1320'), 'rind_dark': hexa('566a1f'), 'rind': hexa('7e932d'), 'rind_light': hexa('a6b845'),
    'rind_spot': hexa('445619'), 'pith': hexa('f1e7a2'), 'flesh_deep': hexa('c92f63'), 'flesh': hexa('ea4f80'),
    'flesh_light': hexa('f683a3'), 'bite_edge': hexa('fbb3c4'), 'seed': hexa('f6d88d'), 'seed_shade': hexa('9a4633'),
    'spark': hexa('fff6e8'), 'glow': hexa('c3a6f2', 170), 'glow_far': hexa('a488e0', 95),
}
CAT = {
    'o': hexa('140e18'), 'k': hexa('2a2334'), 'h': hexa('453c55'), 'w': hexa('f5f0f3'), 's': hexa('cfc5d8'),
    'p': hexa('ec8ea6'), 'n': hexa('f07e9b'), 'e': hexa('a69cb6'),
}

# Crescent: the bite opens to the right and a little up, like the logo.
O = (47.0, 54.0); R = 40.5
PHI = math.radians(-24); D = 21.0; r = 31.0
B = (O[0] + D * math.cos(PHI), O[1] + D * math.sin(PHI))

def inside(x, y):
    return math.hypot(x - O[0], y - O[1]) <= R and math.hypot(x - B[0], y - B[1]) > r

def hash2(x, y, k=0):
    v = math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453
    return v - math.floor(v)

BODY = [  # Juquinha's curled back, 20 wide; bottom row rests on the rind.
    "......oooooooo......",
    "....ookkkhhhkkoo....",
    "...okkhhhkkkkkkko...",
    "..okkkkkkkkkkkkkko..",
    ".okkkkkkkkkkkkkkkko.",
    ".okkkkkkkkkkkkkkkko.",
    "okkkkkkkkkkkkkkkkko.",
    "okkkkkkkkkkkkkkkkko.",
    "okwwsokkkkkkkkkkkko.",
    ".oooo.oooooooooooo..",
]
HEAD = [  # Head resting on white paws, eyes closed, facing the viewer.
    "..o......o..",
    ".oko....oko.",
    ".okpoooopko.",
    "okkkkkkkkkko",
    "okkkkkkkkkko",
    "okeekwwkeeko",
    "okkkkwwkkkko",
    "okkwwnnwwkko",
    ".owwwwwwwwo.",
    "owwsowwsowwo",
    ".oooooooooo.",
]
TAIL = [(0, 8), (-1, 9), (-2, 10), (-2, 11), (-2, 12), (-1, 13), (-1, 14), (0, 15)]

def cat_layer(inhale):
    body = list(BODY)
    if inhale:  # the back rises one pixel; the belly stays on the moon
        body = body[1:4] + [body[3]] + body[4:]
    pixels = {}
    oy = 10 - len(body)
    for y, row in enumerate(body):
        for x, ch in enumerate(row):
            if ch != '.': pixels[(x, y + oy)] = ch
    for x, y in TAIL:
        for dx, ch in ((-1, 'o'), (0, 'k'), (1, 'k'), (2, 'o')):
            if (x + dx, y) not in pixels or ch == 'k': pixels[(x + dx, y)] = ch
    pixels[(-1, 16)] = 'o'; pixels[(0, 16)] = 'o'
    for y, row in enumerate(HEAD):
        for x, ch in enumerate(row):
            if ch != '.': pixels[(x + 15, y - 1)] = ch
    return pixels

def frame(index):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    px = img.load()
    mask = [[inside(x + .5, y + .5) for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if mask[y][x]: continue
            if any(0 <= x + dx < W and 0 <= y + dy < H and mask[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = C['outline']
    light = (-.7, -.7)
    for y in range(H):
        for x in range(W):
            if not mask[y][x]: continue
            cx, cy = x + .5, y + .5
            d_out = R - math.hypot(cx - O[0], cy - O[1])
            d_in = math.hypot(cx - B[0], cy - B[1]) - r
            nx, ny = (cx - O[0]) / R, (cy - O[1]) / R
            lit = nx * light[0] + ny * light[1]
            if d_out < 4.6:
                color = C['rind_light'] if lit > .35 else C['rind_dark'] if lit < -.45 else C['rind']
                if hash2(x, y) > .86: color = C['rind_spot'] if lit < .5 else C['rind']
                if lit > .35 and hash2(x, y, 3) > .8: color = C['rind']
            elif d_out < 6.0:
                color = C['pith']
            elif d_in < 1.6:
                color = C['bite_edge']
            elif d_in < 3.4:
                color = C['flesh_light']
            elif d_out < 8.2:
                color = C['flesh_deep']
            else:
                color = C['flesh']
            px[x, y] = color
    # Seeds: a row through the middle of the flesh, following the curve.
    seeds = []
    for k in range(160):
        a = math.radians(-160 + 320 * k / 159) + PHI
        for t in [i * .25 for i in range(0, 200)]:
            x, y = O[0] + math.cos(a) * t, O[1] + math.sin(a) * t
            if inside(x, y):
                break
        else:
            continue
        band_out = R
        band_in = t
        mid = band_in + (band_out - 6.0 - band_in) * .5
        if band_out - 6.0 - band_in < 7: continue
        sx, sy = O[0] + math.cos(a) * mid, O[1] + math.sin(a) * mid
        if all(math.hypot(sx - qx, sy - qy) > 3.3 for qx, qy in seeds): seeds.append((sx, sy))
    for i, (sx, sy) in enumerate(seeds):
        # Seeds alternate either side of the middle line, like the logo's rows.
        x, y = int(sx), int(sy)
        nx, ny = (sx - O[0]) / R, (sy - O[1]) / R
        side = 2.6 if i % 2 else -2.6
        x, y = int(sx + nx * side), int(sy + ny * side)
        for dx, dy, ch in ((0, 0, 'seed'), (1, 0, 'seed'), (0, 1, 'seed'), (1, 1, 'seed_shade'), (0, 2, 'seed_shade')):
            if inside(x + dx + .5, y + dy + .5) and px[x + dx, y + dy] in (C['flesh'], C['flesh_deep'], C['flesh_light']): px[x + dx, y + dy] = C[ch]
    # Sparkles twinkle in turn.
    sparkles = [(28, 70), (52, 82), (21, 48), (68, 76), (36, 58), (27, 34), (44, 76)]
    for i, (sx, sy) in enumerate(sparkles):
        phase = (index + i * 3) % FRAMES
        if not inside(sx + .5, sy + .5) or phase > 2: continue
        arms = [(0, 0)] + ([(1, 0), (-1, 0), (0, 1), (0, -1)] if phase >= 1 else []) + ([(2, 0), (-2, 0), (0, 2), (0, -2)] if phase == 1 else [])
        for dx, dy in arms:
            if inside(sx + dx + .5, sy + dy + .5): px[sx + dx, sy + dy] = C['spark']
    # Juquinha on the top horn.
    # Each body column rests on the rind below it (a stepped pixel slope);
    # the head stays rigid so the face keeps its shape.
    left = int(O[0] - 21)
    ground = lambda X: min((y for y in range(H) if mask[y][X]), default=H) - 1
    head_ground = min(ground(left + x) for x in range(15, 27))
    for (x, y), ch in cat_layer(index % FRAMES in (2, 3, 4)).items():
        X = left + x
        base = head_ground if x >= 15 else ground(left + max(0, x))
        Y = base - 9 + y
        if 0 <= X < W and 0 <= Y < H: px[X, Y] = CAT[ch]
    # Halo: dithered lavender around the moon and Juquinha, as in the logo.
    solid = [[px[x, y][3] == 255 for x in range(W)] for y in range(H)]
    for y in range(H):
        for x in range(W):
            if solid[y][x]: continue
            near = min((abs(dx) + abs(dy) for dy in range(-3, 4) for dx in range(-3, 4)
                        if 0 <= x + dx < W and 0 <= y + dy < H and solid[y + dy][x + dx]), default=9)
            if near == 1: px[x, y] = C['glow']
            elif near <= 3 and (x + y) % 2 == 0: px[x, y] = C['glow_far'] if near == 3 else C['glow']
    return img

sheet = Image.new('RGBA', (W * FRAMES, H), (0, 0, 0, 0))
for i in range(FRAMES):
    sheet.paste(frame(i), (i * W, 0))
out = ROOT / 'assets/drawn/goiaba-moon.png'
sheet.save(out, optimize=True)
if len(sys.argv) > 1:
    preview = Image.new('RGBA', (W * 4 * 2, H * 4), (9, 16, 22, 255))
    for i, f in enumerate((0, 3)):
        preview.alpha_composite(frame(f).resize((W * 4, H * 4), Image.NEAREST), (i * W * 4, 0))
    preview.save(sys.argv[1])
print(out, sheet.size)
