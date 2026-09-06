from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent/'.tools'))
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT=Path(__file__).parent
ROOT=Path('/Users/mac/Documents/portfolio/goiaba-lunar/assets/fonts')
roman=TTFont(ROOT/'instrument-serif.woff2')
italic=TTFont(ROOT/'instrument-serif-italic.woff2')

def glyphs(font,word,x,baseline,size,tracking=0,remove_dot=False):
    gs=font.getGlyphSet(); cm=font.getBestCmap(); scale=size/font['head'].unitsPerEm; result=[]
    for c in word:
        pen=SVGPathPen(gs, ntos=lambda v: f"{v:.3f}".rstrip("0").rstrip("."))
        # Optical registration: the two words have independent baselines.
        gs[cm[ord(c)]].draw(TransformPen(pen,(scale,0,0,-scale,x,baseline)))
        d=pen.getCommands()
        # Instrument's i has two contours: isolate the stem, replace its dot by a hand-authored elliptical seed.
        if c=='i' and remove_dot:
            contours=['M'+part for part in d.split('M')[1:]]
            # Keep the long stem contour, which has the majority of drawing commands.
            d=max(contours,key=len)
        result.append(f'<path d="{d}"/>')
        x+=gs[cm[ord(c)]].width*scale+tracking
    return '\n'.join(result)

first=glyphs(roman,'Goiaba',9,81,89,-1.55,True)
second=glyphs(italic,'Lunar',220,101,87,-1.45)
# Dot location derived from source glyph placement, then optically adjusted.
# G advance 46.369 -1.55; o advance 36.312 -1.55; stem is 83.03..100.56.
dot='<ellipse cx="91.8" cy="21.4" rx="3.65" ry="5.3" transform="rotate(31 91.8 21.4)"/>'

for variant in ('light','dark'):
    first_color='#f4e9dd' if variant=='light' else '#091016'
    second_color='#efabc3' if variant=='light' else '#73354e'
    orbit_color='#a9d7aa' if variant=='light' else '#44754f'
    # A rising, open orbital swash. It threads between the compact words,
    # and extends from the G's lower bowl toward the upper shoulder of Lunar.
    orbit='<path d="M22 89 C50 108 171 104 264 72 C334 48 374 22 359 13 C349 7 319 10 291 18" fill="none" stroke="'+orbit_color+'" stroke-width="1.7" stroke-linecap="round"/>'
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="420" height="128" viewBox="0 0 420 128" fill="none" role="img" aria-labelledby="wordmark-title wordmark-desc">
<title id="wordmark-title">Goiaba Lunar</title>
<desc id="wordmark-desc">Assinatura tipográfica Goiaba Lunar, com letras serifadas, Lunar em itálico, ponto verde em forma de semente e um traço orbital integrado.</desc>
{orbit}
<g fill="{first_color}" stroke="{first_color}" stroke-width="0.65" stroke-linejoin="round">
{first}
</g>
<g fill="{second_color}" stroke="{second_color}" stroke-width="0.65" stroke-linejoin="round">
{second}
</g>
<g fill="{orbit_color}">{dot}</g>
</svg>
'''
    (OUT/f'goiaba-lunar-wordmark-{variant}.svg').write_text(svg)
print('SVG assets written')
