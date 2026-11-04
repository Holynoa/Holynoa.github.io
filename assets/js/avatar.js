/* ============================================================
   Pixel Noa, 20 x 30 cells, after a reference Noa picked.
   "#" ink, "." paper inside the figure, "p" pink, " " outside.
   Used next to the resume on the About page and in the PDF.
   ============================================================ */
window.AVATAR = [
    "      ########      ",
    "    ############    ",
    "   ##############   ",
    "  ################  ",
    "  ################  ",
    " ################## ",
    " ################## ",
    "####################",
    "####################",
    "#.####.###.#######.#",
    "#.##...###.##...##.#",
    "#..#.##......##.#..#",
    "##.#..#......#..#.##",
    "####..#......#..####",
    "#####p........p#####",
    "######........######",
    "####################",
    "######..#..#..######",
    "#####....##....#####",
    "####..#..#...#..####",
    " ####.#......#.#### ",
    " ##..#...#....#..## ",
    "  #..#........#.#.# ",
    "  #..#...#....#..#  ",
    "   ###........###   ",
    "     #........#     ",
    "     ##########     ",
    "     ####  ####     ",
    "     ####  ####     ",
    "     #..#  #..#     ",
    "      ##    ##      "
];

/* Builds an <svg>. grid: draw the faint graph-paper lines and a paper tile behind the figure. */
window.avatarSVG = function ({ grid = false, pad = 2 } = {}) {
  const R = window.AVATAR, W = R[0].length, H = R.length;
  const INK = "#080708", PAPER = "#f4efe7", PINK = "#ff6fcf", LINE = "#ddd6cb";
  const vw = W + pad * 2, vh = H + pad * 2;
  let out = "";
  if (grid) {
    out += `<rect width="${vw}" height="${vh}" fill="${PAPER}"/><g stroke="${LINE}" stroke-width="0.06">`;
    for (let x = 0; x <= vw; x++) out += `<line x1="${x}" y1="0" x2="${x}" y2="${vh}"/>`;
    for (let y = 0; y <= vh; y++) out += `<line x1="0" y1="${y}" x2="${vw}" y2="${y}"/>`;
    out += "</g>";
  }
  // one rect per run of the same cell
  R.forEach((row, y) => {
    let x = 0;
    while (x < W) {
      const c = row[x];
      let e = x + 1;
      while (e < W && row[e] === c) e++;
      const fill = c === "#" ? INK : c === "p" ? PINK : c === "." ? PAPER : null;
      if (fill) out += `<rect x="${x + pad}" y="${y + pad}" width="${e - x}" height="1" fill="${fill}"/>`;
      x = e;
    }
  });
  return `<svg class="px-noa" viewBox="0 0 ${vw} ${vh}" shape-rendering="crispEdges" role="img" aria-label="Pixel Noa: long black hair with bangs, winged liner, white shirt, black pants">${out}</svg>`;
};
