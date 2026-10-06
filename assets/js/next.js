/* ============================================================
   HOLYNOA, objects in the void
   Things from past projects float around the name.
   Look at one and time stops for it.
   ============================================================ */
(() => {
  "use strict";

  const DE = document.documentElement;
  const ROOT = DE.dataset.root || "";          // path to the repo root (assets)
  const BASE = DE.dataset.base ?? ROOT;        // path to the site root (links)
  const PAGE = document.body.dataset.page;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const S = window.SITE, P = window.PROJECTS, A = window.ARCHIVE;
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const img = (f) => ROOT + "assets/img/" + f;
  const asset = (f) => ROOT + "assets/" + f;
  const objSrc = (f) => ROOT + "assets/obj/" + f;
  const url = (p) => (BASE + p) || "./";
  const pad = (n) => String(n).padStart(2, "0");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const TAU = Math.PI * 2;
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
  };

  /* ---------- glyph mixing (Lingo pixel / italic) ---------- */
  const hash = (i, seed) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); };
  function glyphs(el, { ratio = 0.3, seed = 1 } = {}) {
    const text = el.textContent;
    el.textContent = "";
    el.classList.add("glyphs");
    el.setAttribute("aria-label", text);
    let i = 0;
    text.split(/(\s+)/).forEach((chunk) => {
      if (!chunk) return;
      if (/^\s+$/.test(chunk)) { el.appendChild(document.createTextNode(" ")); return; }
      const w = document.createElement("span");
      w.className = "word";
      w.setAttribute("aria-hidden", "true");
      [...chunk].forEach((ch) => {
        const g = document.createElement("span");
        g.className = "g " + (hash(i++, seed) < ratio ? "is-it" : "is-px");
        g.textContent = ch;
        w.appendChild(g);
      });
      el.appendChild(w);
    });
    return $$(".g", el);
  }
  const flip = (g, force) => {
    const toIt = force === undefined ? g.classList.contains("is-px") : force;
    g.classList.toggle("is-it", toIt);
    g.classList.toggle("is-px", !toIt);
  };
  function flicker(gs, every = 1400, count = 1) {
    if (REDUCED || !gs.length) return;
    setInterval(() => {
      if (document.hidden) return;
      for (let k = 0; k < count; k++) {
        const g = gs[(Math.random() * gs.length) | 0];
        flip(g);
        setTimeout(() => flip(g), 180 + Math.random() * 600);
      }
    }, every);
  }
  function scrambleOnHover(el, gs) {
    if (!FINE || REDUCED) return;
    el.addEventListener("mouseenter", () => gs.forEach((g, i) => setTimeout(() => { flip(g); setTimeout(() => flip(g), 220); }, i * 28)));
  }

  /* ---------- pointer + light ---------- */
  const M = { x: innerWidth / 2, y: innerHeight * 0.45, tx: innerWidth / 2, ty: innerHeight * 0.45, in: false, touch: 0 };
  const centreLight = () => { M.tx = innerWidth / 2; M.ty = innerHeight * 0.5; };
  if (FINE) {
    addEventListener("mousemove", (e) => { M.tx = e.clientX; M.ty = e.clientY; M.in = true; }, { passive: true });
    document.addEventListener("mouseleave", () => { M.in = false; });
  } else {
    centreLight();
    addEventListener("touchmove", (e) => { const t = e.touches[0]; M.tx = t.clientX; M.ty = t.clientY; M.touch = Date.now(); }, { passive: true });
    addEventListener("touchend", () => setTimeout(() => { if (Date.now() - M.touch > 800) centreLight(); }, 900), { passive: true });
    addEventListener("resize", centreLight);
  }

  /* ============================================================
     OBJECTS
     ============================================================ */
  const OBJS = [];
  let stage = null;        // element that gets .has-focus
  let hovered = null;
  let kbFocus = null;
  let autoFocus = null;    // touch screens: objects take turns being "looked at"

  // o = {src, cm, alt}; opts = {href, label, num, kind, k, rot, depth, x, y, amp}
  function makeObj(o, opts = {}) {
    const tag = opts.href ? "a" : "div";
    const el = document.createElement(tag);
    el.className = "obj";
    if (opts.href) { el.href = opts.href; el.setAttribute("aria-label", opts.label || o.alt); }
    else el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--w", o.cm);
    if (opts.k) el.style.setProperty("--k", opts.k);
    if (opts.x != null) { el.style.setProperty("--x", opts.x); el.style.setProperty("--y", opts.y); el.classList.add("is-placed"); }
    el.innerHTML = `<div class="obj__par"><div class="obj__float"><img class="obj__img" alt="" decoding="async"></div></div>`;
    const rec = {
      el, href: opts.href || null,
      par: $(".obj__par", el), flt: $(".obj__float", el), im: $(".obj__img", el),
      rot0: opts.rot || 0, rotNow: opts.rot || 0, depth: opts.depth ?? 1,
      f: 0, focus: false, ready: false, alpha: null, aw: 0, ah: 0,
      // each object has its own slow, slightly irregular drift
      ph: [Math.random() * TAU, Math.random() * TAU, Math.random() * TAU],
      per: [17 + Math.random() * 9, 13 + Math.random() * 8, 11 + Math.random() * 7],
      amp: opts.amp ?? 1,
      cap: opts.label ? { num: opts.num || "", name: opts.label, kind: opts.kind || "" } : null,
      orbit: null, cx: 0, cy: 0, sx: 0, sy: 0,
    };
    rec.im.addEventListener("load", () => {
      rec.im.style.aspectRatio = (rec.im.naturalWidth / rec.im.naturalHeight).toFixed(4);
      alphaMap(rec);
      rec.ready = true;
      el.classList.add("is-ready");
    }, { once: true });
    rec.im.src = objSrc(o.src);
    if (opts.href) {
      el.addEventListener("focus", () => (kbFocus = rec));
      el.addEventListener("blur", () => { if (kbFocus === rec) kbFocus = null; });
    }
    OBJS.push(rec);
    return rec;
  }

  // a low-res alpha grid of the object, so hovering only counts on the object itself, not its empty box
  function alphaMap(rec) {
    const im = rec.im;
    const aw = 72, ah = Math.max(8, Math.round(72 * im.naturalHeight / im.naturalWidth));
    const c = document.createElement("canvas"); c.width = aw; c.height = ah;
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(im, 0, 0, aw, ah);
    try {
      const d = x.getImageData(0, 0, aw, ah).data;
      const a = new Uint8Array(aw * ah);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
      Object.assign(rec, { alpha: a, aw, ah });
    } catch { rec.alpha = null; }
  }

  function hitTest(rec, px, py, r) {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const w = rec.im.offsetWidth, hh = rec.im.offsetHeight;
    const a = (-rec.rotNow * Math.PI) / 180, dx = px - cx, dy = py - cy;
    const lx = dx * Math.cos(a) - dy * Math.sin(a) + w / 2, ly = dx * Math.sin(a) + dy * Math.cos(a) + hh / 2;
    if (lx < 0 || ly < 0 || lx > w || ly > hh) return false;
    if (!rec.alpha) return true;
    const u = Math.floor((lx / w) * rec.aw), v = Math.floor((ly / hh) * rec.ah);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const uu = u + i, vv = v + j;
      if (uu >= 0 && vv >= 0 && uu < rec.aw && vv < rec.ah && rec.alpha[vv * rec.aw + uu] > 60) return true;
    }
    return false;
  }
  const onScreen = (r) => r.bottom > -50 && r.top < innerHeight + 50;
  function pickAt(px, py) {
    for (let i = OBJS.length - 1; i >= 0; i--) {
      const o = OBJS[i];
      if (!o.ready) continue;
      const r = o.im.getBoundingClientRect();
      if (onScreen(r) && hitTest(o, px, py, r)) return o;
    }
    return null;
  }

  /* ---------- the orbit (home) ---------- */
  // objects travel slowly around the name, always kept clear of it
  const ORB = { el: null, t: 0, speed: TAU / 210, freeze: 0, W: 0, H: 0, ex: null };
  function measureOrbit() {
    if (!ORB.el) return;
    const hr = ORB.el.getBoundingClientRect();
    ORB.W = hr.width; ORB.H = hr.height;
    const t = $(".hero__title .word", ORB.el).getBoundingClientRect();
    const i = $(".hero__intro", ORB.el).getBoundingClientRect();
    const l = Math.min(t.left, i.left) - hr.left, r = Math.max(t.right, i.right) - hr.left;
    const top = t.top - hr.top, bot = i.bottom - hr.top;
    ORB.ex = { cx: (l + r) / 2, cy: (top + bot) / 2, hw: (r - l) / 2, hh: (bot - top) / 2 };
  }
  function orbitPos(o, now) {
    const { W, H, ex } = ORB;
    if (!ex) return;
    const small = W < 760;
    const rx = W * (small ? 0.36 : 0.41), ry = H * (small ? 0.38 : 0.39);
    const th = o.orbit.a + ORB.t;
    const ux = rx * Math.cos(th), uy = ry * Math.sin(th);
    const ow = o.im.offsetWidth, oh = o.im.offsetHeight, m = small ? 6 : 18;
    // push outward until the object clears the name and the intro
    const sx = Math.abs(ux) > 1 ? (ex.hw + ow / 2 + m) / Math.abs(ux) : 1e9;
    const sy = Math.abs(uy) > 1 ? (ex.hh + oh / 2 + m) / Math.abs(uy) : 1e9;
    const breathe = 1 + 0.05 * Math.sin(now / 1000 * TAU / o.per[0] + o.ph[0]);
    const top = small ? 70 : 64, side = 10;
    const place = (s) => {
      o.cx = clamp(ex.cx + ux * s * breathe, ow / 2 + side, W - ow / 2 - side);
      o.cy = clamp(ex.cy + uy * s * breathe, oh / 2 + top, H - oh / 2 - side);
    };
    place(Math.max(1, Math.min(sx, sy)));
    // no room on that side (the screen edge got in the way): go around the other way
    if (hitsEx(o.cx, o.cy, ow, oh, m) && Math.max(sx, sy) < 1e8) place(Math.max(1, Math.max(sx, sy)));
  }
  const hitsEx = (x, y, w, h, m = 0) => {
    const ex = ORB.ex;
    return ex && Math.abs(x - ex.cx) < ex.hw + w / 2 + m && Math.abs(y - ex.cy) < ex.hh + h / 2 + m;
  };

  // objects on the ring gently push each other apart so they never pile up
  function separate(now) {
    const ring = OBJS.filter((o) => o.orbit && o.ready);
    if (!ring.length) return;
    ring.forEach((o) => orbitPos(o, now));
    const push = new Map(ring.map((o) => [o, [0, 0]]));
    for (let i = 0; i < ring.length; i++) for (let j = i + 1; j < ring.length; j++) {
      const a = ring[i], b = ring[j];
      const dx = (b.cx + b.sx) - (a.cx + a.sx), dy = (b.cy + b.sy) - (a.cy + a.sy);
      const ox = (a.im.offsetWidth + b.im.offsetWidth) / 2 + 14 - Math.abs(dx);
      const oy = (a.im.offsetHeight + b.im.offsetHeight) / 2 + 14 - Math.abs(dy);
      if (ox > 0 && oy > 0) {
        // resolve along the axis that needs the smaller move
        if (ox < oy) { const m = ox / 2 * Math.sign(dx || 1); push.get(a)[0] -= m; push.get(b)[0] += m; }
        else { const m = oy / 2 * Math.sign(dy || 1); push.get(a)[1] -= m; push.get(b)[1] += m; }
      }
    }
    const { W, H } = ORB, top = W < 760 ? 70 : 64;
    ring.forEach((o) => {
      const [px, py] = push.get(o);
      o.sx += px * 0.12; o.sy += py * 0.12;
      o.sx *= 0.985; o.sy *= 0.985;     // drift back home when there is room
      const ow = o.im.offsetWidth / 2, oh = o.im.offsetHeight / 2;
      o.sx = clamp(o.cx + o.sx, ow + 10, W - ow - 10) - o.cx;
      o.sy = clamp(o.cy + o.sy, oh + top, H - oh - 10) - o.cy;
      // never let a push slide anything over the name or the intro
      const ex = ORB.ex, x = o.cx + o.sx, y = o.cy + o.sy, mm = 12;
      if (ex && hitsEx(x, y, ow * 2, oh * 2, mm)) {
        const needX = ex.hw + ow + mm - Math.abs(x - ex.cx), needY = ex.hh + oh + mm - Math.abs(y - ex.cy);
        const canY = y < ex.cy ? y - needY - oh >= top : y + needY + oh <= H - 10;
        if (needX < needY || !canY) o.sx += needX * Math.sign(x - ex.cx || 1);
        else o.sy += needY * Math.sign(y - ex.cy || 1);
      }
    });
  }

  /* ---------- the callout: a line out of the object, its name on the black ---------- */
  const CO = { el: null, line: null, dot: null, txt: null, obj: null, dir: 0, L: 64 };
  function makeCallout(host) {
    CO.el = h(`<div class="callout" aria-hidden="true"><i class="callout__line"></i><b class="callout__dot"></b>
      <div class="callout__txt"><span class="mono callout__num"></span><span class="callout__name"></span><span class="callout__kind"></span></div></div>`);
    host.appendChild(CO.el);
    CO.line = $(".callout__line", CO.el); CO.dot = $(".callout__dot", CO.el); CO.txt = $(".callout__txt", CO.el);
  }
  const rectsOverlap = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
  // where the anchor, the end of the line and the text land for a given direction (in hero coordinates)
  function calloutGeom(o, dir, tw, th) {
    const hr = ORB.el.getBoundingClientRect();
    const r = o.im.getBoundingClientRect();
    const cx = r.left + r.width / 2 - hr.left, cy = r.top + r.height / 2 - hr.top;
    const c = Math.cos(dir), s = Math.sin(dir);
    const ax = cx + c * r.width * 0.36, ay = cy + s * r.height * 0.36;
    const tx = ax + c * CO.L, ty = ay + s * CO.L;
    let l, t;
    if (c > 0.35) { l = tx + 10; t = ty - th / 2; }
    else if (c < -0.35) { l = tx - 10 - tw; t = ty - th / 2; }
    else { l = tx - (c >= 0 ? 0 : tw); t = s < 0 ? ty - th - 8 : ty + 8; }
    return { ax, ay, box: { l, t, r: l + tw, b: t + th }, hr };
  }
  function showCallout(o) {
    if (!CO.el) return;
    if (!o || !o.cap || !o.orbit) { CO.el.classList.remove("is-on"); CO.obj = null; return; }
    $(".callout__num", CO.el).textContent = o.cap.num;
    const nm = $(".callout__name", CO.el);
    nm.textContent = o.cap.name;
    const gs = glyphs(nm, { ratio: 0.3, seed: o.cap.name.length + 3 });
    $(".callout__kind", CO.el).textContent = o.cap.kind;
    const tw = CO.txt.offsetWidth, th = CO.txt.offsetHeight;
    // try eight directions, keep the one where the text sits on empty black
    const hr = ORB.el.getBoundingClientRect();
    const rel = (r, p) => ({ l: r.left - hr.left - p, t: r.top - hr.top - p, r: r.right - hr.left + p, b: r.bottom - hr.top + p });
    const avoid = OBJS.filter((x) => x !== o && x.ready).map((x) => rel(x.im.getBoundingClientRect(), 10));
    $$(".hero__title .word, .hero__intro, .hero__hint, .site-header nav, .brand").forEach((e) => avoid.push(rel(e.getBoundingClientRect(), 12)));
    let best = 0, bs = Infinity;
    for (let k = 0; k < 8; k++) {
      const dir = (k * TAU) / 8;
      const b = calloutGeom(o, dir, tw, th).box;
      let sc = avoid.reduce((acc, a) => acc + rectsOverlap(b, a), 0);
      const off = (Math.max(0, 8 - b.l) + Math.max(0, b.r - hr.width + 8)) * th + (Math.max(0, 8 - b.t) + Math.max(0, b.b - hr.height + 8)) * tw;
      sc += off * 4 + (k === 0 || k === 4 ? 0 : k % 2 ? 600 : 300);
      if (sc < bs) { bs = sc; best = dir; }
    }
    CO.dir = best; CO.obj = o;
    CO.el.classList.remove("is-on"); void CO.el.offsetWidth;
    placeCallout();
    CO.el.classList.add("is-on");
    if (!REDUCED) gs.forEach((g, i) => { flip(g); setTimeout(() => flip(g), 120 + i * 35); });
  }
  function placeCallout() {
    const o = CO.obj; if (!o) return;
    const g = calloutGeom(o, CO.dir, CO.txt.offsetWidth, CO.txt.offsetHeight);
    CO.line.style.transform = `translate3d(${g.ax}px,${g.ay}px,0) rotate(${CO.dir}rad)`;
    CO.line.style.width = CO.L + "px";
    CO.dot.style.transform = `translate3d(${g.ax - 3}px,${g.ay - 3}px,0)`;
    CO.txt.style.transform = `translate3d(${g.box.l}px,${g.box.t}px,0)`;
    CO.txt.style.textAlign = Math.cos(CO.dir) < -0.35 ? "right" : "left";
  }

  /* ---------- the loop ---------- */
  const darkEl = h(`<div class="dark" aria-hidden="true"></div>`);
  const L = { g: 1 };
  let cursorEl = null, cursorLabel = null, last = performance.now();

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    M.x += (M.tx - M.x) * 0.14;
    M.y += (M.ty - M.y) * 0.14;
    const ds = darkEl.style;
    ds.setProperty("--lx", M.x.toFixed(1) + "px");
    ds.setProperty("--ly", M.y.toFixed(1) + "px");
    ds.setProperty("--dk", (0.5 + (1 - L.g) * 0.35).toFixed(3));

    const hit = kbFocus || (FINE ? (M.in ? pickAt(M.tx, M.ty) : null) : autoFocus);
    if (hit !== hovered) {
      hovered = hit;
      if (stage) stage.classList.toggle("has-focus", !!hit);
      if (cursorEl) { setCursor(hit && hit.href && !hit.orbit ? "open" : null); cursorEl.classList.toggle("is-on-obj", !!(hit && hit.href)); }
      showCallout(hit);
    }

    // looking at something stops time
    ORB.freeze += ((hovered && FINE ? 1 : 0) - ORB.freeze) * 0.08;
    if (!REDUCED) ORB.t += ORB.speed * dt * (1 - ORB.freeze);

    const mx = M.x / innerWidth - 0.5, my = M.y / innerHeight - 0.5, sec = now / 1000;
    separate(now);
    for (const o of OBJS) {
      if (o.orbit) {
        if (!o.ready) continue;
        o.el.style.transform = `translate3d(${(o.cx + o.sx).toFixed(1)}px,${(o.cy + o.sy).toFixed(1)}px,0) translate(-50%,-50%)`;
      } else if (!onScreen(o.el.getBoundingClientRect())) continue;
      // a small float of its own on top of the orbit
      const a = REDUCED ? 0 : o.amp;
      const fx = Math.sin(sec * TAU / o.per[1] + o.ph[1]) * 9 * a;
      const fy = Math.sin(sec * TAU / o.per[2] + o.ph[2]) * 12 * a;
      o.rotNow = o.rot0 + (REDUCED ? 0 : Math.sin(sec * TAU / o.per[0] + o.ph[0]) * 5 * a);
      o.f += ((o === hovered ? 1 : 0) - o.f) * (REDUCED ? 1 : 0.12);
      const sc = 1 + o.f * 0.07;
      o.flt.style.transform = `translate3d(${fx.toFixed(1)}px,${fy.toFixed(1)}px,0) rotate(${o.rotNow.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      const ox = REDUCED ? 0 : mx * -16 * o.depth, oy = REDUCED ? 0 : my * -10 * o.depth;
      o.par.style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,0)`;
      const fo = o.f > 0.4;
      if (fo !== o.focus) { o.focus = fo; o.el.classList.toggle("is-focus", fo); }
    }
    if (CO.obj) placeCallout();
    requestAnimationFrame(loop);
  }

  // click anywhere on an object's visible pixels opens it
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.target.closest("a,button,input,textarea,.lightbox")) return;
    const o = pickAt(e.clientX, e.clientY);
    if (o && o.href) { e.preventDefault(); go(o.href); }
  });

  // sometimes an object doesn't hold together
  function glitches() {
    if (REDUCED) return;
    const tick = () => {
      const pool = OBJS.filter((o) => o.ready && o !== hovered && onScreen(o.el.getBoundingClientRect()));
      if (pool.length && !document.hidden) {
        const o = pool[(Math.random() * pool.length) | 0];
        o.el.classList.add("is-glitch");
        setTimeout(() => o.el.classList.remove("is-glitch"), 360);
      }
      setTimeout(tick, 5000 + Math.random() * 6000);
    };
    setTimeout(tick, 3500);
  }
  function lampStutter() {
    if (REDUCED || !hasGSAP) return;
    const run = () => {
      const tl = gsap.timeline();
      [0.25, 1, 0.5, 1].forEach((v, i) => tl.to(L, { g: v, duration: 0.05 + (i % 2) * 0.06, ease: "steps(1)" }));
      setTimeout(run, 16000 + Math.random() * 12000);
    };
    setTimeout(run, 10000);
  }

  /* ---------- images come into focus as they enter ---------- */
  const rvIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { rvIO.unobserve(e.target); e.target.classList.add("is-in"); } }), { rootMargin: "0px 0px -10% 0px" });
  const reveal = (el) => { if (REDUCED) return; el.classList.add("rv"); rvIO.observe(el); };

  /* ---------- page transition: a quiet fade to black ---------- */
  const veil = h(`<div class="veil" aria-hidden="true"></div>`);
  function go(href) {
    if (REDUCED) { location.href = href; return; }
    store.set("hn-tx", "1");
    veil.classList.add("is-on");
    setTimeout(() => (location.href = href), 380);
  }
  function transitions() {
    document.body.appendChild(veil);
    if (store.get("hn-tx") === "1" && !REDUCED) {
      veil.classList.add("is-on", "is-instant");
      requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.remove("is-on", "is-instant")));
    }
    store.set("hn-tx", "0");
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return;
      if (u.pathname === location.pathname) return;
      e.preventDefault();
      go(u.href);
    });
    addEventListener("pageshow", (e) => { if (e.persisted) veil.classList.remove("is-on"); });
  }

  /* ---------- shared chrome ---------- */
  function chrome() {
    const cur = (p) => (PAGE === p ? ' aria-current="page"' : "");
    document.body.prepend(h(`
      <header class="site-header">
        <a class="brand" href="${url("")}" aria-label="Holynoa, home"><span>Holynoa</span></a>
        <nav aria-label="Main">
          <a href="${url("")}#index"${cur("project")}>Work</a>
          <a href="${url("archive/")}"${cur("archive")}>Archive</a>
          <a href="${url("about/")}"${cur("about")}>About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>`));
    flicker(glyphs($(".brand span"), { ratio: 0.3, seed: 6 }), 2600);

    const c = document.createElement("canvas"); c.width = c.height = 180;
    const x = c.getContext("2d"), d = x.createImageData(180, 180);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    const grain = h(`<div class="grain" aria-hidden="true"></div>`);
    grain.style.backgroundImage = `url(${c.toDataURL()})`;
    document.body.append(darkEl, grain);
  }

  function footer() {
    const f = h(`
      <footer class="site-footer" id="contact">
        <p class="site-footer__big">Thank you for visiting</p>
        <div class="site-footer__grid">
          <div><span class="mono">Email</span><button type="button" data-copy="${esc(S.email)}" data-cursor="copy">${esc(S.email)}</button><span class="copy-toast mono" aria-live="polite"></span></div>
          <div><span class="mono">Phone</span><a href="tel:${esc(S.phoneHref)}">${esc(S.phone)}</a></div>
          <div><span class="mono">Instagram</span><a href="${S.instagram}" target="_blank" rel="noopener">@holynoa</a></div>
          <div><span class="mono">LinkedIn</span><a href="${S.linkedin}" target="_blank" rel="noopener">noayaakobovitz</a></div>
        </div>
        <div class="site-footer__base mono"><span>© ${new Date().getFullYear()} Noa Yaakobovitz</span><span class="timer">you have been here for 00:00:00</span></div>
      </footer>`);
    document.body.appendChild(f);
    const big = $(".site-footer__big", f);
    const gs = glyphs(big, { ratio: 0.3, seed: 9 });
    flicker(gs, 1600);
    scrambleOnHover(big, gs);
    const btn = $("[data-copy]", f), toast = $(".copy-toast", f);
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); toast.textContent = "Copied"; }
      catch { location.href = "mailto:" + btn.dataset.copy; return; }
      toast.classList.add("is-on");
      setTimeout(() => toast.classList.remove("is-on"), 1600);
    });
    const t0 = Number(store.get("hn-t0")) || Date.now();
    store.set("hn-t0", String(t0));
    const timer = $(".timer", f);
    const tick = () => {
      const s = Math.floor((Date.now() - t0) / 1000);
      timer.textContent = `you have been here for ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    };
    tick(); setInterval(tick, 1000);
  }

  function setCursor(label) {
    if (!cursorEl) return;
    cursorEl.classList.toggle("is-label", !!label);
    if (label) cursorLabel.textContent = label;
  }
  function cursor() {
    if (!FINE || REDUCED) return;
    document.body.classList.add("has-cursor");
    cursorEl = h(`<div class="cursor" aria-hidden="true"><i></i><span></span></div>`);
    cursorLabel = $("span", cursorEl);
    document.body.appendChild(cursorEl);
    const move = () => { cursorEl.style.transform = `translate3d(${M.tx}px,${M.ty}px,0)`; requestAnimationFrame(move); };
    move();
    document.addEventListener("mouseover", (e) => {
      if (hovered) return;
      const t = e.target.closest("[data-cursor],a,button");
      cursorEl.classList.remove("is-link");
      if (!t) { setCursor(null); return; }
      if (t.dataset.cursor) setCursor(t.dataset.cursor);
      else { setCursor(null); cursorEl.classList.add("is-link"); }
    });
  }

  function smooth() {
    if (REDUCED || typeof window.Lenis === "undefined" || !hasGSAP) return null;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a) return;
      const u = new URL(a.href, location.href);
      if (u.pathname !== location.pathname || !u.hash) return;
      const t = document.getElementById(u.hash.slice(1));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); }
    }, true);
    if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); t && lenis.scrollTo(t, { immediate: true }); }, 60);
    return lenis;
  }

  const label = (p) => p.short || p.title;

  /* ============================================================
     HOME
     ============================================================ */
  // the order they sit around the name, starting top left, clockwise
  const RING = ["anemoia", "xhibit", "clarity", "surface-deep", "archive", "about", "curious-incident", "unfolded"];
  const ROT = { anemoia: -7, xhibit: -4, clarity: 9, "surface-deep": -12, archive: -3, about: 6, "curious-incident": 3, unfolded: 5 };
  function home() {
    const main = $("main");
    main.innerHTML = `
      <section class="hero" aria-label="Selected work">
        <div class="hero__field"></div>
        <h1 class="hero__title">Holynoa</h1>
        <p class="hero__intro">Noa Yaakobovitz is a visual designer. She works in branding, motion and interfaces, and is interested in what screens do&nbsp;to&nbsp;memory.</p>
        <span class="hero__hint mono"><i></i>${FINE ? "hover to look, click to open" : "scroll for the index"}</span>
      </section>
      <section class="index" id="index" aria-label="Index">
        <div class="index__head mono"><span>Index</span><span>${pad(P.length)} works, 2023 to 2025</span></div>
        ${P.map((p, i) => `
          <a class="index__row" href="${url("work/" + p.slug + "/")}" data-i="${i}" data-cursor="open">
            <span class="mono n">${pad(i + 1)}</span>
            <span class="t">${esc(label(p))}</span>
            <span class="k">${esc(p.kind)}</span>
            <span class="mono">${p.year}</span>
            <span class="mono">→</span>
          </a>`).join("")}
      </section>`;

    const hero = $(".hero"), field = $(".hero__field");
    stage = hero;
    ORB.el = hero;
    makeCallout(hero);
    dust(hero);

    RING.forEach((id, i) => {
      let o, opts;
      if (id === "archive") { o = S.archiveObj; opts = { href: url("archive/"), label: "Prints & fun", num: "Archive", kind: "Posters and things in between" }; }
      else if (id === "about") { o = S.aboutObj; opts = { href: url("about/"), label: "About", num: "Info", kind: "Noa Yaakobovitz, visual designer" }; }
      else {
        const pi = P.findIndex((p) => p.slug === id), p = P[pi];
        o = p.obj;
        opts = { href: url("work/" + p.slug + "/"), label: label(p), num: `${pad(pi + 1)} · ${p.year}`, kind: p.kind };
      }
      const rec = makeObj(o, { ...opts, rot: ROT[id], depth: 0.7 + (i % 3) * 0.25 });
      rec.orbit = { a: Math.PI + Math.PI / 4 + (i * TAU) / RING.length };   // start at top left, clockwise
      field.appendChild(rec.el);
    });

    const title = $(".hero__title");
    const tg = glyphs(title, { ratio: 0.34, seed: 3 });
    flicker(tg, 900);
    measureOrbit();
    addEventListener("resize", measureOrbit);
    document.fonts?.ready.then(measureOrbit);

    // touch screens: the objects take turns introducing themselves
    if (!FINE && !REDUCED) {
      let k = 0;
      setInterval(() => {
        if (document.hidden || hero.getBoundingClientRect().bottom < innerHeight * 0.5) { autoFocus = null; return; }
        const ready = OBJS.filter((o) => o.ready && o.orbit);
        autoFocus = ready.length ? ready[k++ % ready.length] : null;
      }, 3200);
    }

    $$(".index__row .t").forEach((t, i) => { const gs = glyphs(t, { ratio: 0.12, seed: 40 + i }); scrambleOnHover(t.closest("a"), gs); });

    // a small ghost of the object follows the cursor over the index
    if (FINE) {
      const peek = h(`<div class="index__peek" aria-hidden="true"><img alt=""></div>`);
      document.body.appendChild(peek);
      const pi = $("img", peek);
      let on = false;
      $$(".index__row").forEach((row) => {
        row.addEventListener("mouseenter", () => { pi.src = objSrc(P[+row.dataset.i].obj.src); peek.classList.add("is-on"); on = true; });
        row.addEventListener("mouseleave", () => { peek.classList.remove("is-on"); on = false; });
      });
      const mv = () => { if (on) peek.style.transform = `translate3d(${M.x + 28}px,${M.y - 60}px,0) rotate(${((M.tx - M.x) * 0.08).toFixed(2)}deg)`; requestAnimationFrame(mv); };
      mv();
    }

    if (hasGSAP && !REDUCED) {
      gsap.from(tg, { opacity: 0, duration: 0.01, stagger: { each: 0.07, from: "random" }, delay: 0.35 });
      gsap.from(field, { opacity: 0, duration: 1.6, ease: "power2.out", delay: 0.6 });
      gsap.from(".hero__intro, .hero__hint", { opacity: 0, y: 12, duration: 1, ease: "power3.out", delay: 1.2 });
      $$(".index__row").forEach((r) => gsap.from(r, { opacity: 0, y: 24, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: r, start: "top 94%" } }));
    }
  }

  // loose fragments drifting in the void
  function dust(host) {
    const cv = document.createElement("canvas");
    cv.className = "dust";
    cv.setAttribute("aria-hidden", "true");
    host.prepend(cv);
    const cols = ["239,232,222", "239,232,222", "255,111,207", "120,150,255", "190,180,170"];
    let W = 0, H = 0, dpr = 1;
    const parts = [];
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; };
    size(); addEventListener("resize", size);
    const n = innerWidth < 760 ? 34 : 70;
    for (let i = 0; i < n; i++) parts.push({
      x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 1.2,
      s: [2, 2, 3, 4, 5][(Math.random() * 5) | 0], c: cols[(Math.random() * cols.length) | 0],
      a: 0.08 + Math.random() * 0.28, v: 0.00004 + Math.random() * 0.0001, ph: Math.random() * TAU,
    });
    const c = cv.getContext("2d");
    const fr = (t) => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const mx = M.x / innerWidth - 0.5, my = M.y / innerHeight - 0.5;
      for (const p of parts) {
        if (!REDUCED) p.y -= p.v * p.z;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        const x = (((p.x - mx * 0.03 * p.z) % 1) + 1) % 1 * W;
        const y = p.y * H - my * 10 * p.z;
        const blink = Math.sin(t * 0.0012 + p.ph) > 0.93 ? 0.15 : 1;
        c.fillStyle = `rgba(${p.c},${(p.a * blink).toFixed(3)})`;
        const s = Math.round(p.s * (0.6 + p.z * 0.4));
        c.fillRect(Math.round(x), Math.round(y), s, s);
      }
      requestAnimationFrame(fr);
    };
    requestAnimationFrame(fr);
  }

  /* ============================================================
     PROJECT
     ============================================================ */
  function project() {
    const slug = document.body.dataset.slug;
    const idx = P.findIndex((p) => p.slug === slug);
    const p = P[idx];
    if (!p) { location.replace(url("")); return; }
    const next = P[(idx + 1) % P.length];
    document.title = `${label(p)} · HOLYNOA`;
    const m = p.hero;
    const poster = m.poster ? asset(m.poster) : asset(m.src);

    const heroMedia = (() => {
      if (m.type === "video" && m.loop) return `<video src="${asset(m.src)}" poster="${poster}" muted loop autoplay playsinline></video>`;
      if (m.type === "video" || m.type === "youtube") return `<img src="${poster}" alt="${esc(p.title)}"><button class="p-play" type="button" data-cursor="play" aria-label="Play video"><span>Play ▸</span></button>`;
      return `<img src="${asset(m.src)}" alt="${esc(p.title)}">`;
    })();

    const gallery = (p.gallery || []).map((g) => {
      if (g.row) return `<div class="row">${g.row.map((f) => `<figure><div class="frame"><img src="${img(f)}" alt="${esc(p.title)}" loading="lazy"></div></figure>`).join("")}</div>`;
      if (g.video) return `<figure><div class="frame"><video src="${asset(g.video)}" poster="${asset(g.poster)}" ${g.controls ? "controls" : "muted loop autoplay"} playsinline preload="metadata"></video></div>${g.caption ? `<figcaption class="mono">${esc(g.caption)}</figcaption>` : ""}</figure>`;
      return `<figure class="${g.narrow ? "narrow" : ""}"><div class="frame"><img src="${img(g.src)}" alt="${esc(p.title)}" loading="lazy"></div>${g.caption ? `<figcaption class="mono">${esc(g.caption)}</figcaption>` : ""}</figure>`;
    }).join("");

    const main = $("main");
    main.innerHTML = `
      <div class="page">
        <section class="p-head">
          <div class="crumbs mono"><a href="${url("")}#index">Work</a><span>${pad(idx + 1)} / ${pad(P.length)}</span><span>${p.year}</span></div>
          <div class="p-head__obj"></div>
          <h1 class="p-title${p.title.length > 18 ? " is-long" : ""}">${esc(p.title)}</h1>
          <p class="p-lead">${esc(p.lead || p.kind)}</p>
          <dl class="p-facts">
            <dt>Type</dt><dd>${esc(p.kind)}</dd>
            <dt>Context</dt><dd>${esc(p.label)}</dd>
            <dt>Year</dt><dd>${p.year}</dd>
          </dl>
        </section>
        <section class="p-media" data-kind="${m.type}">
          <div class="p-media__frame">${heroMedia}</div>
        </section>
        <section class="p-body">
          <span class="p-body__label mono">About the work</span>
          <div class="p-body__text">
            ${p.text.map((t) => `<p>${esc(t)}</p>`).join("")}
            <div class="p-tags">${p.tags.map((t) => `<span class="mono">${esc(t)}</span>`).join("")}</div>
            ${p.aside ? `<aside class="p-aside"><h3 class="px">${esc(p.aside.title)}</h3><p>${esc(p.aside.text)}</p></aside>` : ""}
          </div>
        </section>
        ${gallery ? `<section class="p-gallery" aria-label="Gallery">${gallery}</section>` : ""}
        <a class="p-next" href="${url("work/" + next.slug + "/")}" data-cursor="next">
          <div><span class="mono">Next · ${pad(((idx + 1) % P.length) + 1)}</span><div class="p-next__t${label(next).length > 14 ? " is-long" : ""}">${esc(label(next))}</div></div>
          <div class="p-next__obj"></div>
        </a>
      </div>`;

    stage = $(".p-head");
    $(".p-head__obj").appendChild(makeObj(p.obj, { x: 74, y: 40, rot: -6, depth: 1, k: 1.55, amp: 1.3 }).el);
    $(".p-next__obj").appendChild(makeObj(next.obj, { x: 50, y: 50, rot: 5, depth: 0.6, k: 1.1 }).el);

    const t = $(".p-title");
    flicker(glyphs(t, { ratio: 0.3, seed: idx + 2 }), 1500);
    glyphs($(".p-next__t"), { ratio: 0.3, seed: idx + 9 });
    $$(".p-media__frame, .p-gallery .frame").forEach(reveal);

    const pm = $(".p-media"), frame = $(".p-media__frame");
    const play = $(".p-play", pm);
    if (play) play.addEventListener("click", () => {
      if (m.type === "youtube") frame.insertAdjacentHTML("beforeend", `<iframe src="https://www.youtube-nocookie.com/embed/${m.id}?autoplay=1&rel=0" title="${esc(p.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`);
      else { const v = h(`<video src="${asset(m.src)}" poster="${poster}" controls autoplay playsinline></video>`); frame.innerHTML = ""; frame.appendChild(v); }
      pm.classList.add("is-playing");
    });

    if (hasGSAP && !REDUCED) {
      gsap.from($$(".g", t), { opacity: 0, duration: 0.01, stagger: { each: 0.05, from: "random" }, delay: 0.5 });
      gsap.from(".p-lead, .p-facts, .crumbs", { opacity: 0, y: 18, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.9 });
      $$(".p-body__text > *").forEach((el) => gsap.from(el, { y: 26, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } }));
    }
  }

  /* ============================================================
     ARCHIVE
     ============================================================ */
  function archive() {
    const main = $("main");
    main.innerHTML = `
      <div class="page">
        <section class="a-head">
          <div class="a-head__obj"></div>
          <h1>Prints &amp; fun</h1>
          <p>Posters, prints and things made in between, from over the years.<span class="mono">${pad(A.length)} pieces · click to look closer</span></p>
        </section>
        <section class="a-grid">
          ${A.map((a, i) => `
            <button class="a-item" type="button" data-i="${i}" data-cursor="look">
              <figure style="margin:0">
                <div class="frame"><img src="${img(a.src)}" alt="${esc(a.title)}" loading="lazy"></div>
                <figcaption><b>${esc(a.title)}</b><span class="mono">${esc(a.kind)}</span></figcaption>
              </figure>
            </button>`).join("")}
        </section>
      </div>
      <div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
        <button class="lightbox__close mono" type="button">Close ✕</button>
        <img alt="">
        <span class="lightbox__cap mono"></span>
      </div>`;
    stage = $(".a-head");
    $(".a-head__obj").appendChild(makeObj(S.archiveObj, { x: 74, y: 50, rot: -4, depth: 1, k: 0.95, amp: 1.2 }).el);
    flicker(glyphs($(".a-head h1"), { ratio: 0.3, seed: 4 }), 1500);
    $$(".a-item .frame").forEach(reveal);

    const lb = $(".lightbox"), lbImg = $("img", lb), cap = $(".lightbox__cap", lb);
    let opener = null;
    const close = () => { lb.classList.remove("is-open"); opener && opener.focus(); };
    $$(".a-item").forEach((b) => b.addEventListener("click", () => {
      const a = A[+b.dataset.i];
      opener = b;
      lbImg.src = img(a.src); lbImg.alt = a.title; cap.textContent = `${a.title} · ${a.kind}`;
      lb.classList.add("is-open");
      $(".lightbox__close", lb).focus();
    }));
    $(".lightbox__close", lb).addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && lb.classList.contains("is-open")) close(); });
  }

  /* ============================================================
     ABOUT
     ============================================================ */
  function about() {
    const main = $("main");
    main.innerHTML = `
      <div class="page">
        <section class="about">
          <h1>About</h1>
          <div class="about__portrait" data-cursor="look"><img src="${img("portrait-bitmap.jpg")}" alt="Portrait of Noa"><span class="mono">${FINE ? "hover to see" : "tap to see"}</span></div>
          <div class="about__text">
            <p class="first">Noa Yaakobovitz is a visual designer with a B.Des. in Visual Communication from HIT.</p>
            <p>I work across branding, motion design, post-production, compositing, and UX/UI, with a strong focus on screen-based visuals.</p>
            <p>My work explores the emotional side of technology: how images, interfaces, and digital systems shape memory, mood, and perception. I like mixing clean, intentional design with subtle imperfections, creating visuals that feel both sharp and human.</p>
            <p>I'm drawn to projects that sit between design and art, precision and experimentation, and I care deeply about concept, rhythm, and tone. Not just how things look, but how they move and feel.</p>
            <ul class="about__list">
              <li><span class="mono">Disciplines</span><span>Branding, motion, post-production, compositing, UX/UI</span></li>
              <li><span class="mono">Education</span><span>B.Des. Visual Communication, HIT</span></li>
              <li><span class="mono">Email</span><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>
              <li><span class="mono">Instagram</span><a href="${S.instagram}" target="_blank" rel="noopener">@holynoa</a></li>
              <li><span class="mono">LinkedIn</span><a href="${S.linkedin}" target="_blank" rel="noopener">noayaakobovitz</a></li>
            </ul>
            <a class="resume" href="${asset("Resume-Noa-Yaakobovitz.pdf")}" target="_blank" rel="noopener" data-cursor="pdf">Resume <span>↓</span></a>
          </div>
        </section>
      </div>`;
    flicker(glyphs($(".about h1"), { ratio: 0.3, seed: 8 }), 1500);
    const pt = $(".about__portrait");
    if (!FINE) pt.addEventListener("click", () => pt.classList.toggle("is-seen"));
    if (hasGSAP && !REDUCED) {
      $$(".about__text > p, .about__list li").forEach((el) => gsap.from(el, { y: 22, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 94%" } }));
    }
  }

  /* ---------- boot ---------- */
  chrome();
  ({ home, project, archive, about })[PAGE]?.();
  footer();
  cursor();
  transitions();
  smooth();
  glitches();
  lampStutter();
  requestAnimationFrame(loop);
  document.fonts?.ready.then(() => hasGSAP && window.ScrollTrigger && ScrollTrigger.refresh());
  addEventListener("load", () => { measureOrbit(); hasGSAP && window.ScrollTrigger && ScrollTrigger.refresh(); });
})();
