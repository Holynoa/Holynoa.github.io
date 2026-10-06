/* ============================================================
   HOLYNOA, interactions
   play → distort → design → repeat
   ============================================================ */
(() => {
  "use strict";

  const ROOT = document.documentElement.dataset.root || "";
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
  const url = (p) => (ROOT + p) || "./";
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- glyph mixing (the Lingo pixel / italic swap) ---------- */
  // Deterministic "random" so the mix looks designed, not noisy.
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

  // Letters quietly flicker between the two faces.
  function flicker(gs, every = 900, count = 2) {
    if (REDUCED || !gs.length) return;
    setInterval(() => {
      if (document.hidden) return;
      for (let k = 0; k < count; k++) {
        const g = gs[(Math.random() * gs.length) | 0];
        flip(g);
        setTimeout(() => flip(g), 140 + Math.random() * 420);
      }
    }, every);
  }

  // Hovering a word ripples through its letters.
  function ripple(el) {
    if (REDUCED) return;
    const gs = $$(".g", el);
    let busy = false;
    el.addEventListener("mouseenter", () => {
      if (busy) return;
      busy = true;
      gs.forEach((g, i) => {
        setTimeout(() => flip(g), i * 28);
        setTimeout(() => flip(g), i * 28 + 220);
      });
      setTimeout(() => (busy = false), gs.length * 28 + 260);
    });
  }

  /* ---------- pixelate: the "memory resolving" reveal ---------- */
  function coverRect(iw, ih, cw, ch, posX = 0.5) {
    const s = Math.max(cw / iw, ch / ih);
    const w = cw / s, h2 = ch / s;
    return [(iw - w) * posX, (ih - h2) / 2, w, h2];
  }
  const tmp = document.createElement("canvas");
  function drawPixel(ctx, image, block, fit = "cover", posX = 0.5) {
    const c = ctx.canvas;
    const cw = c.width, ch = c.height;
    const iw = image.naturalWidth || image.videoWidth, ih = image.naturalHeight || image.videoHeight;
    if (!iw || !cw) return;
    const src = fit === "cover" ? coverRect(iw, ih, cw, ch, posX) : [0, 0, iw, ih];
    if (block <= 1) {
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(image, ...src, 0, 0, cw, ch);
      return;
    }
    const w = Math.max(1, Math.ceil(cw / block)), hh = Math.max(1, Math.ceil(ch / block));
    tmp.width = w; tmp.height = hh;
    const t = tmp.getContext("2d");
    t.imageSmoothingEnabled = true;
    t.drawImage(image, ...src, 0, 0, w, hh);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(tmp, 0, 0, w, hh, 0, 0, cw, ch);
  }
  const ready = (im) => new Promise((res) => (im.complete && im.naturalWidth ? res() : (im.addEventListener("load", res, { once: true }), im.addEventListener("error", res, { once: true }))));

  const STEPS = [72, 56, 40, 28, 20, 14, 10, 7, 5, 3, 2, 1];
  // Puts a canvas over an <img>; the canvas starts as big pixels and resolves on scroll.
  function pixelReveal(imEl, { trigger, containerAnimation, fit = "cover", start = "top 85%" } = {}) {
    if (REDUCED || !hasGSAP) return;
    const frame = imEl.parentElement;
    const cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    frame.appendChild(cv);
    const ctx = cv.getContext("2d");
    const state = { i: 0 };
    const size = () => {
      const r = frame.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    };
    const paint = () => drawPixel(ctx, imEl, STEPS[Math.round(state.i)] * Math.min(devicePixelRatio || 1, 2), fit);
    imEl.style.visibility = "hidden";
    ready(imEl).then(() => {
      size(); paint();
      addEventListener("resize", () => { if (cv.isConnected && cv.style.display !== "none") { size(); paint(); } });
      ScrollTrigger.create({
        trigger: trigger || frame,
        start,
        containerAnimation,
        once: true,
        onEnter: () => {
          gsap.to(state, {
            i: STEPS.length - 1,
            duration: 1.25,
            ease: "steps(" + (STEPS.length - 1) + ")",
            onUpdate: paint,
            onComplete: () => { imEl.style.visibility = ""; cv.style.display = "none"; },
          });
        },
      });
    });
  }

  /* ---------- shared chrome: header, footer, cursor, wipe ---------- */
  function header() {
    const cur = (p) => (PAGE === p ? ' aria-current="page"' : "");
    document.body.prepend(h(`
      <header class="site-header">
        <a class="brand" href="${url("")}" data-cursor-link>Holynoa</a>
        <nav aria-label="Main">
          <a href="${url("archive/")}"${cur("archive")} data-cursor-link>Archive</a>
          <a href="${url("about/")}"${cur("about")} data-cursor-link>About</a>
        </nav>
      </header>`));
    $$(".site-header a").forEach((a) => { glyphs(a, { ratio: 0.12, seed: a.textContent.length }); ripple(a); });
  }

  function footer() {
    const f = h(`
      <footer class="site-footer" id="contact">
        <p class="site-footer__big px">Thank you for visiting</p>
        <div class="site-footer__grid">
          <div><span class="mono">Email</span><button type="button" data-copy="${esc(S.email)}" data-cursor="copy">${esc(S.email)}</button><span class="copy-toast mono" aria-live="polite"></span></div>
          <div><span class="mono">Phone</span><a href="tel:${esc(S.phoneHref)}" data-cursor-link>${esc(S.phone)}</a></div>
          <div><span class="mono">Instagram</span><a href="${S.instagram}" target="_blank" rel="noopener" data-cursor-link>@holynoa</a></div>
          <div><span class="mono">LinkedIn</span><a href="${S.linkedin}" target="_blank" rel="noopener" data-cursor-link>noayaakobovitz</a></div>
        </div>
        <div class="site-footer__base mono"><span>© ${new Date().getFullYear()} Noa Yaakobovitz</span><span>Visual designer, Israel</span></div>
      </footer>`);
    document.body.appendChild(f);
    const big = $(".site-footer__big", f);
    flicker(glyphs(big, { ratio: 0.28, seed: 7 }), 700, 3);
    const btn = $("[data-copy]", f), toast = $(".copy-toast", f);
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); toast.textContent = "Copied"; }
      catch { location.href = "mailto:" + btn.dataset.copy; return; }
      toast.classList.add("is-on");
      setTimeout(() => toast.classList.remove("is-on"), 1600);
    });
    if (hasGSAP && !REDUCED) {
      gsap.from($$(".word", big), {
        yPercent: 100, opacity: 0, stagger: 0.06, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: big, start: "top 85%" },
      });
    }
  }

  function cursor() {
    if (!FINE || REDUCED) return;
    document.body.classList.add("has-cursor");
    const c = h(`<div class="cursor" aria-hidden="true"><span></span></div>`);
    document.body.appendChild(c);
    const label = $("span", c);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    document.addEventListener("mouseleave", () => c.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => c.classList.remove("is-hidden"));
    const loop = () => { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; c.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor],[data-cursor-link],a,button");
      c.classList.remove("is-label", "is-link");
      if (!t) return;
      if (t.dataset.cursor) { label.textContent = t.dataset.cursor; c.classList.add("is-label"); }
      else c.classList.add("is-link");
    });
  }

  // Pink pixel grid that covers / uncovers the page between navigations.
  function wipe() {
    const el = h(`<div class="wipe" aria-hidden="true"></div>`);
    const cols = innerWidth < 700 ? 8 : 16;
    const size = innerWidth / cols;
    const rows = Math.ceil(innerHeight / size);
    el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    el.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    for (let i = 0; i < cols * rows; i++) el.appendChild(document.createElement("i"));
    document.body.appendChild(el);
    const cells = [...el.children];
    const out = () => {
      if (REDUCED || !hasGSAP) { el.classList.add("is-done"); return Promise.resolve(); }
      return new Promise((res) => gsap.to(cells, { opacity: 0, duration: 0.01, stagger: { each: 0.5 / cells.length * 1.6, from: "random" }, onComplete: () => { el.classList.add("is-done"); res(); } }));
    };
    const cover = () => new Promise((res) => {
      if (REDUCED || !hasGSAP) return res();
      el.classList.remove("is-done");
      gsap.set(cells, { opacity: 0 });
      gsap.to(cells, { opacity: 1, duration: 0.01, stagger: { each: 0.45 / cells.length * 1.6, from: "random" }, onComplete: res });
    });
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.protocol === "mailto:" || u.protocol === "tel:") return;
      if (u.pathname === location.pathname && u.hash) return;
      e.preventDefault();
      cover().then(() => (location.href = u.href));
    });
    addEventListener("pageshow", (e) => { if (e.persisted) { gsap.set(cells, { opacity: 0 }); el.classList.add("is-done"); } });
    return { out };
  }

  function smooth() {
    if (REDUCED || typeof window.Lenis === "undefined" || !hasGSAP) return null;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  /* ---------- HOME ---------- */
  function home() {
    const main = $("main");
    main.innerHTML = `
      <section class="hero" aria-label="Intro">
        <h1 class="hero__title px">Holynoa</h1>
        <div class="hero__body">
          <p class="hero__intro">Hi, my name is Noa<br>I like coffee, cats,<br>and designing things that move</p>
          <div class="hero__portrait" data-cursor="hi">
            <img src="${img("portrait-bitmap.jpg")}" alt="Bitmap portrait of Noa" hidden>
            <canvas aria-hidden="true"></canvas>
          </div>
        </div>
        <div class="hero__meta"><span class="mono">Branding · Motion · Post-production · UX/UI</span><span class="mono">Scroll ↓</span></div>
      </section>

      <div class="band" aria-hidden="true">
        <svg viewBox="0 0 2400 220" preserveAspectRatio="none">
          <path class="band__path" id="wave" d="" stroke-width="96"></path>
          <text font-size="46" dy="16"><textPath href="#wave" startOffset="0"></textPath></text>
        </svg>
      </div>

      <section class="work" id="work" aria-label="Selected work">
        <div class="section-head"><h2 class="px">Selected work</h2><span class="mono">${P.length} projects · 2023 to 2025</span></div>
        <div class="reel">
          <div class="reel__track">
            ${P.map((p, i) => `
              <a class="card" href="${url("work/" + p.slug + "/")}" data-cursor="${p.preview ? "play" : "view"}">
                <div class="card__media">
                  <span class="card__index mono">${pad(i + 1)}</span>
                  <img src="${img(p.cover)}" alt="${esc(p.title)}" loading="${i < 3 ? "eager" : "lazy"}" ${p.preview ? `data-preview="${asset(p.preview)}"` : ""}>
                </div>
                <div class="card__info">
                  <h3 class="card__title px">${esc(p.short || p.title)}</h3>
                  <span class="card__year mono">${p.year}</span>
                  <span class="card__kind mono">${esc(p.kind)}</span>
                </div>
              </a>`).join("")}
          </div>
          <div class="reel__progress" aria-hidden="true"><i></i></div>
        </div>
      </section>

      <section class="teaser" aria-label="Archive">
        <a class="teaser__link" href="${url("archive/")}" data-cursor="open">
          <span class="row"><span class="px">Prints &amp; fun</span><span class="arrow">ARCHIVE →</span></span>
        </a>
        <div class="teaser__thumbs" aria-hidden="true">${A.slice(0, 4).map((a) => `<img src="${img(a.src)}" alt="" loading="lazy">`).join("")}</div>
      </section>`;

    // hero title + intro glyph treatment
    const title = $(".hero__title");
    const tg = glyphs(title, { ratio: 0.25, seed: 3 });
    flicker(tg, 650, 2);
    const intro = $(".hero__intro");
    intro.innerHTML = intro.innerHTML.split("<br>").map((l) => `<span class="reveal-line"><span>${l}</span></span>`).join("");
    $$(".reveal-line > span", intro).forEach((s, i) => glyphs(s, { ratio: 0.32, seed: 11 + i }));

    // letters near the pointer turn italic
    if (FINE && !REDUCED) {
      let rects = [];
      const measure = () => (rects = tg.map((g) => { const r = g.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }));
      addEventListener("resize", measure);
      addEventListener("scroll", measure, { passive: true });
      setTimeout(measure, 300);
      title.addEventListener("mousemove", (e) => {
        tg.forEach((g, i) => {
          const d = Math.hypot(e.clientX - rects[i][0], e.clientY - rects[i][1]);
          if (d < 130) flip(g, true);
        });
      });
      title.addEventListener("mouseleave", () => tg.forEach((g, i) => flip(g, hash(i, 3) < 0.25)));
    }

    portrait($(".hero__portrait"));
    band($(".band"));
    reel();
    teaser();

    if (hasGSAP && !REDUCED) {
      gsap.from($$(".reveal-line > span", intro), { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "power4.out", delay: 0.35 });
      gsap.from(".hero__portrait", { opacity: 0, duration: 1.4, delay: 0.2 });
      gsap.to(title, { yPercent: -35, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero__portrait", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      $$(".section-head h2").forEach((h2) => {
        const gs = glyphs(h2, { ratio: 0.2, seed: 5 });
        gsap.from(gs, { opacity: 0, yPercent: 60, stagger: 0.03, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: h2, start: "top 85%" } });
      });
    }
  }

  // Bitmap portrait: blurred into big pixels, sharp where you look.
  function portrait(box) {
    const im = $("img", box), cv = $("canvas", box), ctx = cv.getContext("2d");
    const sharp = document.createElement("canvas"), sctx = sharp.getContext("2d");
    let w = 0, hgt = 0, dpr = 1;
    const m = { x: 0.62, y: 0.38, tx: 0.62, ty: 0.38, r: 0, tr: 0 };
    const size = () => {
      const r = box.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = sharp.width = Math.round(r.width * dpr);
      hgt = cv.height = sharp.height = Math.round(r.height * dpr);
      drawPixel(sctx, im, 1, "cover", 1);
    };
    const render = (t = 0) => {
      if (!w) return;
      const block = REDUCED ? 1 : Math.round((9 + Math.sin(t / 900) * 3) * dpr);
      drawPixel(ctx, im, block, "cover", 1);
      if (!REDUCED) {
        m.x += (m.tx - m.x) * 0.08; m.y += (m.ty - m.y) * 0.08; m.r += (m.tr - m.r) * 0.08;
        ctx.save();
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * hgt, m.r * Math.min(w, hgt), 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(sharp, 0, 0);
        ctx.restore();
      }
    };
    ready(im).then(() => {
      size();
      addEventListener("resize", size);
      if (REDUCED) { render(); return; }
      let visible = true;
      new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(box);
      const loop = (t) => { if (visible) render(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      if (FINE) {
        box.addEventListener("mousemove", (e) => {
          const r = box.getBoundingClientRect();
          m.tx = (e.clientX - r.left) / r.width; m.ty = (e.clientY - r.top) / r.height; m.tr = 0.26;
        });
        box.addEventListener("mouseleave", () => (m.tr = 0));
      } else {
        // touch: the sharp spot drifts on its own
        m.tr = 0.22;
        setInterval(() => { m.tx = 0.45 + Math.random() * 0.45; m.ty = 0.2 + Math.random() * 0.5; }, 1800);
      }
    });
  }

  // Pink liquid ribbon with the site motto riding the wave.
  function band(el) {
    const path = $("#wave", el), tp = $("textPath", el);
    const unit = "play → distort → design → repeat → ";
    tp.textContent = unit.repeat(14);
    let phase = 0, offset = 0, boost = 0;
    const W = 2400, mid = 110, amp = 46, k = (Math.PI * 2) / 1200;
    const wave = () => {
      let d = "";
      for (let x = -100; x <= W + 100; x += 40) d += (d ? " L" : "M") + x + " " + (mid + Math.sin(x * k + phase) * amp).toFixed(1);
      path.setAttribute("d", d);
    };
    wave();
    let unitLen = 0;
    const measure = () => { try { unitLen = tp.parentNode.getComputedTextLength() / 14; } catch { unitLen = 900; } };
    document.fonts?.ready.then(measure); measure();
    if (REDUCED) return;
    let last = scrollY;
    addEventListener("scroll", () => { boost += Math.abs(scrollY - last) * 0.02; last = scrollY; }, { passive: true });
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);
    const loop = () => {
      if (visible) {
        boost *= 0.92;
        phase += 0.012 + boost * 0.004;
        offset -= 1.2 + boost;
        if (unitLen && offset < -unitLen) offset += unitLen;
        wave();
        tp.setAttribute("startOffset", offset.toFixed(1));
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  function reel() {
    const track = $(".reel__track"), bar = $(".reel__progress i");
    const cards = $$(".card", track);

    // hover video previews
    cards.forEach((card) => {
      const im = $("img", card);
      if (!im.dataset.preview || !FINE) return;
      let v;
      card.addEventListener("mouseenter", () => {
        if (!v) {
          v = document.createElement("video");
          Object.assign(v, { src: im.dataset.preview, muted: true, loop: true, playsInline: true, preload: "auto" });
          v.setAttribute("aria-hidden", "true");
          v.addEventListener("canplay", () => v.classList.add("is-ready"), { once: true });
          $(".card__media", card).appendChild(v);
        }
        v.play().catch(() => {});
      });
      card.addEventListener("mouseleave", () => v && v.pause());
    });

    // cards resolve from pixels like her title font
    $$(".card__title", track).forEach((t, i) => { glyphs(t, { ratio: 0.25, seed: 20 + i }); ripple(t.closest(".card")); });

    if (!hasGSAP || REDUCED) return;

    ScrollTrigger.matchMedia({
      "(min-width: 901px)": () => {
        const dist = () => track.scrollWidth - innerWidth;
        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: ".work",
            start: "top top",
            end: () => "+=" + dist(),
            pin: ".work",
            pinSpacing: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              gsap.set(bar, { scaleX: self.progress });
              const skew = gsap.utils.clamp(-3, 3, self.getVelocity() / -600);
              gsap.to(cards, { skewX: skew, duration: 0.4, overwrite: true });
            },
          },
        });
        cards.forEach((card) => pixelReveal($("img", card), { trigger: card, containerAnimation: tween, start: "left 95%" }));
      },
      "(max-width: 900px)": () => {
        cards.forEach((card) => pixelReveal($("img", card), { trigger: card }));
      },
    });
  }

  function teaser() {
    const link = $(".teaser__link"), thumbs = $$(".teaser__thumbs img");
    if (!FINE || REDUCED || !hasGSAP) return;
    let n = 0, lastT = 0;
    link.addEventListener("mousemove", (e) => {
      const now = performance.now();
      if (now - lastT < 140) return;
      lastT = now;
      const r = link.parentElement.getBoundingClientRect();
      const t = thumbs[n++ % thumbs.length];
      gsap.killTweensOf(t);
      gsap.set(t, { left: e.clientX - r.left - 90, top: e.clientY - r.top - 90, opacity: 1, scale: 0.6, rotate: gsap.utils.random(-12, 12) });
      gsap.to(t, { scale: 1, duration: 0.5, ease: "back.out(2)" });
      gsap.to(t, { opacity: 0, duration: 0.4, delay: 0.55 });
    });
  }

  /* ---------- PROJECT ---------- */
  function project() {
    const slug = document.body.dataset.slug;
    const idx = P.findIndex((p) => p.slug === slug);
    const p = P[idx];
    if (!p) { location.replace(url("")); return; }
    const next = P[(idx + 1) % P.length];
    document.title = `${p.short || p.title} · HOLYNOA`;
    const main = $("main");

    const heroMedia = (() => {
      const m = p.hero;
      if (m.type === "video" && m.loop) return `<div class="p-media"><video src="${asset(m.src)}" poster="${asset(m.poster)}" muted loop autoplay playsinline></video></div>`;
      if (m.type === "video") return `<div class="p-media" data-kind="video"><img src="${asset(m.poster)}" alt="${esc(p.title)}, video still"><button class="p-media__play" data-cursor="play" aria-label="Play video"><span>Play</span></button></div>`;
      if (m.type === "youtube") return `<div class="p-media" data-kind="youtube" data-id="${m.id}"><img src="${asset(m.poster)}" alt="${esc(p.title)}"><button class="p-media__play" data-cursor="play" aria-label="Play video"><span>Play</span></button></div>`;
      return `<div class="p-media"><img src="${asset(m.src)}" alt="${esc(p.title)}"></div>`;
    })();

    const gallery = (p.gallery || []).map((g) => {
      if (g.row) return `<div class="row">${g.row.map((f) => `<figure><div class="frame"><img src="${img(f)}" alt="${esc(p.title)}" loading="lazy"></div></figure>`).join("")}</div>`;
      if (g.video) return `<figure><div class="frame"><video src="${asset(g.video)}" poster="${asset(g.poster)}" ${g.controls ? "controls" : "muted loop autoplay"} playsinline preload="metadata"></video></div>${g.caption ? `<figcaption class="mono">${esc(g.caption)}</figcaption>` : ""}</figure>`;
      return `<figure class="${g.narrow ? "narrow" : ""}"><div class="frame"><img src="${img(g.src)}" alt="${esc(p.title)}" loading="lazy"></div>${g.caption ? `<figcaption class="mono">${esc(g.caption)}</figcaption>` : ""}</figure>`;
    }).join("");

    main.innerHTML = `
      <section class="p-hero">
        <div class="p-hero__crumbs mono"><a href="${url("")}#work">Work</a><span>${pad(idx + 1)} / ${pad(P.length)}</span></div>
        <h1 class="p-hero__title px ${p.title.length > 18 ? "is-long" : ""}">${esc(p.title)}</h1>
        <dl class="p-meta">
          <div><dt class="mono">Type</dt><dd>${esc(p.kind)}</dd></div>
          <div><dt class="mono">Context</dt><dd>${esc(p.label)}</dd></div>
          <div><dt class="mono">Year</dt><dd>${p.year}</dd></div>
          <div><dt class="mono">Focus</dt><dd>${esc(p.tags.slice(0, 2).join(", "))}</dd></div>
        </dl>
      </section>
      ${heroMedia}
      <section class="p-body">
        <p class="p-body__lead">${esc(p.lead || p.kind)}</p>
        <div class="p-body__text">
          ${p.text.map((t) => `<p>${esc(t)}</p>`).join("")}
          <div class="p-tags">${p.tags.map((t) => `<span class="mono">${esc(t)}</span>`).join("")}</div>
          ${p.aside ? `<aside class="p-aside"><h3 class="px">${esc(p.aside.title)}</h3><p>${esc(p.aside.text)}</p></aside>` : ""}
        </div>
      </section>
      ${gallery ? `<section class="p-gallery" aria-label="Gallery">${gallery}</section>` : ""}
      <a class="next" href="${url("work/" + next.slug + "/")}" data-cursor="next">
        <span class="mono">Next project</span>
        <div class="next__title px">${esc(next.short || next.title)}</div>
        <img class="next__img" src="${img(next.cover)}" alt="" loading="lazy">
      </a>`;

    const t = $(".p-hero__title");
    const gs = glyphs(t, { ratio: 0.3, seed: idx + 2 });
    flicker(gs, 800, 2);
    glyphs($(".next__title"), { ratio: 0.3, seed: idx + 9 });
    glyphs($(".p-body__lead"), { ratio: 0.45, seed: idx + 30 });
    ripple($(".next"));

    // click-to-play hero
    const pm = $(".p-media[data-kind]");
    if (pm) {
      $(".p-media__play", pm).addEventListener("click", () => {
        if (pm.dataset.kind === "youtube") {
          pm.insertAdjacentHTML("beforeend", `<iframe src="https://www.youtube-nocookie.com/embed/${pm.dataset.id}?autoplay=1&rel=0" title="${esc(p.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`);
        } else {
          const v = h(`<video src="${asset(p.hero.src)}" poster="${asset(p.hero.poster)}" controls autoplay playsinline></video>`);
          pm.appendChild(v);
        }
        pm.classList.add("is-playing");
      });
    }

    if (hasGSAP && !REDUCED) {
      gsap.from(gs, { yPercent: 70, opacity: 0, stagger: 0.025, duration: 0.8, ease: "power3.out", delay: 0.25 });
      gsap.from(".p-meta > div", { y: 20, opacity: 0, stagger: 0.08, duration: 0.8, ease: "power3.out", delay: 0.5 });
      const heroImg = $(".p-media > img");
      if (heroImg) pixelReveal(heroImg, { start: "top 95%" });
      gsap.fromTo(".p-media", { clipPath: "inset(8% 4% 8% 4%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".p-media", start: "top bottom", end: "top 25%", scrub: true } });
      $$(".p-gallery img").forEach((im) => pixelReveal(im));
      $$(".p-body__text p").forEach((pp) => gsap.from(pp, { y: 30, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: pp, start: "top 88%" } }));
    }
  }

  /* ---------- ARCHIVE ---------- */
  function archive() {
    const main = $("main");
    main.innerHTML = `
      <section class="a-hero">
        <h1 class="px">Prints &amp; fun</h1>
        <p class="mono">From over the years · ${A.length} pieces</p>
      </section>
      <section class="a-grid" aria-label="Archive">
        ${A.map((a, i) => `
          <button class="a-item" type="button" data-i="${i}" data-cursor="view">
            <figure style="margin:0">
              <div class="frame"><img src="${img(a.src)}" alt="${esc(a.title)}" loading="lazy"></div>
              <figcaption class="mono"><b>${esc(a.title)}</b><span>${esc(a.kind)}</span></figcaption>
            </figure>
          </button>`).join("")}
      </section>
      <div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
        <button class="lightbox__close mono" type="button">Close ✕</button>
        <img alt="">
        <span class="lightbox__cap mono"></span>
      </div>`;
    const h1 = $(".a-hero h1");
    flicker(glyphs(h1, { ratio: 0.3, seed: 4 }), 700, 2);
    $$(".a-item img").forEach((im) => pixelReveal(im));

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

  /* ---------- ABOUT ---------- */
  function about() {
    const main = $("main");
    main.innerHTML = `
      <section class="about">
        <h1 class="px">Info</h1>
        <div class="about__portrait" data-cursor="hi">
          <img src="${img("portrait-bitmap.jpg")}" alt="Bitmap portrait of Noa" hidden>
          <canvas aria-hidden="true"></canvas>
        </div>
        <div class="about__text">
          <p>Hi, I'm Noa Yaakobovitz, a visual designer with a B.Des. in Visual Communication.</p>
          <p>I work across branding, motion design, post-production, compositing, and UX/UI, with a strong focus on screen-based visuals.</p>
          <p>My work explores the emotional side of technology: how images, interfaces, and digital systems shape memory, mood, and perception. I like mixing clean, intentional design with subtle imperfections, creating visuals that feel both sharp and human.</p>
          <p>I'm drawn to projects that sit between design and art, precision and experimentation, and I care deeply about concept, rhythm, and tone, not just how things look, but how they move and feel.</p>
          <p>Let's work together :)</p>
          <ul class="about__list">
            <li><span class="mono">Disciplines</span><span>Branding, motion, post-production, compositing, UX/UI</span></li>
            <li><span class="mono">Education</span><span>B.Des. Visual Communication, HIT</span></li>
            <li><span class="mono">Email</span><a href="mailto:${esc(S.email)}" data-cursor-link>${esc(S.email)}</a></li>
            <li><span class="mono">Instagram</span><a href="${S.instagram}" target="_blank" rel="noopener" data-cursor-link>@holynoa</a></li>
            <li><span class="mono">LinkedIn</span><a href="${S.linkedin}" target="_blank" rel="noopener" data-cursor-link>noayaakobovitz</a></li>
          </ul>
          <a class="about__cta" href="${asset("Resume-Noa-Yaakobovitz.pdf")}" target="_blank" rel="noopener" data-cursor="pdf">Resume ↓</a>
        </div>
      </section>`;
    const h1 = $(".about h1");
    const gs = glyphs(h1, { ratio: 0.35, seed: 8 });
    flicker(gs, 600, 2);
    portrait($(".about__portrait"));
    if (hasGSAP && !REDUCED) {
      gsap.from(gs, { yPercent: 70, opacity: 0, stagger: 0.05, duration: 0.8, ease: "power3.out", delay: 0.2 });
      $$(".about__text > p, .about__list li").forEach((el) => gsap.from(el, { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } }));
    }
  }

  /* ---------- first-visit loader ---------- */
  function loader() {
    let seen = false;
    try { seen = sessionStorage.getItem("hn-seen") === "1"; sessionStorage.setItem("hn-seen", "1"); } catch {}
    if (seen || REDUCED || !hasGSAP || PAGE !== "home") return Promise.resolve();
    const el = h(`<div class="loader" aria-hidden="true"><div class="loader__word px">Holynoa</div><span class="loader__count mono">000</span><span class="loader__note mono">play → distort → design → repeat</span></div>`);
    document.body.appendChild(el);
    const gs = glyphs($(".loader__word", el), { ratio: 0.5, seed: 2 });
    const iv = setInterval(() => gs.forEach((g) => Math.random() < 0.4 && flip(g)), 90);
    const c = { v: 0 };
    return new Promise((res) => {
      gsap.to(c, {
        v: 100, duration: 1.6, ease: "power2.inOut",
        onUpdate: () => ($(".loader__count", el).textContent = String(Math.round(c.v)).padStart(3, "0")),
        onComplete: () => {
          clearInterval(iv);
          gs.forEach((g, i) => flip(g, hash(i, 3) < 0.25));
          gsap.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "power4.inOut", delay: 0.15, onComplete: () => { el.remove(); res(); } });
        },
      });
    });
  }

  /* ---------- boot ---------- */
  header();
  const w = wipe();
  ({ home, project, archive, about })[PAGE]?.();
  footer();
  cursor();
  smooth();
  loader();
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 900))])
    .then(() => w.out())
    .then(() => hasGSAP && ScrollTrigger.refresh());
  document.fonts?.ready.then(() => hasGSAP && ScrollTrigger.refresh());
})();
