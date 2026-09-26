(function () {
  'use strict';
  var RE = window.RedEarthPassword;
  var st = { character: 0, level: 32, points: 9990, granted: 0, shield: 0 };
  var $ = function (id) { return document.getElementById(id); };
  var CHAR_SLUG = ['leo', 'kenji', 'tessa', 'mai'];
  var ORDER = [2, 0, 3, 1];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  var LESS_MOTION = !!(window.matchMedia
                   && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var GLYPHS = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*-_+=;:<>,'.split('');
  var WIDE = ('\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3'
            + '\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8'
            + '\u30ca\u30cb\u30cc\u30cd\u30ce\u30cf\u30d2\u30d5\u30d8\u30db'
            + '\u30de\u30df\u30e0\u30e1\u30e2\u30e4\u30e6\u30e8\u30e9\u30ea'
            + '\u30eb\u30ec\u30ed\u30ef\u30f2\u30f3'
            + '\uff03\uff20\uff0a\uff0b\uff1d\uff1c\uff1e').split('');
  var WIDE_CH = /[\u3000-\u30ff\u4e00-\u9fff\uff01-\uff60]/;
  var KNOWN_CH = /^[\x20-\x7e\u00d7\u2013\u3000-\u30ff\u4e00-\u9fff\uff01-\uff60]*$/;
  function wrongGlyph(c, glyphs) {
    var set = WIDE_CH.test(c) ? WIDE : glyphs;
    return set[Math.floor(Math.random() * set.length)];
  }
  var STEP = 47, FLICKS = 4;
  var running = null, armed = null;

  var lastPw = null;
  var PW_TICK = 30, PW_TAIL = 300;
  var pwHot = [], pwTruth = '', pwNode = null;
  var pwTimer = null, pwUntil = 0, pwHeld = false;

  var LEGEND = ['', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'START', '\u2193+START'];
  function symFile(d, forChar) {
    return '/art/symbols/' + (d === 7 ? 'start' : 'down') + '-'
           + CHAR_SLUG[forChar === undefined ? st.character : forChar] + '.svg';
  }
  function chips(digits, forChar, after) {
    var who = forChar === undefined ? st.character : forChar;
    var box = el('div', cascade ? 'chips' : 'chips still');
    digits.forEach(function (d, i) {
      var delay = cascade ? ((after || 0) + i * 18) + 'ms' : '0ms';
      if (d >= 1 && d <= 6) {
        var img = document.createElement('img');
        img.className = 'chip';
        img.src = ART[CHAR_SLUG[who]][d];
        img.alt = LEGEND[d];
        img.style.animationDelay = delay;
        box.appendChild(img);
      } else if (d === 7 || d === 8) {
        var sym = document.createElement('img');
        sym.className = 'chip sym';
        sym.src = symFile(d, who);
        sym.alt = LEGEND[d];
        sym.style.animationDelay = delay;
        box.appendChild(sym);
      } else {
        var pill = el('span', 'chip s', LEGEND[d]);
        pill.style.animationDelay = delay;
        box.appendChild(pill);
      }
    });
    return box;
  }

  function bits(n) { var c = 0; while (n) { c += n & 1; n >>>= 1; } return c; }
  function namesOf(opts, want) {
    return opts.filter(function (o) {
      return o.shield ? !!want.shield : !!(want.granted & o.bit);
    }).map(function (o) { return o.name; });
  }
  function text(digits) {
    var s = digits.map(function (d) { return RE.SYMBOLS[d]; });
    return s.slice(0, 5).join('') + ' ' + s.slice(5).join('');
  }

  var ART = {"leo":{"1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACIklEQVR42u2cvU4CQRSF78pPsolSYCItFhRi0BILCgp6E3wLO0ufwNLWziewsKfYgsTGhhAlkUIaC0ygQAkJhKwFEe+sM8uwy4DIOdWwDAN7cvLt3TuARQZ1lcm4pxdN6XO1m6PpOG3bgd/j5DamPbfhVKfj++uMdM5ls2mZ8mOLoKUpukkne1AssLFe0tfKbH6CIkZ6SLYff1WMDcLcMJzWkZXdkx53n9+lx4vJJBERPeTzrmrN1mAgHetyHsxeomA2zN4QZnM2f3MM+n2d4WPOeafbVdbtSDbq7PCSVR0Np0oNZzLOnpeJqMzS+QZm/6tkc0aD0+Hl9Y/7i2SD2abuIMuoszcm2aZ7FKjNbSQbzDaoZdTRYPZfSjbvy5roOfPdEBL2DguBqgpvQlXrr6ry8PrJHyPZwAjMhsIy+7Enbrz2xmMpb1S93FmadNfMyfT68+5Hcv+IiF76fSQbGIHZ0KJknaVSrs7E3Zj6O3X7Cp7zcaJUmo7tdFp4/U4uJ113+/B47hP6fKpJj3/U68LjQav1w9lKZSaLiYheFfckndEIyQZGYDa0NswW5sXjoT5QIhJZ2Ml5a9551RkO9eaB2cAIzIZgNsyGYDbMhmA2zIbZEMxeV0Xv2m3hN3y6vRJIT9xfJBsYgdlQSGn/t4Yfy3mv+z/3s1V9a+91D8kGRmA2tGpmBxHnvN8eJue8KWb77SdyFuvyF8kGRiCYvQJ9AYdFqgPqjY++AAAAAElFTkSuQmCC","2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACOklEQVR42u2bv07CUBTGT/mXkCgDJrLiwCCGONaBgYEnwCdw9Qn0CRzdXH0CTdgZGEhwcDFESGSQxQESGFBCAiE4US/Xe0opLW3h+6bb2wspX77+OD0XNHJJd5nMXJ67KafY9Vq2pslz82Z+zq1/uZoSEdHFY9TyNbWqNWNcvs8o19y225pbnoQI2poifrkQsxQ7pdNCXjiqLZ3jko5k73KyZf6m43Hl2E/SssfMHdRTzheSSSIiqus6e4d1xmPl2CrnQ341xer5IAkYgdl7wGyRzQuGbQslzYfnf/PZ65KvzOK+q0TOVwcDtm5Hsvexzna+bu8pnyBbVfVdU9e/wOydSrZXnPY7n+1K9lD0F8kGs916WCqhzt6bZPupt8FXBNHAGiz6i2SD2du8a8Ds3Uy22JflWOOUxD3AdSoE9et0k3PeVR6yn+Ixkg2MwGxoU2a/DofGwXA2U7JG5rddntvtf6het6guvOqpcPuRoodERB+jEZINjMBsyClpl6nUyl8iHUX53sQJsy8ncz1RLBrjeDptjA9zOeX7Hpyd2/pAP+9vyvnvRmPpeNzp/HG2UlnJYiKiT+aZpD+dItnACMyGAsHspXWx2EYXkwiHHf1wcs27rvqTibV1YDYwArMhmA2zIZgNsyGYDbNhNgSzg6rIU7dr/OfDSp8EWk+iv0g2MAKzoQ1l6T/XZiwXe9273s/m+tYil5FsYARmQ14z245kznP7mCLn3WS22X6iyGKr/EWygREIZnugX/mdtJSfnxutAAAAAElFTkSuQmCC","3":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACK0lEQVR42u2csU7CUBSGTwVMSJQBE1lxYBBDHOvgwMAT4BO4+gT6BI4+gk/gwM7QgQQHF0OURAZZHDCBASUkEIKDoZ7We+ktbaEt/z+d29sW+ufk67nnBjQKULeFwnwRX9dy/+YfL6eO9zi7Ty29TjQvU9tomHHtriA856bT0YLyY4egtSm5TQ97XD5no4ZlTpbpyOy4Zzbnbz6dJlEcJmnFQ+Hx+eun8Hg5myUioqauz2X37I7HwliV88jsNQpmw+wtYDbn8oJhEJHTu4pz3hgMpHX7Rks/NwsS1NkhlqjqaBsNahu/cfGqaplr6h9gdqwyG5z2V3YPub/IbDA7qBVkdXvNli2pVZbXkczssPY24libg9lgtv9aRx0dKbPFhsRnlZnkfVkZa/wQ3/9zUx2Ir9Md5jdXedj95GMwm9BihdmQR2Y/DYfmYDibSdnjdd/R3mXzch1/ka56Xz/ZzGPuIRHR22iEzAZGYDbkl7SLXG6ucuJBSry4OFrCcj7OVCpmnM7nzXi/VJJ+5t7JqesH+n55Fh7/arUs43G3+8fZet2RxURE75I1SX86RWYDIzAbigSzLefs7nr+QplEwreHs9e8btWfTNTOA7OBEZgNwWyYDcFsmA3BbJgNsyGYHVUlH3o98zcfqn0SSF3cX2Q2MAKzIY9S/m8NGc95nzvu/WxZ35pzGZkNjMBsKAzMXkWc87I9TDvng2L2sv1EzmJV/iKzgREIZm9AP1Ayr72yP62nAAAAAElFTkSuQmCC","4":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACRklEQVR42u2cz0oCURjFP1MDoQwMcmuLWWRYS1u4cOFesAeItu1a9gT2BNEufIB6AhcuggzaiGSQi9y0MFDIEkGRaSP63WmujuOd8d85q3vnz2XmcPjNvd9FPeSgspqmpy+rpudKt0fDdiQQsDX+ztnzv2PfufjYe07u/EL/Ol0X+lfVqscpPzYIck2+VX9BY5KJiN4Kj6ynrY7ZB8mEBCMtR8Yu5nrLn+yspukyxtphrl1Oq1YyFBL6T/G4Lru21umYtq1yHswGs51jdPQiQ0SZQYo/XX02JHueyeZsNvJs3cW/M7zNOV9oNqXzdiQbzFYjT3Rv0MosxPMg2W4mmzManFY/b+f+ItlgthrplS/JPBvMXv1kL0qNYh3m5kg2mK1ibj3iNi/FVm4eTPntRp0EyXYz2bwu60TNWdwVIVadS9hKKk+g+djzXS0a/eR9JBvMVqfiec+wI0+YZ69Fsl9a4sZrq9835Y2sljtJTq7Y7Iyt6nlk+5HcPyKi93YbyQZGYDakbMF1Gg7rVi7c9ful5/YlPOftYCo1bAciEeH+7VjMdNytw+OpX+j3tWR6/KdcFvqdWm3E2Xx+IouJiD4ka5JGr4dkAyMwG1oaZgvXbW7O9EBBr1fZyxnnvNOq0e1auw7MBkZgNgSzYTYEs2E2BLNhNsyGYPayyndfrwu/4bNaK4GsifuLZAMjMBuaUZb/W2Mcy3mte5Xr2bK6tfG7h2QDIzAbmjez7YhzftweJue8U8wet5/IWWyVv0g2MALB7DnoDyWvtkExSHgWAAAAAElFTkSuQmCC","5":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACVElEQVR42u2bvUrDUBzF/7WtUNAKFexahw5WimMcHDp0F+oDiKtPoE+gT+AqfQAF9w4dBBVcpFjBDnZxaKEFq6XQUOKgxJub3CamufninOkmvfk6nP5y7/+SBEnSWbGo8ftObvLC/vdHqmnf7mV67jX4Y9YOH0x9PurK3HPw1zjf7xm2TzudhFeeLBHkm1JhuRG7FMu8zkvzltkqxt9sL7RV2TOjpq5GK9k8fwuZjGU7DqrkcobtO0XRn707mZBV2ynXA2d2orSx0O9gdohkx+jScY2Iar8pfpd6LxiNBJVsls08u2SjpH1xbdr/k7rwSPSuYrlORNQcDi15jmSD2bJfxsH8Y5BsP5MdFKfDzmevxuqsv0g2mC1HWrsvGGeD2fFLdphqG+IZXDqyBrP+ItlgtrxCl9buG0qx7MyV5beMOgmS7Wey2bqsiDVeybgiQo5nc9bHEREpnpzfa4nq3kg2mC1P5hV5wjg7lsl+HI30jdFsZskant9uee52tiY6jh8xuDm/23sScZn38XU8RrIJJVaYDXk1wTrI5zW7TutpcW1iU7Aux3M9W63q7UyhoLdXy2XL865s77h6oK/nJ+Fvn62W3p50u3+MbTQc8fhNMCcZqCqSDYzAbCgSzDb0W15e6GayyaTnD8iOed1oMJ3a9wGzgRGYDcFsmA3BbJgNwWyYDbMhmB1Vpa56Pf2bDyd1Euh/Yv1FsoERmA0tKEffXM9jOVvrjns9W1S3ZrmMZAMjMBsKmtluxHNetI7Jcl42s0XriTyLnTIYyQZGIJjts74B1Be/8q2sVjcAAAAASUVORK5CYII=","6":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACRklEQVR42u2cvUoDQRSFb8waCPgDCqaNRQqVYLkWFhbphfgAYusT6BPoE9iKD6Bgb5FCUMFGxAimMI1FAhFclYBB1iaud3dnknGzk91szqnm7s9k53Dz7cwdkhRp1EGhYP+2985zvvPXO52+fawdTwqPe++d3b7xXfN2Yv6r78PNhiver9VSYfoxQdDQZIzTYEXfksfKJYsKMFtFSxvrftScdEYzszl/89ksidqjro25OVd8ZZo2j+vtNsliFb6D2WD2cBi9vFsmonI3i1+0Pw8yO6rM5lz28gvyv594zPleeX0VstyI29cczE6AUssL3VY5smcAs4eZ2eC03vk69xeZDWaHL7valMyzx8Tsv5dWf5MSkdlJqm3EfW4OZoPZejBlV5uuUmz16EzIb111kliZLR5kclaZhrdGq6tO7d4RIeXVnPg+IiIzlP51iHvK22A2mK1H/h151EaSm9m3luUE1vc3yfbbBt13DLpak93nfZkG6X/QFaSMzdzHp89PZDahxAqzobAWWVu5nK1y4fykeHGx2IPlPJ4plZx2Np932tPFovQzp1ZWAw3q4+FOePz9/t5pt+t11znr4qIvi58laxIiolang8wGRmA2FHtmu67JZAZ+oJl0OtQB8jlvELW+vtSuA7OBEZgNwWyYDcFsmA3BbJgNsyGYPYoyThsN5zcfqnUSSF3cX2Q2MAKzoQGl/H8aMp7zOnfS69m9ataczchsYARmQ1EzO4g452V7mF7O62R2r/1EzmMV/iKzgREIZkegHweWvk/utmnzAAAAAElFTkSuQmCC"},"kenji":{"1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACKklEQVR42u2cT0sCQRjGZ/0DeUnsYEVgnVo6eIzwA4TlsW/SJRA6Rh3rC3Svi0c7dAwK6ZaHMAhKCNNDoocMVt0u6b6zzersP0X3eS6Ou+PIPjz89t13UIX5qK3Fon5+nBOey5++DsfJ5SXH33F1kZCeWyob48OTonDOczun+OVHiEETUyRIF7uTNsb31zmppM+U2fQCkWwb/B2MF0Iqd84Jc91wWkaJ/QPh8eZNQXg8tZr5e23qVms26l/D8U+/YpvzYPYEBbNhdkCYTdk84Bgkus9kCO8NzldrD5Z1O5KNOtu9RFVHqWw8Re4d8dVKVgWz5yvZlNHgtHv998/wF8kGs/17gkSdHZRkm/sckLei/iLZYLb3yqqXYHagkk37sowx1qirnvac6W4Ic7B3aK4qzAm1Wn9aoj1vxvi+N5INjMBsyC2z29odd6Abbhm8qcWF9aIdlpu7a17L7/Xt7kd2+y1u3nfvCckGRmA25JWUtVhel5kYDSUtz8XC6li27xK0bmyGuc+nt6PCdVPr9i+o+i4+Xn7UuPdvL73h+LYwnsWMMdbpVYRra/0Gkg2MwGxoZpjNzVNW3BX+obhnF2euee1K0z/l5oHZwAjMhmA2zIZgNsyGYDbMhtkQzJ5VRT46Z9xv+GR7JZCcqL9INjACsyGXkv5vjVEsp73uee5nW/Wtzfc9JBsYgdnQtJntRJTzo/YwKef9Yvao/UTKYln+ItnACASzp6Bf90ChK2ioLv8AAAAASUVORK5CYII=","2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACR0lEQVR42u2bPU/CQBzGrwUSWSQ4oMYEnWwcGI3hAxiE0cmPoYuJiaOJiYt+AXddOqKJo4nGuMlgcFISgzBIYBCT8uIi7bXcQekLfeF5Fq7ttWmfPPfj+m8rEJe0MV/sG9c9XBe4/ZN5IhjXNW5In9d/b79BCCHk6iJp+pyeSlr74KTI7PPaKghueSISaGqK+uVERqXYKW1ltPb5sX6U8ZKOZIc52Ub+zomS2k4tLvjywpL5Xc4Ikpnr08vZ/98Gd4TVa99q+7dXnpjzol9NMbs9SAJGYPYMMJtm84Bh00LJ7dkwS3cO/YUQ/f9TluK9xvlK9ZE7b0eyZ3Ge7fy8XWbeQQ7uIo2jJieB2eFKtlec9jufrWrYQ81fJBvMdv9mCfPssCebrnN4rZx0ydkiB9Zg2l8kG8ye5qgBs8OZbLouW6+5W6emnwE6tZ/VY7oluuZNiL7ujWQDIzAbssvslnKvLnQiTY011QRzrmiH51brH6z9BlU6r2oqvOeRnV5T1++n+4JkAyMwG3JKwkr8aOybSDExxd0Wj0im3ifZptC6th5R25nNGPO46VVrF1T5YK8vPSu65fe3rtq+k8ezmBBC2t0y89hKr45kAyMwGwoEs3X9hCV7k34x4ejFGee8k0rpf5nrB2YDIzAbgtkwG4LZMBuC2TAbZkMwO6iKfrZP1W8+zNRJoMlE+4tkAyMwG7IpU99cj2I5XesOez2bV7emuYxkAyMwG/Ka2VZk5DzvOSbNeTeZPep5Is1is/xFsoERCGZ7oD+P+6wSh6zBqwAAAABJRU5ErkJggg==","3":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACMklEQVR42u2cu04CQRSGZ7kk0kiwQI0JWrmxoDSGBzAopZWPoY2JiaWJpb6AvTaUWFiaaIidFAYrJTEIhQQKMVlgbWT37DIDe+Wy/H/D7OzMkPlz+DhzNiAxH7W1WFD77cfb3MD9w6PGyDVurhJD5/Hui1Qs6e3j8wJ3zGsrJ/nlR4hBY1Nknja7k9bbl2fGT5oo0hHZQY9syt+FkKz1J5eXpnJjif0Dbn/jLs/tT61m/l8bqmjNeu1ba//2yrY5j8geo2A2zJ4DZlMu9xkGMcH3U4bwXud8pfokzNsnmvrZOZAgz55i8bKOYkk/Re6dGLOVrAxmByuywWlvNeih7i8iG8z27wQ5t2ZbMUR0vJ7JyKZ1Dsh7UX/BbDDbe2Xla5g92pAAMZvWZes1/+rU9Pmfl/OcruuXaM2bMWPdG8xmKLHCbMgls1vKg3bRCTd11lTjwnzRCc/NVTY382iFzum6XrKZcrnTaxrG/XRfENnACMyGvJK0FjtVrQyMhpLc/lhY5nLdzPZdgtaNzbDWTm9Hhe+ZWre/ocoHv7/0rBiu39+6Wvs+P5rFjDHW7pa5ayu9OiIbGIHZ0Eww2zBGWnGf+Ifinm3OnPPalaJ+WRsHZgMjMBuC2TAbgtkwG4LZMBtmQzB7VhX5bF9ov/mwWieBrIv6i8gGRmA25FKW/1tDxHNa5w56PVtUt6ZcRmQDIzAbmgZmOxHlvOgZppnzfjF72PNEymKr/EVkAyMQzJ6A/gBQS6eocxKYugAAAABJRU5ErkJggg==","4":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACRUlEQVR42u2cPU/CUBiFX74SWSA4oMYEnSQMjMbgblRGFt39A7qYkDhr4oJ/gN2JEUwcHYxxk8FgYqIkBmGwgUFM+KiT5d7allJuW6nnTLft7U17cvLw8t6Aj2xUKlKWCydZzWv502dlHF+Yt7T+0UHs17lCUTK85/KCv2dzr8wdP3ayPrv88BPkmIJef0F1komI7qoeNXsjPZtru2p2KlKWf8Zz/iR3zQpzrXJatBJLGdWxJOvNbTU/lPHXsDYx58FsMNs+Ru8c55TxdrLo6LMh2W4mm2Wzmmf/XfznTEaT8/XGrW7djmSD2WIU2839qedBsp1MNstocFp83U408hfJBrPFSKqUDOtsMNvLyVb3OSCxYv1FssFscbW1VClxrdir8xLDb3K0T4JkO5lsti9LRNRqJoX2nPV2RbS6c2aSyibQrR0XI7E9byK+741kg9nitH8ojd2RR53txWR3ejfciX6gPeJNI6pZL07Ccju/sVlZW9Tz6O1H9odtbt7n4AHJBkZgNiRKvuVwXjYzMeSP614LB5Jj2b7FoHJ1LcDdn14Paa6bWJn8heqv2uer9z3u+OVpoIyvS+NZTETUHdQ01+4NW0g2MAKzoZlhNjfPtzhd4e+PCns5dc07qXryu7l5YDYwArMhmA2zIZgNsyGYDbNhNgSzZ1XBt+4Z9xs+s70SyJxYf5FsYARmQ1PK9H9rGLGc7XV7uZ+t17dWf+4h2cAIzIbcZrYVsZw32sNkOW8Xs432E1kWm+Uvkg2MQDDbBX0DhOGpyMnOqzEAAAAASUVORK5CYII=","5":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACTElEQVR42u2bPU/CQBzGrwUSWSQ4oMYEnWwcGI3B3aCMLrr7BXQh8ROYuOgXYNelI5g4mmiMmwwGJyUxCIONDGJSXtzao/Ta0vZaqM8z9eV6bR8efr3+DwTCSRvzlaFx2/11kdn+8FgZ23Z1mbY8h/GYk6Px9hdlxbIP4zm2Dyoj6y+douCXJyKBAlN8Wi7ELsU8z/NY+2dm+6GtXASSbeTvnChpy5nFhUh91bPLecO6ot17u/Wlbf8d1CfmeujMTu/te9oPZk+R7Bi9W9I/zIJU5notGI2ElWyazUZ28UbJzbk8tp1O3TRo9PmUN+U6IYQ0mg+mPEeywexwHsa8hWQHmeywOD3tfPZvrK77i2SD2XykVGXLcTaYHaVk03WOsMV+g5Nn1mDaXyQbzOY3tlaq8kgpln5z3S0RrnUSJDvIZNN12XaLb53a7YyI0+OCmnGxE6vujWSD2fzkZEYe4+woJLuj3mkrvdi3zppmynSs6IXnbt/WWMcVJO/9u70mFpcJIaQ30H386T8j2QQlVpgN+SRhJXk6tGuUEDPMfcmY5Oj3JDsUGtfWY9pybjNh2m921d0NNd7Z+2pPqrb89trXlm9lZzzu9uum/aqDNpINjMBsaCaYPdJOWPI26BdTvt8gPeZ1I3X4ad8GzAZGYDYEs2E2BLNhNgSzYTbMhmD2rCr+0T3T/vPhpE4CTSbaXyQbGIHZkEc5+s+1FcvpWnfU69msujXNZSQbGIHZUNjMdiMj51nzmDTneTObNZ9oZLFTBiPZwAgEswPWH/TTtVWsu6jJAAAAAElFTkSuQmCC","6":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACOUlEQVR42u2cP0/CQBjG2wKJLBIcUGOCTjYOjMbgblBGFt39ArqY+AlMXPQLsOvSEUwcTTTGTQajk5IYhMFGBjEpf5wo13KFo+21eD7PdHe9XntP3v56fS8gSxy1Nlvq9cu3l/mh43sH+tgxLs6T1Hb7uYf7w/3OivpEY2/uliz1p2Ze9tMPRYICU/Q/TZb2lNxXYPbE2sgIFNkkf2cU1WxPzc8JE/npxaytrvfIeqP+aTn+032eiO9gNpgdDKO3jwpmOacWud8PIjusyCa5bOcXRHs/Zal8r9buqCyPTttjDmYLoOROIfR7ALODjGxwmvd6feAvIhvM9l96WRu5zhbebJaXVt8kISKbzHNA/ov0F8wGs/lgSi9rllTs1alG8FvinieZKrPpkxSI2WROtlHnl6d2uyPCel6QOy7jROa9SX/BbDCbj1h25CXkRgSJ7KZxY1baka8Ba2oJx/WiG567/VpzOi+neh/f6xekE5vb3YGP351HRLaEFCvMhnySvBQ/7rF0jCkpans8olK5bmf7FoHHldWIWc6sxxyvmV52N6nqG7298mCY5deXjuXYtTaexa3Os+M1jW4DkQ2MwGxo6plt6SMveF/4KwlfJ0iued3I6H2w9QOzgRGYDcFsmA3BbJgNwWyYDbMhmP0XFX1vnZi/+WDNk0DsIv1FZAMjMBvyKOb/03DiOZnnFj2fPSpnTbIZkQ2MwGwobGa7Ecl5pz1MO+d5MnvUfiLJYxb+IrKBEQhmh6BftXmyR3JZar8AAAAASUVORK5CYII="},"tessa":{"1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACK0lEQVR42u2bvU/CQBiHr4bEoRrBAT8SMMZFXTTGQcMfwOxsXNTFj9nJ0cHBUTcdHd1ccCc4GMIkLsQIiSgD4kcHExOcqO/VO7jSHlj5PQtHW470lzcPx3tgMI3sTK/WNw52heeuDi/scdwca/s9Vi63la/Np3L2+Gz/WHjNyd25oSuPPgY6RqiXbnYmOW+Pj5KnSpUeqLDpDco0gsoW+Lcxjg3wjm3HuV48rcJybFl4PFPKCI8nRhYaj3XZnEWrbI9LH2XXnoezOwjCRtg94mzq5obHwO/PGTqmnk8/Z6XrdlQ21tneEa068qmcvbZe39zizu3NrcHZ/6qyqaPhae8I8qujsuFs/d8gsc7ulcp29jmAv9B8Udlwtv90Yh0NZ/+lyqZ9WR09Z7obwtrYO3SuKpwVKpu/W9CeN2N83xuVDY0gbODV2blqnjvw/mUJfUPXi25c7uyu+Y3u+d3uR9L8GGOs8FZEZUMjCBv4hZGIyn8nQYn0D0nPTZjjLd0eX5yyx2Y8zL0+PBsVzju6NOn6hp6u74XHa7cV7rlVrP3496bQ0sWMMfZgPQrnfvl8RWVDIwgbBMbZlGHF62QMhkzfbs655nVLVdHFcDY0grABwkbYAGEjbICwETbCBgg7sITSlSz3Hz7VXglQg+aLyoZGEDbw+1esToeruDzisYcdFGR9a1lmqGxoBGEDnzF0Tk4938zrdN9S1x5ks/1E6mJV/6KyoRGAsLvAN91SpVOfH/03AAAAAElFTkSuQmCC","2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACTUlEQVR42u2cPU/CQBzG/yUkhiARHFBMwBgXddEQBwkfwMXF2bioiy+zkx/B0ZcF3ZxdXPgABBMNYRIXYoRElAFRJMTEBCfOo95BKW0p8DwL1+tL2idPf1z/V1DIJO3PbdTVfcd3Men2Lo9LUffVKrW6bPvrtTMiIlq/2dN8Tpl4mrUvjk6E25w+XilmeeIgyDI57XIirVJslOZXl1h7mw6a1smSjmQPcrLV/A2OBlg75A7Y8sIiwYiwP5lPCvujE+HGp/QOy1ULrJ3/KnTMeYddTdG6vp8EjMDsIWA2z+YGw6xCyWXs/F//1s6urcziv5/4Ns/5xFtKOm5HsodxnG20RKOOTDzNniLVd83h4iaYPVDJ7hWn7c5nvRJ4WEeywWzrHpYwzh70ZPN1jl7LihGB1eL9RbLB7MG8a5BsK5PN12VldQCjxM8BGrWf3mOaJb7mTdRc90aygRGYDXXL7HQpwxYqP1Uha9Rjcb0811v/EO3XGF30qqYim4/kPSQiyn7mkGxgBGZDRkmJ+sNt30TyjYxJ1027pzS9TxJanmVtd8jL2t4Fv/C4kyszui7o9fZJ2F9+KDYtV3PlP/7eZ9uymIjoufoiPPb79weSDYzAbKgvmM1rXON2MnmcbkMvTj3m7VQljSwGs4ERmA3BbJgNwWyYDcFsmA2zIZjdt3Imiin2mw8tdRKoM/H+ItnACMyGjHyLlecLr1Ys93VZw+4nyerWMt+QbGAEZkMGy7T/Q1JzXsZ2ft7SzDnIVvOJPIu18hfJBkYgmN0D/QJzwK/Pj4WAFwAAAABJRU5ErkJggg==","3":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACNUlEQVR42u2bPU/CQBjHr4bEoRrBAcUEjHFRF41xkPABXFycjYu6+DI7+REc1UlHZxcXPgDBREOYrAsxQiLKgPjSwcQEJ86n5Q5auAKF/2/xaOmZ/vPkx/U50JiHHMxtVmvjk7uLuvPX6+dN59i42W94nei8DCOZ5ePL41Phe84erzSv8hhioGMEBulm59eW+HiHHVrOySodld3vlU39Gx2J8OMxPdKTNxaPxoXH04W08HhiYrn2tyqbM28W+bjwXXTteVR2B0HYCHsAnE29XHMYYMLPJzqmnk+9ZaTr9q4u/dw8kGCd3cOIVh1GMsufIrd39yznjha34Oy+qmx4Wi2CDKuobDjb+yfIgQ3bSSCyx2tfVjbtcwD10HzhbDhbPZ1YR/sq7F4IxNOwaV9W1gdQAd3/U3ldq/N6Be15M2bte8PZDC1WhA3adHa2bPAXX7+m0DUq9h3tXbZ2rqMfpK3Oq9LNNCuaIWOM5T7zqGxoBGEDVWiJsPx7EpTQ8Jjw+LQ+JfR63Z7dyiwf67EgHwcXwtL/Obk64/qGXm+fhMcrDyXLazNf+ffvfa6pixlj7Nl8Ec79/vOByoZGEDbwhbMp4w7e04zRgK7s5uxrXreUHboYzoZGEDZA2AgbIGyEDRA2wkbYAGH7lkCqlOG/+XDaJwHOofmisqERhA1UfrGS+sWOzOchBT1svyDrWzfKDZUNjSBsoBDNy8mp52Vut+9berUH2Wg/kbrYqX9R2dAIQNhd4A9TwqmIEtZGRQAAAABJRU5ErkJggg==","4":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACSUlEQVR42u2bvU/CUBTFL4bEAY3ggB8JGOOCLhqjicgf4OLiTFyURdHN+Bc4uBt1MW6OxsVFd8TBECZhIUZIRBkUPzqYmOAk3lf72oKvIHjO9F5bXtqTkx+Pe4uLHFQ8FK0sb60ZnjvfPq6Og56ButYPrc/+OJbduTD9zMLpqjDfmI4J893skcspPzoIapjc7f6A+iQTEWXO0u1p9ujchCVGVK5thZGWSHY8FK18jQNdImPrYW69nFatSN+kfl6RXZvXitVx4a1YM+fBbDDbOUYvxVaq483xxYbeG5LdzGRzNut59t/Fv2f4mHM+8ZCS7tuRbDBbjcKB8J+6HyS7kcnmjAan1e/biaiCZIPZapUsJE332WB2OydbX+eA1Ir7i2SD2er21slCUijFHh7sN61OgmQ3Mtm8LutEzVnWFTGqztlJKk9gszouZuI1byKx7o1kg9nqdDK/R1Ydeeyz2zHZ6ceMcOD1QzPkDd8v1sJyJ3+x1bO2qvuR9SO5f0REuZc8kg2MwGxIlVwRv/w9CS5fZ4/03JBn0JLtwamR6tgT9Aqf9475Ddftnxmu+YHuL28Mj5evS8Jcy5e/+XuVs2QxEdGtdme49tP7M5INjMBsqGWYzdVr8zqZut0eZQ+n3/PWqkebLAazgRGYDcFsmA3BbJgNwWyYDbMhmN2ycidKKeE/fHZrJZA9cX+RbGAEZkOq34jSM9wOy32/rGG3imR1a5lnSDYwArMhxXI5uTjnvBnXed/SqR6kWT+Rs9guf5FsYASC2U3QJ80Tr6jwYWZjAAAAAElFTkSuQmCC","5":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACTklEQVR42u2bPU/CQBzGW0PiUI3ggGICxrigi4ZoIvIBXFycjYthUeNm/BRuRl2Im7OLix8AMdEQJmEhRkhEGRBfOpiY4HYeR68t5a4t+DzT9e3aPnn49fq/oiqStBffbLHrju4y3P0v10871m1c7Zqegz0mvr/asU/p+Ma0D/YcB8vptuWT0oUqypMhBXJNAb9ciFWKZZ6neF34X2aL0NzaYtcY8V2yWf5GRyKkHdMiA/VTT00k2GVy7xW9RtZXv2pdc91zZiejyZ62g9k+khWjt9M7pH24sCX1WjAa8SrZNJtZdslGyXnmrGM9nTo/iH4+0W2a64qiKNnXvCHPkWww25uHsWwh2W4m2ytO+53PAsfqLSQbzJarXDVnOs4Gswcp2XSdw2vJfoPzQrS/SDaYLW9snavm2kqx9Jur7DoJku1msum6LK8OIEpOZ0TsHufWjIuVeHVvJBvMlic7M/IYZw9CsguNIln4/NENWcOOxZ3y3OnbGu84dsTgpH+n18TjMutj+aOCZCsoscJsSJDUVDjRstopNDzG3TatTdn6niS2NEvaWixI2sH5sGG/kyszjm7o5faRu635UCdtvdL84+992RaPn/Rnw37fvt+RbGAEZkN9wWxa4zb342k0oAm/QXrM60QNGzwGs4ERmA3BbJgNwWyYDcFsmA2zIZjdtwpk63nynw87dRKoO9H+ItnACMyGRH4RRfOFlhnLQz3WsPtJvLo1zzckGxiB2ZBgqbI6ZjnPYzs9byl7DpI3n8iy2C6DkWxgBILZLusX/JW5tc6NkdgAAAAASUVORK5CYII=","6":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACPUlEQVR42u2bO0/CUBiGqWniUI3ggGICxrigi8ZoIvIDXFycjYthUeNm/BVuRl2Im7OLiz8Aa6IhTMJCjJCIMiBeOpiY4ETztfRyWnqjvs90TqGFvvl4Wr4DXMRF9tNbne74+D7f8/jVxpnpMTav9zS3q/dNH6z1PKdycmvp2IcrOcX8tHLJOZnHUAR4Bv+fTlbrU1K+KSFsq8ytL1rWSGArm/o3OZKQt6eERGgqPzuxpJ536LwmNRSP178blvwOZ8PZ3jh6J7crj48Wtl1/P6hsvyqbelntL9B7faJz6vfCW1HT5XzQPuZwdgjIJDO+vwc428vKhqddv1/voLLhbPcQ66LhfXbow2a5aHVDCkVl0z4HcB6aL5wNZ7ujKbEuKlqxF/lzT/skgQrbi2aQr5VNe7JGfYB+sbsiwrqflysuZtC+N80Xzoaz3YFlRT6C3khIKrvUKsuTr19J0zVOrDva/bamt5/6Ymrn+P1+g9RzM82x+llDZUfQYkXYwCG4bFz52wg9YsNjmtunhSlNr6vdnlqelcdCKiqPo/Nx3decXJ2xdVKvd0+a29uPTXks1dpK/z5UTV38LL3ovub7zwcqGxpB2CDwzqaMMzzHjFFecPQE6T2vHVoMLoazoRGEDRA2wgYIG2EDhI2wETZA2AMLX2gW5f98sPZJADs0X1Q2NIKwgZO/iKJ+UaPn85gDPexBwahnbZQdKhsaQdjAITg3D049r+d29bqlm2uQRuuJ1Mcs/kVlQyMAYfvAH+nott+cLz05AAAAAElFTkSuQmCC"},"mai":{"1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACK0lEQVR42u2bvU4CQRSF7xoMmiyJ+FMQQWosTCxMNDY2Gq30DTQ+h7Gw8AF8Au1saW20MRYURgupjFnBYIKIkU3UWKwVy8w6u8z+DLhyTsNkdhmYk5OPyx3QSKHmVqatg+NL4bWjvXV7PJXTA7/G6WFJ+t6iYdjj/Z1l4T23F0+aKj+GCOqZEoO02c18vjM+r0olPVZmsxvkMIJke/O3PZ7MprhrQZgbhtMympjPCOcb1zXhfGEp03603NasV0x7/FJt+eY8mN1DwWyYPSDMZtnc5hj0+3OGHbOcL1/VXOt2JBt1dniJqo6iYdi19e7WIndtdSMLZv+rZLOMBqfDS+CfhWSD2eq/QaLOHpRkO/scULRi/UWywezo1Ys6Gsz+S8lm+7Iqes7saQgFODt0VhXOhLqt3y+xPW8ivu+NZAMjMBsKy+yHmwY38WF+C3nD1ot+WO7srkUt1ev7PY9k/SMier5/R7KBEZgNRSUtlR6xZG7U00n3enxG78r2wkKuM6/nuOdnx2aF664Vtn1v6Kx8Ipyvvt3xzDUr9rhcqnRlMRFR/dEUrm02v5BsYARmQ7FhNnffeDLUGxrVhyPbnLPm9SvzVY7FYDYwArMhmA2zIZgNsyGYDbNhNgSzY6tEq/nJ/YdPtlcCyYn1F8kGRmA2FPWvWJ0MJ8F/Qyhgrzvucutbe3iGZAMjMBuKUprKxdma3Yvr7LmlqjNIr/NElsWy/EWygREIZvdBP1dXofJFzmFsAAAAAElFTkSuQmCC","2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACRUlEQVR42u2csU/CQBjFvxoMmpREVAYiyIyDiQOJxsVFEycd3TT+GQ6O/hlGN0dZXXQxmjAYHGQypoLBBBEjTdQ41IlyrXdQyrWU8t7icS1N+/L64+O7okIeaXFtzrDPFS8rwv0VRVHsc4ZhGKL9dw5yRER0dlRwfE55TTPHh3ur3H3ur14UrzwZI8g3RYJyIp1SLEtbmUz7xcm1ZZso6Uh2mJNt5+9sKmaOE2k1kBc2s5Tkztfvqtz57Eqy9Vd4h9XKujl+qzR75vxYUE1xun2YBIzA7BFgNsvmFsP8Qsnx+e2/+f3t5UCZxX4+sWOW86WbqrBuR7JHsc6WLV7Vkdc081uk/a5Z30yB2aFK9qA4HXQ+uxXHQwPJBrP9+7KEOjvsyWb7HIOWHxWB32L9RbLB7HDeNUi2n8lm+7KiPoAssWuAst7n9pheie15E1n73kg2MAKzoX6Z/VSsmy++9F8ua+y1uFueu+1/8N7Xqi4G1VMRrUeyHhIRvT5+ItnACMyGZEmJxSe6PomkxqPCbYl51dHzJNlcur1NbY9TUwvc425kd11d0EXplDtf+XiwMlcvm+NSodyVxUREtWede2y98YNkAyMwGxoKZlv2m472dTKT6rjUi7PXvL1Kf3fGYjAbGIHZEMyG2RDMhtkQzIbZMBuC2UOrSLPxbf7mw0mfBOpNrL9INjACsyGZT7GyfCHB70LIZa87DBL1rTv4hmQDIzAbkinP/h+SvWYXsZ1dt/RyDbLTeiLLYqf8RbKBEQhmD0B/9uWsQZstkDEAAAAASUVORK5CYII=","3":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACLklEQVR42u2bP08CMRjGewaDJkci/hmIIDMOJg4kGhcXTZx0dNP4MRwc/Ry6ubK66GIcGAwOMhlzAsEEESOXqHE4J8p70MIdtMDB81so7V2hT9489/YtGEwja9vLTqOduym2jR+eprvOcXWe7XifaFxGxrJ4++x4S3jN423J0KXHFAMDIzRJi91PJptvLu5cY7JIR2SPe2RT/12MR3j/UsIcyYUtrMeE/dWHsrA/tRlrvDqyOSsFm7ffi3XfPo/IHiAQG2JPgGdTX254GGDC5xNtU5/P35eleftQUz8/GxLk2SOMKOvIWBbfRZ4cbLjGdvbi8Oyximz4tFoEGjqIbHi2/h3kxIrtRRDZ9jqQkU3rHEA9VF94NjxbPYPIowMl9igIolVsWpeV1QFUQM//VN7X67y6oDVvxtx1b3g2Q4kVYoM+PfslV+Vvvu0/odeoOHdsrbL1cx99kPY6r0pvplpRDRlj7O35C5ENG4HYQBVGJDrjeLnQjIbF+fiKKfT1tnO6dKLZbzbb8blV6Wfupo58L+g6fynsL34+uT3XLvB2Plvo6sWMMVZ5tYVz27VfRDZsBGKDQHi265r5cN9faNacVra41pzXL/aHNy+GZ8NGIDaA2BAbQGyIDSA2xIbYAGIHllC99sP/8+G1TgK8Q/VFZMNGIDZQ+cNK6i8CnF7r3OOCrG7dRTdENmwEYgNVGDonp3m7zNtbzy11nUF2Ok+kXuzVfxHZsBEAsYfAP+2rp0M8ktE1AAAAAElFTkSuQmCC","4":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACSUlEQVR42u2bPU/CUBiFXwwGTUoifgwGkBkHjAOJbjhodNLBQScTF/+DcXLwB7i5GJ1wcNDVycVowkB0kMkYBIMJIkaaqHGok/XeeltKvS1Sz5luv27ak8PDy3tpgFxUKhPVNvfOhMe2N2b18VBccTT/8trhj33ZnUXLaw62ctz22FSM2746vQ+45UcXQZ4p6PcHNCaZiOi4WPSn2fOJhBgjLs2d9UOyU5mo9jUejIW5Y06Y65TTspWcHDZua2bnVkuqPn4sN1rmPJgNZrvH6NWFCX08PRfz9N6Q7HYmm2WzkWf/Xez3DDtmOV84r5jW7Ug2mC1HA+N/65OJZHuZbJbR4LT8up2INCQbzJarWr5iWWeD2X5OtrHPAckV6y+SDWbLq61r+QrXit09umhbnwTJ9jLZbF/WjZ6z2aqIqDtnJ6lsAtu14mIltudNxPe9kWwwW56W1tPUbEUedbYfk317WeN2vKofQt6w9WIrLHfzF5uTuWXdj9l6JOsfEdHDzQuSDYzAbEiWAuFIj2bnRCUSMq/HR5SmbE+m49/7lTh3faxvVDjvTHKl5Qc6KewL95efr3nmqiV9XMiVmrKYiKh6pwrnVuvvSDYwArOhjmE2d15/6Fc31Kt0S3s4Y83bqtQneywGs4ERmA3BbJgNwWyYDcFsmA2zIZjdsQo26m/cO3x2eyWQPbH+ItnACMyGZP8jyshwErwbQg573Z0us761hWdINjACsyGZCrg5OVuzW3GdXbd0aw3Saj2RZbFd/iLZwAgEs9ugTzu6q1hoJCyFAAAAAElFTkSuQmCC","5":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACS0lEQVR42u2bv0/CQBzFW4NBk5KIykAsMuOgcSDRTQdNnHRw0MnExf/BP8D/wcXESQcHXV1004SB4CATMQgGE0SMNFHjULdyXHttKXdtqe9N11/X9uXx6fV7RZYEaX5lRqfXlW7qzP13DvOmdedHBdtz0MfsHlyY9jk73rbtgz7Hwqras/xw+yLz8mREgnxTLCwX4pRikee5qlb/l9k8tJnNmjEybMmm+TutJox2KqNE6qeeW07Ty8a9N2uasf6t3umb64Eze2oxPdB2MDtEcmL0/taS0V7bUIVeC0YjQSWbZDPNLtEoObm8N60nUxcGkc8nsk1yXZIkqXzXsOQ5kg1mB/MwFi0k289kB8XpsPOZ41hdR7LBbLFqFRu242wwO0rJJuscQUv0G1wQIv1FssFscWPrVrHRU4ol31xF10mQbD+TTdZlWXUAXvI6I+L2OL9mXJzEqnsj2WC2OLmZkcc4OwrJfiq1jIUv7deSNfRY3CvPvb6tsY6jRwxe+vd6TSwu0z6+Vj6RbAklVpgNcZKcSI7pTjspyThzW2pWcfU9SS6f6W5Tum11Ys6y3/Xcnqcbui6fMrfVPx67zNVqRrtcqLnicfNZs+xXa/8g2cAIzIaGgtk9+03GB7qYcWWU+w2SY14v0t6deQxmAyMwG4LZMBuC2TAbgtkwG2ZDMHtoFeu0v43/fLipk0D9ifQXyQZGYDbE84soki+U9EFr3VEQq25t4xuSDYzAbIinZFEd02N2FtvJeUvRc5Cs+USaxW4ZjGQDIxDM9ll/Y1y1pnt4/3IAAAAASUVORK5CYII=","6":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFsAAAA4CAYAAACSVoRtAAACO0lEQVR42u2bPUvDUBSGE6lUIQXrxyCmdq6D4lDQTQcFJx0cdBJc/A/+AP+Di+Ckg4OuLropdCh1sJNIbaVCrRUb0OIQp6Yn37dpbtLG951yb25ukpeTJzfntKLAUfMrM2p7u3BTMe3fOcy6znF+lLPsNx67e3BhGnN2vN3V3Aursq79cPsq+unHkAAFpth/ulmrp+SqVILZ3WoznTZjZFAjm/J3Uk5o/VMpKTKRn1meNrZV2q6VFd3+90qzK76D2WB2MIze31rSttc2ZO7Xg8gOK7Ipl438gszvJ9qmfC/eVS1ZHuu3xxzMjoAmFsN/UsHsICMbnOa+XlcR2WA2P9XzVcd1duTNZnlptU2KRGTTPAfkv6i/YDaYzQdT9XxVl4o9ubwPNE/SV2YHkQwKNbJpTtYpD9CrvFZEWI8LsuLiJpr3pv6C2WA2H7FU5AXkRiIS2c+Futb4Vn4tWeNH3dHr15rdccaXqZf5e/2CtGMz9fHt6QuRLSDFCrMhnyQmkiMqy0ApGbdej89Kllw31eiyqU6/1NmWx+Zsz7me2fN0U9fFU8v+yudjh7dKWbevmCu7srj2otieU2m0ENnACMyG+p7ZujHj8Z4vaFQa9vUG6ZrXi5SPFts4MBsYgdkQzIbZEMyG2RDMhtkwG4LZg6hYs/Gj/eeDNU8CsYv6i8gGRmA25OcvoihfLKR6zXNHRU45axfvENnACMyG/JDIc3K6brdju7FuybMG6VRPpDxm4S8iGxiBYHYI+gOMFrOruAzkSgAAAABJRU5ErkJggg=="}};

  var LANG = 'en';
  var NAMES = {
    en: ['Leo', 'Kenji', 'Tessa', 'Mai-Ling'],
    ja: ['Leo (レオ)', 'Mukuro (ムクロ)',
         'Tabasa (タバサ)', 'Tao (タオ)']
  };
  var S = {
    en: {
      'how.r.tally': '{n} of the 216 variations are accepted.',
      'how.r.h.gives': 'gives',
      'how.r.h.3sym': '3rd symbol',
      'how.r.h.give': '2nd symbol',
      'how.r.g.pick': '{d} gives {what}',
      'how.r.g.none': 'nothing',
      'how.r.h.1st': '1st symbol',
      'how.r.h.lvl': 'level',
      'how.r.h.pts': 'points',
      'how.r.h.3rd': '3rd must be',
      'how.r.any': 'any',
      'how.r.leo': 'Leo\u2019s 3rd symbol has its own thresholds: the Legendary Sword wants level 32 and 5000 points, the Shield wants level 30 and 3000. It\u2019s the only place where failing a requirement takes back what you were already given.',
      'how.r.kenji': 'Kenji\u2019s 3rd symbol never gives anything. Every row wants one exact value and nothing else will do, so his are the tightest of the 4.',
      'how.r.tessa': 'Same shape as Kenji, just without the exact 3rd symbol. Hers grants the Sun Staff instead, at level 30 and 3000 points.',
      'how.r.mai': 'Mai-Ling has no requirement table behind this. Her rules are written out in full instead of looked up, so a 3rd symbol that gets part of the way there fails instead of just granting nothing.',
      'how.ex.lv': 'Here is one of Leo\u2019s passwords. For him the level symbols are the 1st and the 7th. Both of them are 4, so the byte is 44, and if you look at the table above, 44 is the very last entry in it, which is level 32.',
      'how.ex.vs': 'Same password. Leo\u2019s VS symbols are the 2nd to the 6th: 14444. The 1st of them is 1, so that is the marker and 4444 is the number. Each symbol counts as one less, so 4444 becomes 3333, and 3333 in base 6 is 777. The marker is 1, so multiply by 10 and you get 7770 points.',
      'how.ex.var': 'Same password one more time. The last 3 symbols are Leo\u2019s variation: 113, which for him is the Legendary Sword and the Legendary Shield. Those same 3 fail for Kenji. For Mai-Ling the whole password fails. Tessa takes it, but reads it as level 5 with no points at all. Same 10 symbols, 4 different answers.',
      'how.rom.lv': 'levels {a}\u2013{b}',
      'how.b3t': 'As an example:',
      'how.b3b.i1': 'If it\u2019s 4 or 5, then the 2nd symbol has to be 4 or 5 too, which makes your VS points 0. The last 3 symbols do not matter, because the game does not read them.',
      'how.b3b.i2': 'If it\u2019s 6, then the 2nd symbol is the marker, and the last 3 symbols are the number.',
      'how.b3b.i3': 'If it\u2019s 1, 2 or 3, then that symbol is the marker itself, and the last 4 symbols are the number.',
      'how.b3b3': 'Then the marker tells you what to do with it. 1 means multiply by 10, 2 means leave it as it is, and 3 means divide by 10.',
      'how.b3b2': 'The number is written in base 6 (because 6 buttons is all you have to write with lol). And each symbol counts as one less than it looks: 1 is 0, 6 is 5. Written like that, the number always comes out between 100 and 999.',
      'how.ex.zero': 'A different password this time, because the one above has points. This is Leo at level 32 with 0 VS points. His VS symbols are 54465, so the 54 is one of those 4 openings, and the 465 after it is never read.',
      'how.b3z2': 'Which means if your VS points are 0, the game can show you a different password every time it shows you one: on the continue screen when you die, or at the end of an arcade run. Any other amount is written the same way every time, for every character and every level.',
      'how.b3d2': 'The 1st symbol picks which rule is used, and the other 2 symbols get checked against it. A rule can ask for a level and VS points too: Leo\u2019s Legendary Sword needs level 32 and 5000 points, and his shield needs level 30 and 3000.',
      'how.b3d3': 'All 4 characters work differently here, because each one was written by hand. Kenji and Tessa use a table of requirements that the 1st symbol looks up. Leo is a chain of cases instead, and his 3rd symbol is the only place where failing takes back something you were already given. Mai-Ling does not even have a weapon list. Only 1 combination grants her anything, and the rest of her rules are just there to turn away near misses.',
      'brand.name': 'Red Earth', 'brand.what': 'Password Generator',
      'brand.lang': 'en',
      'brand.also': '\u30a6\u30a9\u30fc\u30b6\u30fc\u30c9 (War-Zard)', 'brand.also.lang': 'ja',
      'nav.how': 'How it works',
      'how.s1': '10 symbols, 3 groups',
      'how.b1': 'Red Earth passwords are combinations of 10 symbols, and they carry 3 things:',
      'how.b1a': 'The level you were on.',
      'how.b1b': 'Your VS points.',
      'how.b1c': '3 numbers that decide which extras you get.',
      'how.s2': 'Every character shuffles them differently',
      'how.b2': '2 symbols hold the level (A), 5 symbols hold the VS points (B), and 3 symbols hold the variation (C). Every character uses the same amounts, but not the same order. Here is how each one shuffles them:',
      'how.b2b': 'That order is the only thing tying a password to a character. Funny enough, now and then 2 characters both accept the same 10 symbols, but will have completely different results for level, VS points and variation.',
      'how.s3': 'The level',
      'how.b3': 'The 2 level symbols are the 2 halves of 1 byte. The game then goes through 32 values one by one looking for that byte, and wherever it finds it, that is your level. The 1st value is level 1, the 32nd is level 32, of course. If your byte is not in there at all, the password just fails.',
      'how.s3b': 'The VS points',
      'how.b3b': 'The 5 VS symbols hold a number, plus a marker that tells the game what to do with that number. Which symbol is which depends on the 1st one:',
      'how.b3c': 'So the 5 symbols are not your points written out. If you read Leo\u2019s 14444 as a normal number you would get 14444 points, but it\u2019s actually 7770.',
      'how.s3z': 'A password with no VS points',
      'how.b3z': 'When you have 0 VS points, the game does not encode a number at all. It just writes 2 symbols where each one is either 4 or 5, so you can end up with 44, 45, 54 or 55. The 3 symbols after that are random and never read, and there are 6 x 6 x 6 = 216 ways to write them. So 4 openings times 216 endings gives you 864 passwords that all mean 0, and the game reads every single one of them back as 0.',
      'how.s3d': 'The 3 that decide the extras',
      'how.b3d': '3 symbols gives you 216 combinations, and funny enough, most of them grant nothing.',
      'how.s5': 'The special passwords are never decoded',
      'how.b5': 'A password that has {start} Start or {down} Down with Start in it cannot be read this way at all, because neither of those ever shows up in any of the 3 groups. So the game does not take it apart. It just compares all 10 symbols against a short list, and that is how those 4 can do things the normal maths cannot.',
      'how.foot': 'All of this was read straight out of the game\u2019s own code.',
      'seo.gen.t': 'Get a password',
      'seo.gen.d': 'Red Earth / War-Zard password generator. Customize your character easily and see what any password does.',
      'seo.dec.t': 'Analyze a password',
      'seo.dec.d': 'Type in 10 symbols and see what a Red Earth password actually gives you: whose it is, the level, the VS points and every extra.',
      'seo.codes.t': 'Special passwords',
      'seo.codes.d': 'The 4 Red Earth passwords the game never decodes: Power Fight Mode, Ultimate Battle Mode, the staff roll, and the one that locks you at level 1.',
      'seo.how.t': 'How the password system works',
      'seo.how.d': 'How the 10 symbols actually work: a level, VS points, and 3 numbers that decide the extras, shuffled differently for every character. All read out of the game\u2019s own code.',
      'seo.suffix': 'Red Earth Password Generator',
      'nav.gen': 'Get a password', 'nav.dec': 'Analyze a password', 'nav.codes': 'Special passwords',
      'gen.s1': 'Select your warrior', 'gen.s2': 'Pick what you want',
      'gen.s3': 'Enter this at the password screen',
      'gen.tab': 'Customize', 'gen.shut': 'Close',
      'roll.tab': 'Randomize',
      'roll.sub': 'Roll a random password.',
      'roll.level': 'Level range',
      'roll.vs': 'VS points range',
      'roll.seed': 'Seed, if you want the same roll twice',
      'roll.chars': 'Characters',
      'roll.rules': 'Rules',
      'roll.must': 'Only passwords that grant something',
      'roll.noleg': 'No legendary gear',
      'roll.keep': 'Keep the level and points I have',
      'roll.go': 'Roll',
      'roll.none': 'Nothing matches those rules. Widen the ranges, or untick the grant rule.',
      'gen.tune': 'Pick a different level, VS points or extras.',
      'lbl.level': 'Level', 'lbl.vs': 'VS points',
      'dec.s1': 'Whose password it is', 'dec.s2': 'Type the 10 symbols',
      'dec.waiting': 'Waiting for 10 symbols.',
      'dec.nobody': 'No character accepts this password.',
      'sp.locked': 'Level locked at 1, score held at zero',
      'sp.locked.d': 'The character cannot level up past 1, and the score stays at zero however many coins are picked up.',
      'sp.power': 'Power Fight Mode',
      'sp.power.d': 'Enemies deal 1.5\u00d7 damage.',
      'sp.ultimate': 'Ultimate Battle Mode',
      'sp.ultimate.d': 'Harder enemy patterns.',
      'sp.credits': 'Jump to the staff roll',
      'sp.credits.d': 'Skips straight to the credits.',
      'codes.s1': 'Select your warrior',
      'codes.s2': 'Enter one of these instead of a normal password',
      'preset.best': 'Best password',
      'preset.leo0': 'Best: Legendary Sword and Shield',
      'preset.leo1': 'Best without the Legendary Sword',
      'preset.kenji0': 'Best: everything he can carry',
      'preset.kenji1': 'Best without Rasetsu-Jin',
      'note.leo0': 'Leo plays best with his legendary items. They are so good that you do not need any other weapon.',
      'note.leo1': 'Drops the Legendary Sword, which some tournaments ban.',
      'note.kenji0': 'Level 32 with all 3 of his extras.',
      'note.kenji1': 'Drops Rasetsu-Jin. Some players rate it as a weak move.',
      'note.other': 'Level 32 with everything this character can carry, on the VS points that type easiest.',
      'out.none': 'No password can carry exactly that.',
      'out.untick': 'Untick something. The game cannot combine every extra, and {n} combinations work here.',
      'out.same': '{n} different passwords give this exact result',
      'out.easiest': 'easiest to enter',
      'out.only': 'Only this password gives this result.',
      'toggle.combo': 'Not alongside what is already ticked. Untick one to reach this.',
      'toggle.blocked': 'Cannot be added to what is ticked: {what}. Untick one to swap.',
      'toggle.level': 'Not at this level or with these VS points.',
      'out.nothing': 'Nothing at all is accepted at this level with these VS points.',
      'out.adjusted': 'Adjusted: ',
      'out.reach': '{x} {v} out of reach at level {lv} with {vs} VS points.',
      'out.is': 'is', 'out.are': 'are', 'out.and': ' and ',
      'carry.plus': 'plus ', 'carry.none': 'Nothing beyond the level itself.',
      'all.sum': 'Every combination here ({n})', 'all.nothing': 'nothing extra',
      'at.level': 'At level {lv}: ', 'gear.none': 'no gear is recorded for this character',
      'at.gained': 'Gained here: ',
      'at.nothing': 'nothing recorded for this level',
      'at.announced': 'The game tells you it gives {said} here, but the message is wrong and the line above is what you get.',
      'at.power': 'Power: ',
      'at.nopower': 'no increases yet',
      'at.resist': 'Resistance: ',
      'at.noresist': 'none yet',
      'at.attack': 'Attack',
      'at.defence': 'Defence',
      'el.fire': 'Fire', 'el.ice': 'Ice', 'el.lightning': 'Lightning',
      'el.poison': 'Poison', 'el.wind': 'Wind',
      'at.moves': 'Moves: ',
      'at.nomoves': 'none recorded yet',
      'dec.reading': 'Reading as {who}.', 'dec.try': 'Try',
      'dec.example': '{pw} as {who}',
      'dec.only': 'Only 1-6, Y and M are symbols.',
      'key.y': 'press Start',
      'key.m': 'hold Down and press Start',
      'dec.ten': '10 symbols; that is {n}.',
      'dec.notmine': 'Not a password {who} accepts.',
      'dec.why': 'Why',
      'dec.specialwhy': 'It holds Start or Down+Start, so it can only be a special password, and it\u2019s none of {who}\u2019s 4.',
      'dec.rejected': 'Rejected as {who}.', 'dec.accepted': 'Accepted as {who}.',
      'lbl.character': 'Character', 'lbl.effect': 'Effect',
      'lbl.gear': 'Gear', 'lbl.extras': 'Extras', 'lbl.none': 'none',
      'langnote': '',
      'cr.site': 'Site and password research: ',
      'cr.levels': 'Level table: '
    },
    ja: {
      'how.r.tally': '216\u901a\u308a\u306e\u3046\u3061{n}\u901a\u308a\u304c\u901a\u308a\u307e\u3059\u3002',
      'how.r.h.gives': '\u5f97\u308b\u3082\u306e',
      'how.r.h.3sym': '3\u756a\u76ee',
      'how.r.h.give': '2\u756a\u76ee',
      'how.r.g.pick': '{d} \u306a\u3089 {what}',
      'how.r.g.none': '\u306a\u3057',
      'how.r.h.1st': '1\u756a\u76ee',
      'how.r.h.lvl': '\u30ec\u30d9\u30eb',
      'how.r.h.pts': '\u30dd\u30a4\u30f3\u30c8',
      'how.r.h.3rd': '3\u756a\u76ee\u306f',
      'how.r.any': '\u4efb\u610f',
      'how.r.leo': '3\u756a\u76ee\u306f\u72ec\u81ea\u306e\u6761\u4ef6\u3092\u6301\u3061\u307e\u3059\u3002\u4f1d\u8aac\u306e\u5263\u306f\u30ec\u30d9\u30eb32\u30685000\u30dd\u30a4\u30f3\u30c8\u3001\u76fe\u306f\u30ec\u30d9\u30eb30\u30683000\u30dd\u30a4\u30f3\u30c8\u3002\u6761\u4ef6\u3092\u6e80\u305f\u305b\u306a\u3044\u3068\u3001\u3059\u3067\u306b\u4e0e\u3048\u305f\u3082\u306e\u3092\u53d6\u308a\u6d88\u3059\u552f\u4e00\u306e\u5834\u6240\u3067\u3059\u3002',
      'how.r.kenji': '\u30e0\u30af\u30ed\u306e3\u756a\u76ee\u306f\u4f55\u3082\u4e0e\u3048\u307e\u305b\u3093\u3002\u3069\u306e\u884c\u3082\u6b63\u78ba\u306a\u5024\u3092\u6307\u5b9a\u3057\u3001\u4ed6\u306e\u5024\u306f\u901a\u308a\u307e\u305b\u3093\u30024\u4eba\u306e\u4e2d\u3067\u6700\u3082\u53b3\u3057\u3044\u306e\u306f\u305d\u306e\u305f\u3081\u3067\u3059\u3002',
      'how.r.tessa': '\u30e0\u30af\u30ed\u3068\u540c\u3058\u5f62\u3067\u30013\u756a\u76ee\u306e\u6307\u5b9a\u3060\u3051\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u4ee3\u308f\u308a\u306b\u30ec\u30d9\u30eb30\u30683000\u30dd\u30a4\u30f3\u30c8\u3067\u592a\u967d\u306e\u6756\u3092\u4e0e\u3048\u307e\u3059\u3002',
      'how.r.mai': '\u30bf\u30aa\u306b\u306f\u3053\u306e\u88cf\u306b\u6761\u4ef6\u30c6\u30fc\u30d6\u30eb\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u898f\u5247\u306f\u8868\u3092\u5f15\u304f\u306e\u3067\u306f\u306a\u304f\u305d\u306e\u307e\u307e\u66f8\u304b\u308c\u3066\u304a\u308a\u30013\u756a\u76ee\u304c\u7279\u5b9a\u306e\u5024\u3092\u907f\u3051\u308b\u306e\u306f\u305d\u306e\u305f\u3081\u3067\u3059\u3002\u9014\u4e2d\u307e\u3067\u5408\u3063\u3066\u3044\u308b\u30d1\u30b9\u30ef\u30fc\u30c9\u306f\u3001\u4f55\u3082\u4e0e\u3048\u306a\u3044\u306e\u3067\u306f\u306a\u304f\u62d2\u5426\u3055\u308c\u307e\u3059\u3002',
      'how.ex.lv': '\u30ec\u30aa\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u306e\u4f8b\u3067\u3059\u3002\u30ec\u30aa\u306e\u30ec\u30d9\u30eb\u306e\u8a18\u53f7\u306f1\u756a\u76ee\u30687\u756a\u76ee\u3002\u3069\u3061\u3089\u30824\u306a\u306e\u3067\u30d0\u30a4\u30c8\u306f44\u300244\u306f\u4e0a\u306e\u8868\u306e\u6700\u5f8c\u306e\u9805\u76ee\u3067\u3059\u3002\u3064\u307e\u308a\u30ec\u30d9\u30eb32\u3002',
      'how.ex.vs': '\u540c\u3058\u30d1\u30b9\u30ef\u30fc\u30c9\u3067\u3059\u3002\u30ec\u30aa\u306eVS\u306e\u8a18\u53f7\u306f2\u756a\u76ee\u304b\u30896\u756a\u76ee\uff1a14444\u3002\u306f\u3058\u3081\u306e1\u304c\u5370\u3067\u30014444\u304c\u6570\u3067\u3059\u3002\u5404\u8a18\u53f7\u306f1\u5c0f\u3055\u3044\u306e\u30674444\u306f3333\u30016\u9032\u6570\u306e3333\u306f777\u3002\u5370\u304c1\u306a\u306e\u306710\u500d\u3057\u30667770\u30dd\u30a4\u30f3\u30c8\u3002',
      'how.ex.var': '\u307e\u305f\u540c\u3058\u30d1\u30b9\u30ef\u30fc\u30c9\u3067\u3059\u3002\u6700\u5f8c\u306e3\u500b\u304c\u30ec\u30aa\u306e\u30d0\u30ea\u30a8\u30fc\u30b7\u30e7\u30f3\uff1a113\u3002\u30ec\u30aa\u306b\u3068\u3063\u3066\u306f\u4f1d\u8aac\u306e\u5263\u3068\u4f1d\u8aac\u306e\u76fe\u3067\u3059\u3002\u30e0\u30af\u30ed\u306f\u3053\u306e3\u500b\u3092\u5f3e\u304d\u307e\u3059\u3002\u30bf\u30aa\u306f\u30d1\u30b9\u30ef\u30fc\u30c9\u81ea\u4f53\u3092\u5f3e\u304d\u307e\u3059\u3002\u30bf\u30d0\u30b5\u306f\u53d7\u3051\u53d6\u308a\u307e\u3059\u304c\u3001\u30ec\u30d9\u30eb5\u3001\u30dd\u30a4\u30f3\u30c80\u3068\u3057\u3066\u8aad\u307f\u307e\u3059\u300210\u500b\u306e\u8a18\u53f7\u306b\u3001\u56db\u3064\u306e\u7b54\u3048\u3002',
      'how.rom.lv': '\u30ec\u30d9\u30eb {a}\u2013{b}',
      'how.b3t': '\u4f8b\u3068\u3057\u3066\uff1a',
      'how.b3b.i1': '4\u304b5\u306a\u30892\u500b\u76ee\u30824\u304b5\u3067\u3001\u305d\u306e\u7d50\u679cVS\u30dd\u30a4\u30f3\u30c8\u306f0\u306b\u306a\u308a\u307e\u3059\u3002\u6b8b\u308a\u306e3\u500b\u306f\u4f55\u3067\u3082\u304b\u307e\u3044\u307e\u305b\u3093\u3002\u30b2\u30fc\u30e0\u304c\u8aad\u307e\u306a\u3044\u304b\u3089\u3067\u3059\u3002',
      'how.b3b.i2': '6\u306a\u3089\u30012\u500b\u76ee\u304c\u5370\u3067\u3001\u6b8b\u308a\u306e3\u500b\u304c\u6570\u3067\u3059\u3002',
      'how.b3b.i3': '1\u304b2\u304b3\u306a\u3089\u3001\u305d\u306e\u8a18\u53f7\u81ea\u4f53\u304c\u5370\u3067\u3001\u6b8b\u308a\u306e4\u500b\u304c\u6570\u3067\u3059\u3002',
      'how.b3b3': '\u5370\u306f\u305d\u306e\u6570\u3092\u3069\u3046\u6271\u3046\u304b\u3092\u793a\u3057\u307e\u3059\u30021\u306a\u308910\u500d\u30012\u306a\u3089\u305d\u306e\u307e\u307e\u30013\u306a\u308910\u3067\u5272\u308a\u307e\u3059\u3002',
      'how.b3b2': '\u6570\u306f6\u9032\u6570\u3067\u66f8\u304b\u308c\u307e\u3059\uff08\u66f8\u304f\u306e\u306b\u4f7f\u3048\u308b\u30dc\u30bf\u30f3\u304c6\u3064\u3057\u304b\u306a\u3044\u306e\u3067\uff09\u3002\u5404\u8a18\u53f7\u306f\u898b\u305f\u76ee\u3088\u308a1\u5c0f\u3055\u3044\u5024\u3092\u8868\u3057\u30011\u306f0\u30016\u306f5\u3067\u3059\u3002\u3053\u3046\u66f8\u304f\u3068\u3001\u6570\u306f\u5fc5\u305a100\u304b\u3089999\u306e\u9593\u306b\u306a\u308a\u307e\u3059\u3002',
      'how.ex.zero': '\u4e0a\u306e\u3082\u306e\u306f\u5f97\u70b9\u304c\u3042\u308b\u306e\u3067\u3001\u5225\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u3067\u3059\u3002\u540c\u3058\u304f\u30ec\u30aa\u3001\u30ec\u30d9\u30eb32\u3001VS\u30dd\u30a4\u30f3\u30c8\u306f0\u3002VS\u306e\u8a18\u53f7\u306f54465\u3067\u3001\u306f\u3058\u3081\u306e54\u306f\u305d\u306e4\u901a\u308a\u306e\u3072\u3068\u3064\u3002\u7d9a\u304f465\u306f\u4e00\u5207\u8aad\u307e\u308c\u307e\u305b\u3093\u3002',
      'how.b3z2': 'VS\u30dd\u30a4\u30f3\u30c8\u304c0\u306a\u3089\u3001\u30b2\u30fc\u30e0\u304c\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u898b\u305b\u308b\u305f\u3073\u306b\u9055\u3046\u3082\u306e\u306b\u306a\u308a\u5f97\u307e\u3059\u3002\u898b\u305b\u308b\u306e\u306f\u3001\u3084\u3089\u308c\u3066\u30b3\u30f3\u30c6\u30cb\u30e5\u30fc\u753b\u9762\u304c\u51fa\u305f\u3068\u304d\u3068\u3001\u30a2\u30fc\u30b1\u30fc\u30c9\u3092\u6700\u5f8c\u307e\u3067\u3084\u308a\u7d42\u3048\u305f\u3068\u304d\u3067\u3059\u3002\u4ed6\u306e\u5408\u8a08\u306f\u3001\u3069\u306e\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u3067\u3082\u3069\u306e\u30ec\u30d9\u30eb\u3067\u3082\u3001\u6bce\u56de\u540c\u3058\u66f8\u304d\u65b9\u3067\u3059\u3002',
      'how.b3d2': '1\u500b\u76ee\u304c\u898f\u5247\u3092\u9078\u3073\u307e\u3059\u3002\u6b8b\u308a\u306e2\u500b\u304c\u305d\u306e\u898f\u5247\u3067\u8abf\u3079\u3089\u308c\u307e\u3059\u3002\u898f\u5247\u306f\u30ec\u30d9\u30eb\u3068VS\u30dd\u30a4\u30f3\u30c8\u3082\u8981\u6c42\u3067\u304d\u307e\u3059\u3002\u30ec\u30aa\u306e\u4f1d\u8aac\u306e\u5263\u306f\u30ec\u30d9\u30eb32\u30685000\u30dd\u30a4\u30f3\u30c8\u3001\u76fe\u306f\u30ec\u30d9\u30eb30\u30683000\u30dd\u30a4\u30f3\u30c8\u3002',
      'how.b3d3': '4\u4eba\u306e\u4f5c\u308a\u306f\u9055\u3044\u307e\u3059\u3002\u624b\u3067\u66f8\u304b\u308c\u305f\u304b\u3089\u3067\u3059\u3002\u30e0\u30af\u30ed\u3068\u30bf\u30d0\u30b5\u306f\u30011\u500b\u76ee\u3067\u5f15\u304f\u8981\u6c42\u6761\u4ef6\u306e\u8868\u3092\u6301\u3061\u307e\u3059\u3002\u30ec\u30aa\u306f\u5834\u5408\u5206\u3051\u306e\u9023\u306a\u308a\u3067\u30013\u500b\u76ee\u3060\u3051\u306f\u3001\u5931\u6557\u3059\u308b\u3068\u3059\u3067\u306b\u4e0e\u3048\u305f\u3082\u306e\u3092\u53d6\u308a\u6d88\u3057\u307e\u3059\u3002\u30bf\u30aa\u306b\u306f\u6b66\u5668\u306e\u4e00\u89a7\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u4f55\u304b\u3092\u4e0e\u3048\u308b\u7d44\u307f\u5408\u308f\u305b\u306f\u3072\u3068\u3064\u3060\u3051\u3002\u6b8b\u308a\u306e\u898f\u5247\u306f\u3001\u60dc\u3057\u3044\u9593\u9055\u3044\u3092\u5f3e\u304f\u305f\u3081\u306b\u3042\u308a\u307e\u3059\u3002',
      'brand.name': '\u30a6\u30a9\u30fc\u30b6\u30fc\u30c9', 'brand.what': '\u30d1\u30b9\u30ef\u30fc\u30c9\u751f\u6210\u5668',
      'brand.lang': 'ja',
      'brand.also': 'Red Earth', 'brand.also.lang': 'en',
      'seo.gen.t': '\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u4f5c\u308b',
      'seo.gen.d': '\u30a6\u30a9\u30fc\u30b6\u30fc\u30c9\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u751f\u6210\u5668\u3002\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u3092\u81ea\u7531\u306b\u8a2d\u5b9a\u3057\u3066\u3001\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u4f55\u3092\u3059\u308b\u306e\u304b\u78ba\u304b\u3081\u3089\u308c\u307e\u3059\u3002\u4efb\u610f\u306e\u30ec\u30d9\u30eb\u3001VS\u30dd\u30a4\u30f3\u30c8\u3001\u305d\u3057\u3066\u305d\u306e\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u304c\u6301\u3066\u308b\u3059\u3079\u3066\u306e\u88c5\u5099\u3068\u6280\u3002',
      'seo.dec.t': '\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u89e3\u6790',
      'seo.dec.d': '10\u500b\u306e\u8a18\u53f7\u3092\u5165\u529b\u3059\u308b\u3068\u3001\u305d\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u8ab0\u306e\u3082\u306e\u3067\u3001\u30ec\u30d9\u30eb\u3001VS\u30dd\u30a4\u30f3\u30c8\u3001\u8ffd\u52a0\u88c5\u5099\u304c\u4f55\u304b\u3092\u8aad\u307f\u53d6\u308a\u307e\u3059\u3002',
      'seo.codes.t': '\u7279\u6b8a\u30d1\u30b9\u30ef\u30fc\u30c9',
      'seo.codes.d': '\u30b2\u30fc\u30e0\u304c\u89e3\u6790\u3057\u306a\u30444\u3064\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u3002\u30d1\u30ef\u30fc\u30d5\u30a1\u30a4\u30c8\u30e2\u30fc\u30c9\u3001\u30a2\u30eb\u30c6\u30a3\u30e1\u30c3\u30c8\u30d0\u30c8\u30eb\u30e2\u30fc\u30c9\u3001\u30b9\u30bf\u30c3\u30d5\u30ed\u30fc\u30eb\u3001\u305d\u3057\u3066\u30ec\u30d9\u30eb1\u306b\u56fa\u5b9a\u3055\u308c\u308b\u3082\u306e\u3002',
      'seo.how.t': '\u30d1\u30b9\u30ef\u30fc\u30c9\u306e\u4ed5\u7d44\u307f',
      'seo.how.d': '10\u500b\u306e\u8a18\u53f7\u304c\u30ec\u30d9\u30eb\u3068VS\u30dd\u30a4\u30f3\u30c8\u3068\u8ffd\u52a0\u88c5\u5099\u3092\u6c7a\u3081\u308b3\u3064\u306e\u6570\u3092\u904b\u3073\u3001\u305d\u306e\u4e26\u3073\u9806\u306f\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u3054\u3068\u306b\u9055\u3044\u307e\u3059\u3002\u3059\u3079\u3066\u30b2\u30fc\u30e0\u306e\u30b3\u30fc\u30c9\u304b\u3089\u8aad\u307f\u53d6\u3063\u305f\u3082\u306e\u3067\u3059\u3002',
      'seo.suffix': '\u30a6\u30a9\u30fc\u30b6\u30fc\u30c9 \u30d1\u30b9\u30ef\u30fc\u30c9\u751f\u6210\u5668',
      'nav.gen': '\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u4f5c\u308b',
      'nav.how': '\u4ed5\u7d44\u307f',
      'how.s1': '10\u500b\u306e\u8a18\u53f7\u3068\u30013\u3064\u306e\u30b0\u30eb\u30fc\u30d7',
      'how.b1': '\u30a6\u30a9\u30fc\u30b6\u30fc\u30c9\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u306f10\u500b\u306e\u8a18\u53f7\u3067\u3067\u304d\u3066\u3044\u307e\u3059\u3002\u904b\u3076\u3082\u306e\u306f3\u3064\u3002',
      'how.b1a': '\u305d\u306e\u3068\u304d\u306e\u30ec\u30d9\u30eb\u3002',
      'how.b1b': 'VS\u30dd\u30a4\u30f3\u30c8\u306e\u5408\u8a08\u3002',
      'how.b1c': '\u8ffd\u52a0\u88c5\u5099\u3092\u6c7a\u3081\u308b3\u3064\u306e\u6570\u3002',
      'how.s2': '\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u3054\u3068\u306b\u4e26\u3073\u9806\u304c\u9055\u3046',
      'how.b2': '\u30ec\u30d9\u30eb\u306b2\u500b\uff08A\uff09\u3001VS\u30dd\u30a4\u30f3\u30c8\u306b5\u500b\uff08B\uff09\u3001\u30d0\u30ea\u30a8\u30fc\u30b7\u30e7\u30f3\u306b3\u500b\uff08C\uff09\u3002\u500b\u6570\u306f\u5168\u54e1\u540c\u3058\u3067\u3059\u304c\u3001\u9806\u756a\u306f\u5909\u308f\u308a\u307e\u3059\u30024\u4eba\u5206\u306f\u6b21\u306e\u3068\u304a\u308a\uff1a',
      'how.b2b': '\u3053\u306e\u9806\u756a\u3060\u3051\u304c\u3001\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u306b\u7d10\u3065\u3051\u3066\u3044\u307e\u3059\u3002\u304a\u3082\u3057\u308d\u3044\u3053\u3068\u306b\u3001\u307e\u308c\u306b2\u4eba\u304c\u540c\u305810\u500b\u3092\u53d7\u3051\u53d6\u308a\u307e\u3059\u304c\u3001\u30ec\u30d9\u30eb\u3082VS\u30dd\u30a4\u30f3\u30c8\u3082\u30d0\u30ea\u30a8\u30fc\u30b7\u30e7\u30f3\u3082\u3001\u307e\u3063\u305f\u304f\u5225\u306e\u7d50\u679c\u306b\u306a\u308a\u307e\u3059\u3002',
      'how.s3': '\u30ec\u30d9\u30eb',
      'how.b3': '\u30ec\u30d9\u30eb\u306e2\u500b\u306f1\u30d0\u30a4\u30c8\u306e\u4e0a\u4f4d\u3068\u4e0b\u4f4d\u3067\u3059\u3002\u30b2\u30fc\u30e0\u306f\u305d\u306e\u30d0\u30a4\u30c8\u309232\u500b\u306e\u5024\u3068\u9806\u306b\u7167\u3089\u3057\u5408\u308f\u305b\u3001\u4e00\u81f4\u3057\u305f\u4f4d\u7f6e\u304c\u30ec\u30d9\u30eb\u306b\u306a\u308a\u307e\u3059\u30021\u500b\u76ee\u304c\u30ec\u30d9\u30eb1\u300132\u500b\u76ee\u306f\u3082\u3061\u308d\u3093\u30ec\u30d9\u30eb32\u3002\u305d\u306e\u30d0\u30a4\u30c8\u304c32\u500b\u306e\u4e2d\u306b\u306a\u3051\u308c\u3070\u3001\u30d1\u30b9\u30ef\u30fc\u30c9\u306f\u5f3e\u304b\u308c\u307e\u3059\u3002',
      'how.s3b': 'VS\u30dd\u30a4\u30f3\u30c8',
      'how.b3b': 'VS\u306e5\u500b\u306f\u3001\u6570\u3068\u3001\u305d\u306e\u6570\u3092\u3069\u3046\u6271\u3046\u304b\u3092\u793a\u3059\u5370\u3092\u6301\u3061\u307e\u3059\u3002\u3069\u308c\u304c\u3069\u308c\u304b\u306f1\u500b\u76ee\u3067\u6c7a\u307e\u308a\u307e\u3059\uff1a',
      'how.b3c': '\u3064\u307e\u308a5\u500b\u306e\u8a18\u53f7\u306f\u3001\u5408\u8a08\u3092\u305d\u306e\u307e\u307e\u66f8\u3044\u305f\u3082\u306e\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u666e\u901a\u306e\u6570\u3068\u3057\u3066\u8aad\u3080\u3068\u3001\u4e0a\u306e\u30ec\u30aa\u306e14444\u306f14444\u30dd\u30a4\u30f3\u30c8\u306b\u306a\u308a\u307e\u3059\u304c\u3001\u5b9f\u969b\u306f7770\u3067\u3059\u3002',
      'how.s3z': 'VS\u30dd\u30a4\u30f3\u30c8\u304c0\u306e\u30d1\u30b9\u30ef\u30fc\u30c9',
      'how.b3z': 'VS\u30dd\u30a4\u30f3\u30c8\u304c0\u306e\u3068\u304d\u306f\u3001\u6570\u305d\u306e\u3082\u306e\u304c\u7b26\u53f7\u5316\u3055\u308c\u307e\u305b\u3093\u3002\u30b2\u30fc\u30e0\u306f2\u500b\u3092\u66f8\u304d\u307e\u3059\u304c\u3001\u305d\u308c\u305e\u308c\u304c4\u304b5\u306e\u3069\u3061\u3089\u304b\u306a\u306e\u3067\u3001\u306f\u3058\u3081\u306e2\u500b\u306f44\u300145\u300154\u300155\u306e\u3044\u305a\u308c\u304b\u3067\u3059\u3002\u7d9a\u304f3\u500b\u306f\u7121\u4f5c\u70ba\u3067\u3001\u8aad\u307e\u308c\u307e\u305b\u3093\u30026\u00d76\u00d76\u3067216\u901a\u308a\u3067\u3059\u30024\u901a\u308a\u00d7216\u901a\u308a\u3067864\u901a\u308a\u3002\u3059\u3079\u30660\u3092\u610f\u5473\u3057\u3001\u3059\u3079\u30660\u3068\u3057\u3066\u8aad\u307f\u623b\u3055\u308c\u307e\u3059\u3002',
      'how.s3d': '\u8ffd\u52a0\u88c5\u5099\u3092\u6c7a\u3081\u308b\u4e09\u3064',
      'how.b3d': '3\u500b\u306a\u306e\u3067216\u901a\u308a\u3002\u304a\u3082\u3057\u308d\u3044\u3053\u3068\u306b\u3001\u307b\u3068\u3093\u3069\u306f\u4f55\u3082\u4e0e\u3048\u307e\u305b\u3093\u3002',
      'how.s5': '\u7279\u6b8a\u30d1\u30b9\u30ef\u30fc\u30c9\u306f\u89e3\u6790\u3055\u308c\u307e\u305b\u3093',
      'how.b5': '{start}\u30b9\u30bf\u30fc\u30c8\u3001\u307e\u305f\u306f{down}\u4e0b\uff0b\u30b9\u30bf\u30fc\u30c8\u3092\u542b\u3080\u30d1\u30b9\u30ef\u30fc\u30c9\u306f\u3001\u305d\u3082\u305d\u3082\u305d\u306e\u8aad\u307f\u65b9\u304c\u3067\u304d\u307e\u305b\u3093\u3002\u3069\u3061\u3089\u306e\u8a18\u53f7\u30823\u3064\u306e\u30b0\u30eb\u30fc\u30d7\u306e\u3069\u308c\u306b\u3082\u73fe\u308c\u306a\u3044\u304b\u3089\u3067\u3059\u3002\u305d\u306e\u305f\u3081\u30b2\u30fc\u30e0\u306f\u5206\u89e3\u305b\u305a\u300110\u500b\u3092\u305d\u306e\u307e\u307e\u77ed\u3044\u4e00\u89a7\u3068\u7167\u5408\u3057\u307e\u3059\u3002\u3053\u306e4\u3064\u304c\u8a08\u7b97\u3067\u306f\u3067\u304d\u306a\u3044\u3053\u3068\u3092\u3067\u304d\u308b\u306e\u306f\u3001\u305d\u308c\u304c\u7406\u7531\u3067\u3059\u3002',
      'how.foot': '\u3053\u3053\u306b\u66f8\u3044\u305f\u3053\u3068\u306f\u3059\u3079\u3066\u3001\u30b2\u30fc\u30e0\u306e\u30b3\u30fc\u30c9\u305d\u306e\u3082\u306e\u306b\u57fa\u3065\u3044\u3066\u3044\u307e\u3059\u3002',
      'nav.dec': '\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u89e3\u6790',
      'nav.codes': '\u7279\u6b8a\u30d1\u30b9\u30ef\u30fc\u30c9',
      'gen.s1': '\u6226\u58eb\u3092\u9078\u3079',
      'gen.s2': '\u6b32\u3057\u3044\u3082\u306e\u3092\u9078\u3076',
      'gen.s3': '\u30d1\u30b9\u30ef\u30fc\u30c9\u753b\u9762\u3067\u3053\u308c\u3092\u5165\u529b',
      'gen.tab': '\u30ab\u30b9\u30bf\u30de\u30a4\u30ba', 'gen.shut': '\u9589\u3058\u308b',
      'roll.tab': '\u30e9\u30f3\u30c0\u30de\u30a4\u30ba',
      'roll.sub': '\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u30e9\u30f3\u30c0\u30e0\u306b\u4f5c\u308a\u307e\u3059\u3002',
      'roll.level': '\u30ec\u30d9\u30eb\u306e\u7bc4\u56f2',
      'roll.vs': 'VS\u30dd\u30a4\u30f3\u30c8\u306e\u7bc4\u56f2',
      'roll.seed': '\u30b7\u30fc\u30c9\uff08\u540c\u3058\u7d50\u679c\u3092\u51fa\u3057\u305f\u3044\u3068\u304d\uff09',
      'roll.chars': '\u30ad\u30e3\u30e9\u30af\u30bf\u30fc',
      'roll.rules': '\u6761\u4ef6',
      'roll.must': '\u4f55\u304b\u3092\u4e0e\u3048\u308b\u30d1\u30b9\u30ef\u30fc\u30c9\u3060\u3051',
      'roll.noleg': '\u4f1d\u8aac\u306e\u88c5\u5099\u306a\u3057',
      'roll.keep': '\u4eca\u306e\u30ec\u30d9\u30eb\u3068VS\u30dd\u30a4\u30f3\u30c8\u3092\u4fdd\u3064',
      'roll.go': '\u30e9\u30f3\u30c0\u30e0',
      'roll.none': '\u6761\u4ef6\u306b\u5408\u3046\u3082\u306e\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u7bc4\u56f2\u3092\u5e83\u3052\u308b\u304b\u3001\u6761\u4ef6\u3092\u5916\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
      'gen.tune': '\u30ec\u30d9\u30eb\u30fbVS\u30dd\u30a4\u30f3\u30c8\u30fb\u8ffd\u52a0\u88c5\u5099\u3092\u5909\u3048\u307e\u3059\u3002',
      'lbl.level': '\u30ec\u30d9\u30eb', 'lbl.vs': 'VS\u30dd\u30a4\u30f3\u30c8',
      'dec.s1': '\u3060\u308c\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u304b',
      'dec.waiting': '10\u500b\u306e\u30b7\u30f3\u30dc\u30eb\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
      'dec.nobody': '\u3069\u306e\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u3067\u3082\u901a\u308a\u307e\u305b\u3093\u3002',
      'dec.s2': '10\u500b\u306e\u30b7\u30f3\u30dc\u30eb\u3092\u5165\u529b',
      'sp.locked': '\u30ec\u30d9\u30eb1\u56fa\u5b9a\u3001\u30b9\u30b3\u30a2\u306f0\u306e\u307e\u307e',
      'sp.locked.d': '\u30ec\u30d9\u30eb\u304c1\u304b\u3089\u4e0a\u304c\u3089\u305a\u3001\u30b3\u30a4\u30f3\u3092\u3044\u304f\u3064\u53d6\u3063\u3066\u3082\u30b9\u30b3\u30a2\u306f0\u306e\u307e\u307e\u3067\u3059\u3002',
      'sp.power': '\u30d1\u30ef\u30fc\u30d5\u30a1\u30a4\u30c8\u30e2\u30fc\u30c9',
      'sp.power.d': '\u6575\u306e\u30c0\u30e1\u30fc\u30b8\u304c1.5\u500d\u306b\u306a\u308a\u307e\u3059\u3002',
      'sp.ultimate': '\u30a2\u30eb\u30c6\u30a3\u30e1\u30c3\u30c8\u30d0\u30c8\u30eb\u30e2\u30fc\u30c9',
      'sp.ultimate.d': '\u6575\u306e\u884c\u52d5\u30d1\u30bf\u30fc\u30f3\u304c\u96e3\u3057\u304f\u306a\u308a\u307e\u3059\u3002',
      'sp.credits': '\u30b9\u30bf\u30c3\u30d5\u30ed\u30fc\u30eb\u3078',
      'sp.credits.d': '\u30a8\u30f3\u30c9\u30ed\u30fc\u30eb\u306b\u76f4\u884c\u3057\u307e\u3059\u3002',
      'codes.s1': '\u6226\u58eb\u3092\u9078\u3079',
      'codes.s2': '\u901a\u5e38\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u306e\u4ee3\u308f\u308a\u306b\u3053\u308c\u3092\u5165\u529b',
      'preset.best': '\u304a\u3059\u3059\u3081\u306e\u30d1\u30b9\u30ef\u30fc\u30c9',
      'preset.leo0': '\u304a\u3059\u3059\u3081: \u4f1d\u8aac\u306e\u5263\u3068\u76fe',
      'preset.leo1': '\u304a\u3059\u3059\u3081: \u4f1d\u8aac\u306e\u5263\u306a\u3057',
      'preset.kenji0': '\u304a\u3059\u3059\u3081: \u3059\u3079\u3066\u8fbc\u307f',
      'preset.kenji1': '\u304a\u3059\u3059\u3081: \u7f85\u5239\u5203\u306a\u3057',
      'note.leo0': '\u30ec\u30aa\u306f\u4f1d\u8aac\u306e\u88c5\u5099\u304c\u6700\u3082\u5f37\u304f\u3001\u4ed6\u306e\u6b66\u5668\u306f\u5fc5\u8981\u3042\u308a\u307e\u305b\u3093\u3002',
      'note.leo1': '\u5927\u4f1a\u3067\u7981\u6b62\u3055\u308c\u308b\u3053\u3068\u304c\u3042\u308b \u4f1d\u8aac\u306e\u5263\u3092\u5916\u3057\u307e\u3059\u3002',
      'note.kenji0': '\u30ec\u30d9\u30eb32\u3067\u3001\u5f7c\u306e\u8ffd\u52a03\u3064\u3059\u3079\u3066\u3002',
      'note.kenji1': '\u5f31\u3044\u6280\u3060\u3068\u3055\u308c\u308b\u3053\u3068\u304c\u3042\u308b \u7f85\u5239\u5203\u3092\u5916\u3057\u307e\u3059\u3002',
      'note.other': '\u30ec\u30d9\u30eb32\u3067\u3001\u3053\u306e\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u304c\u6301\u3066\u308b\u3082\u306e\u3059\u3079\u3066\u3002VS\u30dd\u30a4\u30f3\u30c8\u306f\u5165\u529b\u3057\u3084\u3059\u3055\u3067\u9078\u3093\u3067\u3044\u307e\u3059\u3002',
      'out.none': '\u3053\u306e\u7d44\u307f\u5408\u308f\u305b\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u306f\u3042\u308a\u307e\u305b\u3093\u3002',
      'out.untick': '\u30c1\u30a7\u30c3\u30af\u3092\u5916\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u3059\u3079\u3066\u306e\u8ffd\u52a0\u3092\u7d44\u307f\u5408\u308f\u305b\u308b\u3053\u3068\u306f\u3067\u304d\u307e\u305b\u3093\u3002\u3053\u3053\u3067\u306f {n} \u901a\u308a\u304c\u6709\u52b9\u3067\u3059\u3002',
      'out.same': '{n}\u901a\u308a\u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u3053\u306e\u540c\u3058\u7d50\u679c\u306b\u306a\u308a\u307e\u3059',
      'out.easiest': '\u6700\u3082\u5165\u529b\u3057\u3084\u3059\u3044',
      'out.only': '\u3053\u306e\u7d50\u679c\u306b\u306a\u308b\u30d1\u30b9\u30ef\u30fc\u30c9\u306f\u3053\u308c\u3060\u3051\u3067\u3059\u3002',
      'toggle.combo': '\u4ed6\u306b\u30c1\u30a7\u30c3\u30af\u3057\u305f\u3082\u306e\u3068\u4f75\u7528\u3067\u304d\u307e\u305b\u3093\u3002\u3069\u308c\u304b\u3092\u5916\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
      'toggle.blocked': '\u30c1\u30a7\u30c3\u30af\u6e08\u307f\u306e\u3082\u306e\u3068\u306f\u4f75\u7528\u3067\u304d\u307e\u305b\u3093: {what}\u3002\u3069\u308c\u304b\u3092\u5916\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
      'toggle.level': '\u3053\u306e\u30ec\u30d9\u30eb\u3068VS\u30dd\u30a4\u30f3\u30c8\u3067\u306f\u9078\u3079\u307e\u305b\u3093\u3002',
      'out.nothing': '\u3053\u306e\u30ec\u30d9\u30eb\u3068VS\u30dd\u30a4\u30f3\u30c8\u3067\u306f\u4f55\u3082\u53d7\u3051\u4ed8\u3051\u3089\u308c\u307e\u305b\u3093\u3002',
      'out.adjusted': '\u8abf\u6574\u3057\u307e\u3057\u305f: ',
      'out.reach': '{x} \u306f\u30ec\u30d9\u30eb {lv}\u3001VS\u30dd\u30a4\u30f3\u30c8 {vs} \u3067\u306f\u5165\u624b\u3067\u304d\u307e\u305b\u3093\u3002',
      'out.is': '', 'out.are': '', 'out.and': '\u3068',
      'carry.plus': '\u3055\u3089\u306b ', 'carry.none': '\u30ec\u30d9\u30eb\u305d\u306e\u3082\u306e\u4ee5\u5916\u306f\u3042\u308a\u307e\u305b\u3093\u3002',
      'all.sum': '\u3053\u3053\u3067\u4f5c\u308c\u308b\u7d44\u307f\u5408\u308f\u305b ({n})',
      'all.nothing': '\u8ffd\u52a0\u306a\u3057',
      'at.level': '\u30ec\u30d9\u30eb {lv} \u3067\u306f: ',
      'gear.none': '\u3053\u306e\u30ad\u30e3\u30e9\u30af\u30bf\u30fc\u306e\u88c5\u5099\u306f\u8a18\u9332\u3055\u308c\u3066\u3044\u307e\u305b\u3093',
      'at.gained': '\u3053\u306e\u30ec\u30d9\u30eb\u3067\u306e\u7fd2\u5f97: ',
      'at.nothing': '\u3053\u306e\u30ec\u30d9\u30eb\u306e\u8a18\u9332\u306f\u3042\u308a\u307e\u305b\u3093',
      'at.power': '\u80fd\u529b: ',
      'at.nopower': '\u307e\u3060\u4e0a\u6607\u306a\u3057',
      'at.resist': '\u8010\u6027: ',
      'at.noresist': '\u307e\u3060\u306a\u3057',
      'at.attack': '\u653b\u6483\u529b',
      'at.defence': '\u9632\u5fa1\u529b',
      'el.fire': '\u708e', 'el.ice': '\u6c37', 'el.lightning': '\u96f7',
      'el.poison': '\u6bd2', 'el.wind': '\u98a8',
      'at.moves': '\u6280: ',
      'at.announced': '\u30b2\u30fc\u30e0\u306f\u3053\u3053\u3067 {said} \u3092\u5f97\u3089\u308c\u308b\u3068\u8868\u793a\u3057\u307e\u3059\u304c\u3001\u305d\u308c\u306f\u8aa4\u308a\u3067\u3001\u4e0a\u306e\u884c\u304c\u5b9f\u969b\u306b\u5f97\u3089\u308c\u308b\u3082\u306e\u3067\u3059\u3002',
      'at.nomoves': '\u307e\u3060\u3042\u308a\u307e\u305b\u3093',
      'dec.reading': '{who} \u3068\u3057\u3066\u8aad\u307f\u307e\u3059\u3002', 'dec.try': '\u4f8b',
      'dec.example': '{pw} ({who})',
      'dec.only': '\u4f7f\u3048\u308b\u306e\u306f 1-6\u3001Y\u3001M \u3060\u3051\u3067\u3059\u3002',
      'key.y': '\u30b9\u30bf\u30fc\u30c8\u3092\u62bc\u3059',
      'key.m': '\u4e0b\u3092\u5165\u308c\u306a\u304c\u3089\u30b9\u30bf\u30fc\u30c8\u3092\u62bc\u3059',
      'dec.ten': '\u30b7\u30f3\u30dc\u30eb\u306f10\u500b\u5fc5\u8981\u3067\u3059\u3002\u4eca\u306f {n} \u500b\u3002',
      'dec.notmine': '{who} \u306e\u30d1\u30b9\u30ef\u30fc\u30c9\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002',
      'dec.why': '\u7406\u7531',
      'dec.specialwhy': 'Start \u307e\u305f\u306f Down+Start \u304c\u5165\u3063\u3066\u3044\u308b\u306e\u3067\u7279\u6b8a\u30d1\u30b9\u30ef\u30fc\u30c9\u306e\u306f\u305a\u3067\u3059\u304c\u3001{who} \u306e4\u3064\u306e\u3069\u308c\u3067\u3082\u3042\u308a\u307e\u305b\u3093\u3002',
      'dec.rejected': '{who} \u3068\u3057\u3066\u62d2\u5426\u3055\u308c\u307e\u3057\u305f\u3002',
      'dec.accepted': '{who} \u3068\u3057\u3066\u53d7\u3051\u4ed8\u3051\u3089\u308c\u307e\u3057\u305f\u3002',
      'lbl.character': '\u30ad\u30e3\u30e9\u30af\u30bf\u30fc', 'lbl.effect': '\u52b9\u679c',
      'lbl.gear': '\u88c5\u5099', 'lbl.extras': '\u8ffd\u52a0', 'lbl.none': '\u306a\u3057',
      'langnote': '\u79f0\u53f7\u306f\u30b2\u30fc\u30e0\u540c\u69d8\u82f1\u8a9e\u8868\u8a18\u306e\u307e\u307e\u3067\u3059\u3002\u6280\u306e\u540d\u524d\u306f\u30ec\u30d9\u30eb\u30a2\u30c3\u30d7\u753b\u9762\u304b\u3089\u78ba\u8a8d\u3057\u305f\u3082\u306e\u3092\u4f7f\u3063\u3066\u3044\u307e\u3059\u304c\u3001\u672a\u78ba\u8a8d\u306e\u3082\u306e\u3082\u3042\u308a\u307e\u3059\u3002',
      'cr.site': '\u30b5\u30a4\u30c8\u3068\u30d1\u30b9\u30ef\u30fc\u30c9\u306e\u89e3\u6790: ',
      'cr.levels': '\u30ec\u30d9\u30eb\u8868: '
    }
  };
  function T(k, vars) {
    var t = (S[LANG] && S[LANG][k] !== undefined) ? S[LANG][k] : (S.en[k] || k);
    if (vars) Object.keys(vars).forEach(function (n) {
      t = t.split('{' + n + '}').join(vars[n]);
    });
    return t;
  }
  function who() { return NAMES[LANG][st.character]; }
  function jp(text) { return LANG === 'ja' ? RE.localise(text) : text; }
  function jpLevel(text) { return LANG === 'ja' ? RE.localiseLevel(text) : text; }

  function applyLang() {
    document.documentElement.lang = LANG;
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (n) {
      n.textContent = T(n.getAttribute('data-t'));
    });
    ['en', 'ja'].forEach(function (l) {
      $('l-' + l).setAttribute('aria-pressed', l === LANG ? 'true' : 'false');
    });
    $('langnote').textContent = T('langnote');
    drawInterleave();
    drawRom();
    drawExamples();
    drawRules();
    drawSpecialNote();
    var brand = $('brand');
    $('brand-name').textContent = T('brand.name');
    brand.setAttribute('lang', T('brand.lang'));
    $('brand-what').textContent = T('brand.what');
    var also = $('also');
    also.textContent = T('brand.also');
    also.setAttribute('lang', T('brand.also.lang'));
    document.title = T('brand.name') + ' ' + T('brand.what');
    $('tune-shut').setAttribute('aria-label', T('gen.shut'));
    var cr = $('credits');
    cr.textContent = '';
    cr.appendChild(document.createTextNode(T('cr.site')));
    cr.appendChild(el('b', null, 'HB Production'));
    cr.appendChild(document.createTextNode('. ' + T('cr.levels')));
    cr.appendChild(el('b', null, 'Yoshin'));
    cr.appendChild(document.createTextNode('.'));
    applyKeys();
    PICKERS.forEach(function (id) {
      Array.prototype.forEach.call($(id).children, function (c, k) {
        plate(c, ORDER[k]);
      });
    });
    render(); decode(); renderCodes();
    fitNames(true);
  }

  ['keys-codes'].forEach(function (id) {
    var host = $(id);
    [7, 8].forEach(function (d) {
      var k = el('div', 'key');
      var img = document.createElement('img');
      img.alt = LEGEND[d];
      k.appendChild(img);
      k.appendChild(el('b', null, ''));
      host.appendChild(k);
    });
  });
  var TYPED = ['', '1', '2', '3', '4', '5', '6', 'Y', 'M'];
  function applyTypeKeys() {
    var host = $('typekeys');
    host.textContent = '';
    for (var d = 1; d <= 8; d++) {
      var k = el('div', 'tk');
      var img = document.createElement('img');
      img.src = d <= 6 ? ART[CHAR_SLUG[st.character]][d] : symFile(d);
      img.alt = LEGEND[d];
      k.appendChild(img);
      k.appendChild(el('b', null, TYPED[d]));
      host.appendChild(k);
    }
  }
  function applyKeys() {
    applyTypeKeys();
    ['keys-codes'].forEach(function (id) {
      Array.prototype.forEach.call($(id).children, function (k, i) {
        k.children[0].src = symFile(i === 0 ? 7 : 8);
        k.children[1].textContent = T(i === 0 ? 'key.y' : 'key.m');
      });
    });
  }

  var LONGEST_NAME = (function () {
    var best = '';
    ['en', 'ja'].forEach(function (l) {
      NAMES[l].forEach(function (full) {
        var m = /^(.*?)\s*\((.*)\)$/.exec(full);
        var nm = (m ? m[1] : full).toUpperCase();
        if (nm.length > best.length) best = nm;
      });
    });
    return best;
  }());

  var fittedAt = 0;
  function fitNames(force) {
    var host = $('chars');
    if (!host.clientWidth || !host.children.length) { fittedAt = 0; return; }
    if (!force && host.clientWidth === fittedAt) return;
    fittedAt = host.clientWidth;
    var p0 = host.children[0], probe = p0.children[0];
    var keep = probe.textContent;
    probe.textContent = LONGEST_NAME;
    probe.style.fontSize = '100px';
    var at100 = probe.getBoundingClientRect().width;
    probe.style.fontSize = '';
    probe.textContent = keep;
    if (!at100) return;
    var room = p0.clientWidth - 8;
    var tall = p0.clientHeight - 8 - 15;
    var byWidth = 100 * (room * 0.94) / at100;
    var byHeight = tall / 1.2;
    var size = Math.max(12, Math.floor(Math.min(byWidth, byHeight)));
    Array.prototype.forEach.call(host.children, function (p) {
      p.children[0].style.fontSize = size + 'px';
    });
  }

  var tuning = false;
  var tuneBtn = null;
  function tuneButton() {
    if (!tuneBtn) {
      tuneBtn = el('button', 'tune-tab');
      tuneBtn.type = 'button';
      tuneBtn.id = 'tune-tab';
      tuneBtn.setAttribute('aria-controls', 'tune');
      var mark = el('span', 'mark', '+');
      mark.id = 'tune-mark';
      mark.setAttribute('aria-hidden', 'true');
      tuneBtn.appendChild(mark);
      tuneBtn.appendChild(el('span', null, ''));
      tuneBtn.addEventListener('click', function () {
        setTune(!(tuning && tuneMode === 'tune'), 'tune');
      });
    }
    tuneBtn.children[1].textContent = T('gen.tab');
    tuneBtn.setAttribute('aria-expanded', tuning ? 'true' : 'false');
    tuneBtn.children[0].textContent = tuning ? '\u2212' : '+';
    return tuneBtn;
  }
  var tuneMode = 'tune';
  function setTune(on, mode) {
    tuning = !!on;
    if (mode) tuneMode = mode;
    var rolling = tuneMode === 'roll';
    document.body.classList.toggle('tuning', tuning);
    $('tune').setAttribute('aria-hidden', tuning ? 'false' : 'true');
    $('head-tune').hidden = rolling;
    $('head-roll').hidden = !rolling;
    $('tuner').hidden = rolling;
    $('roller').hidden = !rolling;
    if (tuneBtn) {
      tuneBtn.setAttribute('aria-expanded', tuning && !rolling ? 'true' : 'false');
      tuneBtn.children[0].textContent = tuning && !rolling ? '\u2212' : '+';
    }
    if (rollBtn) {
      rollBtn.setAttribute('aria-expanded', tuning && rolling ? 'true' : 'false');
      rollBtn.children[0].textContent = tuning && rolling ? '\u2212' : '+';
    }
  }

  var rollBtn = null;
  function rollButton() {
    if (!rollBtn) {
      rollBtn = el('button', 'tune-tab');
      rollBtn.type = 'button';
      rollBtn.id = 'roll-tab';
      rollBtn.setAttribute('aria-controls', 'tune');
      var rmark = el('span', 'mark', '+');
      rmark.id = 'roll-mark';
      rmark.setAttribute('aria-hidden', 'true');
      rollBtn.appendChild(rmark);
      rollBtn.appendChild(el('span', null, ''));
      rollBtn.addEventListener('click', function () {
        var open = !(tuning && tuneMode === 'roll');
        buildRollChars();
        setTune(open, 'roll');
      });
    }
    rollBtn.children[1].textContent = T('roll.tab');
    rollBtn.setAttribute('aria-expanded', tuning && tuneMode === 'roll' ? 'true' : 'false');
    rollBtn.children[0].textContent = tuning && tuneMode === 'roll' ? '\u2212' : '+';
    return rollBtn;
  }

  function buildRollChars() {
    var host = $('r-chars');
    if (!host) return;
    var was = {};
    Array.prototype.forEach.call(host.children, function (lab) {
      was[lab.children[0].value] = lab.children[0].checked;
    });
    host.textContent = '';
    ORDER.forEach(function (i) {
      var lab = el('label', 'toggle');
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.value = String(i);
      box.checked = was[String(i)] === undefined ? true : was[String(i)];
      lab.appendChild(box);
      lab.appendChild(el('span', null, NAMES[LANG][i]));
      host.appendChild(lab);
    });
  }

  function seeded(text) {
    var h = 1779033703 ^ text.length, i;
    for (i = 0; i < text.length; i++) {
      h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  function whole(v, lo, hi) {
    var n = parseInt(v, 10);
    if (isNaN(n)) n = lo;
    return n < lo ? lo : n > hi ? hi : n;
  }

  function doRoll() {
    var picks = [];
    Array.prototype.forEach.call($('r-chars').children, function (lab) {
      if (lab.children[0].checked) picks.push(+lab.children[0].value);
    });
    if (!picks.length) picks = ORDER.slice();

    var lvA = whole($('r-lv-min').value, 1, 32), lvB = whole($('r-lv-max').value, 1, 32);
    if (lvA > lvB) { var t = lvA; lvA = lvB; lvB = t; }
    var vsA = whole($('r-vs-min').value, 0, 9990), vsB = whole($('r-vs-max').value, 0, 9990);
    if (vsA > vsB) { var u = vsA; vsA = vsB; vsB = u; }
    vsA = Math.ceil(vsA / 10) * 10;
    vsB = Math.floor(vsB / 10) * 10;
    var must = $('r-must').checked;
    var noleg = $('r-noleg').checked;
    var keep = $('r-keep').checked;
    var legBit = 0;
    (RE.GRANTS[0] || []).forEach(function (g) {
      if (/Legendary/i.test(g[1])) legBit |= g[0];
    });
    var text = ($('r-seed').value || '').trim();
    var rnd = text ? seeded(text) : Math.random;

    for (var tries = 0; tries < 800; tries++) {
      var c = keep ? st.character : picks[Math.floor(rnd() * picks.length)];
      var lvl = keep ? st.level : lvA + Math.floor(rnd() * (lvB - lvA + 1));
      var pts = keep ? st.points
                     : vsA + Math.floor(rnd() * ((vsB - vsA) / 10 + 1)) * 10;
      var all = RE.enumerate(c, lvl, pts) || [];
      if (must) all = all.filter(function (o) { return o.granted || o.shield; });
      if (noleg) {
        all = all.filter(function (o) {
          return !o.shield && !(c === 0 && (o.granted & legBit));
        });
      }
      if (!all.length) continue;
      var o = all[Math.floor(rnd() * all.length)];
      if (c !== st.character) pickChar(c);
      st.level = lvl; st.points = pts;
      st.granted = o.granted; st.shield = o.shield;
      $('lv').value = lvl; $('vs').value = pts;
      render();
      setPath(false);
      $('r-out').textContent = '';
      return;
    }
    $('r-out').textContent = T('roll.none');
  }
  $('tune-shut').addEventListener('click', function () { setTune(false); });
  $('r-go').addEventListener('click', doRoll);
  $('tune-veil').addEventListener('click', function () { setTune(false); });
  document.addEventListener('keydown', function (e) {
    if (tuning && (e.key === 'Escape' || e.key === 'Esc')) setTune(false);
  });



  function itemsOf(c, granted, shield) {
    var out = [], list = RE.GRANTS[c], i;
    for (i = 0; i < list.length; i++)
      if (granted & list[i][0]) out.push(list[i][1]);
    if (shield) out.push('Legendary Shield');
    return out;
  }

  function costOf(c, a, b, cc, d1, d2, want) {
    function reach(level, points) {
      var lb = RE.LEVEL_TABLE[level - 1], vsd = [], i, d3;
      var f = RE.encodeVs(points);
      for (i = 0; i < 5; i++) vsd.push((f >> (4 * (4 - i))) & 15);
      for (d3 = 1; d3 <= 6; d3++) {
        var d = new Array(10);
        d[a[0]] = (lb >> 4) & 15; d[a[1]] = lb & 15;
        for (i = 0; i < 5; i++) d[b[i]] = vsd[i];
        d[cc[0]] = d1; d[cc[1]] = d2; d[cc[2]] = d3;
        var r = RE.decode(c, d);
        if (!r || r.error) continue;
        var got = itemsOf(c, r.granted, r.shield), all = true;
        for (i = 0; i < want.length; i++)
          if (got.indexOf(want[i]) < 0) { all = false; break; }
        if (all) return true;
      }
      return false;
    }
    var lo = 1, hi = 32, m;
    while (lo < hi) { m = (lo + hi) >> 1; if (reach(m, 9990)) hi = m; else lo = m + 1; }
    var plo = 0, phi = 999;
    while (plo < phi) { m = (plo + phi) >> 1; if (reach(32, m * 10)) phi = m; else plo = m + 1; }
    return { level: lo, points: plo * 10, corner: reach(lo, plo * 10) };
  }

  function variationCounts(c) {
    var p = RE.PATTERN[c], a = [], b = [], cc = [], i;
    for (i = 0; i < 10; i++) {
      if (p.charAt(i) === 'A') a.push(i);
      else if (p.charAt(i) === 'B') b.push(i);
      else cc.push(i);
    }
    var lv = RE.LEVEL_TABLE[31], vs = [1, 5, 4, 5, 4];
    var out = { by: {}, wins: [], sets: {}, pick: {}, third: {},
                pairs: {}, cost: {}, thirds: {} };
    for (var d1 = 1; d1 <= 6; d1++) {
      out.by[d1] = 0; out.sets[d1] = []; out.pick[d1] = {};
      out.pairs[d1] = {}; out.cost[d1] = {}; out.thirds[d1] = {};
    }
    for (var d3i = 1; d3i <= 6; d3i++) out.third[d3i] = [];
    for (d1 = 1; d1 <= 6; d1++)
      for (var d2 = 1; d2 <= 6; d2++)
        for (var d3 = 1; d3 <= 6; d3++) {
          var d = new Array(10);
          d[a[0]] = (lv >> 4) & 15; d[a[1]] = lv & 15;
          for (i = 0; i < 5; i++) d[b[i]] = vs[i];
          d[cc[0]] = d1; d[cc[1]] = d2; d[cc[2]] = d3;
          var r = RE.decode(c, d);
          if (!r || r.error) continue;
          out.by[d1]++;
          out.pairs[d1][d2] = (out.pairs[d1][d2] || 0) + 1;
          if (!out.thirds[d1][d2]) out.thirds[d1][d2] = [];
          out.thirds[d1][d2].push(d3);
          var got = itemsOf(c, r.granted, r.shield);
          out.sets[d1].push(got);
          if (!out.pick[d1][d2]) out.pick[d1][d2] = got.slice();
          else out.pick[d1][d2] = out.pick[d1][d2].filter(function (x) {
            return got.indexOf(x) >= 0;
          });
          got.forEach(function (x) {
            if (out.third[d3].indexOf(x) < 0) out.third[d3].push(x);
          });
          if (r.granted || r.shield) out.wins.push('' + d1 + d2 + d3);
        }
    for (d1 = 1; d1 <= 6; d1++)
      for (d2 = 1; d2 <= 6; d2++)
        if (out.pick[d1][d2])
          out.cost[d1][d2] = costOf(c, a, b, cc, d1, d2, out.pick[d1][d2]);
    return out;
  }

  function asRange(list) {
    var out = [], i, from, to;
    for (i = 0; i < list.length; i++) {
      from = to = list[i];
      while (i + 1 < list.length && list[i + 1] === to + 1) { i++; to = list[i]; }
      out.push(from === to ? String(from)
                           : from + (to === from + 1 ? ', ' : '\u2013') + to);
    }
    return out.join(', ');
  }

  function givesCell(text, names) {
    var cell = el('td', 'give', null), rest = text;
    names.forEach(function (n) {
      var at = rest.indexOf(n);
      if (at < 0) return;
      if (at) cell.appendChild(el('span', null, rest.slice(0, at)));
      cell.appendChild(el('span', 'it', n));
      rest = rest.slice(at + n.length);
    });
    if (rest) cell.appendChild(el('span', null, rest));
    return cell;
  }

  function drawRules() {
    var host = $('rules');
    if (!host) return;
    host.textContent = '';
    ORDER.forEach(function (c) {
      var counts = variationCounts(c);
      var box = el('div', null, null);
      box.appendChild(el('div', 'who', NAMES[LANG][c]));

      var wide = false;
      for (var wd1 = 1; wd1 <= 6; wd1++)
        for (var wd2 = 1; wd2 <= 6; wd2++) {
          var th = counts.thirds[wd1][wd2];
          if (th && th.length < 6) wide = true;
        }
      var extras = [];
      counts.sets[1].forEach(function (t) {
        t.forEach(function (x) { if (extras.indexOf(x) < 0) extras.push(x); });
      });
      var pair = el('div', 'pair', null);
      var t = el('table', null, null), head = el('tr', null, null);
      ['1st', 'lvl', 'pts', 'give', '3rd'].forEach(function (k) {
        head.appendChild(el('th', k === 'give' ? 'give' : null,
                            (k === '3rd' && !wide) ? '' : T('how.r.h.' + k)));
      });
      t.appendChild(head);

      function rowsFor(d1) {
        var runs = [], prev = null;
        for (var d2 = 1; d2 <= 6; d2++) {
          var got = counts.pick[d1][d2];
          if (!got) { prev = null; continue; }
          var parts = got.filter(function (x) { return extras.indexOf(x) < 0; })
                         .map(jp);
          var name = parts.join(' + ') || T('how.r.g.none');
          var cost = counts.cost[d1][d2];
          var th3 = counts.thirds[d1][d2] || [];
          var third = th3.length === 6 ? T('how.r.any') : asRange(th3);
          if (prev && prev.name === name && prev.to === d2 - 1
              && prev.level === cost.level && prev.points === cost.points
              && prev.third === third) {
            prev.to = d2;
            prev.n += counts.pairs[d1][d2];
          } else {
            prev = { from: d2, to: d2, name: name, level: cost.level,
                     points: cost.points, third: third, parts: parts,
                     n: counts.pairs[d1][d2] };
            runs.push(prev);
          }
        }
        return runs;
      }

      var groups = [], seen = {};
      for (var d1 = 1; d1 <= 6; d1++) {
        var runs = rowsFor(d1);
        var key = JSON.stringify(runs.map(function (r2) {
          return [r2.from, r2.to, r2.name, r2.level, r2.points, r2.third];
        }));
        if (seen[key] === undefined) {
          seen[key] = groups.length;
          groups.push({ who: [d1], runs: runs });
        } else {
          var g = groups[seen[key]];
          g.who.push(d1);
          runs.forEach(function (r2, i2) { g.runs[i2].n += r2.n; });
        }
      }

      groups.forEach(function (g, gi) {
        g.runs.forEach(function (r2, idx) {
          var row = el('tr', (idx || !gi) ? null : 'grp', null);
          row.appendChild(el('td', null, idx ? '' : asRange(g.who)));
          row.appendChild(el('td', null, r2.level > 1 ? String(r2.level)
                                                      : T('how.r.any')));
          row.appendChild(el('td', null, r2.points ? String(r2.points)
                                                   : T('how.r.any')));
          row.appendChild(givesCell(T('how.r.g.pick', {
            d: r2.from === r2.to ? r2.from : r2.from + '\u2013' + r2.to,
            what: r2.name
          }), r2.parts));
          row.appendChild(el('td', null, wide ? r2.third : ''));
          t.appendChild(row);
        });
      });
      pair.appendChild(t);

      var gives3 = [], any3 = false;
      for (var d3 = 1; d3 <= 6; d3++) {
        var mine = counts.third[d3].filter(function (x) {
          return extras.indexOf(x) >= 0;
        });
        if (mine.length) any3 = true;
        gives3.push({ d: d3, name: mine.map(jp).join(' + '),
                      parts: mine.map(jp) });
      }
      if (any3) {
        var t3 = el('table', 'third', null), h3 = el('tr', null, null);
        h3.appendChild(el('th', null, T('how.r.h.3sym')));
        h3.appendChild(el('th', 'give', T('how.r.h.gives')));
        t3.appendChild(h3);
        var runs3 = [], run3 = null;
        gives3.forEach(function (g) {
          if (run3 && run3.name === g.name && run3.to === g.d - 1) run3.to = g.d;
          else {
            run3 = { from: g.d, to: g.d, name: g.name, parts: g.parts };
            runs3.push(run3);
          }
        });
        runs3.forEach(function (g) {
          var r3 = el('tr', null, null);
          r3.appendChild(el('td', null,
            g.from === g.to ? String(g.from) : g.from + '\u2013' + g.to));
          r3.appendChild(givesCell(g.name || T('how.r.g.none'), g.parts));
          t3.appendChild(r3);
        });
        pair.appendChild(t3);
      }
      if (!any3) pair.className = 'pair solo';
      box.appendChild(pair);

      var all = 0;
      for (var td1 = 1; td1 <= 6; td1++) all += counts.by[td1];
      box.appendChild(el('div', 'tally', T('how.r.tally', { n: all })));
      box.appendChild(el('div', 'note', T('how.r.' + CHAR_SLUG[c])));
      host.appendChild(box);
    });
  }

  var EXAMPLE = '4144444113';
  function drawSpecialNote() {
    var host = $('b5');
    if (!host) return;
    host.textContent = '';
    var text = T('how.b5'), at = 0, m;
    var mark = /\{(start|down)\}/g;
    while ((m = mark.exec(text))) {
      if (m.index > at)
        host.appendChild(el('span', null, text.slice(at, m.index)));
      var d = m[1] === 'start' ? 7 : 8;
      var img = document.createElement('img');
      img.className = 'insym';
      img.src = symFile(d);
      img.alt = LEGEND[d];
      host.appendChild(img);
      at = m.index + m[0].length;
    }
    if (at < text.length) host.appendChild(el('span', null, text.slice(at)));
  }

  function drawExamples() {
    Array.prototype.forEach.call(document.querySelectorAll('.ex'),
      function (host) {
        var on = (host.getAttribute('data-hi') || '').split(',');
        var text = host.getAttribute('data-pw') || EXAMPLE;
        host.textContent = '';
        for (var i = 0; i < text.length; i++)
          host.appendChild(el('span',
            on.indexOf(String(i)) >= 0 ? 'on' : '', text.charAt(i)));
      });
  }

  var ROM_AT = 0x0671D730;
  function drawRom() {
    var host = $('rom');
    if (!host) return;
    host.textContent = '';
    for (var r = 0; r < 4; r++) {
      var row = el('div', null, null);
      row.appendChild(el('span', 'at',
        (ROM_AT + r * 8).toString(16).toUpperCase().padStart(8, '0')));
      var bytes = [];
      for (var c = 0; c < 8; c++)
        bytes.push(RE.LEVEL_TABLE[r * 8 + c].toString(16)
                   .toUpperCase().padStart(2, '0'));
      row.appendChild(el('b', null, bytes.join(' ')));
      row.appendChild(el('span', 'lv',
        T('how.rom.lv', { a: r * 8 + 1, b: r * 8 + 8 })));
      host.appendChild(row);
    }
  }

  function drawInterleave() {
    var host = $('ilv');
    host.textContent = '';
    ORDER.forEach(function (c) {
      host.appendChild(el('b', null, NAMES[LANG][c]));
      var slots = el('div', 'slots');
      RE.PATTERN[c].split('').forEach(function (which) {
        slots.appendChild(el('span', which === 'A' ? 'a'
                                   : which === 'B' ? 'b' : '', which));
      });
      host.appendChild(slots);
    });
  }

  ['en', 'ja'].forEach(function (l) {
    $('l-' + l).addEventListener('click', function (e) {
      if (e && e.preventDefault) e.preventDefault();
      LANG = l; applyLang(); setPath();
    });
  });

  var PAGES = ['gen', 'dec', 'codes', 'how'];
  var pageNow = 'gen', leaving = null;
  function showPage(name, focus, quiet) {
    var from = quiet ? null : pageNow;
    pageNow = name;
    PAGES.forEach(function (other) {
      var on = other === name;
      $('p-' + other).classList.toggle('on', on);
      if (on) $('n-' + other).setAttribute('aria-current', 'page');
      else $('n-' + other).removeAttribute('aria-current');
    });
    setTune(false);
    document.body.setAttribute('data-page', name);
    fitNames();
    if (name === 'dec' && focus) $('dec').focus();

    if (from && from !== name) {
      if (leaving) clearTimeout(leaving);
      PAGES.forEach(function (p) {
        $('p-' + p).classList.remove('leaving');
        $('p-' + p).classList.remove('after');
      });
      $('p-' + from).classList.add('leaving');
      $('p-' + name).classList.add('after');
      leaving = setTimeout(function () {
        leaving = null;
        $('p-' + from).classList.remove('leaving');
      }, 260);
    }
  }
  PAGES.forEach(function (name) {
    $('n-' + name).addEventListener('click', function (e) {
      if (e && e.preventDefault) e.preventDefault();
      showPage(name, true);
      setPath();
    });
  });

  function plate(b, i) {
    var full = NAMES[LANG][i];
    var m = /^(.*?)\s*\((.*)\)$/.exec(full);
    b.textContent = '';
    b.appendChild(el('span', 'nm', (m ? m[1] : full).toUpperCase()));
    var kana = el('span', 'kana', m ? m[2] : '');
    kana.setAttribute('lang', 'ja');
    b.appendChild(kana);
  }

  var PICKERS = ['chars'];
  PICKERS.forEach(function (id) {
    var host = $(id);
    ORDER.forEach(function (i) {
      var b = el('a', 'char');
      plate(b, i);
      b.id = id + '-c' + i;
      b.setAttribute('aria-pressed', i === st.character ? 'true' : 'false');
      b.addEventListener('click', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        pickChar(i);
        setPath();
      });
      host.appendChild(b);
    });
  });

  function pickChar(i) {
        st.character = i;
        document.getElementById('app').setAttribute('data-char', CHAR_SLUG[i]);
        document.body.setAttribute('data-char', CHAR_SLUG[i]);
        var b0 = best(0);
        if (b0) {
          st.level = 32; st.points = b0.points;
          st.granted = b0.granted; st.shield = b0.shield;
          $('lv').value = 32; $('vs').value = b0.points;
        }
        PICKERS.forEach(function (other) {
          Array.prototype.forEach.call($(other).children, function (c, k) {
            c.setAttribute('aria-pressed', ORDER[k] === i ? 'true' : 'false');
          });
        });
        applyKeys(); render(); decode(); renderCodes();
        drawSpecialNote();
  }

  var URL_LANG = { en: 'en', ja: 'jp' };
  var LANG_OF = { en: 'en', jp: 'ja', ja: 'ja' };

  function langOfHost() {
    var host = (window.location && window.location.hostname) || '';
    return /warzard/i.test(host) ? 'ja' : 'en';
  }
  var URL_CHAR = {
    en: ['leo', 'kenji', 'tessa', 'mai-ling'],
    ja: ['leo', 'mukuro', 'tabasa', 'tao']
  };
  var URL_PAGE = { gen: 'password', codes: 'special',
                   dec: 'analyze', how: 'how-it-works' };
  var URL_WAS = { analyse: 'dec' };
  var URL_SHAPES = ['/:lang/:who/password', '/:lang/:who/special',
                    '/:lang/analyze', '/:lang/how-it-works',
                    '/:who/password', '/:who/special',
                    '/analyze', '/how-it-works',
                    '/:lang/analyse', '/analyse'];
  var ROUTED = !!(window.location && window.history && window.history.pushState
                  && /^https?:$/.test(window.location.protocol));

  function pathFor(page, character, lang) {
    return '/' + URL_LANG[lang] + ((page === 'gen' || page === 'codes')
         ? '/' + URL_CHAR[lang][character] + '/' + URL_PAGE[page]
         : '/' + URL_PAGE[page]);
  }

  var CANON = 'https://redearthpassword.vercel.app';

  function describePage() {
    var page = document.body.getAttribute('data-page') || 'gen';
    var path = pathFor(page, st.character, LANG);
    var set = function (id, attr, v) {
      var n = $(id);
      if (n) n.setAttribute(attr, v);
    };
    document.title = T('seo.' + page + '.t') + ' | ' + T('seo.suffix');
    set('m-desc', 'content', T('seo.' + page + '.d'));
    set('m-canon', 'href', CANON + path);
    set('m-alt-en', 'href', CANON + pathFor(page, st.character, 'en'));
    set('m-alt-ja', 'href', CANON + pathFor(page, st.character, 'ja'));
    set('m-alt-x', 'href', CANON + pathFor(page, st.character, 'en'));
    set('m-og-title', 'content', document.title);
    set('m-og-desc', 'content', T('seo.' + page + '.d'));
    set('m-og-url', 'content', CANON + path);
  }

  function linkUp() {
    PAGES.forEach(function (name) {
      var a = $('n-' + name);
      if (a && a.setAttribute) a.setAttribute('href', pathFor(name, st.character, LANG));
    });
    ['en', 'ja'].forEach(function (l) {
      var a = $('l-' + l);
      var p = document.body.getAttribute('data-page') || 'gen';
      if (a && a.setAttribute) a.setAttribute('href', pathFor(p, st.character, l));
    });
    PICKERS.forEach(function (id) {
      var host = $(id);
      if (!host) return;
      var p = document.body.getAttribute('data-page') || 'gen';
      var page = (p === 'gen' || p === 'codes') ? p : 'gen';
      ORDER.forEach(function (i, k) {
        var a = host.children[k];
        if (a && a.setAttribute) a.setAttribute('href', pathFor(page, i, LANG));
      });
    });
  }

  function setPath(replace) {
    if (!ROUTED) return;
    var url = pathFor(document.body.getAttribute('data-page') || 'gen',
                      st.character, LANG);
    if (url !== window.location.pathname)
      window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
    describePage();
    linkUp();
  }

  function charFromSlug(slug) {
    var langs = Object.keys(URL_CHAR), i, at;
    for (i = 0; i < langs.length; i++) {
      at = URL_CHAR[langs[i]].indexOf(slug);
      if (at >= 0) return at;
    }
    return -1;
  }

  var booted = false;
  function goToPath() {
    if (!ROUTED) return;
    var parts = window.location.pathname.toLowerCase().split('/')
                      .filter(function (x) { return x.length; });
    var lang = langOfHost(), said = false;
    if (parts.length && LANG_OF[parts[0]]) {
      lang = LANG_OF[parts.shift()]; said = true;
    }
    var page = 'gen', who = -1, known = said && parts.length === 0;
    if (parts.length === 1) {
      ['dec', 'how'].forEach(function (n) {
        if (parts[0] === URL_PAGE[n] || URL_WAS[parts[0]] === n) {
          page = n; known = true;
        }
      });
    } else if (parts.length === 2) {
      who = charFromSlug(parts[0]);
      ['gen', 'codes'].forEach(function (n) {
        if (parts[1] === URL_PAGE[n] && who >= 0) { page = n; known = true; }
      });
      if (!known) who = -1;
    }
    if (lang !== LANG) { LANG = lang; applyLang(); }
    if (who >= 0 && who !== st.character) pickChar(who);
    showPage(page, false, !booted);
    booted = true;
    document.documentElement.removeAttribute('data-boot');
    setPath(true);
  }

  var cache = {};
  function best(which) {
    var k = st.character + ':' + which;
    if (!cache[k]) cache[k] = RE.bestLoadout(st.character, which);
    return cache[k];
  }
  function showing(which) {
    var t = RE.bestTargets(st.character)[which];
    var b = cache[st.character + ':' + which];
    return !!t && !!b && st.level === 32 && st.points === b.points &&
           st.granted === t.granted && st.shield === t.shield;
  }
  function apply(which) {
    var b = best(which);
    if (!b) return;
    st.level = 32; st.points = b.points;
    st.granted = b.granted; st.shield = b.shield;
    $('lv').value = 32; $('vs').value = b.points;
    render();
  }
  var NOTE = [['note.leo0', 'note.leo1'],
              ['note.kenji0', 'note.kenji1'],
              ['note.other'], ['note.other']];
  function renderPresets() {
    var host = $('presets');
    host.textContent = '';
    RE.bestTargets(st.character).forEach(function (t, i) {
      var b = el('button', 'preset', T(t.key));
      b.type = 'button';
      b.setAttribute('aria-pressed', showing(i) ? 'true' : 'false');
      b.addEventListener('click', function () { apply(i); });
      var wrap = el('span', 'tip', null);
      var box = el('span', 'tipbox', T(NOTE[st.character][i]));
      box.id = 'preset-tip-' + i;
      b.setAttribute('aria-describedby', box.id);
      wrap.appendChild(b);
      wrap.appendChild(box);
      host.appendChild(wrap);
    });
    var row = $('tune-row');
    row.textContent = '';
    row.appendChild(tuneButton());
    row.appendChild(rollButton());
  }

  var EL_KEY = { fire: 'el.fire', ice: 'el.ice', lightning: 'el.lightning',
                 poison: 'el.poison', wind: 'el.wind' };

  function statsUpTo(character, level) {
    var atk = 0, def = 0, res = {}, order = [];
    for (var lv = 1; lv <= level; lv++) {
      var g = RE.progressionAt(character, lv, 'en').gained || '';
      g.split(/[,+]/).forEach(function (part) {
        var t = part.trim();
        if (/Attacking Power Increased/i.test(t)) { atk++; return; }
        if (/Defensive Power Increased/i.test(t)) { def++; return; }
        var m = /Resistant\s+(?:to\s+)?(\w+)/i.exec(t);
        if (!m) return;
        var key = m[1].toLowerCase();
        if (!EL_KEY[key]) return;
        if (res[key] === undefined) { res[key] = 0; order.push(key); }
        res[key]++;
      });
    }
    return { atk: atk, def: def, res: res, order: order };
  }

  function options() {
    var out = RE.GRANTS[st.character].map(function (g) {
      return { bit: g[0], name: g[1], note: (LANG === 'en' ? g[2] : '') || '',
               shield: false };
    });
    if (st.character === 0) out.push({ bit: 0, name: 'Legendary Shield', shield: true });
    return out;
  }

  function render() {
    if (editing !== $('lv-num')) $('lv-num').value = st.level;
    if (editing !== $('vs-num')) $('vs-num').value = st.points;
    Array.prototype.forEach.call($('vs-quick').children, function (b) {
      b.setAttribute('aria-pressed', +b.textContent === st.points ? 'true' : 'false');
    });
    renderPresets();

    var list = RE.generate(st.character, st.level, st.points), map = {};
    list.forEach(function (o) { map[o.granted + ':' + o.shield] = o; });

    var opts = options(), reach = {};
    list.forEach(function (o) {
      opts.forEach(function (opt) {
        if (opt.shield ? o.shield : (o.granted & opt.bit)) reach[opt.name] = true;
      });
    });

    var asked = { granted: st.granted, shield: st.shield };
    var use = { granted: st.granted, shield: st.shield };
    opts.forEach(function (opt) {
      if (reach[opt.name]) return;
      if (opt.shield) use.shield = 0; else use.granted &= ~opt.bit;
    });
    if (!map[use.granted + ':' + use.shield]) {
      var fit = null;
      list.forEach(function (o) {
        var keep = bits(o.granted & use.granted) + ((o.shield && use.shield) ? 1 : 0);
        var spare = bits(o.granted & ~use.granted) + ((o.shield && !use.shield) ? 1 : 0);
        if (!fit || keep > fit.keep || (keep === fit.keep && spare < fit.spare)) {
          fit = { o: o, keep: keep, spare: spare };
        }
      });
      if (fit) { use.granted = fit.o.granted; use.shield = fit.o.shield; }
    }
    var dropped = namesOf(opts, asked).filter(function (n) {
      return namesOf(opts, use).indexOf(n) < 0;
    });

    function canAdd(opt) {
      var g = opt.shield ? use.granted : (use.granted | opt.bit);
      var sh = opt.shield ? 1 : use.shield;
      return !!map[g + ':' + sh];
    }

    var host = $('toggles'), blocked = [];
    host.textContent = '';
    opts.forEach(function (opt, i) {
      var on = opt.shield ? !!use.shield : !!(use.granted & opt.bit);
      var free = on || canAdd(opt);
      var lab = el('label', 'toggle' + (free ? '' : ' off'));
      if (!free) {
        lab.setAttribute('title',
          T(reach[opt.name] ? 'toggle.combo' : 'toggle.level'));
      }
      var box = el('input');
      box.type = 'checkbox';
      box.id = 'g-' + st.character + '-' + i;
      box.checked = on;
      box.disabled = !free;
      box.addEventListener('change', function () {
        if (opt.shield) st.shield = box.checked ? 1 : 0;
        else if (box.checked) st.granted |= opt.bit;
        else st.granted &= ~opt.bit;
        quietly();
      });
      lab.appendChild(box);
      var nm = el('span', null, jp(opt.name));
      if (opt.note) nm.appendChild(el('i', 'note', opt.note));
      lab.appendChild(nm);
      host.appendChild(lab);
      if (!free && reach[opt.name]) blocked.push(opt.name);
    });
    $('combonote').textContent = blocked.length
      ? T('toggle.blocked', { what: blocked.join(', ') }) : '';

    var p = RE.progressionAt(st.character, st.level, LANG), bits = [];
    if (p.title) bits.push(p.title);
    RE.loadout(st.character, st.level, use.granted, use.shield).gear
      .forEach(function (item) { bits.push(item); });
    var g = $('gained');
    g.textContent = '';

    function line(label, body) {
      var d = el('div');
      d.appendChild(el('b', null, label));
      d.appendChild(document.createTextNode(body));
      g.appendChild(d);
      return d;
    }

    line(T('at.level', { lv: st.level }),
         bits.length ? jp(bits.join(', ')) : T('gear.none'));

    line(T('at.gained'), p.gained ? jpLevel(p.gained) : T('at.nothing'));

    if (p.announced) {
      var wrong = el('div', 'wrong',
        T('at.announced', { said: jpLevel(p.announced) }));
      g.appendChild(wrong);
    }

    line(T('at.moves'), p.moves.length
      ? p.moves.map(function (m) { return jp(m.name) + ' (' + m.level + ')'; }).join(', ')
      : T('at.nomoves'));

    var stat = statsUpTo(st.character, st.level), power = [];
    if (stat.atk) power.push(T('at.attack') + ' +' + stat.atk);
    if (stat.def) power.push(T('at.defence') + ' +' + stat.def);
    line(T('at.power'), power.length ? power.join(', ') : T('at.nopower'));
    line(T('at.resist'), stat.order.length
      ? stat.order.map(function (k) {
          return T(EL_KEY[k]) + ' +' + stat.res[k];
        }).join(', ')
      : T('at.noresist'));

    renderOut(map, list, dropped, use);

    $('all-sum').textContent = T('all.sum', { n: list.length });
    var all = $('all');
    all.textContent = '';
    list.slice().sort(function (p, q) {
      var pm = p.granted | (p.shield ? 0x100 : 0);
      var qm = q.granted | (q.shield ? 0x100 : 0);
      var pn = bitsIn(pm), qn = bitsIn(qm);
      if (pn !== qn) return pn - qn;
      return pm - qm;
    }).forEach(function (o) {
      var r = el('div');
      r.appendChild(el('span', 'g',
        o.description === 'nothing' ? T('all.nothing') : jp(o.description)));
      r.appendChild(el('span', null, text(o.digits)));
      all.appendChild(r);
    });
  }

  function bitsIn(mask) {
    var n = 0;
    while (mask) { n += mask & 1; mask >>>= 1; }
    return n;
  }

  function carrying(use) {
    var l = RE.loadout(st.character, st.level, use.granted, use.shield);
    var parts = [];
    if (l.gear.length) parts.push(l.gear.join(T('out.and')));
    if (l.extras.length) parts.push((l.gear.length ? T('carry.plus') : '') + l.extras.join(', '));
    return parts.length ? parts.join(', ') + '.' : T('carry.none');
  }

  function renderOut(map, list, dropped, eff) {
    var outEl = $('out'), hit = map[eff.granted + ':' + eff.shield];
    outEl.textContent = '';
    outEl.className = 'out' + (hit ? '' : ' bad');
    if (!hit) {
      outEl.appendChild(el('div', 'pw small', T('out.none')));
      outEl.appendChild(el('div', 'said', list.length
        ? T('out.untick', { n: list.length }) : T('out.nothing')));
      return;
    }
    var sp = RE.spellings(st.character, st.level, st.points, eff.granted, eff.shield);
    var use = sp ? sp.best : hit;
    var pwText = text(use.digits);
    var pwEl = el('div', cascade ? 'pw' : 'pw still', pwText);
    outEl.appendChild(pwEl);
    if (!LESS_MOTION) {
      if (cascade) {
        if (pwText !== lastPw) { pwStop(); play(pwEl, GLYPHS); }
      } else {
        churn(pwEl, pwText, pwText !== lastPw ? lastPw : null);
      }
    }
    lastPw = pwText;
    outEl.appendChild(chips(use.digits));
    var said = el('div', 'said');
    said.appendChild(el('b', null,
      who() + ', ' + T('lbl.level').toLowerCase() + ' ' + st.level + '. '));
    said.appendChild(document.createTextNode(jp(carrying(use))));
    outEl.appendChild(said);

    if (sp && sp.count > 1) {
      var alts = el('details', 'alts');
      var sum = el('summary', 'more', T('out.same', { n: sp.count }));
      alts.appendChild(sum);
      var box = el('div', 'all');
      sp.all.forEach(function (o, i) {
        var row = el('div');
        row.appendChild(el('span', null, text(o.digits)));
        row.appendChild(el('span', 'g', i === 0 ? T('out.easiest') : ''));
        box.appendChild(row);
      });
      alts.appendChild(box);
      outEl.appendChild(alts);
    } else {
      outEl.appendChild(el('div', 'said onlyone', T('out.only')));
    }

    var note = el('div', 'said note');
    if (dropped && dropped.length) {
      note.appendChild(el('b', null, T('out.adjusted')));
      note.appendChild(document.createTextNode(T('out.reach', {
        x: jp(dropped.join(T('out.and'))),
        v: T(dropped.length > 1 ? 'out.are' : 'out.is'),
        lv: st.level, vs: st.points
      })));
    }
    outEl.appendChild(note);
  }

  var editing = null;
  var cascade = true;
  function quietly() {
    cascade = false;
    try { render(); } finally { cascade = true; }
  }

  function clamp(v, lo, hi, step) {
    v = Math.round(v / step) * step;
    return Math.max(lo, Math.min(hi, v));
  }
  function bind(name, key, lo, hi, step) {
    var slider = $(name), box = $(name + '-num');
    slider.addEventListener('pointerdown', function () { pwHold(true); });
    slider.addEventListener('input', function () {
      st[key] = +slider.value;
      quietly();
    });
    box.addEventListener('input', function () {
      var raw = parseInt(box.value, 10);
      if (isNaN(raw)) return;
      st[key] = clamp(raw, lo, hi, step);
      slider.value = st[key];
      editing = box;
      quietly();
      editing = null;
    });
    box.addEventListener('blur', function () {
      box.value = st[key];
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') box.blur();
    });
  }
  bind('lv', 'level', 1, 32, 1);
  bind('vs', 'points', 0, 9990, 10);

  function bindRange(minId, maxId, lo, hi, step) {
    var a = $(minId), b = $(maxId);
    function settle(moved) {
      var na = parseInt(a.value, 10); if (isNaN(na)) na = lo;
      var nb = parseInt(b.value, 10); if (isNaN(nb)) nb = hi;
      var va = clamp(na, lo, hi, step), vb = clamp(nb, lo, hi, step);
      if (va > vb) { if (moved === a) vb = va; else va = vb; }
      a.value = va;
      b.value = vb;
    }
    [a, b].forEach(function (box) {
      box.addEventListener('change', function () { settle(box); });
      box.addEventListener('blur', function () { settle(box); });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') box.blur();
      });
    });
  }
  bindRange('r-lv-min', 'r-lv-max', 1, 32, 1);
  bindRange('r-vs-min', 'r-vs-max', 0, 9990, 10);

  [0, 1000, 1500, 2500, 3000, 5000, 7770, 9990].forEach(function (v) {
    var b = el('button', null, String(v));
    b.type = 'button';
    b.addEventListener('click', function () {
      st.points = v;
      $('vs').value = v;
      quietly();
    });
    $('vs-quick').appendChild(b);
  });

  function parse(s) {
    var out = [], i, c;
    for (i = 0; i < s.length; i++) {
      c = s[i];
      if (c === ' ' || c === '-') continue;
      if (c >= '1' && c <= '6') out.push(c.charCodeAt(0) - 48);
      else if (c === 'Y' || c === 'y') out.push(7);
      else if (c === 'M' || c === 'm') out.push(8);
      else return null;
    }
    return out;
  }
  function say(bad, head, lines, digits) {
    var v = $('verdict');
    v.className = 'out' + (bad ? ' bad' : '');
    v.textContent = '';
    v.appendChild(el('div', 'pw small', head));
    if (digits) v.appendChild(chips(digits));
    (lines || []).forEach(function (l) {
      var d = el('div', 'said');
      d.appendChild(el('b', null, l[0] + ': '));
      d.appendChild(document.createTextNode(l[1]));
      v.appendChild(d);
    });
  }
  var EXAMPLES = {};
  function example() {
    if (EXAMPLES[st.character]) return EXAMPLES[st.character];
    var all = RE.generate(st.character, 16, 1000), o, sp, d;
    if (!all.length) return '';
    o = all[0];
    sp = RE.spellings(st.character, 16, 1000, o.granted, o.shield);
    d = (sp && sp.best ? sp.best.digits : o.digits).join('');
    EXAMPLES[st.character] = d.slice(0, 5) + ' ' + d.slice(5);
    return EXAMPLES[st.character];
  }

  function verdict(bad, head, lines, digits, character) {
    var v = el('div', 'out' + (bad ? ' bad' : ''));
    if (character !== undefined) v.setAttribute('data-char', CHAR_SLUG[character]);
    v.appendChild(el('div', 'pw small', head));
    if (digits) v.appendChild(chips(digits, character));
    (lines || []).forEach(function (l) {
      var d = el('div', 'said');
      d.appendChild(el('b', null, l[0] + ': '));
      d.appendChild(document.createTextNode(l[1]));
      v.appendChild(d);
    });
    $('verdict').appendChild(v);
  }

  function decode() {
    var host = $('verdict');
    host.textContent = '';
    var s = $('dec').value.trim();
    $('dec').placeholder = example();
    if (!s) {
      verdict(false, T('dec.waiting'),
              [[T('dec.try'), T('dec.example', { pw: example(), who: who() })]]);
      return;
    }
    var d = parse(s);
    if (!d) { verdict(true, T('dec.only')); return; }
    if (d.length !== 10) { verdict(true, T('dec.ten', { n: d.length })); return; }

    var found = 0, special = null;
    for (var c = 0; c < 4; c++) {
      var r = RE.decode(c, d);
      if (r.error) continue;
      if (r.special) {
        if (!r.unknown) special = { c: c, r: r };
        continue;
      }
      found++;
      var l = RE.loadout(c, r.level, r.granted, r.shield);
      var lines = [[T('lbl.level'), String(r.level)], [T('lbl.vs'), String(r.points)]];
      if (l.gear.length) lines.push([T('lbl.gear'), jp(l.gear.join(T('out.and')))]);
      lines.push([T('lbl.extras'),
                  l.extras.length ? jp(l.extras.join(', ')) : T('lbl.none')]);
      verdict(false, T('dec.accepted', { who: NAMES[LANG][c] }), lines, d, c);
    }
    if (special) {
      verdict(false, special.r.name,
              [[T('lbl.character'), NAMES[LANG][special.c]],
               [T('lbl.effect'), special.r.note]], d, special.c);
      found++;
    }
    if (!found) verdict(true, T('dec.nobody'), null, d);
  }
  $('dec').addEventListener('input', decode);

  var ALL_CODES = RE.specialCodes();
  var SPECIAL_SLUG = {
    'Level locked at 1, score held at zero': 'locked',
    'Power Fight Mode': 'power',
    'Ultimate Battle Mode': 'ultimate',
    'Jump to the staff roll': 'credits'
  };
  function renderCodes() {
    var host = $('codes');
    host.textContent = '';
    ALL_CODES.filter(function (s) { return s.character === st.character; })
      .forEach(function (s) {
        var slug = SPECIAL_SLUG[s.name];
        var box = el('div', 'code');
        box.appendChild(el('div', 'n', slug ? T('sp.' + slug) : s.name));
        box.appendChild(el('div', 'p', text(s.digits)));
        box.appendChild(chips(s.digits, undefined, host.children.length * 70));
        box.appendChild(el('div', 'd', slug ? T('sp.' + slug + '.d') : s.note));
        host.appendChild(box);
      });
  }

  (function () {
    var b = best(0);
    if (b) {
      st.level = 32; st.points = b.points;
      st.granted = b.granted; st.shield = b.shield;
      $('lv').value = 32; $('vs').value = b.points;
    }
  })();

  applyLang();
  render();
  decode();
  renderCodes();
  fitNames();
  if (document.fonts && document.fonts.load) {
    var refit = function () { fittedAt = 0; fitNames(true); };
    document.fonts.load('700 100px "Public Pixel"').then(refit, refit);
  }
  function churn(host, truth, before) {
    var node = firstText(host);
    if (!node) return;
    pwNode = node; pwTruth = truth;
    if (before !== null) {
      var i;
      for (i = 0; i < truth.length; i++) {
        if (truth.charAt(i) !== ' ' && truth.charAt(i) !== before.charAt(i))
          pwHot[i] = 1;
      }
      pwUntil = (new Date()).getTime() + PW_TAIL;
      if (!pwTimer) pwTimer = setInterval(pwTick, PW_TICK);
      pwTick();
    }
    if (!pwTimer) pwNode.data = pwTruth;
  }

  function pwTick() {
    if (!pwHeld && (new Date()).getTime() >= pwUntil) { pwStop(); return; }
    var out = '', i;
    for (i = 0; i < pwTruth.length; i++) {
      out += pwHot[i]
        ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        : pwTruth.charAt(i);
    }
    if (pwNode) pwNode.data = out;
  }

  function pwStop() {
    if (pwTimer) clearInterval(pwTimer);
    pwTimer = null; pwHot = []; pwHeld = false;
    if (pwNode) pwNode.data = pwTruth;
  }

  function pwHold(on) {
    pwHeld = on;
    if (!on) pwUntil = (new Date()).getTime() + PW_TAIL;
  }
  function firstText(node) {
    if (node.nodeType === 3) return /\S/.test(node.data) ? node : null;
    if (node.getAttribute && node.getAttribute('aria-hidden') === 'true')
      return null;
    for (var i = 0; i < node.childNodes.length; i++) {
      var got = firstText(node.childNodes[i]);
      if (got) return got;
    }
    return null;
  }

  function play(host, glyphs) {
    var node = firstText(host);
    if (!node || !KNOWN_CH.test(node.data)) return null;
    var was = node.data, n = was.length, i;
    if (!n || n > 48) return null;
    if (!node.parentNode) return null;

    if (running) running.finish();

    var box = document.createElement('span'), cells = [];
    box.className = 'scr';
    for (i = 0; i < n; i++) {
      var cell = document.createElement('i');
      cell.textContent = was.charAt(i);
      if (was.charAt(i) !== ' ') cell.style.opacity = '0';
      box.appendChild(cell);
      cells.push(cell);
    }

    var pin = 0;
    if (document.createRange) {
      var range = document.createRange();
      range.selectNodeContents(node);
      if (range.getClientRects().length === 1)
        pin = range.getBoundingClientRect().width;
    }
    if (pin) {
      box.style.display = 'inline-block';
      box.style.width = pin + 'px';
    }
    node.parentNode.replaceChild(box, node);

    var step = 0, last = n + FLICKS, timer = null, over = false;
    function finish() {
      if (over) return;
      over = true;
      if (timer) clearInterval(timer);
      if (box.parentNode)
        box.parentNode.replaceChild(document.createTextNode(was), box);
      if (running && running.host === host) running = null;
    }
    running = { host: host, finish: finish };

    timer = setInterval(function () {
      step++;
      if (step >= last) { finish(); return; }
      for (var k = 0; k < n; k++) {
        var c = was.charAt(k), from = k + 1, cell = cells[k];
        if (c === ' ') continue;
        cell.style.opacity = step < from ? '0' : '1';
        cell.style.setProperty('--blk', step === from ? '1' : '0');
        cell.textContent = (step >= from && step < from + FLICKS)
          ? wrongGlyph(c, glyphs) : c;
      }
    }, STEP);
    return finish;
  }

  function scramble(host) {
    if (armed === host) return;
    var finish = play(host, GLYPHS);
    if (!finish) return;
    armed = host;
    function leave() {
      finish();
      if (armed === host) armed = null;
      host.removeEventListener('mouseleave', leave);
    }
    host.addEventListener('mouseleave', leave);
  }

  var SCRAMBLES = '.nav a, .preset, .lang, .quick button, .tune-tab,'
                + ' .toggle, .tune-shut';
  if (document.addEventListener && !LESS_MOTION) {
    document.addEventListener('mouseover', function (e) {
      var host = e.target && e.target.closest && e.target.closest(SCRAMBLES);
      if (host) scramble(host);
    });
  }

  if (window.addEventListener) {
    window.addEventListener('pointerup', function () { pwHold(false); });
    window.addEventListener('pointercancel', function () { pwHold(false); });
    window.addEventListener('blur', function () { pwHold(false); });
  }

  goToPath();
  if (ROUTED) window.addEventListener('popstate', goToPath);

  if (window.ResizeObserver) {
    new ResizeObserver(function () { fitNames(); }).observe($('chars'));
  } else {
    window.addEventListener('resize', function () { fitNames(true); });
  }
})();
