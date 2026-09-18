# -*- coding: utf-8 -*-
"""Cut the six attack buttons out of the notation sheet and recolour them.

The sheet comes from the Red Earth mizuumi wiki. It is pixel
art in fourteen colours, so recolouring is an exact palette swap rather than a
filter: every red-family colour is re-hued to the character's own, keeping its
own lightness step so the cap still reads as domed and the base as shadow. The
yellow legend and its navy shadow are left alone -- they are the part that has
to stay legible on every cap.
"""
import base64
import colorsys
import io
import json
import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent
sheet = Image.open(ROOT / 'art' / 'RE_Notation.png').convert('RGBA')

BOX = {
    1: (492, 307, 587, 363),   # LP
    2: (600, 307, 692, 363),   # MP
    3: (703, 307, 794, 363),   # HP
    4: (492, 371, 587, 427),   # LK
    5: (600, 371, 692, 427),   # MK
    6: (703, 371, 794, 427),   # HK
}

# The cap's own specular glint, left alone.
KEEP = {(247, 243, 0), (247, 178, 0), (0, 0, 82), (247, 243, 247)}

# The legend cannot stay yellow on every cap: it is fine on Leo's red and
# Kenji's blue and unreadable on Tessa's mauve and Mai-Ling's pale green. So it
# is recoloured too -- bright on a dark cap, near-white with a dark drop shadow
# on a light one. Where a character's own second colour serves, it is used.
#            glyph                shading              drop shadow
LEGEND = {
    'leo':   {(247, 243, 0): (255, 214, 60), (247, 178, 0): (214, 150, 0),
              (0, 0, 82): (0, 0, 82)},
    'kenji': {(247, 243, 0): (239, 183, 0), (247, 178, 0): (184, 138, 0),
              (0, 0, 82): (0, 0, 82)},
    'tessa': {(247, 243, 0): (247, 243, 247), (247, 178, 0): (201, 174, 187),
              (0, 0, 82): (59, 16, 32)},
    'mai':   {(247, 243, 0): (255, 255, 255), (247, 178, 0): (176, 224, 224),
              (0, 0, 82): (18, 48, 24)},
}

CHARS = {
    'leo':   (0xC7, 0x37, 0x37),
    'kenji': (0x47, 0x27, 0xEF),
    'tessa': (0xCE, 0x82, 0x9C),
    'mai':   (0xA0, 0xD0, 0x78),
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


art = {}
for name, target in CHARS.items():
    art[name] = {}
    for digit, box in BOX.items():
        im = sheet.crop(box).copy()
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
    for col, digit in enumerate(BOX):
        raw = base64.b64decode(art[name][digit].split(',', 1)[1])
        proof.paste(Image.open(io.BytesIO(raw)), (col * 96, row * 58))
proof.resize((6 * 96 * 2, 4 * 58 * 2), Image.NEAREST).save(ROOT / 'art' / '_proof.png')

out = ROOT / 'art' / 'buttons.json'
out.write_text(json.dumps(art), encoding='utf-8')
total = sum(len(v) for d in art.values() for v in d.values())
print('24 sprites, %.1f KB of data URIs total' % (total / 1024.0))
print('proof sheet: art/_proof.png')
