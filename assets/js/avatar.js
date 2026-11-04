/* ============================================================
   Noa as a pixel character, drawn by hand, one pixel at a time.
   32 x 40 cells. Used by the CV page and by the PDF resume.
   Legend: . empty  H hair  h hair shine  S skin  s skin shade  b blush
           E eyeliner  W eye white  I iris  P piercing  L lips  l lip shade
           T top  t tattoo  N necklace
   ============================================================ */
window.AVATAR = {
  rows: [
    "............HHHHHHHH............",
    "..........HHHHHHHHHHHH..........",
    "........HHHHHhhHHHHHHHHH........",
    ".......HHHHhhHHHHHHHHHHHH.......",
    "......HHHhhHHHHHHHHHHHHHHH......",
    "......HHhHHHHHHHHHHHHHHhHH......",
    ".....HHhHHHHHHHHHHHHHHHHhHH.....",
    ".....HHHHHHHHHHHHHHHHHHHHHH.....",
    ".....HHHHHHHHHHHHHHHHHHHHHH.....",
    ".....HHHHHHHSHHHHHSHHHSHHHH.....",
    ".....HHHHHESSSSSSSSPSPEHHHH.....",
    ".....HHHHHEEEEESSSEEEEEHHHH.....",
    ".....HHHHHsWIIWSSSWIIWsHHHH.....",
    ".....HHHHHsSssSSSSSssSsHHHH.....",
    ".....HHHHHsSSSSSSSSSSPsHHHH.....",
    ".....HHHHHsbbSSSsSSSbbsHHHH.....",
    ".....HHHHHsSSSSsPsSSSSsHHHH.....",
    ".....HHHHsSSSSSSSSSSSSSsHHH.....",
    ".....HHHHsSSSSPLLLPSSSSsHHH.....",
    ".....HHHHsSSSSSlPlSSSSSsHHH.....",
    ".....HHHHHSSSSSSSSSSSSSHHHH.....",
    ".....HHHHHHSSSSSSSSSSSHHHHH.....",
    ".....HHHHHHHSSSSSSSSSHHHHHH.....",
    ".....HHHHHHHHSSSSSSSHHHHHHH.....",
    "....HHHHHHHHSSSSSSSSHHHHHHHH....",
    "....HHHHHHHHSNSSSSNSHHHHHHHH....",
    "...HHHHHHHHTSSNNNNSSTHHHHHHHH...",
    "...HHHHHHHTTTSSSSSSTTTHHHHHHH...",
    "..THHHHHHTTTTTSSSSTTTTTHHHHHHT..",
    "..TTHHHHHTTTTTTTTTTTTTTHHHHHTT..",
    ".TTTTHHHHTTTTTTTTTTTTTTHHHHTTT..",
    ".SttSSHHHTTTTTTTTTTTTTTHHHSSSS..",
    ".SStSSHHTTTTTTTTTTTTTTTTHHSStS..",
    ".SSttSSHTTTTTTTTTTTTTTTTHSSttS..",
    ".SSSttSTTTTTTTTTTTTTTTTTTSSStS..",
    ".StSSSSTTTTTTTTTTTTTTTTTTSSSSS..",
    ".SttSSSTTTTTTTTTTTTTTTTTTSStSS..",
    ".SStSSSTTTTTTTTTTTTTTTTTTSSSSS..",
    ".SSSSSSTTTTTTTTTTTTTTTTTTSSSSS..",
    ".SSSSSSTTTTTTTTTTTTTTTTTTSSSSS.."
  ],
  // cells that change for a blink, and for an open mouth while talking
  blink: { 11: ".....HHHHHESSSSSSSSSSSEHHHH.....", 12: ".....HHHHHsEEEESSSEEEEsHHHH....." },
  talk: { 19: ".....HHHHsSSSSSlElSSSSSsHHH.....", 20: ".....HHHHHSSSSSlPlSSSSSHHHH....." },
  colors: {
    H: "#141114", h: "#463e48", S: "#f0d6c6", s: "#d6b4a2", b: "#ecbeba", E: "#080708", W: "#faf6f0",
    I: "#5c6846", P: "#c8ccd4", L: "#ce7884", l: "#b05c6a", T: "#221e22", t: "#2c2830", N: "#c8ccd4",
  },
};

/* Builds an <svg>. outline: colour of the 1-cell line around the figure (a CSS colour or var()). */
window.avatarSVG = function (outline) {
  const A = window.AVATAR, W = A.rows[0].length, H = A.rows.length;
  const at = (rows, x, y) => (y >= 0 && y < H && x >= 0 && x < W ? rows[y][x] : ".");
  // runs of the same cell in a row become one rect
  const runs = (rows, ys, fill) => {
    let out = "";
    ys.forEach((y) => {
      let x = 0;
      while (x < W) {
        const c = rows[y][x];
        let e = x + 1;
        while (e < W && rows[y][e] === c) e++;
        if (c !== ".") out += `<rect x="${x + 1}" y="${y + 1}" width="${e - x}" height="1" fill="${fill ? fill(c) : A.colors[c]}"/>`;
        x = e;
      }
    });
    return out;
  };
  // the outline: empty cells that touch the figure (not below it, the figure is cut off by the frame)
  let line = "";
  for (let y = -1; y < H; y++) for (let x = -1; x <= W; x++) {
    if (at(A.rows, x, y) !== ".") continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(A.rows, x + dx, y + dy) !== ".")) line += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`;
  }
  const frame = (d) => { const rows = A.rows.slice(); Object.keys(d).forEach((k) => (rows[k] = d[k])); return runs(rows, Object.keys(d).map(Number)); };
  const all = A.rows.map((_, i) => i);
  return `<svg class="px-avatar" viewBox="0 0 ${W + 2} ${H + 1}" shape-rendering="crispEdges" role="img" aria-label="Pixel portrait of Noa: black hair with bangs, winged eyeliner, piercings and tattoos">` +
    `<g fill="${outline}">${line}</g><g>${runs(A.rows, all)}</g>` +
    `<g class="px-avatar__blink">${frame(A.blink)}</g><g class="px-avatar__talk">${frame(A.talk)}</g></svg>`;
};
