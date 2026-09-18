# Red Earth Passwords

A generator and reader for the continue passwords in Red Earth /
ウォーザード (War-Zard).

Pick a character, pick what you want to come back with, and it gives you the ten
symbols to enter, shown as the buttons you actually press. It also reads a
password back, and lists the sixteen special passwords.

## Running it

Static: open `index.html`, or serve the folder.

    python -m http.server

Only two files matter: `index.html` and `password.js`. No build step, no
dependencies.

## How the passwords work

Ten symbols, each one a button on the panel:

| 1 | 2 | 3 | 4 | 5 | 6 | Y | M |
|---|---|---|---|---|---|---|---|
| LP | MP | HP | LK | MK | HK | Start | Down + Start |

Three fields are interleaved, in a different order for each character: two
symbols of level, five of VS points, three of variation. There is no checksum,
so the scramble is what binds a password to one character.

The VS field is not a base-6 number, which is what it looks like. The total
drops its units digit, the three digits that remain are re-encoded in base 6,
and a magnitude class records which three they were. A total of zero is not
encoded at all: it gets two symbols from {4,5} and three the game ignores.

Symbols 7 and 8, Start and Down + Start, cannot appear in any field. The game
matches passwords containing them against a short list before it tries to decode
anything, which is how the sixteen special passwords work.

Most loadouts have several working passwords, because a digit the rules never
consult is free to be anything. The page picks the one that types easiest.

## Accuracy

The rules were recovered by disassembling the game. They are checked against
real passwords: 225 from published lists all decode, and the 129 of those that
state a level all decode to that level.

The level progression, meaning titles, weapons, shields, moves and resistances, is
research rather than disassembly, and the page says so where it matters.

## The button art

`make_buttons.py` recolours the six attack buttons in `art/buttons/` for each character and writes the data URIs the
page embeds. It is an exact palette swap rather than a filter: the art is
fourteen colours, so every red in the cap is re-hued while keeping its own
lightness, and the legend is recoloured separately so it stays readable on a
pale cap. Needs Pillow.

## The typeface

Set in **Berkeley Mono** where it is installed, and **JetBrains Mono**
otherwise. Berkeley Mono is commercial and is not shipped here: it is named
first in the stack so that anyone who has licensed it sees the page as intended.
JetBrains Mono is under the SIL Open Font License and is loaded from Google
Fonts.

## Credits

Password research: **HB Production**.

Not affiliated with or endorsed by the rights holder. Red Earth and War-Zard
belong to Capcom.
