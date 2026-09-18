# -*- coding: utf-8 -*-
"""Recolour the six attack buttons for each character.

Reads the six button sprites in art/buttons/ -- cut from the Red Earth notation
sheet, which is not kept here: only the buttons are, because only the buttons
are used. They are pixel art in fourteen colours, so recolouring is an exact
palette swap rather than a filter: every red-family colour is re-hued to the
character's own, keeping its own lightness step so the cap still reads as domed
and the base as shadow.

The legend cannot stay yellow on every cap -- it is fine on Leo's red and
Kenji's blue and unreadable on Tessa's mauve and Mai-Ling's pale green -- so it
is recoloured too: bright on a dark cap, near-white with a dark drop shadow on a
light one.

Writes art/buttons.json, the data URIs the page embeds.
"""
import base64
import colorsys
import io
import json
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'art' / 'buttons'

ORDER = [(1, 'lp'), (2, 'mp'), (3, 'hp'), (4, 'lk'), (5, 'mk'), (6, 'hk')]

# The cap's own specular glint, left alone.
KEEP = {(247, 243, 0), (247, 178, 0), (0, 0, 82), (247, 243, 247)}

#            glyph                shading              drop shadow
LEGEND = {
    'leo':   {(247, 243, 0): (255, 214, 60), (247, 178, 0): (214, 150, 0),
              (0, 0, 82): (0, 0, 82)},
    'kenji': {(247, 243, 0): (239, 183, 0), (247, 178, 0): (184, 138, 0),
              (0, 0, 82): (0, 0, 82)},
    'tessa': {(247, 243, 0): (247, 243, 247), (247, 178, 0): (206, 172, 199),
              (0, 0, 82): (48, 16, 48)},
    'mai':   {(247, 243, 0): (255, 255, 255), (247, 178, 0): (176, 224, 224),
              (0, 0, 82): (18, 48, 24)},
}

CHARS = {
    'leo':   (0xC7, 0x37, 0x37),
    'kenji': (0x47, 0x27, 0xEF),
    'tessa': (0xA6, 0x3F, 0x8D),
    'mai':   (0x57, 0x79, 0x34),
}

CAP = (247, 8, 0)   # the cap's main colour; the ramp is measured against it


def hls(rgb):
    r, g, b = [c / 255.0 for c in rgb[:3]]
    return colorsys.rgb_to_hls(r, g, b)


def rgb(h, l, s):
    r, g, b = colorsys.hls_to_rgb(h, max(0.04, min(0.97, l)), max(0.0, min(1.0, s)))
    return (int(round(r * 255)), int(round(g * 255)), int(round(b * 255)))


cap_h, cap_l, cap_s = hls(CAP)


def remap(src, target):
    """One palette entry, re-hued to the target but keeping its own shading."""
    h, l, s = hls(src)
    th, tl, ts = hls(target)
    # Same distance from the cap in lightness, so the dome and the shadow keep
    # their depth instead of flattening on a lighter character colour.
    return rgb(th, tl + (l - cap_l), ts * (s / cap_s if cap_s else 1.0))


def is_red(c):
    r, g, b = c[:3]
    return c[3] > 0 and c[:3] not in KEEP and r > g and r > b


# The page sets a width and lets the height follow, so sprites of different
# widths render at different heights and the row visibly wobbles as the password
# changes. They were 95, 92 and 91 wide when first cut. Checked, not assumed.
sizes = {Image.open(SRC / (base + '.png')).size for _, base in ORDER}
if len(sizes) != 1:
    raise SystemExit('button sprites must all be the same size, found %s' % sorted(sizes))

art = {}
for name, target in CHARS.items():
    art[name] = {}
    for digit, base in ORDER:
        im = Image.open(SRC / (base + '.png')).convert('RGBA')
        px = im.load()
        cache = {}
        for y in range(im.height):
            for x in range(im.width):
                c = px[x, y]
                if c[3] == 0:
                    continue
                if c not in cache:
                    if c[:3] in LEGEND[name]:
                        cache[c] = LEGEND[name][c[:3]] + (c[3],)
                    elif is_red(c):
                        cache[c] = remap(c, target) + (c[3],)
                    else:
                        cache[c] = c
                px[x, y] = cache[c]
        buf = io.BytesIO()
        im.save(buf, 'PNG', optimize=True)
        art[name][digit] = ('data:image/png;base64,'
                            + base64.b64encode(buf.getvalue()).decode('ascii'))

# A contact sheet to look at before it goes anywhere near the page.
proof = Image.new('RGBA', (6 * 96, 4 * 58), (0, 0, 0, 255))
for row, name in enumerate(CHARS):
    for col, (digit, _) in enumerate(ORDER):
        raw = base64.b64decode(art[name][digit].split(',', 1)[1])
        proof.paste(Image.open(io.BytesIO(raw)), (col * 96, row * 58))
proof.resize((6 * 96 * 2, 4 * 58 * 2), Image.NEAREST).save(ROOT / 'art' / '_proof.png')

(ROOT / 'art' / 'buttons.json').write_text(json.dumps(art), encoding='utf-8')
total = sum(len(v) for d in art.values() for v in d.values())
print('24 sprites, %.1f KB of data URIs total' % (total / 1024.0))
print('proof sheet: art/_proof.png')
