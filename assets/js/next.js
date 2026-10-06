/* ============================================================
   HOLYNOA, objects in the void
   Every object is a memory that hasn't loaded yet.
   It stays in pixels until you come close.
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
  const narrow = () => innerWidth <= 760;
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
  // hovering a word scrambles it for a moment
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
  const PX_BLOCK = 9;      // size of one pixel fragment on screen (css px)

  // build one floating object; o = {src, cm, alt}, opts = {x, y, rot, depth, href, label, num, year, kind, k, mxm, z}
  function makeObj(o, opts = {}) {
    const tag = opts.href ? "a" : "div";
    const el = document.createElement(tag);
    el.className = "obj";
    if (opts.href) { el.href = opts.href; el.setAttribute("aria-label", opts.label || o.alt); }
    else el.setAttribute("aria-hidden", "true");
    const st = el.style;
    st.setProperty("--x", opts.x ?? 50);
    st.setProperty("--y", opts.y ?? 50);
    st.setProperty("--w", o.cm);
    st.setProperty("--rot", (opts.rot || 0) + "deg");
    st.setProperty("--dur", (6 + Math.random() * 4).toFixed(2) + "s");
    st.setProperty("--delay", (-Math.random() * 8).toFixed(2) + "s");
    if (opts.k) st.setProperty("--k", opts.k);
    if (opts.mxm != null) st.setProperty("--mxm", opts.mxm);
    if (opts.z) st.setProperty("--z", opts.z);
    el.innerHTML = `
      <div class="obj__par">
        <div class="obj__float">
          <div class="obj__img"><canvas class="obj__px" aria-hidden="true"></canvas><img class="obj__sharp" alt="" decoding="async"></div>
        </div>
        ${opts.label ? `<div class="obj__label" aria-hidden="true">
          ${opts.num ? `<span class="mono">${esc(opts.num)}</span>` : ""}
          <b class="obj__name">${esc(opts.label)}</b>
          ${opts.kind ? `<em>${esc(opts.kind)}</em>` : ""}
        </div>` : ""}
      </div>`;
    const rec = {
      el, href: opts.href || null, rot: opts.rot || 0, depth: opts.depth ?? 1,
      par: $(".obj__par", el), box: $(".obj__img", el), cv: $("canvas", el), sharp: $(".obj__sharp", el),
      f: 0, near: 0, alpha: null, aw: 0, ah: 0, focus: false, ready: false, lw: 0,
      cap: opts.label ? { num: opts.num || "", name: opts.label, kind: opts.kind || "" } : null,
    };
    const name = $(".obj__name", el);
    if (name) glyphs(name, { ratio: 0.3, seed: (opts.label || "").length + 3 });
    const im = rec.sharp;
    im.addEventListener("load", () => {
      el.style.setProperty("--ar", (im.naturalWidth / im.naturalHeight).toFixed(4));
      alphaMap(rec);
      requestAnimationFrame(() => { pixelate(rec); rec.ready = true; el.classList.add("is-ready"); });
    }, { once: true });
    im.src = objSrc(o.src);
    if (opts.href) {
      el.addEventListener("focus", () => (kbFocus = rec));
      el.addEventListener("blur", () => { if (kbFocus === rec) kbFocus = null; });
    }
    OBJS.push(rec);
    return el;
  }

  // a low-res alpha grid of the object, so hovering only counts on the object itself, not its empty box
  function alphaMap(rec) {
    const im = rec.sharp;
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

  // redraw the pixel version at the object's current on-screen size
  function pixelate(rec) {
    const w = rec.box.offsetWidth, hh = rec.box.offsetHeight;
    if (!w || !hh || !rec.sharp.naturalWidth) return;
    rec.lw = w;
    const sw = Math.max(2, Math.round(w / PX_BLOCK)), sh = Math.max(2, Math.round(hh / PX_BLOCK));
    const s = document.createElement("canvas"); s.width = sw; s.height = sh;
    const sx = s.getContext("2d", { willReadFrequently: true });
    sx.imageSmoothingQuality = "high";
    sx.drawImage(rec.sharp, 0, 0, sw, sh);
    try {
      const d = sx.getImageData(0, 0, sw, sh);
      for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 96 ? 255 : 0;  // hard fragment edges
      sx.putImageData(d, 0, 0);
    } catch {}
    const dpr = Math.min(2, devicePixelRatio || 1);
    rec.cv.width = Math.round(w * dpr); rec.cv.height = Math.round(hh * dpr);
    const c = rec.cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, rec.cv.width, rec.cv.height);
    c.drawImage(s, 0, 0, rec.cv.width, rec.cv.height);
  }
  let rsT;
  addEventListener("resize", () => { clearTimeout(rsT); rsT = setTimeout(() => OBJS.forEach((r) => r.ready && Math.abs(r.box.offsetWidth - r.lw) > 2 && pixelate(r)), 160); });

  // point (px,py) in viewport → position inside the object's own (unrotated) box
  function local(rec, px, py, r) {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const w = rec.box.offsetWidth, hh = rec.box.offsetHeight;
    const a = (-rec.rot * Math.PI) / 180;
    const dx = px - cx, dy = py - cy;
    return { x: dx * Math.cos(a) - dy * Math.sin(a) + w / 2, y: dx * Math.sin(a) + dy * Math.cos(a) + hh / 2, w, h: hh };
  }
  function hitTest(rec, px, py, r) {
    const p = local(rec, px, py, r);
    if (p.x < 0 || p.y < 0 || p.x > p.w || p.y > p.h) return false;
    if (!rec.alpha) return true;
    const u = Math.floor((p.x / p.w) * rec.aw), v = Math.floor((p.y / p.h) * rec.ah);
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
      const r = o.box.getBoundingClientRect();
      if (onScreen(r) && hitTest(o, px, py, r)) return o;
    }
    return null;
  }

  // on touch screens, the object nearest the middle of the screen is the one in focus
  function pickCentre() {
    let best = null, bd = Infinity;
    const cy = innerHeight * 0.5;
    OBJS.forEach((o) => {
      if (!o.ready) return;
      const r = o.box.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - cy);
      if (d < bd && d < innerHeight * 0.24) { bd = d; best = o; }
    });
    return best;
  }

  /* ---------- the loop ---------- */
  const darkEl = h(`<div class="dark" aria-hidden="true"></div>`);
  const L = { g: 1 };
  let cursorEl = null, cursorLabel = null;

  function loop() {
    M.x += (M.tx - M.x) * 0.14;
    M.y += (M.ty - M.y) * 0.14;
    const ds = darkEl.style;
    ds.setProperty("--lx", M.x.toFixed(1) + "px");
    ds.setProperty("--ly", M.y.toFixed(1) + "px");
    ds.setProperty("--dk", (0.52 + (1 - L.g) * 0.4).toFixed(3));

    const touchMode = !FINE;
    const hit = kbFocus || (touchMode ? pickCentre() : M.in ? pickAt(M.tx, M.ty) : null);
    if (hit !== hovered) {
      hovered = hit;
      if (stage) stage.classList.toggle("has-focus", !!hit);
      if (FINE) document.body.classList.toggle("on-obj", !!(hit && hit.href));
      if (cursorEl) { setCursor(hit && hit.href && !hit.cap ? "open" : null); cursorEl.classList.toggle("is-on-obj", !!(hit && hit.href)); caption(hit); }
    }

    const mx = (M.x / innerWidth - 0.5), my = (M.y / innerHeight - 0.5);
    for (const o of OBJS) {
      const outer = o.el.getBoundingClientRect();
      if (!onScreen(outer)) continue;
      // depth: things nearer move more
      const d = o.depth;
      const py = REDUCED || narrow() ? 0 : (outer.top + outer.height / 2 - innerHeight / 2) * (1 - d) * 0.35;
      const ox = REDUCED ? 0 : mx * -18 * d, oy = REDUCED ? 0 : my * -12 * d;
      o.f += ((o === hit ? 1 : 0) - o.f) * (REDUCED ? 1 : 0.13);
      const sc = 1 + o.f * 0.035;
      o.par.style.transform = `translate3d(${ox.toFixed(1)}px,${(py + oy).toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
      if (!o.ready) continue;

      const r = o.box.getBoundingClientRect();
      const p = local(o, M.x, M.y, r);
      const big = Math.max(p.w, p.h);
      // how close the light is: a small window of clarity opens around it
      const dist = Math.hypot(p.x - p.w / 2, p.y - p.h / 2) / big;
      const near = clamp(1.15 - dist * 1.1, 0, 1);
      o.near += (near - o.near) * 0.2;
      const rad = o.near * big * 0.3 + o.f * big * 1.6;
      const s = o.sharp.style;
      s.setProperty("--mx", p.x.toFixed(0) + "px");
      s.setProperty("--my", p.y.toFixed(0) + "px");
      s.setProperty("--r", rad.toFixed(1) + "px");
      o.cv.style.opacity = (1 - clamp(o.f * 1.4, 0, 1)).toFixed(3);
      const fo = o.f > 0.45;
      if (fo !== o.focus) { o.focus = fo; o.el.classList.toggle("is-focus", fo); }
    }

    if (PAGE === "home") homeTick();
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
      setTimeout(tick, 2600 + Math.random() * 4200);
    };
    setTimeout(tick, 2200);
  }
  // and the light isn't completely stable either
  function lampStutter() {
    if (REDUCED || !hasGSAP) return;
    const run = () => {
      const tl = gsap.timeline();
      [0.2, 1, 0.45, 1].forEach((v, i) => tl.to(L, { g: v, duration: 0.05 + (i % 2) * 0.06, ease: "steps(1)" }));
      setTimeout(run, 14000 + Math.random() * 12000);
    };
    setTimeout(run, 9000);
  }

  /* ---------- pixel resolve for images and videos ---------- */
  const STEPS = [64, 40, 28, 18, 12, 8, 5, 3];
  const rsIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { rsIO.unobserve(e.target); e.target._resolve && e.target._resolve(); } }), { rootMargin: "0px 0px -12% 0px" });
  function resolve(wrap, srcUrl) {
    wrap.classList.add("rs");
    const cv = document.createElement("canvas");
    cv.className = "rs__px";
    cv.setAttribute("aria-hidden", "true");
    wrap.appendChild(cv);
    const src = new Image();
    src.decoding = "async";
    let ready = false, pending = false;
    const draw = (b) => {
      const w = wrap.offsetWidth, hh = wrap.offsetHeight;
      if (!w || !hh) return;
      const blocks = Math.max(1, Math.round(w / b));
      const sw = blocks, sh = Math.max(1, Math.round(hh / b));
      const s = document.createElement("canvas"); s.width = sw; s.height = sh;
      const sx = s.getContext("2d");
      // cover-fit the source into the box
      const ar = src.naturalWidth / src.naturalHeight, br = w / hh;
      let dw = sw, dh = sh, ox = 0, oy = 0;
      if (ar > br) { dw = sh * ar; ox = (sw - dw) / 2; } else { dh = sw / ar; oy = (sh - dh) / 2; }
      sx.fillStyle = "#080708"; sx.fillRect(0, 0, sw, sh);
      sx.drawImage(src, ox, oy, dw, dh);
      const dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(w * dpr / 2); cv.height = Math.round(hh * dpr / 2);
      const c = cv.getContext("2d");
      c.imageSmoothingEnabled = false;
      c.drawImage(s, 0, 0, cv.width, cv.height);
    };
    const run = () => {
      if (!ready) { pending = true; return; }
      if (REDUCED) { cv.remove(); return; }
      let i = 0;
      const step = () => {
        if (i < STEPS.length) { draw(STEPS[i++]); setTimeout(step, 85); }
        else { cv.style.opacity = "0"; setTimeout(() => cv.remove(), 600); }
      };
      step();
    };
    wrap._resolve = run;
    src.onload = () => { ready = true; draw(STEPS[0]); if (pending) run(); };
    src.onerror = () => cv.remove();
    src.src = srcUrl;
    rsIO.observe(wrap);
  }

  /* ---------- page transition: the screen fills with fragments ---------- */
  const dissolve = (() => {
    const cv = document.createElement("canvas");
    cv.className = "dissolve";
    cv.setAttribute("aria-hidden", "true");
    let cells = [], cols = 0, rows = 0, size = 0;
    const setup = () => {
      size = Math.max(36, Math.round(Math.min(innerWidth, innerHeight) / 14));
      cols = Math.ceil(innerWidth / size); rows = Math.ceil(innerHeight / size);
      cv.width = cols * size; cv.height = rows * size;
      cv.style.width = cols * size + "px"; cv.style.height = rows * size + "px";
      cells = [];
      for (let i = 0; i < cols * rows; i++) cells.push(i);
      for (let i = cells.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [cells[i], cells[j]] = [cells[j], cells[i]]; }
    };
    const ctx = () => cv.getContext("2d");
    function fill(dur, done) {
      setup();
      const c = ctx(); let k = 0; const t0 = performance.now();
      const fr = (t) => {
        const want = Math.min(cells.length, Math.ceil(((t - t0) / dur) * cells.length));
        c.fillStyle = "#080708";
        for (; k < want; k++) { const i = cells[k]; c.fillRect((i % cols) * size, ((i / cols) | 0) * size, size, size); }
        if (k < cells.length) requestAnimationFrame(fr); else done && done();
      };
      requestAnimationFrame(fr);
    }
    function clear(dur) {
      setup();
      const c = ctx(); c.fillStyle = "#080708"; c.fillRect(0, 0, cv.width, cv.height);
      let k = 0; const t0 = performance.now();
      const fr = (t) => {
        const want = Math.min(cells.length, Math.ceil(((t - t0) / dur) * cells.length));
        for (; k < want; k++) { const i = cells[k]; c.clearRect((i % cols) * size, ((i / cols) | 0) * size, size, size); }
        if (k < cells.length) requestAnimationFrame(fr);
      };
      requestAnimationFrame(fr);
    }
    return { cv, fill, clear };
  })();

  function go(href) {
    if (REDUCED) { location.href = href; return; }
    store.set("hn-tx", "1");
    dissolve.fill(420, () => (location.href = href));
  }
  function transitions() {
    document.body.appendChild(dissolve.cv);
    if (store.get("hn-tx") === "1" && !REDUCED) dissolve.clear(560);
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
    addEventListener("pageshow", (e) => { if (e.persisted) dissolve.cv.getContext("2d").clearRect(0, 0, dissolve.cv.width, dissolve.cv.height); });
  }

  /* ---------- shared chrome ---------- */
  function chrome() {
    const cur = (p) => (PAGE === p ? ' aria-current="page"' : "");
    document.body.prepend(h(`
      <header class="site-header">
        <a class="brand" href="${url("")}">Holynoa</a>
        <nav aria-label="Main">
          <a href="${url("")}#index"${cur("project")}>Work</a>
          <a href="${url("archive/")}"${cur("archive")}>Archive</a>
          <a href="${url("about/")}"${cur("about")}>About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>`));
    flicker(glyphs($(".brand"), { ratio: 0.3, seed: 6 }), 2600);

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

  // the name of the thing you're looking at, carried by the cursor
  let capEl = null, capGs = [];
  function caption(o) {
    if (!capEl) return;
    if (!o || !o.cap) { capEl.classList.remove("is-on"); return; }
    $(".cursor__num", capEl).textContent = o.cap.num + (o.href ? "  ·  open" : "");
    const nm = $(".cursor__name", capEl);
    nm.textContent = o.cap.name;
    capGs = glyphs(nm, { ratio: 0.3, seed: o.cap.name.length + 3 });
    $(".cursor__kind", capEl).textContent = o.cap.kind;
    capEl.classList.remove("is-on");
    void capEl.offsetWidth;
    capEl.classList.add("is-on");
    capGs.forEach((g, i) => { flip(g); setTimeout(() => flip(g), 90 + i * 35); });
  }
  function setCursor(label) {
    if (!cursorEl) return;
    cursorEl.classList.toggle("is-label", !!label);
    if (label) cursorLabel.textContent = label;
  }
  function cursor() {
    if (!FINE || REDUCED) return;
    document.body.classList.add("has-cursor");
    cursorEl = h(`<div class="cursor" aria-hidden="true"><i></i><span></span>
      <div class="cursor__cap"><span class="cursor__num mono"></span><b class="cursor__name"></b><em class="cursor__kind"></em></div></div>`);
    cursorLabel = $("span", cursorEl);
    capEl = $(".cursor__cap", cursorEl);
    document.body.classList.add("has-cap");
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
    // in-page anchors
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

  const projObj = (p) => p.obj;
  const label = (p) => p.short || p.title;

  /* ============================================================
     HOME
     ============================================================ */
  // where everything floats. x in vw, y in vh of the field; depth > 1 is nearer.
  const LAYOUT = [
    { id: "anemoia", x: 21, y: 27, rot: -7, depth: 1.0, mxm: 8 },
    { id: "clarity", x: 79, y: 26, rot: 9, depth: 1.25, mxm: 58 },
    { id: "surface-deep", x: 85, y: 75, rot: -12, depth: 0.85, mxm: 34 },
    { id: "unfolded", x: 16, y: 79, rot: 5, depth: 1.15, mxm: 6 },
    { id: "xhibit", x: 64, y: 122, rot: -4, depth: 1.3, mxm: 40 },
    { id: "curious-incident", x: 24, y: 138, rot: 3, depth: 0.9, mxm: 12 },
    { id: "archive", x: 75, y: 176, rot: -3, depth: 1.1, mxm: 18 },
    { id: "about", x: 30, y: 190, rot: 6, depth: 1.2, mxm: 52 },
  ];
  let homeTitle = null;
  function home() {
    const main = $("main");
    main.innerHTML = `
      <section class="stage" aria-label="Selected work">
        <div class="stage__sticky"><h1 class="stage__title">Holynoa</h1></div>
        <div class="stage__field">
          <p class="stage__intro">Noa Yaakobovitz is a visual designer. She works in branding, motion and interfaces, and is interested in what screens do to memory.</p>
          <span class="stage__hint mono"><i></i>${FINE ? "move closer" : "scroll"}</span>
        </div>
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

    stage = $(".stage");
    const field = $(".stage__field");
    LAYOUT.forEach((l, i) => {
      let o, opts;
      if (l.id === "archive") { o = S.archiveObj; opts = { href: url("archive/"), label: "Prints & fun", num: "Archive", kind: "Posters and things in between" }; }
      else if (l.id === "about") { o = S.aboutObj; opts = { href: url("about/"), label: "About", num: "Info", kind: "Noa Yaakobovitz, visual designer" }; }
      else {
        const pi = P.findIndex((p) => p.slug === l.id), p = P[pi];
        o = projObj(p);
        opts = { href: url("work/" + p.slug + "/"), label: label(p), num: `${pad(pi + 1)} · ${p.year}`, kind: p.kind };
      }
      const el = makeObj(o, { ...opts, ...l, z: 2 + Math.round(l.depth * 10) });
      field.appendChild(el);
    });

    dust($(".stage__sticky"));
    homeTitle = $(".stage__title");
    const tg = glyphs(homeTitle, { ratio: 0.34, seed: 3 });
    flicker(tg, 900);

    $$(".index__row .t").forEach((t, i) => { const gs = glyphs(t, { ratio: 0.12, seed: 40 + i }); scrambleOnHover(t.closest("a"), gs); });

    // a ghost of the object follows the cursor over the index
    if (FINE) {
      const peek = h(`<div class="index__peek" aria-hidden="true"><img alt=""></div>`);
      document.body.appendChild(peek);
      const pi = $("img", peek);
      let on = false;
      $$(".index__row").forEach((row) => {
        row.addEventListener("mouseenter", () => { pi.src = objSrc(P[+row.dataset.i].obj.src); peek.classList.add("is-on"); on = true; });
        row.addEventListener("mouseleave", () => { peek.classList.remove("is-on"); on = false; });
      });
      const mv = () => { if (on) peek.style.transform = `translate3d(${M.x + 30}px,${M.y - 110}px,0) rotate(${(M.tx - M.x) * 0.08}deg)`; requestAnimationFrame(mv); };
      mv();
    }

    if (hasGSAP && !REDUCED) {
      gsap.from(tg, { opacity: 0, duration: 0.01, stagger: { each: 0.07, from: "random" }, delay: 0.35 });
      gsap.from($$(".stage .obj"), { opacity: 0, duration: 1.2, ease: "power2.out", stagger: 0.12, delay: 0.7 });
      gsap.from(".stage__intro, .stage__hint", { opacity: 0, y: 14, duration: 1, ease: "power3.out", delay: 1.4 });
      $$(".index__row").forEach((r) => gsap.from(r, { opacity: 0, y: 24, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: r, start: "top 92%" } }));
    }
  }
  // loose fragments drifting in the void, as if something broke a while ago
  function dust(host) {
    const cv = document.createElement("canvas");
    cv.className = "dust";
    cv.setAttribute("aria-hidden", "true");
    host.prepend(cv);
    const cols = ["239,232,222", "239,232,222", "255,111,207", "120,150,255", "190,180,170"];
    let W = 0, H = 0, dpr = 1;
    const parts = [];
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * dpr; cv.height = H * dpr;
    };
    size(); addEventListener("resize", size);
    const n = narrow() ? 38 : 80;
    for (let i = 0; i < n; i++) parts.push({
      x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 1.2,
      s: [2, 3, 4, 4, 6, 8][(Math.random() * 6) | 0], c: cols[(Math.random() * cols.length) | 0],
      a: 0.08 + Math.random() * 0.32, v: 0.00004 + Math.random() * 0.00012, ph: Math.random() * 6.28,
    });
    const c = cv.getContext("2d");
    const fr = (t) => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const mx = (M.x / innerWidth - 0.5), my = (M.y / innerHeight - 0.5), sy = scrollY / innerHeight;
      for (const p of parts) {
        if (!REDUCED) p.y -= p.v * p.z;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        const x = ((p.x - mx * 0.03 * p.z) % 1 + 1) % 1 * W;
        const y = (((p.y - sy * 0.12 * p.z) % 1.1 + 1.1) % 1.1 - 0.05) * H;
        const blink = Math.sin(t * 0.0012 + p.ph) > 0.93 ? 0.15 : 1;
        c.fillStyle = `rgba(${p.c},${(p.a * blink).toFixed(3)})`;
        const s = Math.round(p.s * (0.6 + p.z * 0.4));
        c.fillRect(Math.round(x), Math.round(y - my * 10 * p.z), s, s);
      }
      requestAnimationFrame(fr);
    };
    requestAnimationFrame(fr);
  }
  function homeTick() {
    const y = scrollY;
    document.body.classList.toggle("is-scrolled", y > innerHeight * 0.55);
    if (homeTitle) {
      const k = clamp(y / (innerHeight * 1.6), 0, 1);
      homeTitle.style.opacity = (1 - k * 0.72).toFixed(3);
      homeTitle.style.filter = k > 0.01 ? `blur(${(k * 6).toFixed(2)}px)` : "";
    }
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
      if (g.row) return `<div class="row">${g.row.map((f) => `<figure><div class="frame" data-rs="${img(f)}"><img src="${img(f)}" alt="${esc(p.title)}" loading="lazy"></div></figure>`).join("")}</div>`;
      if (g.video) return `<figure><div class="frame" data-rs="${asset(g.poster)}"><video src="${asset(g.video)}" poster="${asset(g.poster)}" ${g.controls ? "controls" : "muted loop autoplay"} playsinline preload="metadata"></video></div>${g.caption ? `<figcaption class="mono">${esc(g.caption)}</figcaption>` : ""}</figure>`;
      return `<figure class="${g.narrow ? "narrow" : ""}"><div class="frame" data-rs="${img(g.src)}"><img src="${img(g.src)}" alt="${esc(p.title)}" loading="lazy"></div>${g.caption ? `<figcaption class="mono">${esc(g.caption)}</figcaption>` : ""}</figure>`;
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
          <div class="p-media__frame" data-rs="${poster}">${heroMedia}</div>
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
    $(".p-head__obj").appendChild(makeObj(p.obj, { x: 74, y: 40, rot: -6, depth: 1, k: 1.55 }));
    $(".p-next__obj").appendChild(makeObj(next.obj, { x: 50, y: 50, rot: 5, depth: 0.6, k: 1.1 }));

    const t = $(".p-title");
    flicker(glyphs(t, { ratio: 0.3, seed: idx + 2 }), 1500);
    glyphs($(".p-next__t"), { ratio: 0.3, seed: idx + 9 });
    $$("[data-rs]").forEach((w) => resolve(w, w.dataset.rs));

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
                <div class="frame" data-rs="${img(a.src)}"><img src="${img(a.src)}" alt="${esc(a.title)}" loading="lazy"></div>
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
    $(".a-head__obj").appendChild(makeObj(S.archiveObj, { x: 74, y: 50, rot: -4, depth: 1, k: 0.95 }));
    flicker(glyphs($(".a-head h1"), { ratio: 0.3, seed: 4 }), 1500);
    $$("[data-rs]").forEach((w) => resolve(w, w.dataset.rs));

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
  addEventListener("load", () => hasGSAP && window.ScrollTrigger && ScrollTrigger.refresh());
})();
