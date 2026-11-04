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
    "##########.#########",
    "#.####.###.####.##.#",
    "#.##...##..#....##.#",
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

/* Builds an <svg>.
   outline: add a 1-cell contour (class px-noa__line, coloured from CSS) so black hair reads on a dark page.
   grid: draw faint graph-paper lines and a paper tile behind the figure. */
window.avatarSVG = function ({ grid = false, pad = 2, outline = false } = {}) {
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
  if (outline) {
    const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? R[y][x] : " ");
    out += `<g class="px-noa__line">`;
    for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
      if (at(x, y) !== " ") continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) !== " ")) out += `<rect x="${x + pad}" y="${y + pad}" width="1" height="1"/>`;
    }
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
