(function (root) {
  'use strict';

  var REJECT = 0xFFFFFFFF;

  var LEVEL_TABLE = [
    0x31, 0x54, 0x24, 0x15, 0x43, 0x63, 0x52, 0x34,
    0x12, 0x45, 0x26, 0x65, 0x21, 0x56, 0x14, 0x61,
    0x33, 0x41, 0x53, 0x13, 0x62, 0x35, 0x23, 0x46,
    0x16, 0x36, 0x64, 0x32, 0x51, 0x42, 0x25, 0x44
  ];

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

  var LEO_WEAPONS = [1, 2, 4, 3, 6, 5];

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

  var PATTERN = ['ABBBBBACCC', 'CCCABBBBBA', 'ACCCBBBBBA', 'BBBBBACCCA'];

  var BUTTONS = ['', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'Start', 'Down+Start'];
  var SYMBOLS = ['', '1', '2', '3', '4', '5', '6', 'Y', 'M'];

  var GRANTS = [
    [[0x01, 'Fire Sword'], [0x02, 'Ice Sword'], [0x04, 'Lightning Sword'],
     [0x08, 'Battle Axe'], [0x10, 'Legendary Sword']],
    [[0x01, 'Homura-Tsumuji', 'Fire Breath super'],
     [0x02, 'Kimo-Yaburi', 'Kick Ultimate Counter'],
     [0x04, 'Rasetsu-Jin', 'Blade Slice special']],
    [[0x01, 'Super Brave Pigeon'], [0x02, 'Super Chakura Wave'],
     [0x04, 'Super Reverie Sword'], [0x08, 'Sun Staff']],
    [[0x01, 'Kokuu-Ha', 'Kick Ultimate Counter']]
  ];

  var PROGRESSION = [
     [
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
     [
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
      {"text": "New Move - Kimo-Yaburi (VS Point Exclusive), Become Resistant to Lightning", "move": "Kimo-Yaburi (VS Point Exclusive)"},
      {"text": "Become Resistant to Wind"},
      {"text": "Defensive Power Increased"},
      {"text": "Attacking Power Increased"},
      {"text": "Title Assassin, New Move - Rasetsu-Jin (VS Point Exclusive), Become Resistant to Fire", "title": "Assassin", "move": "Rasetsu-Jin (VS Point Exclusive)"},
    ],
     [
      {},
      {"text": "Resistant to Poison"},
      {"text": "Title Sorcerer, New Move - Air Chakura Wave", "title": "Sorcerer", "move": "Air Chakura Wave"},
      {"text": "Defensive Power Increased"},
      {"text": "Resistant to Poison"},
      {"text": "Title Summoner, New Move - Glace Cannon", "title": "Summoner", "move": "Glace Cannon"},
      {"text": "Attacking Power Increased"},
      {"text": "nothing",
       "announced": "Attacking Power Increased, Defensive Power Increased"},
      {"text": "Resistant to Lightning"},
      {"text": "Title Phantasm, New Move - Fiamma Cannon", "title": "Phantasm", "move": "Fiamma Cannon"},
      {"text": "Resistant to Poison"},
      {"text": "Defensive Power Increased"},
      {"text": "Resistant Ice"},
      {"text": "Title Witch, New Move - Electron Cannon", "title": "Witch", "move": "Electron Cannon"},
      {"text": "Attacking Power Increased"},
      {"text": "nothing",
       "announced": "Attacking Power Increased, Defensive Power Increased"},
      {"text": "Resistant to Lightning"},
      {"text": "Defensive Power Increased"},
      {"text": "Title Sage, New Move - Hyper Cannon, New Move - Super Brave Pigeon",
       "announced": "Title Sage, New Move - Hyper Cannon, New Move - Super Chakura Wave",
       "title": "Sage", "move": "Hyper Cannon"},
      {"text": "Resistant to Ice"},
      {"text": "Resistant to Lightning"},
      {"text": "New Move - Super Chakura Wave, Defensive Power Increased",
       "announced": "New Move - Super Brave Pigeon",
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
      {"text": "Title Magelord, New Move - Death Phenomenon", "title": "Magelord", "move": "Death Phenomenon"},
    ],
     [
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

  function progressionAt(character, level, build) {
    var rows = PROGRESSION[character], state = { moves: [], gained: '' }, i, e;
    var ladder = TITLES[build === 'ja' ? 'ja' : 'eu'][character];
    var other = TITLES[build === 'ja' ? 'eu' : 'ja'][character];
    for (i = 0; i < level && i < rows.length; i++) {
      e = rows[i];
      if (!e) continue;
      if (e.sword) state.sword = e.sword;
      if (e.shield) state.shield = e.shield;
      if (e.move) state.moves.push({ name: e.move, level: i + 1 });
    }
    for (i = TITLE_LEVELS.length - 1; i >= 0; i--) {
      if (level >= TITLE_LEVELS[i]) { state.title = ladder[i]; break; }
    }

    e = rows[level - 1];
    state.gained = (e && e.text) ? e.text : '';
    var here = TITLE_LEVELS.indexOf(level);
    if (here >= 0 && other[here] !== ladder[here]) {
      state.gained = state.gained.split('Title ' + other[here])
                                 .join('Title ' + ladder[here]);
    }
    state.announced = (e && e.announced) ? e.announced : '';
    return state;
  }

  var TITLE_LEVELS = [1, 3, 6, 10, 14, 19, 25, 32];
  var TITLES = {
    ja: [
    ['Soldier', 'Swordman', 'Fighter', 'Revenger', 'Victor', 'Warrior', 'Hero', 'Warlord'],
    ['Stalker', 'Sniper', 'Commando', 'Stinger', 'Executor', 'Stealth', 'Shadow', 'Assassin'],
    ['Magician', 'Sorcerer', 'Witch', 'Phantasm', 'Summoner', 'Sage', 'Archmage', 'Magelord'],
    ['Grappler', 'Striker', 'Buster', 'Martian', 'Champion', 'Ironfist', 'Godfist', 'Asura'],
    ],
    eu: [
    ['Savage', 'Brave Heart', 'Revenger', 'Victor', 'Soldier', 'Hero', 'Warrior', 'Warlord'],
    ['Stinger', 'Sniper', 'Stalker', 'Executor', 'Stealth', 'Commando', 'Shadow', 'Assassin'],
    ['Disciple', 'Sorcerer', 'Summoner', 'Phantasm', 'Witch', 'Sage', 'Archmage', 'Magelord'],
    ['Grappler', 'Striker', 'Buster', 'Slammer', 'Fighter', 'Tiger Claw', 'Ironfist', 'Ashura'],
    ]
  };

  var JA_NAMES = [
    ['Fire Sword', '\u708e\u306e\u5263'],
    ['Ice Sword', '\u6c37\u306e\u5263'],
    ['Lightning Sword', '\u96f7\u306e\u5263'],
    ['Battle Axe', '\u6226\u3044\u306e\u65a7'],
    ['Legendary Sword', '\u4f1d\u8aac\u306e\u5263'],
    ['Legendary Shield', '\u4f1d\u8aac\u306e\u76fe'],
    ['Sun Staff', '\u592a\u967d\u306e\u6756'],
    ['Super Reverie Sword', '\u5f37\u529b\u306a\u30ec\u30f4\u30a1\u30ea\u30fc\u30fb\u30bd\u30fc\u30c9'],
    ['Super Brave Pigeon', '\u5f37\u529b\u306a\u30d6\u30ec\u30a4\u30d6\u30fb\u30d4\u30b8\u30e7\u30f3'],
    ['Super Chakura Wave', '\u5f37\u529b\u306a\u30c1\u30e3\u30af\u30e9\u30fb\u30a6\u30a7\u30fc\u30d6'],
    ['Super Chakra Wave', '\u5f37\u529b\u306a\u30c1\u30e3\u30af\u30e9\u30fb\u30a6\u30a7\u30fc\u30d6'],
    ['Cho-Enryuu-Kyaku', '\u8d85\u708e\u9f8d\u811a'],
    ['Air Chakura Wave', '\u30a8\u30a2\u30c1\u30e3\u30af\u30e9\u30fb\u30a6\u30a7\u30fc\u30d6'],
    ['Death Phenomenon', '\u30c7\u30b9\u30fb\u30d5\u30a7\u30ce\u30e1\u30ce'],
    ['Electron Cannon', '\u30a4\u30ec\u30af\u30c8\u30ed\u30f3\u30fb\u30ab\u30ce\u30f3'],
    ['Homura-Tsumuji', '\u7114\u65cb\u98a8'],
    ['Diamond Shield', '\u30c0\u30a4\u30e4\u306e\u76fe'],
    ['Achilles Rush', '\u30a2\u30ad\u30ec\u30b9\u30fb\u30e9\u30c3\u30b7\u30e5'],
    ['Fiamma Cannon', '\u30d5\u30a3\u30a2\u30f3\u30de\u30fb\u30ab\u30ce\u30f3'],
    ['Jamming Ghost', '\u30b8\u30e3\u30df\u30f3\u30b0\u30fb\u30b4\u30fc\u30b9\u30c8'],
    ['Diamond Sword', '\u30c0\u30a4\u30e4\u306e\u5263'],
    ['Wooden Shield', '\u6728\u306e\u76fe'],
    ['Kuugeki-Shou', '\u7a7a\u6483\u638c'],
    ['Glace Cannon', '\u30b0\u30e9\u30fc\u30b9\u30fb\u30ab\u30ce\u30f3'],
    ['Hyper Cannon', '\u30cf\u30a4\u30d1\u30fc\u30fb\u30ab\u30ce\u30f3'],
    ['Steel Shield', '\u92fc\u306e\u76fe'],
    ['Bronze Sword', '\u9752\u9285\u306e\u5263'],
    ['Baku-Ryusho', '\u7206\u9f8d\u6607'],
    ['Kimo-Yaburi', '\u809d\u7834\u308a'],
    ['Koukaku-Shu', '\u7d05\u9db4\u8e74'],
    ['Kumo-Gakure', '\u96f2\u96a0\u308c'],
    ['Rasetsu-Jin', '\u7f85\u5239\u5203'],
    ['Gaia Driver', '\u30ac\u30a4\u30a2\u30fb\u30c9\u30e9\u30a4\u30d0\u30fc'],
    ['Steel Sword', '\u92fc\u306e\u5263'],
    ['Tentsui-Ga', '\u5929\u589c\u7259'],
    ['Enma-Zuki', '\u95bb\u9b54\u7a81\u304d'],
    ['Kokuu-Ha', '\u864e\u7a7a\u7834'],
    ['Utsusemi', '\u7a7a\u8749'],
    ['Kagerou', '\u873b\u86c9'],
    ['Tsumuji', '\u65cb\u98a8'],
    ['Idaten', '\u97cb\u99c4\u5929'],
    ['Koen', '\u5f27\u708e'],
  ];

  var JA_PHRASES = [
    ['Become Resistant to Lightning', '\u96f7\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant to Thunder', '\u96f7\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant Lightning', '\u96f7\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant to Poison', '\u6bd2\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Attacking Power Increased', '\u653b\u6483\u529b\u304c\u3042\u304c\u3063\u305f'],
    ['Defensive Power Increased', '\u9632\u5fa1\u529b\u304c\u3042\u304c\u3063\u305f'],
    ['Become Resistant to Fire', '\u708e\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant Thunder', '\u96f7\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant to Wind', '\u98a8\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant to Ice', '\u6c37\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant Poison', '\u6bd2\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Resistant to Lightning', '\u96f7\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant Fire', '\u708e\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant Wind', '\u98a8\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Become Resistant Ice', '\u6c37\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Resistant to Thunder', '\u96f7\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['(VS Point Exclusive)', '\uff08VS\u30dd\u30a4\u30f3\u30c8\u9650\u5b9a\uff09'],
    ['Resistant to Poison', '\u6bd2\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Resistant to Fire', '\u708e\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Resistant to Wind', '\u98a8\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['Resistant to Ice', '\u6c37\u306b\u5f37\u304f\u306a\u3063\u305f'],
    ['nothing', '\u306a\u3057'],
  ];

  var JA_GEAR = [
    '\u9752\u9285\u306e\u5263',
    '\u6728\u306e\u76fe',
    '\u92fc\u306e\u5263',
    '\u92fc\u306e\u76fe',
    '\u30c0\u30a4\u30e4\u306e\u5263',
    '\u30c0\u30a4\u30e4\u306e\u76fe',
    '\u30aa\u30fc\u30eb\u30c9\u30bd\u30fc\u30c9',
    '\u30aa\u30fc\u30eb\u30c9\u30b7\u30fc\u30eb\u30c9',
    '\u30ec\u30b8\u30a7\u30f3\u30c0\u30ea\u30fc\u30bd\u30fc\u30c9',
    '\u30ec\u30b8\u30a7\u30f3\u30c0\u30ea\u30fc\u30b7\u30fc\u30eb\u30c9',
    '\u30a6\u30c3\u30c9\u30b9\u30bf\u30c3\u30d5',
    '\u30b5\u30f3\u30b9\u30bf\u30c3\u30d5',
    '\u30d5\u30a1\u30a4\u30a2\u30bd\u30fc\u30c9',
    '\u30a2\u30a4\u30b9\u30bd\u30fc\u30c9',
    '\u30e9\u30a4\u30c8\u30cb\u30f3\u30b0\u30bd\u30fc\u30c9',
    '\u30d0\u30c8\u30eb\u30a2\u30c3\u30af\u30b9',
  ];

  var JA_TITLE = /Title ([A-Za-z][A-Za-z ]*?)(?=,|$)/g;
  var JA_MOVE = /New Move -\s*(.+?)(?=\s*\(VS Point|,|$)/g;

  var JA_SPECIAL = '\u5fc5\u6bba\u6280 ';
  var JA_MOVE_KIND = [
    ['\u30b0\u30e9\u30fc\u30b9\u30fb\u30ab\u30ce\u30f3', '\u7cbe\u970a\u53ec\u559a\u8853 '],
    ['\u30d5\u30a3\u30a2\u30f3\u30de\u30fb\u30ab\u30ce\u30f3', '\u7cbe\u970a\u53ec\u559a\u8853 '],
    ['\u30a4\u30ec\u30af\u30c8\u30ed\u30f3\u30fb\u30ab\u30ce\u30f3', '\u7cbe\u970a\u53ec\u559a\u8853 '],
    ['\u30cf\u30a4\u30d1\u30fc\u30fb\u30ab\u30ce\u30f3', '\u8d85\u5fc5\u6bba\u6280 ']
  ];
  function jaMoveKind(name) {
    var i, trimmed = String(name).replace(/^\s+|\s+$/g, '');
    if (trimmed.indexOf('\u5f37\u529b\u306a') === 0) return '';
    for (i = 0; i < JA_MOVE_KIND.length; i++)
      if (trimmed === JA_MOVE_KIND[i][0]) return JA_MOVE_KIND[i][1];
    return JA_SPECIAL;
  }

  function localise(text) {
    var i, out = String(text == null ? '' : text);
    for (i = 0; i < JA_NAMES.length; i++)
      if (out.indexOf(JA_NAMES[i][0]) >= 0)
        out = out.split(JA_NAMES[i][0]).join(JA_NAMES[i][1]);
    out = out.replace(JA_MOVE, function (_all, name) {
      return jaMoveKind(name) + name + '\u3092\u899a\u3048\u305f';
    });
    out = out.replace(JA_TITLE, function (_all, name) {
      return name.toUpperCase() + '\u306e\u79f0\u53f7\u3092\u5f97\u305f';
    });
    for (i = 0; i < JA_PHRASES.length; i++)
      if (out.indexOf(JA_PHRASES[i][0]) >= 0)
        out = out.split(JA_PHRASES[i][0]).join(JA_PHRASES[i][1]);
    return out;
  }

  function localiseLevel(text) {
    var out = localise(text);
    return out.split(',').map(function (part) {
      var t = part.replace(/^\s+|\s+$/g, '');
      return JA_GEAR.indexOf(t) >= 0
        ? part.replace(t, t + '\u3092\u624b\u306b\u5165\u308c\u305f') : part;
    }).join(',');
  }


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


  function shiftForClass(cls) {
    return cls === 1 ? 0 : cls === 2 ? 4 : cls === 3 ? 8 : -1;
  }

  function decodeVs(field) {
    var lead = (field >> 16) & 0xF, digits, count, cls, unbiased, i, value, bcd, shift;

    if (lead === 4 || lead === 5) {
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
        if (firstOk || secondOk || thirdOk) return null;
        return st;
      }
      default: return st;
    }
  }


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

  function spellings(character, level, points, granted, shield) {
    var all = enumerate(character, level, points), matches = [], i, best = null;
    for (i = 0; i < all.length; i++)
      if (all[i].granted === granted && all[i].shield === shield) matches.push(all[i]);
    for (i = 0; i < matches.length; i++)
      if (!best || ease(matches[i].digits) < ease(best.digits) ||
          (ease(matches[i].digits) === ease(best.digits) &&
           matches[i].digits.join('') < best.digits.join('')))
        best = matches[i];
    matches.sort(function (p, q) {
      var ep = ease(p.digits), eq = ease(q.digits);
      if (ep !== eq) return ep - eq;
      return p.digits.join('') < q.digits.join('') ? -1 : 1;
    });
    return best ? { best: best, count: matches.length, all: matches } : null;
  }


  function countBits(n) { var c = 0; while (n) { c += n & 1; n >>>= 1; } return c; }

  function ease(digits) {
    var runs = 1, seen = {}, n = 0, i;
    for (i = 0; i < digits.length; i++) {
      if (i && digits[i] !== digits[i - 1]) runs++;
      if (!seen[digits[i]]) { seen[digits[i]] = 1; n++; }
    }
    return runs * 10 + n;
  }

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

  function loadout(character, level, granted, shield) {
    var p = progressionAt(character, level), gear = [], extras = [], list, i;

    if (character === 0) {
      gear.push((granted & 0x10) ? 'Legendary Sword' : p.sword);
      gear.push(shield ? 'Legendary Shield' : p.shield);
      list = [[0x01, 'Fire Sword'], [0x02, 'Ice Sword'],
              [0x04, 'Lightning Sword'], [0x08, 'Battle Axe']];
    } else if (character === 2) {
      gear.push((granted & 0x08) ? 'Sun Staff' : 'Wooden Staff');
      list = [[0x01, 'Super Brave Pigeon'], [0x02, 'Super Chakura Wave'],
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
    localise: localise,
    localiseLevel: localiseLevel,
    bestLoadout: bestLoadout, bestTargets: bestTargets,
    generate: generate, enumerate: enumerate, spellings: spellings,
    decode: decode, specialCodes: specialCodes,
    describe: describe, requirements: requirements, loadout: loadout,
    encodeVs: encodeVs, decodeVs: decodeVs, binToBcd: binToBcd,
    CHAR_NAMES: CHAR_NAMES, BUTTONS: BUTTONS, SYMBOLS: SYMBOLS,
    TITLES: TITLES, TITLE_LEVELS: TITLE_LEVELS,
    PATTERN: PATTERN, GRANTS: GRANTS, LEVEL_TABLE: LEVEL_TABLE,
    LEO_RULES: LEO_RULES, KENJI_RULES: KENJI_RULES, TESSA_RULES: TESSA_RULES,
    REJECT: REJECT
  };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports)
  module.exports = globalThis.RedEarthPassword;
