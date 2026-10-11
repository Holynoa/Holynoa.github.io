/* ============================================================
   HOLYNOA toys: paint.exe and destroy.exe
   Loaded only when someone opens one of them from the footer.
   ============================================================ */
(() => {
  "use strict";
  if (window.HNToys) return;
  const DE = document.documentElement;
  const css = (v) => getComputedStyle(DE).getPropertyValue(v).trim();
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------------- paint.exe ---------------- */
  const PAL = ["#080708", "#8f8780", "#ff6fcf", "#2a3a7a", "#3b6fe0", "#e8412f", "#f4c430", "#3fa45b", "#efe8de"];
  const TOOLS = [
    ["pencil", "Pencil"], ["brush", "Brush"], ["spray", "Spray"], ["fill", "Fill"], ["eraser", "Eraser"],
  ];
  let paintWin = null;
  function paint() {
    if (paintWin) { paintWin.classList.remove("is-min"); paintWin.focus(); return; }
    const LW = 300, LH = 200;   // the picture is drawn in real, chunky pixels
    const w = h(`
      <section class="toywin paint" role="dialog" aria-label="paint.exe" tabindex="-1">
        <header class="toywin__bar" data-cursor="drag">
          <span class="toywin__name">paint.exe</span><span class="toywin__file">untitled.bmp</span>
          <button type="button" class="toywin__x" aria-label="Close" data-cursor="close">close</button>
        </header>
        <div class="paint__row">
          <div class="paint__tools" role="toolbar" aria-label="Tools">
            ${TOOLS.map(([k, n], i) => `<button type="button" class="tg${i === 0 ? " is-on" : ""}" data-tool="${k}">${n}</button>`).join("")}
          </div>
          <div class="paint__sizes">${["S", "M", "L"].map((n, i) => `<button type="button" class="tg${i === 1 ? " is-on" : ""}" data-size="${[1, 3, 6][i]}">${n}</button>`).join("")}</div>
        </div>
        <canvas class="paint__cv" width="${LW}" height="${LH}"></canvas>
        <footer class="paint__foot">
          <div class="paint__pal" role="radiogroup" aria-label="Colours">${PAL.map((c, i) => `<button type="button" class="paint__sw${i === 0 ? " is-on" : ""}" style="--c:${c}" data-col="${c}" aria-label="${c}"></button>`).join("")}</div>
          <div class="paint__acts"><button type="button" class="tg" data-act="clear">New</button><button type="button" class="tg" data-act="save">Save .png</button></div>
        </footer>
      </section>`);
    document.body.appendChild(w);
    paintWin = w;
    const cv = w.querySelector("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true });
    const clear = () => { ctx.fillStyle = "#efe8de"; ctx.fillRect(0, 0, LW, LH); };
    clear();
    const st = { tool: "pencil", size: 3, color: "#080708", down: false, lx: 0, ly: 0, spray: 0 };

    // place it a little off-centre, like a window someone left open
    const vw = innerWidth, vh = innerHeight;
    const ww = Math.min(vw - 24, 680);
    w.style.width = ww + "px";
    w.style.left = Math.max(12, (vw - ww) / 2 + rnd(-40, 40)) + "px";
    w.style.top = Math.max(70, vh * 0.16 + rnd(-20, 20)) + "px";

    const pos = (e) => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * LW), Math.floor((e.clientY - r.top) / r.height * LH)]; };
    const dot = (x, y, s, c) => { ctx.fillStyle = c; const o = Math.floor(s / 2); ctx.fillRect(x - o, y - o, s, s); };
    const line = (x0, y0, x1, y1, s, c) => {
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
      for (let n = 0; n < 2000; n++) {
        dot(x0, y0, s, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
      }
    };
    const sprayAt = (x, y) => { const r = st.size * 3 + 4; ctx.fillStyle = st.color; for (let i = 0; i < 10; i++) { const a = rnd(0, 6.283), d = Math.sqrt(Math.random()) * r; ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d), 1, 1); } };
    const fill = (x, y) => {
      const im = ctx.getImageData(0, 0, LW, LH), d = im.data, k0 = (y * LW + x) * 4;
      const t = [d[k0], d[k0 + 1], d[k0 + 2]];
      const c = st.color.match(/\w\w/g).map((v) => parseInt(v, 16));
      if (t[0] === c[0] && t[1] === c[1] && t[2] === c[2]) return;
      const same = (k) => d[k] === t[0] && d[k + 1] === t[1] && d[k + 2] === t[2];
      const stack = [[x, y]];
      while (stack.length) {
        const [px, py] = stack.pop();
        if (px < 0 || py < 0 || px >= LW || py >= LH) continue;
        const k = (py * LW + px) * 4;
        if (!same(k)) continue;
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
        stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
      }
      ctx.putImageData(im, 0, 0);
    };
    const size = () => (st.tool === "brush" ? st.size * 2 + 1 : st.tool === "eraser" ? st.size * 3 + 3 : st.size);
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      const [x, y] = pos(e); st.down = true; st.lx = x; st.ly = y;
      if (st.tool === "fill") { fill(x, y); st.down = false; return; }
      if (st.tool === "spray") { sprayAt(x, y); const go = () => { if (!st.down) return; sprayAt(st.lx, st.ly); st.spray = requestAnimationFrame(go); }; go(); return; }
      dot(x, y, size(), st.tool === "eraser" ? "#efe8de" : st.color);
    });
    cv.addEventListener("pointermove", (e) => {
      if (!st.down) return;
      if (e.pointerType === "mouse" && !(e.buttons & 1)) { up(); return; }   // the button was let go somewhere we didn't hear about
      const [x, y] = pos(e);
      if (x < -40 || y < -40 || x > LW + 40 || y > LH + 40) return;   // ignore stray synthetic moves far off the paper
      if (st.tool === "pencil" || st.tool === "brush" || st.tool === "eraser") line(st.lx, st.ly, x, y, size(), st.tool === "eraser" ? "#efe8de" : st.color);
      st.lx = x; st.ly = y;
    });
    function up() { st.down = false; cancelAnimationFrame(st.spray); }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up);

    const pick = (sel, el) => { w.querySelectorAll(sel).forEach((b) => b.classList.toggle("is-on", b === el)); };
    w.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tool) { st.tool = b.dataset.tool; pick("[data-tool]", b); }
      else if (b.dataset.size) { st.size = +b.dataset.size; pick("[data-size]", b); }
      else if (b.dataset.col) { st.color = b.dataset.col; pick(".paint__sw", b); if (st.tool === "eraser") { st.tool = "pencil"; pick("[data-tool]", w.querySelector('[data-tool="pencil"]')); } }
      else if (b.dataset.act === "clear") clear();
      else if (b.dataset.act === "save") {
        const o = document.createElement("canvas"); o.width = LW * 4; o.height = LH * 4;
        const x = o.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(cv, 0, 0, o.width, o.height);
        o.toBlob((bl) => { const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "holynoa-paint.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); });
      } else if (b.classList.contains("toywin__x")) { w.remove(); paintWin = null; }
    });
    drag(w, w.querySelector(".toywin__bar"));
    w.focus();
  }

  // windows can be dragged by their title bar
  function drag(win, bar) {
    let sx = 0, sy = 0, ox = 0, oy = 0, on = false;
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      on = true; bar.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop;
    });
    bar.addEventListener("pointermove", (e) => {
      if (!on) return;
      win.style.left = Math.min(innerWidth - 60, Math.max(-win.offsetWidth + 80, ox + e.clientX - sx)) + "px";
      win.style.top = Math.min(innerHeight - 40, Math.max(0, oy + e.clientY - sy)) + "px";
    });
    const end = () => (on = false);
    bar.addEventListener("pointerup", end); bar.addEventListener("pointercancel", end);
  }

  /* ---------------- destroy.exe ---------------- */
  let D = null;
  function destroy(at) {
    if (D) return;
    // the screen holds still while it is being broken: no scrolling the page out from under the damage
    window.HNLenis?.stop(); DE.style.overflow = "hidden"; getSelection()?.removeAllRanges();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const layer = h(`<canvas class="destroy__cv" aria-hidden="true"></canvas>`);
    const fx = h(`<canvas class="destroy__fx" aria-hidden="true"></canvas>`);
    const bugs = h(`<canvas class="destroy__fx destroy__bugs" aria-hidden="true"></canvas>`);   // crisp, full resolution, for the pixel termites
    const bar = h(`
      <div class="destroy__bar" role="toolbar" aria-label="destroy.exe">
        <span class="destroy__name">destroy.exe</span>
        <button type="button" class="tg is-on" data-t="hammer">Hammer</button>
        <button type="button" class="tg" data-t="gun">Gun</button>
        <button type="button" class="tg" data-t="fire">Fire</button>
        <button type="button" class="tg" data-t="termites">Termites</button>
        <button type="button" class="tg" data-t="bomb">Pixel bomb</button>
        <button type="button" class="tg" data-t="stamp">Stamp</button>
        <span class="destroy__sep"></span>
        <button type="button" class="tg" data-act="fix">Fix it</button>
        <button type="button" class="tg" data-act="exit">Close</button>
      </div>`);
    document.body.append(layer, fx, bugs, bar);
    document.body.classList.add("is-destroying");
    const ctx = layer.getContext("2d"), fctx = fx.getContext("2d"), bctx = bugs.getContext("2d");
    const size = () => {
      // keep what was broken when the window changes size
      const keepImg = layer.width ? ctx.getImageData(0, 0, layer.width, layer.height) : null;
      layer.width = innerWidth * dpr; layer.height = innerHeight * dpr;
      fx.width = innerWidth; fx.height = innerHeight;   // soft fire does not need retina pixels
      bugs.width = innerWidth * dpr; bugs.height = innerHeight * dpr;
      if (keepImg) ctx.putImageData(keepImg, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.setTransform(1, 0, 0, 1, 0, 0); bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size(); addEventListener("resize", size);
    D = { layer, fx, bugs, bar, tool: "hammer", down: false, parts: [], raf: 0, gunT: 0, stampN: 0, size };

    const pink = css("--pink") || "#ff6fcf";
    // shake the page and the damage, but never <body> itself: a transform there would unpin the fixed layers
    const shake = (n) => {
      const kf = [{ transform: "translate(0,0)" }, { transform: `translate(${rnd(-n, n)}px,${rnd(-n, n)}px)` }, { transform: `translate(${rnd(-n, n)}px,${rnd(-n, n)}px)` }, { transform: "translate(0,0)" }];
      [...document.body.children].forEach((el) => {
        if (el.matches("script,style,.destroy__bar,.cursor,.toywin,.pix,.loader,.dark,.crt,.grain")) return;
        el.animate(kf, { duration: 160, easing: "steps(3)" });
      });
    };

    /* the glass cracks the way the old Desktop Destroyer drew it: tapered ink strokes that branch
       like twigs, a crushed chip at the impact, a web of short rings between the main cracks.
       Bone ink on the dark void, black ink when the lights are on */
    const lightsOn = () => DE.dataset.lights === "on";
    const ink = () => (lightsOn() ? "12,11,12" : "239,232,222");
    const shade = () => (lightsOn() ? "255,255,255" : "0,0,0");
    // one jagged crack: a list of points walking away from (x, y), drifting a little at every step
    const walk = (x, y, a, len, step, wob) => {
      const pts = [[x, y]]; let d = 0;
      while (d < len) { a += Math.random() < 0.25 ? rnd(-0.4, 0.4) : rnd(-wob, wob); const s = rnd(step * 0.6, step * 1.4); x += Math.cos(a) * s; y += Math.sin(a) * s; d += s; pts.push([x, y]); }
      return pts;
    };
    // a list of strokes, each drawn thick at the root and thin at the tip, with branches growing off it
    const grow = (out, x, y, a, len, w, depth, d0) => {
      const pts = walk(x, y, a, len, 14, 0.05);
      out.push({ pts, w, d0 });
      if (depth <= 0) return;
      const nb = depth > 1 ? 1 + ((Math.random() * 3) | 0) : Math.random() < 0.6 ? 1 + ((Math.random() * 2) | 0) : 0;
      for (let i = 0; i < nb; i++) {
        const k = 2 + ((Math.random() * (pts.length - 3)) | 0); if (!pts[k]) continue;
        const [bx, by] = pts[k], pa = Math.atan2(pts[k][1] - pts[k - 1][1], pts[k][0] - pts[k - 1][0]);
        const t = k / pts.length;
        grow(out, bx, by, pa + (Math.random() < 0.5 ? -1 : 1) * rnd(0.35, 0.9), len * (1 - t) * rnd(0.35, 0.7), w * (1 - t) * 0.75, depth - 1, d0 + len * t);
      }
    };
    const strokeTapered = (c, s, from, upto) => {
      const n = s.pts.length;
      for (let i = 1; i < n; i++) {
        const d = s.d0 + i * 14;   // roughly how far this piece is from the hit, so the crack runs outwards
        if (d <= from) continue;
        if (d > upto) break;
        const t = i / n, lw = Math.max(0.4, s.w * (1 - t * 0.9));
        c.lineWidth = lw; c.beginPath(); c.moveTo(s.pts[i - 1][0], s.pts[i - 1][1]); c.lineTo(s.pts[i][0], s.pts[i][1]); c.stroke();
      }
    };
    // draw a crack in a few frames so it visibly runs out from the hit
    const drawCrack = (strokes, chips, R) => {
      const I = ink(), S = shade(), frames = 6;
      let f = 0, prev = 0;
      const tick = () => {
        if (!D) return;
        f++; const upto = f === frames ? 1e9 : (f / frames) ** 1.4 * (R + 10);
        ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
        // a soft shade under every line so the crack reads over the title and the objects
        ctx.strokeStyle = `rgba(${S},0.55)`; ctx.translate(1, 1);
        strokes.forEach((s) => strokeTapered(ctx, s, prev, upto)); ctx.translate(-1, -1);
        ctx.strokeStyle = `rgba(${I},0.95)`;
        strokes.forEach((s) => strokeTapered(ctx, s, prev, upto));
        if (f === 1) chips();
        ctx.restore();
        prev = upto;
        if (f < frames) requestAnimationFrame(tick);
      };
      tick();
    };
    // the crushed spot at the impact: glass gone white and powdery, outlined chips, a few loose flakes
    const crushed = (x, y, r) => {
      const I = ink(), S = shade();
      const n = 9 + ((Math.random() * 5) | 0), rim = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + rnd(-0.2, 0.2); const q = r * rnd(0.55, 1.25); rim.push([x + Math.cos(a) * q, y + Math.sin(a) * q]); }
      ctx.beginPath(); rim.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
      ctx.fillStyle = `rgba(${I},${lightsOn() ? 0.06 : 0.16})`; ctx.fill();
      // powder
      for (let i = 0; i < 160; i++) { const a = rnd(0, 6.283), d = r * Math.sqrt(Math.random()) * 1.05; ctx.fillStyle = `rgba(${I},${rnd(0.15, 0.6)})`; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, rnd(0.6, 1.6), rnd(0.6, 1.6)); }
      // the chips: little facets from the centre to the rim, and the rim itself
      ctx.strokeStyle = `rgba(${S},0.5)`; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.strokeStyle = `rgba(${I},0.95)`; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.lineWidth = 0.8;
      rim.forEach(([px, py], i) => {
        if (Math.random() < 0.35) return;
        const mx = x + (px - x) * rnd(0.1, 0.45), my = y + (py - y) * rnd(0.1, 0.45);
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(px, py); const q = rim[(i + 1) % n]; ctx.lineTo(mx + (q[0] - mx) * 0.4, my + (q[1] - my) * 0.4); ctx.stroke();
      });
      // a dark pit right where it hit
      ctx.fillStyle = `rgba(${lightsOn() ? "12,11,12" : "0,0,0"},0.85)`;
      ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283, d = r * rnd(0.12, 0.28); i ? ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } ctx.closePath(); ctx.fill();
      return rim;
    };

    function crack(x, y) {
      const R = rnd(130, 240), r0 = rnd(22, 34), n = 7 + ((Math.random() * 4) | 0), strokes = [];
      const base = rnd(0, 6.283), angs = [];
      for (let i = 0; i < n; i++) angs.push(base + (i / n) * 6.283 + rnd(-0.25, 0.25));
      angs.forEach((a) => grow(strokes, x + Math.cos(a) * r0, y + Math.sin(a) * r0, a, R * rnd(0.4, 1), rnd(2.8, 4.4), 2, 0));
      // the spider web: short jagged rings that join neighbouring cracks near the centre
      [rnd(0.22, 0.32), rnd(0.42, 0.55)].forEach((k, ri) => {
        angs.forEach((a, i) => {
          if (Math.random() < (ri ? 0.6 : 0.35)) return;
          const b = angs[(i + 1) % n] + (i === n - 1 ? 6.283 : 0), rr = R * k * rnd(0.85, 1.15);
          const p0 = [x + Math.cos(a) * rr, y + Math.sin(a) * rr], p1 = [x + Math.cos(b) * rr * rnd(0.85, 1.15), y + Math.sin(b) * rr * rnd(0.85, 1.15)]; const pts = [p0]; for (let j = 1; j < 3; j++) pts.push([p0[0] + (p1[0] - p0[0]) * j / 3 + rnd(-4, 4), p0[1] + (p1[1] - p0[1]) * j / 3 + rnd(-4, 4)]); pts.push(p1);
          strokes.push({ pts, w: rnd(1, 1.6), d0: rr - 30 });
        });
      });
      hitTermites(x, y, 34, "squash");
      drawCrack(strokes, () => crushed(x, y, r0), R);
      shards(x, y, 14, lightsOn() ? ["#0c0b0c", "#8f8780"] : ["#efe8de", "#ffffff", "#8f8780"], 1, 3);
      shake(6);
    }

    // a bullet hole: a black pit, a white crushed ring, short cracks
    function hole(x, y) {
      const r = rnd(5, 8), strokes = [], n = 4 + ((Math.random() * 5) | 0);
      for (let i = 0; i < n; i++) { const a = rnd(0, 6.283); grow(strokes, x + Math.cos(a) * r, y + Math.sin(a) * r, a, rnd(10, 38), rnd(0.9, 1.6), Math.random() < 0.4 ? 1 : 0, 0); }
      hitTermites(x, y, 14, "shot");
      drawCrack(strokes, () => crushed(x, y, r), 40);
      flash(x, y);
      // spent shells fly out of the right side
      D.parts.push({ x: D.x + 30, y: D.y + 6, vx: rnd(140, 260), vy: rnd(-380, -240), s: 3, w: 6, c: "#c9a14a", t: 0, life: 0.9 });
      run();
      shake(2);
    }

    function bomb(x, y) {
      // the screen falls apart into pixels and leaves a ragged hole into the void
      const G = 8, R = rnd(46, 74);
      hitTermites(x, y, R, "gone");
      ctx.save();
      for (let gy = -R; gy <= R; gy += G) for (let gx = -R; gx <= R; gx += G) {
        const d = Math.hypot(gx, gy) / R + rnd(-0.18, 0.18);
        if (d > 1) continue;
        const bx = Math.round((x + gx) / G) * G, by = Math.round((y + gy) / G) * G;
        ctx.fillStyle = d > 0.86 ? (Math.random() < 0.5 ? pink : "#2a2427") : "#050405";
        ctx.fillRect(bx, by, G, G);
      }
      ctx.restore();
      const cols = [pink, "#efe8de", "#8f8780", "#efe8de"];
      for (let i = 0; i < 70; i++) {
        const a = rnd(0, 6.283), v = rnd(120, 520);
        D.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - rnd(80, 260), s: [4, 6, 8][(Math.random() * 3) | 0], c: cols[(Math.random() * cols.length) | 0], t: 0, life: rnd(0.7, 1.4) });
      }
      run();
      shake(9);
    }

    const STAMPS = ["HOLYNOA", "CONNECTION LOST", "CHRONICALLY ONLINE", "404", "SEEN"];
    function stamp(x, y) {
      const txt = STAMPS[D.stampN++ % STAMPS.length];
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rnd(-0.35, 0.35));
      ctx.font = `30px "Lingo Pixel", monospace`;
      const w = ctx.measureText(txt).width + 30, hh = 50;
      ctx.globalAlpha = 0.86;
      ctx.strokeStyle = pink; ctx.lineWidth = 4; ctx.strokeRect(-w / 2, -hh / 2, w, hh);
      ctx.fillStyle = pink; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, 0, 2);
      // worn ink
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 90; i++) ctx.fillRect(rnd(-w / 2, w / 2), rnd(-hh / 2, hh / 2), rnd(1, 4), rnd(1, 3));
      ctx.restore();
      shake(3);
    }

    function shards(x, y, n, cols, smin, smax) {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 6.283), v = rnd(60, 240);
        D.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, s: Math.round(rnd(smin, smax)), c: cols[(Math.random() * cols.length) | 0], t: 0, life: rnd(0.4, 0.8) });
      }
      run();
    }

    /* ---------- fire: fireballs that stay and keep burning, like the old flamethrower ---------- */
    const FLAME_COLS = ["255,246,200", "255,207,58", "255,122,26", "200,38,26"];
    const sprites = FLAME_COLS.map((c) => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 64;
      const g = cv.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${c},1)`); gr.addColorStop(0.55, `rgba(${c},0.85)`); gr.addColorStop(0.8, `rgba(${c},0.3)`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return cv;
    });
    D.fires = []; D.flames = []; D.termites = []; D.hover = false;
    function ignite(x, y) {
      // the burn mark stays on the glass even after "Fix it" stops the flames
      ctx.save();
      const r = rnd(18, 30), g = ctx.createRadialGradient(x, y + 4, 0, x, y + 4, r * 1.6);
      g.addColorStop(0, "rgba(24,12,6,0.55)"); g.addColorStop(0.6, "rgba(24,12,6,0.25)"); g.addColorStop(1, "rgba(24,12,6,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y + 4, r * 1.6, 0, 6.283); ctx.fill(); ctx.restore();
      D.fires.push({ x, y, t: 0, s: rnd(0.85, 1.25), acc: 0 });
      hitTermites(x, y, 30, "burn");
      if (D.fires.length > 24) D.fires.slice(0, D.fires.length - 24).forEach((f) => (f.die = f.die || f.t));
      D.lastFire = [x, y];
      run();
    }
    const emit = (x, y, s, n) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 6.283), k = Math.sqrt(Math.random());   // k: how far out from the heart of the fire
        D.flames.push({ x: x + Math.cos(a) * k * 18 * s, y: y + Math.sin(a) * k * 15 * s, vx: Math.cos(a) * k * 30, vy: rnd(-120, -40) * s, r: rnd(4, 11) * s * (1.3 - k * 0.5), t: 0, life: rnd(0.25, 0.55), k });
      }
    };

    // little hard-edged bits: glass chips, shells, the muzzle flash
    function flash(x, y) { D.parts.push({ kind: "flash", x, y, t: 0, life: 0.07, a: rnd(0, 6.283) }); run(); }

    /* ---------- termites: pixel bugs that crawl out of a hole and eat the screen ---------- */
    // drawn pixel by pixel, head up. a antenna tip, A antenna, m mandible, H head edge, h head, o head light,
    // n neck, d dark segment, b abdomen, t abdomen stripe
    const BUG = [
      "..a.......a..", "...a.....a...", "...A.....A...", "....A...A....",
      "....mHHHm....", "...HhhhhhH...", "...HhooohH...", "...HhhhhhH...", "....HhhhH....",
      ".....nnn.....", "....dnnnd....", "....bbbbb....", "...btttttb...", "...dbbbbbd...",
      "...btttttb...", "...dbbbbbd...", "...btttttb...", "....dbbbd....", "....btttb....",
      ".....dbd.....", "......d......",
    ];
    // two leg poses for the left side (the right side mirrors them in the opposite pose)
    const LEGS = [
      [[2, 8], [1, 7], [1, 6], [0, 5], [3, 10], [2, 10], [1, 11], [0, 12], [2, 13], [1, 14], [1, 15], [0, 16]],
      [[2, 8], [1, 8], [0, 7], [0, 6], [3, 10], [2, 11], [1, 12], [1, 13], [2, 14], [1, 15], [0, 16], [0, 17]],
    ];
    const BUG_COL = { a: "#f2c9a0", A: "#5a1c10", m: "#3a0f08", H: "#6b2010", h: "#d8541e", o: "#f08a3c", n: "#8a3a1e", d: "#6e3018", b: "#a8582e", t: "#e0a874", l: "#8c2f1c" };
    const CHAR_COL = { a: "#5a5450", A: "#1a1716", m: "#0d0b0a", H: "#1d1918", h: "#3a3330", o: "#4a423d", n: "#2a2523", d: "#191615", b: "#2e2826", t: "#4d4540", l: "#221e1c" };
    const bugFrame = (pose, cols) => {
      const cv = document.createElement("canvas"); cv.width = 13; cv.height = 21;
      const g = cv.getContext("2d");
      BUG.forEach((row, y) => [...row].forEach((c, x) => { if (cols[c]) { g.fillStyle = cols[c]; g.fillRect(x, y, 1, 1); } }));
      g.fillStyle = cols.l;
      LEGS[pose].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      LEGS[1 - pose].forEach(([x, y]) => g.fillRect(12 - x, y, 1, 1));
      return cv;
    };
    const BUGS = [bugFrame(0, BUG_COL), bugFrame(1, BUG_COL)], CHARRED = bugFrame(0, CHAR_COL);
    const BUG_K = 1.7;   // screen pixels per sprite pixel

    function nest(x, y) {
      // a small hole gets chewed open first, then they crawl out of it one at a time
      ctx.save();
      ctx.fillStyle = "#060506";
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283, d = rnd(4, 7); i ? ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } ctx.closePath(); ctx.fill();
      for (let i = 0; i < 14; i++) { const a = rnd(0, 6.283), d = rnd(7, 13); ctx.fillStyle = `rgba(${lightsOn() ? "70,52,32" : "214,196,168"},${rnd(0.25, 0.6)})`; ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, rnd(0.8, 1.6), rnd(0.8, 1.6)); }
      ctx.restore();
      const n = 6 + ((Math.random() * 4) | 0);
      let wait = rnd(0.2, 0.5);
      for (let i = 0; i < n && D.termites.length < 60; i++) {
        D.termites.push({ x, y, a: rnd(0, 6.283), turn: 0, v: rnd(24, 40), ph: rnd(0, 6), pause: 0, bite: rnd(3.2, 4.4), t: -wait, life: rnd(26, 38), dead: null });
        wait += rnd(0.25, 0.9);
      }
      run();
    }
    function drawTermite(m, img, alpha = 1, sx = 1, sy = 1, c = bctx) {
      c.save();
      c.globalAlpha = alpha; c.imageSmoothingEnabled = false;
      c.translate(Math.round(m.x), Math.round(m.y)); c.rotate(Math.round((m.a + Math.PI / 2) / (Math.PI / 8)) * (Math.PI / 8)); c.scale(BUG_K * sx, BUG_K * sy);
      c.drawImage(img, -6.5, -10.5);
      c.restore();
    }
    // a bug under the hammer or a bullet: a smear of blood with the flattened body in it
    function squash(m, big) {
      const r = big ? rnd(10, 14) : rnd(6, 9);
      ctx.save();
      ctx.fillStyle = "rgba(168,16,24,0.95)";
      ctx.beginPath();
      for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.283, d = r * rnd(0.65, 1.3); i ? ctx.lineTo(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d) : ctx.moveTo(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(96,6,12,0.85)";
      ctx.beginPath(); ctx.arc(m.x + rnd(-2, 2), m.y + rnd(-2, 2), r * 0.45, 0, 6.283); ctx.fill();
      // droplets thrown off the impact
      for (let i = 0; i < (big ? 12 : 6); i++) {
        const a = rnd(0, 6.283), d = r * rnd(1.3, 2.8), s = rnd(0.8, 2.2);
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? "176,18,26" : "118,10,16"},0.92)`;
        ctx.beginPath(); ctx.arc(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d, s, 0, 6.283); ctx.fill();
      }
      ctx.restore();
      drawTermite(m, BUGS[0], 0.85, 1.35, 0.6, ctx);
      m.dead = { kind: "gone", t: 0 };
    }
    function burn(m) { m.dead = { kind: "burn", t: 0 }; }
    // the other tools reach the bugs too
    function hitTermites(x, y, r, how) {
      D.termites.forEach((m) => {
        if (m.dead || m.t < 0 || Math.hypot(m.x - x, m.y - y) > r) return;
        if (how === "burn") burn(m); else if (how === "squash") squash(m, true); else if (how === "shot") squash(m, false);
        else m.dead = { kind: "gone", t: 0 };
      });
    }

    let last = 0;
    function run() {
      if (D.raf) return;
      last = performance.now();
      const step = (now) => {
        if (!D) return;
        const dt = Math.min(0.033, (now - last) / 1000); last = now;
        fctx.clearRect(0, 0, innerWidth, innerHeight);
        if (D.termites.length || D.bugsDirty) { bctx.clearRect(0, 0, innerWidth, innerHeight); D.bugsDirty = D.termites.length > 0; }
        const light = lightsOn();

        // flames
        D.fires = D.fires.filter((f) => !(f.die !== undefined && f.t - f.die > 0.7));
        D.fires.forEach((f) => {
          f.t += dt;
          const boost = 1 + Math.max(0, 0.8 - f.t) * 0.9;                // a flare-up when it catches
          const fade = f.die !== undefined ? Math.max(0, 1 - (f.t - f.die) / 0.7) : 1;
          f.acc += dt * 200 * f.s * boost * fade;
          const k = f.acc | 0; f.acc -= k; if (D.flames.length < 1400) emit(f.x, f.y, f.s * boost, k);
        });
        if (D.tool === "fire" && D.hover && !D.down) { if (Math.random() < 0.7) D.flames.push({ x: D.x + rnd(-2, 2), y: D.y, vx: rnd(-6, 6), vy: rnd(-70, -30), r: rnd(2, 5), t: 0, life: rnd(0.2, 0.35), k: 0.2 }); }
        D.flames = D.flames.filter((q) => (q.t += dt) < q.life);
        if (D.fires.length) {
          // a warm glow under each fire
          fctx.globalCompositeOperation = light ? "multiply" : "lighter";
          D.fires.forEach((f) => { fctx.globalAlpha = light ? 0.25 : 0.22; fctx.drawImage(sprites[2], f.x - 46 * f.s, f.y - 56 * f.s, 92 * f.s, 92 * f.s); });
        }
        fctx.globalCompositeOperation = light ? "source-over" : "lighter";
        D.flames.forEach((q) => {
          q.vx += rnd(-40, 40) * dt; q.vy -= 30 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
          const u = q.t / q.life + q.k * 0.35, ci = u < 0.12 ? 0 : u < 0.38 ? 1 : u < 0.72 ? 2 : 3, rr = q.r * (1 - u * 0.55);
          fctx.globalAlpha = Math.max(0, 1 - q.t / q.life) * (light ? 0.6 : 0.5);
          fctx.drawImage(sprites[ci], q.x - rr, q.y - rr, rr * 2, rr * 2);
        });
        fctx.globalCompositeOperation = "source-over";
        // termites: they wander, stop now and then, and eat a ragged tunnel through whatever is under them
        if (D.termites.length) {
          ctx.save();
          D.termites = D.termites.filter((m) => (m.t += dt) < m.life && !(m.dead && (m.dead.kind === "gone" || m.dead.t > 1.4)));
          D.termites.forEach((m) => {
            if (m.t < 0) return;                       // still down in the hole
            if (m.dead) {
              // burning: it curls up, smokes and goes black, then leaves a little scorch
              m.dead.t += dt;
              const u = m.dead.t / 1.4;
              if (u < 0.45 && D.flames.length < 1400) emit(m.x, m.y, 0.35, 2);
              drawTermite(m, u < 0.25 ? BUGS[0] : CHARRED, 1 - u * u, 1 - u * 0.25, 1 - u * 0.25);
              if (m.dead.t + dt > 1.4 && !m.dead.mark) {
                m.dead.mark = true;
                ctx.fillStyle = "rgba(20,14,10,0.7)"; ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, 6.283); ctx.fill();
              }
              return;
            }
            // walking into a fire is the end of it
            if (D.fires.some((f) => f.die === undefined && Math.hypot(f.x - m.x, f.y - m.y) < 26 * f.s)) { burn(m); return; }
            if (m.pause > 0) { m.pause -= dt; }
            else {
              m.turn += rnd(-6, 6) * dt; m.turn *= 1 - 2.5 * dt;
              m.a += m.turn * dt * 3;
              const W = innerWidth, H = innerHeight, mg = 40;
              if (m.x < mg || m.x > W - mg || m.y < mg || m.y > H - mg) { const ta = Math.atan2(H / 2 - m.y, W / 2 - m.x); m.a += Math.sin(ta - m.a) * 4 * dt; }
              const sp = m.v * Math.min(1, m.t / 0.8);   // they ease out of the hole instead of shooting out
              m.x += Math.cos(m.a) * sp * dt; m.y += Math.sin(m.a) * sp * dt; m.ph += sp * dt;
              if (Math.random() < 0.25 * dt) m.pause = rnd(0.3, 1.1);
              const hx = m.x + Math.cos(m.a) * 12, hy = m.y + Math.sin(m.a) * 12;
              if (m.t > 0.6) {
                ctx.fillStyle = "#060506";
                ctx.beginPath(); ctx.arc(hx + rnd(-0.8, 0.8), hy + rnd(-0.8, 0.8), m.bite * rnd(0.85, 1.15), 0, 6.283); ctx.fill();
                if (Math.random() < 0.35) {
                  const side = Math.random() < 0.5 ? 1 : -1, o = m.bite + rnd(0.5, 2.5);
                  ctx.fillStyle = `rgba(${lightsOn() ? "70,52,32" : "214,196,168"},${rnd(0.25, 0.6)})`;
                  ctx.fillRect(hx + Math.cos(m.a + 1.57) * o * side, hy + Math.sin(m.a + 1.57) * o * side, rnd(0.6, 1.4), rnd(0.6, 1.4));
                }
              }
            }
            const fade = Math.min(1, (m.life - m.t) / 1.2, m.t / 0.3);
            drawTermite(m, BUGS[m.pause > 0 ? 0 : (Math.floor(m.ph / 4) % 2)], fade);
          });
          ctx.restore();
        }

        // chips, shells, flashes
        D.parts = D.parts.filter((p) => (p.t += dt) < p.life);
        D.parts.forEach((p) => {
          if (p.kind === "flash") {
            const g = fctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
            g.addColorStop(0, "rgba(255,255,240,1)"); g.addColorStop(0.3, "rgba(255,214,90,0.85)"); g.addColorStop(1, "rgba(255,140,40,0)");
            fctx.globalAlpha = 1; fctx.fillStyle = g; fctx.beginPath();
            for (let i = 0; i < 12; i++) { const a = p.a + (i / 12) * 6.283, d = i % 2 ? 7 : rnd(18, 30); fctx.lineTo(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d); }
            fctx.closePath(); fctx.fill();
            return;
          }
          p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          fctx.globalAlpha = 1 - (p.t / p.life) ** 2; fctx.fillStyle = p.c;
          if (p.w) { fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.t * 18); fctx.fillRect(-p.w / 2, -p.s / 2, p.w, p.s); fctx.restore(); }
          else fctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
        });
        fctx.globalAlpha = 1;
        const busy = D.parts.length || D.flames.length || D.fires.length || D.termites.length || (D.tool === "fire" && D.hover);
        D.raf = busy ? requestAnimationFrame(step) : 0;
        if (!D.raf) fctx.clearRect(0, 0, innerWidth, innerHeight);
      };
      D.raf = requestAnimationFrame(step);
    }

    /* ---------- the tool in your hand ---------- */
    const tool = h(`
      <div class="destroy__tool" aria-hidden="true">
        <svg class="destroy__hammer" width="190" height="190" viewBox="0 0 190 190">
          <defs>
            <linearGradient id="hnWood" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6b3311"/><stop offset=".4" stop-color="#c27a3e"/><stop offset=".7" stop-color="#a45d27"/><stop offset="1" stop-color="#5a2a0e"/></linearGradient>
            <linearGradient id="hnSteel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4a4a50"/><stop offset=".35" stop-color="#1d1d21"/><stop offset="1" stop-color="#08080a"/></linearGradient>
          </defs>
          <g transform="translate(150 170) rotate(-45)">
            <path d="M-6,-104 L6,-104 L7.5,-4 Q0,2 -7.5,-4 Z" fill="url(#hnWood)" stroke="rgba(0,0,0,.55)" stroke-width="1"/>
            <path d="M-2,-96 L-1,-12 M2.5,-90 L3,-30" stroke="rgba(60,25,5,.45)" stroke-width=".8" fill="none"/>
            <path d="M-40,-130 L-22,-128 L14,-127 L33,-119 L33,-111 L14,-103 L-22,-102 L-40,-100 Z" fill="url(#hnSteel)" stroke="rgba(0,0,0,.8)" stroke-width="1"/>
            <path d="M-39,-129 L-22,-127 L14,-126 L32,-118.5" stroke="rgba(255,255,255,.35)" stroke-width="1" fill="none"/>
            <path d="M-40,-130 L-36,-129.5 L-36,-100.5 L-40,-100 Z" fill="#5a5a62"/>
          </g>
        </svg>
        <svg class="destroy__aim" width="44" height="44" viewBox="-22 -22 44 44">
          <circle r="13" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="3"/>
          <circle r="13" fill="none" stroke="#efe8de" stroke-width="1.3"/>
          <path d="M-21,0 H-8 M8,0 H21 M0,-21 V-8 M0,8 V21" stroke="#efe8de" stroke-width="1.3"/>
          <rect x="-1.5" y="-1.5" width="3" height="3" fill="${pink}"/>
        </svg>
      </div>`);
    document.body.append(tool);
    D.tool_el = tool;
    const hammerSvg = tool.querySelector(".destroy__hammer");
    const place = () => { tool.style.transform = `translate(${D.x}px,${D.y}px)`; };
    const showTool = () => { tool.dataset.tool = D.tool; tool.classList.toggle("is-on", D.hover); document.body.classList.toggle("is-tooling", D.hover && /hammer|gun|fire/.test(D.tool)); };
    function swing() { hammerSvg.animate([{ transform: "rotate(16deg)" }, { transform: "rotate(-3deg)", offset: 0.35 }, { transform: "rotate(16deg)" }], { duration: 230, easing: "cubic-bezier(.3,.7,.3,1)" }); }

    const shoot = () => { if (!D || !D.down || D.tool !== "gun") return; hole(D.x + rnd(-14, 14), D.y + rnd(-14, 14)); tool.querySelector(".destroy__aim").animate([{ transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 110 }); D.gunT = setTimeout(shoot, 110); };
    layer.addEventListener("pointerdown", (e) => {
      e.preventDefault(); layer.setPointerCapture(e.pointerId);
      D.down = true; D.x = e.clientX; D.y = e.clientY; D.hover = true; place(); showTool();
      const x = e.clientX, y = e.clientY;
      if (D.tool === "hammer") { swing(); setTimeout(() => D && crack(x, y), 75); }
      else if (D.tool === "gun") shoot();
      else if (D.tool === "fire") ignite(x, y);
      else if (D.tool === "termites") nest(x, y);
      else ({ bomb, stamp })[D.tool](x, y);
    });
    layer.addEventListener("pointermove", (e) => {
      D.x = e.clientX; D.y = e.clientY; D.hover = true; place(); showTool();
      if (D.tool === "fire") {
        run();
        if (D.down && D.lastFire && Math.hypot(D.x - D.lastFire[0], D.y - D.lastFire[1]) > 52) ignite(D.x, D.y);
      }
    });
    layer.addEventListener("pointerleave", () => { if (D.down) return; D.hover = false; showTool(); });
    const up = () => { if (!D) return; D.down = false; clearTimeout(D.gunT); };
    layer.addEventListener("pointerup", up); layer.addEventListener("pointercancel", up);

    bar.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.t) { D.tool = b.dataset.t; bar.querySelectorAll("[data-t]").forEach((x) => x.classList.toggle("is-on", x === b)); layer.dataset.tool = D.tool; showTool(); }
      else if (b.dataset.act === "fix") {
        D.fires.forEach((f) => (f.die = f.die === undefined ? f.t : f.die));
        D.termites.forEach((m) => (m.life = Math.min(m.life, m.t + 1.2)));
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "steps(6)" }).onfinish = () => ctx.clearRect(0, 0, innerWidth, innerHeight);
      }
      else if (b.dataset.act === "exit") stop();
    });
    layer.dataset.tool = D.tool;
    // opened by a hit on the title: that hit already lands
    if (at) { D.x = at.x; D.y = at.y; D.hover = true; place(); showTool(); swing(); setTimeout(() => D && crack(at.x, at.y), 75); }
  }

  function stop() {
    if (!D) return;
    cancelAnimationFrame(D.raf); clearTimeout(D.gunT);
    removeEventListener("resize", D.size);
    D.layer.remove(); D.fx.remove(); D.bugs.remove(); D.bar.remove(); D.tool_el.remove();
    document.body.classList.remove("is-destroying", "is-tooling");
    DE.style.overflow = ""; window.HNLenis?.start();
    D = null;
  }

  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (D) stop();
    else if (paintWin) { paintWin.remove(); paintWin = null; }
  });

  window.HNToys = { paint, destroy };
})();
