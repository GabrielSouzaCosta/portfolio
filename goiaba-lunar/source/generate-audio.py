#!/usr/bin/env python3
"""Goiaba Lunar: original procedural ambience and tactile action cues.

Reproduction: Python 3 + numpy; ffmpeg with libmp3lame.
No samples, recordings, music, voices, external models or downloaded material.
All stochastic sources use one recorded seed per asset. Generated WAVs are the
authoritative masters; compressed versions preserve those relative levels.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parent
SR = 44100
TAU = 2 * np.pi
DATE = '2026-09-06'
VERSION = '1.0.0'


def frames(seconds):
    return int(round(seconds * SR))


def noise(rng, seconds, low=70, high=3500, slope=0.55):
    """Periodic band-limited noise with soft, nonresonant spectral shoulders."""
    n = frames(seconds)
    f = np.fft.rfftfreq(n, 1 / SR)
    safe = np.maximum(f, 1)
    shape = safe ** (-slope / 2)
    shape *= (safe / low) ** 3 / np.sqrt(1 + (safe / low) ** 6)
    shape /= np.sqrt(1 + (safe / high) ** 8)
    shape[0] = 0
    z = rng.normal(size=len(f)) + 1j * rng.normal(size=len(f))
    x = np.fft.irfft(z * shape, n=n)
    return x / max(np.std(x), 1e-10)


def bell(n, attack=.35, release=.65):
    t = np.linspace(0, 1, n)
    a = (t / max(attack, .001)) ** 1.7
    b = ((1 - t) / max(release, .001)) ** 1.7
    return np.minimum(np.minimum(a, b), 1)


def fade(x, start=.005, end=.025):
    x = x.copy()
    a, b = min(frames(start), len(x)), min(frames(end), len(x))
    if a:
        x[:a] *= np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if b:
        x[-b:] *= np.cos(np.linspace(0, np.pi / 2, b)) ** 2
    x[0] = 0
    x[-1] = 0
    return x


def stereo(x, pan=0):
    # Small equal-power pan. No delayed/phase-inverted channels.
    angle = (pan + 1) * np.pi / 4
    return np.column_stack((x * np.cos(angle), x * np.sin(angle)))


def add(canvas, event, seconds, pan=0, gain=1, wrap=False):
    y = stereo(event * gain, pan) if event.ndim == 1 else event * gain
    start = frames(seconds)
    if wrap:
        positions = (np.arange(len(y)) + start) % len(canvas)
        np.add.at(canvas, positions, y)
    else:
        lo, hi = max(start, 0), min(start + len(y), len(canvas))
        if hi > lo:
            canvas[lo:hi] += y[lo - start:hi - start]


def contact(rng, seconds=.08, material='wood'):
    t = np.arange(frames(seconds)) / SR
    if material == 'clay':
        modes = [(338, 1, .027), (571, .40, .022), (827, .18, .016)]
        body = sum(a * np.sin(TAU * f * t) * np.exp(-t / d) for f, a, d in modes)
        body += .38 * noise(rng, seconds, 130, 1800, .5) * np.exp(-t / .019)
    else:
        body = noise(rng, seconds, 105, 1550, .8) * np.exp(-t / .022)
        body += .26 * noise(rng, seconds, 550, 2400, .3) * np.exp(-t / .008)
    return fade(body, .0035, .018)


def paper(rng, seconds=.52, remote=False):
    n = frames(seconds)
    t = np.arange(n) / SR
    body = np.zeros(n)
    # Overlapping broad fibres and an irregular slip: no repeated click train.
    centers = [.12, .28, .49, .68, .83]
    for i, c in enumerate(centers):
        spread = (.09 if i != 2 else .15) * seconds
        grain = np.exp(-.5 * ((t - c * seconds) / spread) ** 2)
        body += noise(rng, seconds, 550 if not remote else 220,
                      4200 if not remote else 2600, .75) * grain * rng.uniform(.15, .32)
    body += .3 * noise(rng, seconds, 160, 780, .8) * bell(n)
    # Smooth amplitude flutter is the scrape of fibres, not a tonal carrier.
    flutter = .65 + .35 * np.abs(noise(rng, seconds, 10, 45, 0))
    return fade(body * np.minimum(flutter, 1.4), .018, .075)


def bubble(rng, seconds=.085, frequency=650):
    t = np.arange(frames(seconds)) / SR
    # Damped rising resonances approximate a small displaced pocket of water.
    phase = TAU * frequency * (t + .9 * t * t / max(seconds, .001))
    envelope = (1 - np.exp(-t / .004)) * np.exp(-t / (seconds * .23))
    body = (np.sin(phase) + .13 * np.sin(phase * 1.71)) * envelope
    body += .32 * noise(rng, seconds, 260, 2200, .5) * envelope
    return fade(body, .004, .025)


def water(rng, seconds=.58, quiet=False):
    n = frames(seconds)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.9
    flow = noise(rng, seconds, 190, 2050, 1.1)
    flow *= env * (.65 + .16 * np.sin(TAU * 7.3 * t + .5) + .09 * np.sin(TAU * 13.7 * t))
    canvas = stereo(flow * .42)
    for moment, hz, gain in [(.14, 610, .26), (.29, 930, .18), (.42, 490, .22)]:
        add(canvas, bubble(rng, .095, hz), seconds * moment / .58,
            rng.uniform(-.2, .2), gain * (.35 if quiet else 1))
    return fade(canvas.mean(axis=1), .018, .11)


def bed(rng, seconds, kind):
    n = frames(seconds)
    t = np.arange(n) / SR
    cyc = t / seconds
    # Integer-cycle modulation and FFT noise make beds periodic by construction.
    breathe = .76 + .12 * np.sin(TAU * (2 * cyc) + 1.9) + .10 * np.sin(TAU * cyc + .4)
    specs = {
        'cabin': [(44, 310, 1.1, .58), (260, 1600, .9, .18), (1400, 3100, 1.1, .018)],
        'cindra': [(85, 510, 1.2, .45), (480, 1700, .7, .09), (1800, 3200, 1, .012)],
        'atelier': [(100, 730, 1.2, .26), (620, 2500, 1.2, .07), (2100, 3600, .8, .01)],
        'mangue': [(100, 840, 1.15, .33), (500, 2200, 1.2, .12), (1600, 3300, .9, .016)]
    }
    mid = sum(noise(rng, seconds, low, high, slope) * weight
              for low, high, slope, weight in specs[kind])
    side = noise(rng, seconds, 200, 2400, 1.2) * .025
    canvas = np.column_stack((mid + side, mid - side)) * breathe[:, None]
    if kind == 'cabin':
        # Broad air turbulence has weight in small speakers, without an engine note.
        for at, duration, gain in [(3.0, 2.3, .055), (11.5, 3.1, .045), (17.5, 1.8, .025)]:
            air = noise(rng, duration, 150, 900, .6) * bell(frames(duration))
            add(canvas, air, at, rng.uniform(-.2, .2), gain, True)
    elif kind == 'cindra':
        # Rare subdued coal/wood settling; no loud fire pops or sizzling blanket.
        for at, gain in [(2.6, .27), (8.75, .19), (15.1, .30), (19.4, .15)]:
            add(canvas, contact(rng, .12), at, rng.uniform(-.35, .35), gain, True)
        ember = noise(rng, seconds, 800, 2500, 1) * (.025 + .013 * np.sin(TAU * 3 * cyc + 2))
        canvas += stereo(ember)
    elif kind == 'atelier':
        for at, duration, gain, pan in [(4.3, 1.4, .22, -.25), (12.6, 1.85, .18, .2), (17.5, .9, .11, -.1)]:
            add(canvas, paper(rng, duration, True), at, pan, gain, True)
    elif kind == 'mangue':
        for at, duration, gain, pan in [(1.8, 1.4, .48, -.3), (7.1, 2.2, .42, .1), (14.5, 1.5, .54, .25), (20.0, 1.9, .38, -.15)]:
            add(canvas, water(rng, duration, True), at, pan, gain, True)
        for at, duration, gain in [(4.9, 1.7, .03), (11.3, 1.3, .025), (17.1, 2.2, .033)]:
            leaves = noise(rng, duration, 800, 2800, 1.1) * bell(frames(duration))
            add(canvas, leaves, at, rng.uniform(-.35, .35), gain, True)
        for at, hz, gain in [(3.3, 760, .032), (10.5, 590, .026), (18.2, 900, .027)]:
            add(canvas, bubble(rng, .12, hz), at, .1, gain, True)
    return canvas


def warp(rng):
    seconds = 1.8
    n = frames(seconds)
    u = np.linspace(0, 1, n)
    body = np.zeros(n)
    for low, high, center, spread, amount in [(60, 400, .45, .27, .65), (180, 1100, .43, .18, .28), (700, 2500, .61, .17, .12)]:
        body += noise(rng, seconds, low, high, .8) * np.exp(-.5 * ((u - center) / spread) ** 2) * amount
    body *= np.sin(np.pi * u) ** 1.45
    body *= .94 + .06 * np.sin(TAU * (16 * u + 12 * u * u))
    return stereo(fade(body, .16, .42))


def ship(rng):
    seconds = .78
    n = frames(seconds)
    u = np.linspace(0, 1, n)
    env = (u ** .65) * (1 - u) ** 2.4
    body = (.8 * noise(rng, seconds, 70, 490, .6)
            + .18 * noise(rng, seconds, 500, 2000, 1)) * env
    canvas = stereo(fade(body, .03, .13))
    add(canvas, contact(rng, .10), .41, -.05, .011)
    return canvas


def organize(rng):
    canvas = np.zeros((frames(.43), 2))
    add(canvas, paper(rng, .3), .016, -.04, .22)
    add(canvas, contact(rng, .16, 'clay'), .228, .06, .34)
    return canvas


def rms(x):
    return float(np.sqrt(np.mean(x * x)))


def db(value):
    return round(20 * math.log10(max(value, 1e-12)), 3)


def balance(x, target_rms, peak_limit, loop=False):
    if not loop:
        # Gentle broad-band crest shaping keeps noise/grain peaks from deciding
        # the whole gesture's volume. A soft 4.3 kHz rolloff removes upper grit.
        unit = x / max(rms(x), 1e-10)
        x = np.tanh(unit * .48) / .48
        f = np.fft.rfftfreq(len(x), 1 / SR)
        rolloff = 1 / np.sqrt(1 + (f / 4300) ** 10)
        x = np.fft.irfft(np.fft.rfft(x, axis=0) * rolloff[:, None], n=len(x), axis=0)
    x = x - np.mean(x, axis=0)
    x *= 10 ** (target_rms / 20) / rms(x)
    x *= min(1, 10 ** (peak_limit / 20) / np.max(np.abs(x)))
    if not loop:
        for channel in range(x.shape[1]):
            x[:, channel] = fade(x[:, channel], .002, .008)
    return x


def wav(path, x):
    pcm = np.round(np.clip(x, -.999, .999) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def stats(x):
    mono = x.mean(axis=1)
    silence = np.max(np.abs(x), axis=1) < 10 ** (-70 / 20)
    trailing = 0
    for quiet in silence[::-1]:
        if not quiet:
            break
        trailing += 1
    fft_n = 4 * len(x)
    # Sinc interpolation of the periodic signal estimates intersample peaks.
    mono_peak = np.max(np.abs(mono))
    true_peak = max(np.max(np.abs(np.fft.irfft(np.fft.rfft(x[:, c]), n=fft_n) * 4)) for c in range(2))
    return {
        'duration_seconds': round(len(x) / SR, 6),
        'sample_rate_hz': SR,
        'channels': 2,
        'sample_peak_dbfs': db(float(np.max(np.abs(x)))),
        'estimated_true_peak_dbfs': db(float(true_peak)),
        'rms_dbfs': db(rms(x)),
        'mono_rms_dbfs': db(rms(mono)),
        'mono_peak_dbfs': db(float(mono_peak)),
        'mono_fold_down_loss_db': round(db(rms(mono)) - db(rms(x)), 3),
        'channel_correlation': round(float(np.corrcoef(x.T)[0, 1]), 6),
        'dc_offset': [round(float(v), 9) for v in np.mean(x, axis=0)],
        'head_10ms_rms_dbfs': db(rms(x[:frames(.01)])),
        'tail_10ms_rms_dbfs': db(rms(x[-frames(.01):])),
        'trailing_below_minus70db_seconds': round(trailing / SR, 6),
        'loop_boundary_delta_dbfs': db(float(np.max(np.abs(x[0] - x[-1])))),
        'clipped_samples': int(np.sum(np.abs(x) >= 1)),
    }


def export(name, x):
    master = ROOT / 'masters' / (name + '.wav')
    wav(master, x)
    mp3 = ROOT / 'web' / (name + '.mp3')
    # LAME delay/padding metadata preserves decoded duration. Opus was evaluated
    # and rejected because initial codec state disrupted three ambient seams.
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-map_metadata', '-1',
                    '-c:a', 'libmp3lame', '-b:a', '80k', '-write_xing', '1',
                    '-metadata', 'artist=Goiaba Lunar original procedural sound',
                    str(mp3)], check=True)
    return {kind: {'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size,
                   'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            for kind, path in [('wav_master', master), ('mp3_web', mp3)]}


def main():
    (ROOT / 'masters').mkdir(exist_ok=True)
    (ROOT / 'web').mkdir(exist_ok=True)
    specs = [
        ('galaxy-cabin', 'A02', 6501, lambda r: bed(r, 20, 'cabin'), -37.5, -25, True,
         'Ventilação macia, vibração ampla e abafada, pequenos respiros de cabine.'),
        ('cindra-hearth', 'A06', 6502, lambda r: bed(r, 22, 'cindra'), -38, -25, True,
         'Ar doméstico quente, brasa branda e quatro assentamentos minúsculos de madeira.'),
        ('commissionmatch-atelier', 'A08', 6503, lambda r: bed(r, 20, 'atelier'), -39, -26, True,
         'Ar seco de ateliê; folhas espessas se movem raramente e à distância.'),
        ('mangue-water-leaves', 'A10', 6504, lambda r: bed(r, 24, 'mangue'), -37, -25, True,
         'Água baixa entre raízes, sopros úmidos, folhas esparsas e bolhas discretas.'),
        ('warp', 'A01', 6601, warp, -32, -20, False,
         'Ar que comprime e desacelera, corpo macio de cabine, chegada sem impacto.'),
        ('ship', 'A03', 6602, ship, -32, -20, False,
         'Impulso redondo de propulsão; pequeno mecanismo abafado na cauda.'),
        ('tap', 'A04', 6603, lambda r: stereo(contact(r, .085)), -32, -22, False,
         'Contato seco e acolchoado de cabine, sem bip ou tom de notificação.'),
        ('organize', 'A07', 6604, organize, -26, -14, False,
         'Folha desliza e assenta junto de um toque oco e curto de cerâmica.'),
        ('paper', 'A09', 6605, lambda r: stereo(paper(r, .52)), -26, -14, False,
         'Folha espessa desliza e se desdobra; fibras arredondadas e pouca cauda.'),
        ('water-choice', 'A11', 6606, lambda r: stereo(water(r, .58)), -26, -14, False,
         'Deslocamento breve de água, três bolhas pequenas e recuo suave.'),
    ]
    assets, signals = [], {}
    for name, id_, seed, recipe, target, peak, loop, description in specs:
        x = balance(recipe(np.random.default_rng(seed)), target, peak, loop)
        signals[name] = x
        item = {'name': name, 'planning_id': id_, 'seed': seed, 'loop': loop,
                'description_pt': description, 'stats': stats(x), 'files': export(name, x),
                'playback_gain': 1.0, 'level_note': 'Relative ambience/effect balance is baked into the files.'}
        assets.append(item)
        print(json.dumps({'asset': name, **item['stats']}, ensure_ascii=False), flush=True)

    # Twenty-second listening reel at the exact exported balance, with short
    # equal-power world handoffs. It is a review file, not a site asset.
    preview = np.zeros((frames(20), 2))
    sequence = [('galaxy-cabin', 0, 5.4), ('cindra-hearth', 4.6, 5.4),
                ('commissionmatch-atelier', 9.2, 5.4), ('mangue-water-leaves', 13.8, 6.2)]
    for name, start, duration in sequence:
        clip = signals[name][:frames(duration)].copy()
        for c in range(2):
            clip[:, c] = fade(clip[:, c], .55, .65)
        add(preview, clip, start)
    cues = [('warp', .6), ('tap', 3.15), ('ship', 4.45), ('organize', 6.9),
            ('paper', 11.65), ('water-choice', 16.25), ('water-choice', 18.0)]
    for name, start in cues:
        add(preview, signals[name], start)
    wav(ROOT / 'preview-20s.wav', preview)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / 'preview-20s.wav'),
                    '-c:a', 'libmp3lame', '-b:a', '128k', str(ROOT / 'preview-20s.mp3')], check=True)
    manifest = {
        'title': 'Goiaba Lunar — original sound set', 'version': VERSION, 'date': DATE,
        'origin': 'Original procedural synthesis created specifically for the owner of Goiaba Lunar using this script.',
        'external_sources': [],
        'authorization': 'Produced under the site owner’s authorization for this project; no third-party samples or melodies.',
        'attribution_required': False,
        'toolchain': 'Python 3, NumPy FFT/noise/envelopes; ffmpeg libmp3lame.',
        'generator_prompt': 'No generative media model was used. Full reproducible sound recipes are in generate.py.',
        'assets': assets,
        'omitted': [{'planning_id': 'A05', 'reason': 'Optional feline cue omitted; a convincing cat gesture is better reserved for a future natural recording.'}],
        'preview': {'file': 'preview-20s.mp3', 'stats': stats(preview),
                    'world_timeline_seconds': sequence, 'cue_timeline_seconds': cues,
                    'mix': 'Uses final file levels and unity master gain. Site master should start at 0.35 as proposed in audio.md.'},
        'integration': {
            'preferred_codec': 'audio/mpeg',
            'loop_method': 'Decode the complete MP3 into a Web Audio AudioBuffer; loopStart=0, loopEnd=buffer.duration. LAME delay/padding metadata is present; decoded frame count was audited. Prefer Web Audio for the loop, since HTMLMediaElement looping is not guaranteed gapless.',
            'gain_warning': 'Do not apply the ambient -12 to -18 dB offset again; it is baked into assets. All per-file gain values are 1.0 before master.',
            'recommended_master_gain': .35, 'environment_crossfade_seconds': .75,
            'initial_ambient_fade_seconds': .4, 'mute_ramp_seconds': .02,
            'duck_ambient_db': -4, 'duck_release_seconds': .6,
            'quiet_start_required': True, 'load_only_after_opt_in': True,
        },
        'validation_limit': 'Measured signal/codec/seam/mono audits are supplied. Final artistic listening on physical speakers and in the UI remains necessary; no claim of device-level acoustic safety is made.',
    }
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
