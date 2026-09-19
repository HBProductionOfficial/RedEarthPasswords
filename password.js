/* Red Earth / War-Zard password codec.
 *
 * Builds and reads the ten-symbol continue passwords the arcade game uses.
 * Three fields are interleaved differently for each character -- two digits of
 * level, five of VS points, three of variation -- and there is no checksum, so
 * the per-character scramble is the whole of the obfuscation.
 *
 * The rules were recovered by disassembling the game and checked against real
 * passwords: 225 from published lists all decode, and the 129 of those that
 * state a level all decode to that level.
 *
 * ON THE TABLES BELOW
 *
 * Derived values, not copied data: the level table, the per-character
 * requirement records and the sixteen special passwords, written out as named
 * numbers. Nothing here is a chunk of the original program.
 */
(function (root) {
  'use strict';

  var REJECT = 0xFFFFFFFF;

  /* Level N is encoded by entry N-1: two digits, high nibble first. All 32 are
   * distinct, which they have to be or a level would not decode uniquely. */
  var LEVEL_TABLE = [
    0x31, 0x54, 0x24, 0x15, 0x43, 0x63, 0x52, 0x34,
    0x12, 0x45, 0x26, 0x65, 0x21, 0x56, 0x14, 0x61,
    0x33, 0x41, 0x53, 0x13, 0x62, 0x35, 0x23, 0x46,
    0x16, 0x36, 0x64, 0x32, 0x51, 0x42, 0x25, 0x44
  ];

  /* Requirements, indexed by the FIRST variation digit:
   *   [minimum level index, minimum VS points (packed BCD),
   *    lowest second digit, highest second digit, required third digit]
   * Only Kenji's records carry the fifth field, which is why his stride in the
   * original is 20 bytes where the others are 16. */
  var LEO_RULES = [
    [0, 0x0000, 0, 0], [0, 0x0000, 0, 0],
    [15, 0x1000, 1, 3], [15, 0x1000, 4, 6],
    [27, 0x1500, 4, 6], [27, 0x1500, 1, 6], [27, 0x1500, 1, 3]
  ];
  var KENJI_RULES = [
    [0, 0x0000, 0, 0, 0], [0, 0x0000, 4, 6, 6],
    [15, 0x1000, 1, 2, 5], [27, 0x2000, 3, 3, 4],
    [31, 0x3000, 4, 6, 3], [31, 0x3000, 1, 2, 2], [31, 0x3000, 3, 3, 1]
  ];
  var TESSA_RULES = [
    [0, 0x0000, 0, 0], [0, 0x0000, 4, 6],
    [18, 0x1500, 1, 2], [21, 0x2000, 3, 3],
    [27, 0x2500, 4, 6], [27, 0x2500, 1, 2], [27, 0x2500, 3, 3]
  ];

  /* Leo's elemental weapons, indexed by the second digit. */
  var LEO_WEAPONS = [1, 2, 4, 3, 6, 5];

  /* The sixteen special passwords, as [character, result, VS, variation, level]
   * -- the three entry accumulators the original compares whole, before any
   * decoding happens. That is why they may contain symbols 7 and 8, which no
   * ordinary field can hold. */
  var SPECIAL = [
    [0, 1, 0x77778, 0x238, 0x71], [1, 1, 0x78321, 0x777, 0x78],
    [2, 1, 0x78654, 0x777, 0x78], [3, 1, 0x77777, 0x456, 0x88],
    [0, 2, 0x88811, 0x771, 0x17], [1, 2, 0x22777, 0x288, 0x82],
    [2, 2, 0x44777, 0x888, 0x44], [3, 2, 0x38883, 0x777, 0x33],
    [0, 3, 0x71712, 0x282, 0x18], [1, 3, 0x23838, 0x272, 0x73],
    [2, 3, 0x45858, 0x747, 0x45], [3, 3, 0x37373, 0x848, 0x44],
    [0, 4, 0x11117, 0x787, 0x18], [1, 4, 0x27878, 0x222, 0x27],
    [2, 4, 0x47878, 0x444, 0x47], [3, 4, 0x33333, 0x878, 0x77]
  ];

  /* What each of the four does. 2, 3 and 4 match published lists; 1 was
   * established here by entering it and watching. */
  var SPECIAL_NAMES = {
    1: 'Level locked at 1, score held at zero',
    2: 'Power Fight Mode',
    3: 'Ultimate Battle Mode',
    4: 'Jump to the staff roll'
  };
  var SPECIAL_NOTES = {
    1: 'The character cannot level up past 1, and the score stays at zero ' +
       'however many coins are picked up.',
    2: 'Enemies deal 1.5× damage.',
    3: 'Harder enemy patterns.',
    4: 'Skips straight to the credits.'
  };

  var CHAR_NAMES = ['Leo', 'Kenji', 'Tessa', 'Mai-Ling'];

  /* A = level (2 digits), B = VS points (5), C = variation (3). The field sizes
   * are the same for everyone; only the positions move, and that per-character
   * scramble is the whole of the obfuscation -- there is no checksum. */
  var PATTERN = ['ABBBBBACCC', 'CCCABBBBBA', 'ACCCBBBBBA', 'BBBBBACCCA'];

  /* Each symbol is one control, pressed directly. There is no cursor. */
  var BUTTONS = ['', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'Start', 'Down+Start'];
  var SYMBOLS = ['', '1', '2', '3', '4', '5', '6', 'Y', 'M'];

  /* What each bit of the grant byte means. Bit 3 is not the same thing for
   * everyone: for Leo the id runs 0-15 and bit 3 is part of the number, for
   * Tessa it is a flag her third digit sets. */
  var GRANTS = [
    [[0x01, 'Fire Sword'], [0x02, 'Ice Sword'], [0x04, 'Lightning Sword'],
     [0x08, 'Battle Axe'], [0x10, 'Legendary Sword']],
    /* Named from the level table, which records what the game announces when
     * the move is learned. Each bit's first reachable level matches the level
     * the table marks VS Point Exclusive: 16, 28, 32. The third was confirmed
     * by the owner. The third entry is the description the page used to show,
     * kept as a subtitle in English. */
    [[0x01, 'Homura-Tsumuji', 'Fire Breath super'],
     [0x02, 'Kimo-Yaburi', 'Kick Ultimate Counter'],
     [0x04, 'Rasetsu-Jin', 'Blade Slice special']],
    [[0x01, 'Super Brave Pigeon'], [0x02, 'Super Chakra Wave'],
     [0x04, 'Super Reverie Sword'], [0x08, 'Sun Staff']],
    /* Level 22, where the table records Kokuu-Ha. */
    [[0x01, 'Kokuu-Ha', 'Kick Ultimate Counter']]
  ];

  /* --- what each level itself gives you ---------------------------------
   *
   * The base sword and shield are NOT in the password's variation field: they
   * come from the level, which is why the same variation digits sit under
   * different equipment headings in published lists at different levels. Titles,
   * new moves and resistances are level-driven too.
   *
   * This is HB Production's research rather than anything read out of the code,
   * so it is kept apart from the rules above and labelled as such on the page.
   */
  /* Per level: what the game grants. From HB Production's research. */
  var PROGRESSION = [
    /* Leo */ [
      {"title": "Savage", "sword": "Old Sword", "shield": "Old Shield"},
      {"text": "Become Resistant to Fire"},
      {"text": "Title Brave Heart, Bronze Sword", "title": "Brave Heart", "sword": "Bronze Sword"},
      {"text": "Become Resistant to Ice"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Title Revenger, Wooden Shield", "title": "Revenger", "shield": "Wooden Shield"},
      {"text": "Become Resistant to Poison"},
      {"text": "New Move - Achilles Rush", "move": "Achilles Rush"},
      {"text": "Become Resistant to Fire"},
      {"text": "Title Victor, Steel Sword", "title": "Victor", "sword": "Steel Sword"},
      {"text": "Become Resistant to Ice"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Become Resistant to Wind"},
      {"text": "Title Soldier, Steel Shield", "title": "Soldier", "shield": "Steel Shield"},
      {"text": "Become Resistant to Fire"},
      {"text": "Become Resistant to Ice"},
      {"text": "Defensive Power Increased"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Title Hero, Diamond Sword", "title": "Hero", "sword": "Diamond Sword"},
      {"text": "Become Resistant to Poison"},
      {"text": "Become Resistant to Wind"},
      {"text": "Become Resistant to Fire"},
      {"text": "Become Resistant to Ice"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Title Warrior, Diamond Shield", "title": "Warrior", "shield": "Diamond Shield"},
      {"text": "Become Resistant to Poison"},
      {"text": "Become Resistant to Fire"},
      {"text": "Become Resistant to Wind"},
      {"text": "Become Resistant to Poison"},
      {"text": "Become Resistant to Wind + Legendary Shield (VS Point Exclusive)"},
      {"text": "New Move -  Gaia Driver", "move": "Gaia Driver"},
      {"text": "Title Warlord, Resistant to Fire + Legendary Sword (VS Point Exclusive)", "title": "Warlord"},
    ],
    /* Kenji */ [
      {},
      {"text": "Become Resistant to Poison"},
      {"text": "Title Sniper, New Move - Tsumuji", "title": "Sniper", "move": "Tsumuji"},
      {"text": "Become Resistant to Wind"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Stalker, New Move - Kumo-Gakure", "title": "Stalker", "move": "Kumo-Gakure"},
      {"text": "Become Resistant to Fire"},
      {"text": "Defensive Power Increased"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Title Executor, New Move - Baku-Ryusho", "title": "Executor", "move": "Baku-Ryusho"},
      {"text": "Become Resistant to Wind"},
      {"text": "Defensive Power Increased"},
      {"text": "Become Resistant Ice"},
      {"text": "Title Stealth, New Move - Enma-Zuki", "title": "Stealth", "move": "Enma-Zuki"},
      {"text": "Attacking Power Increased"},
      {"text": "New Move - Homura-Tsumuji (VS Point Exclusive), Become Resistant to Poison", "move": "Homura-Tsumuji (VS Point Exclusive)"},
      {"text": "Become Resistant to Wind"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Commando, New Move - Kagerou", "title": "Commando", "move": "Kagerou"},
      {"text": "Become Resistant to Fire"},
      {"text": "Defensive Power Increased"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Become Resistant to Wind"},
      {"text": "Defensive Power Increased"},
      {"text": "Title Shadow, New Move - Utsusemi", "title": "Shadow", "move": "Utsusemi"},
      {"text": "Become Resistant to Ice"},
      {"text": "Attacking Power Increased"},
      {"text": "New Move - Kimo-Yaburi (VS Point Exclusive), Become Resistant to Thunder", "move": "Kimo-Yaburi (VS Point Exclusive)"},
      {"text": "Become Resistant to Wind"},
      {"text": "Defensive Power Increased"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Assassin, New Move - Rasetsu-Jin (VS Point Exclusive), Become Resistant to Fire", "title": "Assassin", "move": "Rasetsu-Jin (VS Point Exclusive)"},
    ],
    /* Tessa */ [
      {},
      {"text": "Resistant to Poison"},
      {"text": "Title Sorcerer, New Move - Air Chakura Wave", "title": "Sorcerer", "move": "Air Chakura Wave"},
      {"text": "Defensive Power Increased"},
      {"text": "Resistant to Poison"},
      {"text": "Title Summoner, New Move - Glace Cannon", "title": "Summoner", "move": "Glace Cannon"},
      {"text": "Attacking Power Increased"},
      {"text": "Attacking Power Increased, Defensive Power Increased",
       "actually": "nothing at all"},
      {"text": "Resistant to Lightning"},
      {"text": "Title Phantasm, New Move - Fiamma Cannon", "title": "Phantasm", "move": "Fiamma Cannon"},
      {"text": "Resistant to Poison"},
      {"text": "Defensive Power Increased"},
      {"text": "Resistant Ice"},
      {"text": "Title Witch, New Move - Electron Cannon", "title": "Witch", "move": "Electron Cannon"},
      {"text": "Attacking Power Increased"},
      {"text": "Attacking Power Increased, Defensive Power Increased",
       "actually": "nothing at all"},
      {"text": "Resistant to Lightning"},
      {"text": "Defensive Power Increased"},
      {"text": "Title Sage, New Move - Hyper Cannon, New Move - Super Chakura Wave",
       "actually": "Super Brave Pigeon, not Super Chakura Wave",
       "title": "Sage", "move": "Hyper Cannon"},
      {"text": "Resistant to Ice"},
      {"text": "Resistant to Lightning"},
      {"text": "New Move - Super Brave Pigeon",
       "actually": "Super Chakura Wave and Defensive Power Increased, not Super Brave Pigeon",
       "move": "Super Chakura Wave"},
      {"text": "Resistant to Ice"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Archmage, New Move - Jamming Ghost", "title": "Archmage", "move": "Jamming Ghost"},
      {"text": "Resistant to Lightning"},
      {"text": "Resistant to Poison"},
      {"text": "New Move - Super Reverie Sword, Defensive Power Increased", "move": "Super Reverie Sword"},
      {"text": "Attacking Power Increased"},
      {"text": "Resistant to Poison + Sun Staff (VS Point Exclusive + Beat Ravange with special requirement)"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Mageload, New Move - Death Phenomenon", "title": "Mageload", "move": "Death Phenomenon"},
    ],
    /* Mai-Ling */ [
      {},
      {"text": "Become Resistant to Fire"},
      {"text": "Title Striker, New Move - Koukaku-Shu", "title": "Striker", "move": "Koukaku-Shu"},
      {"text": "Become Resistant to Wind"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Title Buster, Defensive Power Increased", "title": "Buster"},
      {"text": "Become Resistant to Ice"},
      {"text": "Become Resistant to Poison"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Slammer, New Move - Idaten", "title": "Slammer", "move": "Idaten"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Become Resistant to Fire"},
      {"text": "Become Resistant to Wind"},
      {"text": "Title Fighter, New Move - Cho-Enryuu-Kyaku", "title": "Fighter", "move": "Cho-Enryuu-Kyaku"},
      {"text": "Defensive Power Increased"},
      {"text": "Become Resistant to Ice"},
      {"text": "Become Resistant to Poison"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Tiger Claw, New Move - Koen", "title": "Tiger Claw", "move": "Koen"},
      {"text": "Become Resistant to Lightning"},
      {"text": "Become Resistant to Fire"},
      {"text": "New Move - Kokuu-Ha, Become Resistant to Wind", "move": "Kokuu-Ha"},
      {"text": "Attacking Power Increased"},
      {"text": "Defensive Power Increased"},
      {"text": "Title Ironfist, New Move - Kuugeki-Shou", "title": "Ironfist", "move": "Kuugeki-Shou"},
      {"text": "Become Resistant to Ice"},
      {"text": "Become Resistant to Poison"},
      {"text": "Attacking Power Increased"},
      {"text": "Defensive Power Increased"},
      {"text": "Attacking Power Increased"},
      {"text": "Defensive Power Increased"},
      {"text": "Title Ashura, New Move - Tentsui-Ga", "title": "Ashura", "move": "Tentsui-Ga"},
    ],
  ];

  /* Everything true of a character at a level, accumulated from level 1. */
  function progressionAt(character, level) {
    var rows = PROGRESSION[character], state = { moves: [], gained: '' }, i, e;
    for (i = 0; i < level && i < rows.length; i++) {
      e = rows[i];
      if (!e) continue;
      if (e.title) state.title = e.title;
      if (e.sword) state.sword = e.sword;
      if (e.shield) state.shield = e.shield;
      if (e.move) state.moves.push({ name: e.move, level: i + 1 });
    }
    e = rows[level - 1];
    state.gained = (e && e.text) ? e.text : '';
    /* Some of the game's own level-up messages are wrong. Where that is
     * recorded, `actually` is what it really gives, and the page shows it as a
     * correction rather than letting the wrong text stand on its own. */
    state.actually = (e && e.actually) ? e.actually : '';
    return state;
  }

  /* --- packed BCD, the form these totals are kept in --------------------- */

  function binToBcd(v) {
    var bcd = 0, shift;
    for (shift = 0; shift <= 12; shift += 4) {
      bcd |= (v % 10) << shift;
      v = Math.floor(v / 10);
    }
    return bcd >>> 0;
  }

  function bcdToBin(bcd) {
    var v = 0, shift;
    for (shift = 12; shift >= 0; shift -= 4) v = v * 10 + ((bcd >> shift) & 0xF);
    return v;
  }

  /* --- VS points --------------------------------------------------------
   *
   * Not a base-6 number, which is what it looks like. The decimal total drops
   * its units digit (always zero), the three that remain are re-encoded in
   * base 6, and a magnitude class of 1, 2 or 3 records which three they were.
   * Three digits leave a place spare and the game fills it with a literal 6,
   * which is what tells the decoder which form it is reading. That is why 7770
   * and 10 look nothing alike.
   */

  function shiftForClass(cls) {
    return cls === 1 ? 0 : cls === 2 ? 4 : cls === 3 ? 8 : -1;
  }

  function decodeVs(field) {
    var lead = (field >> 16) & 0xF, digits, count, cls, unbiased, i, value, bcd, shift;

    if (lead === 4 || lead === 5) {
      /* Zero: two digits from {4,5}, then three nobody cares about. */
      var second = (field >> 12) & 0xF;
      return (second === 4 || second === 5) ? 0 : REJECT;
    }
    if (lead === 6) {
      unbiased = field - 0x111;
      digits = [(unbiased >> 8) & 0xF, (unbiased >> 4) & 0xF, unbiased & 0xF];
      count = 3;
      cls = (field >> 12) & 0xF;
    } else {
      unbiased = field - 0x1111;
      /* A leading zero would be a second spelling of a total the short form
       * already covers, so the original refuses it. */
      if ((unbiased & 0xF000) === 0) return REJECT;
      digits = [(unbiased >> 12) & 0xF, (unbiased >> 8) & 0xF,
                (unbiased >> 4) & 0xF, unbiased & 0xF];
      count = 4;
      cls = lead;
    }
    for (i = 0; i < count; i++) if (digits[i] > 5) return REJECT;

    shift = shiftForClass(cls);
    if (shift < 0) return REJECT;

    value = 0;
    for (i = 0; i < count; i++) value = value * 6 + digits[i];
    if (value > 9999) return REJECT;

    bcd = binToBcd(value);
    /* The places the class says were shifted in must be the zeros that were
     * shifted in, or the password claims a scale its own digits contradict. */
    if (shift === 4 && (bcd & 0x0F)) return REJECT;
    if (shift === 8 && (bcd & 0xFF)) return REJECT;
    bcd >>= shift;
    if (bcd > 0x999) return REJECT;
    return bcdToBin(bcd << 4);
  }

  function encodeVs(points, rng) {
    if (points === 0) {
      var r = rng || Math.random;
      return (((4 + (Math.floor(r() * 2) & 1)) << 16) |
              ((4 + (Math.floor(r() * 2) & 1)) << 12) |
              ((Math.floor(r() * 6) + 1) << 8) |
              ((Math.floor(r() * 6) + 1) << 4) |
              (Math.floor(r() * 6) + 1)) >>> 0;
    }
    var stored = binToBcd(points), top = stored >> 4, cls, value, field = 0, count = 0;
    if (top < 0x10) { cls = 3; top <<= 8; }
    else if (top < 0x100) { cls = 2; top <<= 4; }
    else cls = 1;

    value = bcdToBin(top);
    for (;;) {
      field |= (value % 6) << (4 * count);
      value = Math.floor(value / 6);
      count++;
      if (value < 6) { field |= value << (4 * count); count++; break; }
    }
    field |= cls << (4 * count);
    field += (count === 3) ? (0x00060000 + 0x0111) : 0x1111;
    return field >>> 0;
  }

  /* --- the variation rules ----------------------------------------------
   *
   * Four characters that do not share a design. Leo reads weapon ids from a
   * table and carries his thresholds as constants; Kenji and Tessa gate on
   * records with different field counts; Mai-Ling has no table at all, just one
   * combination that grants anything and a lot of logic rejecting near misses.
   * Left as it is rather than unified, because unifying it would assert a
   * structure the original does not have.
   */

  function leoGrants(d, vsBcd, level, st) {
    switch (d[0]) {
      case 1: st.granted = 0; return true;
      case 2:
        if (level >= 15 && vsBcd >= 0x1000 && d[1] < 4) {
          st.granted = LEO_WEAPONS[d[1] - 1]; return true;
        }
        return false;
      case 3:
        if (level >= 15 && vsBcd >= 0x1000 && d[1] > 3) {
          st.granted = LEO_WEAPONS[d[1] - 1]; return true;
        }
        return false;
      case 4:
        if (level >= 27 && vsBcd >= 0x1500 && d[1] > 3) {
          st.granted = LEO_WEAPONS[d[1] - 1] + 8; return true;
        }
        return false;
      case 5:
        if (level >= 27 && vsBcd >= 0x1500) { st.granted = 8; return true; }
        return false;
      case 6:
        if (level >= 27 && vsBcd >= 0x1500 && d[1] < 4) {
          st.granted = LEO_WEAPONS[d[1] - 1] + 8; return true;
        }
        return false;
      default: return true;
    }
  }

  /* Leo's third digit grants the legendary items, and is the only place where
   * failing undoes what was already granted. */
  function leoThird(d, vsBcd, level, st) {
    if (d[2] === 1 || d[2] === 3) {
      if (level < 31 || vsBcd < 0x5000) { st.granted = 0; return false; }
      st.granted |= 0x10;
    }
    if (d[2] === 2 || d[2] === 3) {
      if (level < 29 || vsBcd < 0x3000) { st.granted = 0; st.shield = 0; return false; }
      st.shield = 1;
    }
    return true;
  }

  function ruleOk(table, d, vsBcd, level) {
    var rec = table[d[0]];
    if (!rec) return false;
    if (level < rec[0]) return false;
    if (vsBcd < rec[1]) return false;
    if (d[1] < rec[2] || d[1] > rec[3]) return false;
    if (rec.length === 5 && d[2] !== rec[4]) return false;
    return true;
  }

  /* Shared by Kenji and Tessa once their requirements are met. */
  function grantsFromFirst(d, level, floorForSecond2, st) {
    switch (d[0]) {
      case 2:
        if (d[1] === 2 && level < floorForSecond2) return false;
        st.granted = (d[1] === 1) ? 1 : 2; return true;
      case 3: st.granted = 3; return true;
      case 4: st.granted = 4; return true;
      case 5: st.granted = 4 + (d[1] === 1 ? 1 : 2); return true;
      case 6: st.granted = 7; return true;
      default: st.granted = 0; return true;
    }
  }

  function applyVariation(character, d, vsBcd, level) {
    var st = { granted: 0, shield: 0 };
    switch (character) {
      case 0:
        if (!leoGrants(d, vsBcd, level, st)) return null;
        if (!leoThird(d, vsBcd, level, st)) return null;
        return st;
      case 1:
        if (d[0] === 1) {
          if (d[1] >= 4 && d[1] <= 6 && d[2] === 6) { st.granted = 0; return st; }
          return null;
        }
        if (!ruleOk(KENJI_RULES, d, vsBcd, level)) return null;
        if (!grantsFromFirst(d, level, 27, st)) return null;
        return st;
      case 2:
        if (d[0] === 1) {
          if (d[1] < 4 || d[1] > 6) return null;
          st.granted = 0;
        } else {
          if (!ruleOk(TESSA_RULES, d, vsBcd, level)) return null;
          if (!grantsFromFirst(d, level, 21, st)) return null;
        }
        if (d[2] === 2 || d[2] === 5) {
          if (level < 29 || vsBcd < 0x3000) { st.granted = 0; return null; }
          st.granted |= 8;
        }
        return st;
      case 3: {
        var firstOk = (d[0] === 2 || d[0] === 4);
        var secondOk = (d[1] === 3);
        var thirdOk = (d[2] === 1 || d[2] === 5);
        if (firstOk && secondOk && thirdOk) {
          if (level < 21 || vsBcd < 0x1000) return null;
          st.granted = 1; return st;
        }
        /* A partial match is refused; no match at all is fine. */
        if (firstOk || secondOk || thirdOk) return null;
        return st;
      }
      default: return st;
    }
  }

  /* --- putting a password together -------------------------------------- */

  function interleave(character, a, b, c) {
    var p = PATTERN[character], ia = 0, ib = 0, ic = 0, out = [], i;
    for (i = 0; i < 10; i++) {
      if (p[i] === 'A') out.push(a[ia++]);
      else if (p[i] === 'B') out.push(b[ib++]);
      else out.push(c[ic++]);
    }
    return out;
  }

  function deinterleave(character, digits) {
    var p = PATTERN[character], a = [], b = [], c = [], i;
    for (i = 0; i < 10; i++) {
      if (p[i] === 'A') a.push(digits[i]);
      else if (p[i] === 'B') b.push(digits[i]);
      else c.push(digits[i]);
    }
    return { a: a, b: b, c: c };
  }

  function describe(character, granted, shield) {
    var parts = [], list = GRANTS[character], left = granted, i;
    for (i = 0; i < list.length; i++)
      if (granted & list[i][0]) { parts.push(list[i][1]); left &= ~list[i][0]; }
    if (left) parts.push('unnamed bits 0x' + left.toString(16).toUpperCase());
    if (shield) parts.push('Legendary Shield');
    return parts.length ? parts.join(' + ') : 'nothing';
  }

  /* Every distinct thing this character can come back with at this level and
   * total. Rather than inverting a 996-byte chain of special cases, all 216
   * variation triples are tried against the rules and the accepted ones kept. */
  /* Every accepted triple, not one per outcome.
   *
   * Several triples usually give the same result, because a digit the rules
   * never consult is free: when Leo's first variation digit is 1 his second is
   * not read at all, so 4154544153 and 4154544113 are the same character. That
   * freedom is what makes an easy-to-type password findable. */
  function enumerate(character, level, points, rng) {
    var vsBcd = binToBcd(points), levelIndex = level - 1;
    var lb = LEVEL_TABLE[level - 1], a = [lb >> 4, lb & 0xF];
    var vsField = encodeVs(points, rng), b = [], i, d1, d2, d3, st, out = [];
    for (i = 0; i < 5; i++) b.push((vsField >> (4 * (4 - i))) & 0xF);

    for (d1 = 1; d1 <= 6; d1++)
      for (d2 = 1; d2 <= 6; d2++)
        for (d3 = 1; d3 <= 6; d3++) {
          st = applyVariation(character, [d1, d2, d3], vsBcd, levelIndex);
          if (!st) continue;
          out.push({
            digits: interleave(character, a, b, [d1, d2, d3]),
            variation: [d1, d2, d3],
            granted: st.granted,
            shield: st.shield,
            description: describe(character, st.granted, st.shield)
          });
        }
    return out;
  }

  /* One per distinct outcome, keeping the lowest triple. */
  function generate(character, level, points, rng) {
    var all = enumerate(character, level, points, rng), seen = {}, out = [], i, key;
    for (i = 0; i < all.length; i++) {
      key = all[i].granted + ':' + all[i].shield;
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(all[i]);
    }
    return out;
  }

  /* The easiest spelling of one particular outcome, and how many there are. */
  function spellings(character, level, points, granted, shield) {
    var all = enumerate(character, level, points), matches = [], i, best = null;
    for (i = 0; i < all.length; i++)
      if (all[i].granted === granted && all[i].shield === shield) matches.push(all[i]);
    for (i = 0; i < matches.length; i++)
      if (!best || ease(matches[i].digits) < ease(best.digits) ||
          (ease(matches[i].digits) === ease(best.digits) &&
           matches[i].digits.join('') < best.digits.join('')))
        best = matches[i];
    /* Easiest first, then in symbol order, which is the order the page lists
     * them in and the order the tests expect. */
    matches.sort(function (p, q) {
      var ep = ease(p.digits), eq = ease(q.digits);
      if (ep !== eq) return ep - eq;
      return p.digits.join('') < q.digits.join('') ? -1 : 1;
    });
    return best ? { best: best, count: matches.length, all: matches } : null;
  }

  /* --- the easiest password that carries the most ------------------------
   *
   * VS points are free: any total that produces a working combination is as
   * good as any other, so the whole range is searched and the easiest to type
   * wins. That turns out to be 7770 almost every time, because 777 encodes as
   * base-6 3,3,3,3 and comes out as the five digits 1 4 4 4 4.
   *
   * "Carries the most" is not always one answer. Leo's weapon ids come from a
   * six-entry table, and no entry in it is 7, so he can hold at most three of
   * his four weapons at once -- three different trios tie, and the tie is
   * broken on how easy the password is to enter.
   */

  function countBits(n) { var c = 0; while (n) { c += n & 1; n >>>= 1; } return c; }

  /* Fewer blocks of repeated symbols first, then fewer different buttons. */
  function ease(digits) {
    var runs = 1, seen = {}, n = 0, i;
    for (i = 0; i < digits.length; i++) {
      if (i && digits[i] !== digits[i - 1]) runs++;
      if (!seen[digits[i]]) { seen[digits[i]] = 1; n++; }
    }
    return runs * 10 + n;
  }

  /* What each character is actually best with, which is not the same as the
   * most items. Leo plays best on his plain sword: the elemental weapons and
   * the axe are a choice, not an upgrade, so his recommended loadout is the
   * legendary pair and nothing else. The second entry drops the Legendary
   * Sword, which some tournaments ban, leaving the Diamond Sword he already has
   * at level 32 plus the Legendary Shield.
   *
   * Kenji has a pair for the same reason, one argument down: some players rate
   * Rasetsu-Jin a weak move, so the second entry drops it and keeps the other
   * two. That is his bit 0x04; 0x03 is reachable at level 32 with 800 working
   * spellings.
   *
   * Tessa and Mai-Ling take everything they can carry, because for them it is
   * all extra moves and nobody has reported a reason not to.
   *
   * The key is the page's string id for the label, carried here so the page
   * does not have to know which character has a choice.
   */
  var BEST_TARGETS = [
    [{ granted: 0x10, shield: 1, key: 'preset.leo0',
       label: 'Best: Legendary Sword and Shield' },
     { granted: 0x00, shield: 1, key: 'preset.leo1',
       label: 'Best without the Legendary Sword' }],
    [{ granted: 0x07, shield: 0, key: 'preset.kenji0',
       label: 'Best: everything he can carry' },
     { granted: 0x03, shield: 0, key: 'preset.kenji1',
       label: 'Best without Rasetsu-Jin' }],
    [{ granted: 0x0F, shield: 0, key: 'preset.best', label: 'Best password' }],
    [{ granted: 0x01, shield: 0, key: 'preset.best', label: 'Best password' }]
  ];

  /* The easiest-to-type spelling of one target loadout, over every VS total.
   * The total is free -- any that produces a working combination is as good as
   * any other for someone who just wants the character -- so the whole range is
   * searched and the most repetitive password wins. */
  function bestLoadout(character, which) {
    var target = BEST_TARGETS[character][which || 0];
    if (!target) return null;
    var best = null, points, all, i, o, e, text;
    for (points = 10; points <= 9990; points += 10) {
      all = enumerate(character, 32, points);
      for (i = 0; i < all.length; i++) {
        o = all[i];
        if (o.granted !== target.granted || o.shield !== target.shield) continue;
        e = ease(o.digits);
        text = o.digits.join('');
        if (!best || e < best.ease || (e === best.ease && text < best.text)) {
          best = { points: points, digits: o.digits, granted: o.granted,
                   shield: o.shield, description: o.description,
                   ease: e, text: text, label: target.label };
        }
      }
    }
    return best;
  }

  function bestTargets(character) { return BEST_TARGETS[character]; }

  function decode(character, digits) {
    var f = deinterleave(character, digits), i, s;

    /* Symbols above 6 never reach the ordinary decoder: password_check_special
     * catches them first and compares the accumulators whole. */
    for (i = 0; i < 10; i++) if (digits[i] > 6) {
      var vs = 0, variation = 0, level = (f.a[0] << 4) | f.a[1];
      for (i = 0; i < 5; i++) vs = (vs << 4) | f.b[i];
      for (i = 0; i < 3; i++) variation = (variation << 4) | f.c[i];
      for (i = 0; i < SPECIAL.length; i++) {
        s = SPECIAL[i];
        if (s[0] === character && s[2] === vs && s[3] === variation && s[4] === level)
          return { special: true, result: s[1], name: SPECIAL_NAMES[s[1]],
                   note: SPECIAL_NOTES[s[1]], vs: vs, variation: variation,
                   levelBytes: level };
      }
      return { special: true, unknown: true, vs: vs, variation: variation,
               levelBytes: level };
    }

    var packed = (f.a[0] << 4) | f.a[1], lvl = 0;
    for (i = 0; i < 32; i++) if (LEVEL_TABLE[i] === packed) { lvl = i + 1; break; }
    if (!lvl)
      return { error: 'The level digits ' + f.a[0] + ' and ' + f.a[1] +
                      ' are not a level the game knows.' };

    var field = 0;
    for (i = 0; i < 5; i++) field |= f.b[i] << (4 * (4 - i));
    var points = decodeVs(field);
    if (points === REJECT)
      return { level: lvl, error: 'The VS field ' + f.b.join('') +
                                  ' is not an encoding the game produces.' };

    var st = applyVariation(character, f.c, binToBcd(points), lvl - 1);
    if (!st)
      return { level: lvl, points: points,
               error: 'Variation ' + f.c.join(' ') + ' is not allowed at level ' +
                      lvl + ' with ' + points + ' VS points.' };

    return {
      level: lvl, points: points, granted: st.granted, shield: st.shield,
      variation: f.c, description: describe(character, st.granted, st.shield)
    };
  }

  /* What the character is actually carrying, which is not the same as what the
   * password grants. The base gear comes from the level; some of what the
   * password grants REPLACES it rather than adding to it.
   *
   *   Leo     the Legendary Sword stands in for whatever sword his level gave
   *           him, and the Legendary Shield for the shield. That is how the
   *           published lists phrase it too -- "Legendary Sword & Diamond
   *           Shield" is one legendary item and one level one.
   *   Tessa   her staff bit is a swap, not an addition: clear is the Wooden
   *           Staff, set is the Sun Staff. Her level-32 list is split into
   *           "Wooden Staff" and "Sun Staff" codes on exactly that bit.
   *
   * Everything else is an extra carried on top.
   */
  function loadout(character, level, granted, shield) {
    var p = progressionAt(character, level), gear = [], extras = [], list, i;

    if (character === 0) {
      gear.push((granted & 0x10) ? 'Legendary Sword' : p.sword);
      gear.push(shield ? 'Legendary Shield' : p.shield);
      list = [[0x01, 'Fire Sword'], [0x02, 'Ice Sword'],
              [0x04, 'Lightning Sword'], [0x08, 'Battle Axe']];
    } else if (character === 2) {
      gear.push((granted & 0x08) ? 'Sun Staff' : 'Wooden Staff');
      list = [[0x01, 'Super Brave Pigeon'], [0x02, 'Super Chakra Wave'],
              [0x04, 'Super Reverie Sword']];
    } else {
      list = GRANTS[character];
    }
    for (i = 0; i < list.length; i++)
      if (granted & list[i][0]) extras.push(list[i][1]);

    return {
      gear: gear.filter(function (x) { return !!x; }),
      extras: extras
    };
  }

  function specialCodes() {
    return SPECIAL.map(function (s) {
      var a = [s[4] >> 4, s[4] & 0xF];
      var b = [(s[2] >> 16) & 0xF, (s[2] >> 12) & 0xF, (s[2] >> 8) & 0xF,
               (s[2] >> 4) & 0xF, s[2] & 0xF];
      var c = [(s[3] >> 8) & 0xF, (s[3] >> 4) & 0xF, s[3] & 0xF];
      return {
        character: s[0], result: s[1], name: SPECIAL_NAMES[s[1]],
        note: SPECIAL_NOTES[s[1]], digits: interleave(s[0], a, b, c)
      };
    });
  }

  /* What a character can reach at all, for the level/VS guidance on the page. */
  function requirements(character) {
    if (character === 3)
      return [{ what: 'Kokuu-Ha', level: 22, points: 1000 }];
    var rules = character === 1 ? KENJI_RULES : character === 2 ? TESSA_RULES : LEO_RULES;
    var out = [], i;
    for (i = 2; i < rules.length; i++)
      out.push({ digit: i, level: rules[i][0] + 1, points: bcdToBin(rules[i][1]) });
    return out;
  }

  root.RedEarthPassword = {
    progressionAt: progressionAt,
    bestLoadout: bestLoadout, bestTargets: bestTargets,
    generate: generate, enumerate: enumerate, spellings: spellings,
    decode: decode, specialCodes: specialCodes,
    describe: describe, requirements: requirements, loadout: loadout,
    encodeVs: encodeVs, decodeVs: decodeVs, binToBcd: binToBcd,
    CHAR_NAMES: CHAR_NAMES, BUTTONS: BUTTONS, SYMBOLS: SYMBOLS,
    PATTERN: PATTERN, GRANTS: GRANTS, LEVEL_TABLE: LEVEL_TABLE,
    LEO_RULES: LEO_RULES, KENJI_RULES: KENJI_RULES, TESSA_RULES: TESSA_RULES,
    REJECT: REJECT
  };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports)
  module.exports = globalThis.RedEarthPassword;
