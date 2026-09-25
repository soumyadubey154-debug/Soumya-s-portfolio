/* ══════════════════════════════════════════════════════════════
   SOUMYA DUBEY — PORTFOLIO SCRIPT
   Vanilla ES modules. Three.js loaded via CDN import map.
   ══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

/* ─────────────── Helpers ─────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const clamp = (v, min = 0, max = 1) => Math.min(Math.max(v, min), max);
const lerp  = (a, b, t) => a + (b - a) * t;
// Frame-rate independent damping
const damp  = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH   = window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* ─────────────── 1. PRELOADER ─────────────── */
(function preloader() {
  const el    = $('#preloader');
  const count = $('#preCount');
  const bar   = $('#preBar');
  if (!el) return;

  let p = 0;
  const DURATION = REDUCED ? 300 : 1500;
  const start = performance.now();

  function tick(now) {
    const t = clamp((now - start) / DURATION);
    // ease-out so it decelerates near 100
    const eased = 1 - Math.pow(1 - t, 2.2);
    p = Math.round(eased * 100);

    if (count) count.textContent = p;
    if (bar)   bar.style.width = p + '%';

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      el.classList.add('is-done');
      document.body.classList.remove('is-locked');
      setTimeout(() => el.remove(), 800);
      // Kick off hero + first reveals
      document.dispatchEvent(new CustomEvent('app:ready'));
    }
  }

  document.body.classList.add('is-locked');
  requestAnimationFrame(tick);
})();

/* ─────────────── 2. THEME ─────────────── */
(function theme() {
  const root   = document.documentElement;
  const toggle = $('#themeToggle');
  const meta   = $('meta[name="theme-color"]');
  const KEY    = 'sd-theme';

  const stored = localStorage.getItem(KEY);
  // Default = light (per brief). Only override if user explicitly chose dark.
  const initial = stored === 'dark' ? 'dark' : 'light';
  apply(initial, false);

  function apply(mode, persist = true) {
    root.setAttribute('data-theme', mode);
    if (persist) localStorage.setItem(KEY, mode);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(mode === 'dark'));
      toggle.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0B0B0F' : '#F7F5F1');
    window.dispatchEvent(new CustomEvent('theme:change', { detail: { mode } }));
  }

  toggle?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
  });
})();

/* ─────────────── 3. CUSTOM CURSOR ─────────────── */
(function cursor() {
  if (TOUCH || REDUCED) return;

  const wrap = $('#cursor');
  const dot  = $('#cursorDot');
  const ring = $('#cursorRing');
  if (!wrap || !dot || !ring) return;

  document.body.classList.add('has-cursor');

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let dx = mx, dy = my;     // dot position (fast)
  let rx = mx, ry = my;     // ring position (lagging)
  let scale = 1, targetScale = 1;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  window.addEventListener('mousedown', () => { targetScale = 0.82; });
  window.addEventListener('mouseup',   () => { targetScale = 1; });

  const HOVER_SEL = 'a, button, input, textarea, .magnetic, .tilt, [role="button"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVER_SEL)) wrap.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(HOVER_SEL)) wrap.classList.remove('is-hover');
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    dx = damp(dx, mx, 34, dt);
    dy = damp(dy, my, 34, dt);
    rx = damp(rx, mx, 12, dt);
    ry = damp(ry, my, 12, dt);
    scale = damp(scale, targetScale, 16, dt);

    dot.style.transform  = `translate3d(${dx}px, ${dy}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`;

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  document.addEventListener('mouseleave', () => { wrap.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { wrap.style.opacity = '1'; });
})();

/* ─────────────── 4. TYPEWRITER ─────────────── */
(function typewriter() {
  const el = $('#typewriter');
  if (!el) return;

  const words = (el.dataset.words || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!words.length) return;

  if (REDUCED) { el.textContent = words[0]; return; }

  let wi = 0, ci = 0, deleting = false;

  function step() {
    const word = words[wi];

    if (!deleting) {
      ci++;
      el.textContent = word.slice(0, ci);
      if (ci === word.length) {
        deleting = true;
        return setTimeout(step, 1900);
      }
      setTimeout(step, 62 + Math.random() * 45);
    } else {
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        return setTimeout(step, 320);
      }
      setTimeout(step, 32);
    }
  }
  setTimeout(step, 1500);
})();

/* ─────────────── 5. SCROLL REVEALS ─────────────── */
(function reveals() {
  // Assign stagger delays to children of [data-stagger]
  $$('[data-stagger]').forEach(group => {
    const step = Number(group.dataset.stagger) || 80;
    [...group.children].forEach((child, i) => {
      child.style.setProperty('--d', i * step);
    });
  });

  const targets = $$('.reveal, [data-stagger]');

  if (REDUCED) {
    targets.forEach(t => t.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(t => io.observe(t));
})();

/* ─────────────── 6. NAV: scrolled + active link ─────────────── */
(function nav() {
  const nav    = $('#nav');
  const links  = $$('.nav__link');
  const sections = links
    .map(l => $(l.getAttribute('href')))
    .filter(Boolean);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;

      nav?.classList.toggle('is-scrolled', y > 20);

      // active section
      const probe = y + window.innerHeight * 0.32;
      let activeId = sections[0]?.id;
      for (const s of sections) {
        if (s.offsetTop <= probe) activeId = s.id;
      }
      links.forEach(l => {
        l.classList.toggle('is-active', l.getAttribute('href') === '#' + activeId);
      });

      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ─────────────── 7. MOBILE MENU ─────────────── */
(function mobileMenu() {
  const btn   = $('#menuBtn');
  const panel = $('#mobileMenu');
  if (!btn || !panel) return;

  let open = false;

  function setOpen(state) {
    open = state;
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);

    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
    } else {
      panel.classList.remove('is-open');
      setTimeout(() => { if (!open) panel.hidden = true; }, 450);
    }
  }

  btn.addEventListener('click', () => setOpen(!open));
  $$('.mobile-menu__link, .mobile-menu__cta', panel).forEach(a =>
    a.addEventListener('click', () => setOpen(false))
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
})();

/* ─────────────── 8. MAGNETIC BUTTONS ─────────────── */
(function magnetic() {
  if (TOUCH || REDUCED) return;

  $$('.magnetic').forEach(el => {
    const STRENGTH = 0.32;
    const MAX = 14;

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * STRENGTH;
      const y = (e.clientY - (r.top + r.height / 2)) * STRENGTH;
      el.style.transform = `translate(${clamp(x, -MAX, MAX)}px, ${clamp(y, -MAX, MAX)}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
})();

/* ─────────────── 9. 3D TILT CARDS ─────────────── */
(function tilt() {
  if (TOUCH || REDUCED) return;

  const MAX_DEG = 6;

  $$('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;

      const rx = (0.5 - py) * MAX_DEG * 2;
      const ry = (px - 0.5) * MAX_DEG * 2;

      card.style.transform =
        `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ─────────────── 10. TIMELINE RAIL PROGRESS ─────────────── */
(function timeline() {
  const wrap = $('#timeline');
  const path = $('#tlProgress');
  if (!wrap || !path) return;

  let ticking = false;
  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress from when the rail enters mid-viewport to when it exits
      const total = r.height + vh * 0.45;
      const passed = clamp((vh * 0.7 - r.top) / total);
      path.style.strokeDashoffset = String(1 - passed);
      ticking = false;
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ─────────────── 11. CONTACT FORM ─────────────── */
(function contactForm() {
  const form = $('#contactForm');
  const btn  = $('#submitBtn');
  const note = $('#formNote');
  if (!form || !btn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic native validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    btn.classList.add('is-loading');
    btn.disabled = true;

    // ── Swap this timeout for your real fetch() to Formspree ──
    // fetch('https://formspree.io/f/YOUR_ID', {
    //   method: 'POST',
    //   body: new FormData(form),
    //   headers: { Accept: 'application/json' }
    // }).then(...)
    setTimeout(() => {
      btn.classList.remove('is-loading');
      btn.classList.add('is-done');
      if (note) note.textContent = 'Thanks — I’ll get back to you soon.';

      setTimeout(() => {
        btn.classList.remove('is-done');
        btn.disabled = false;
        form.reset();
        if (note) note.textContent = 'Demo only — connect Formspree to receive messages.';
      }, 2600);
    }, 1400);
  });
})();

/* ─────────────── 12. FOOTER / MISC ─────────────── */
(function misc() {
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  $('#toTop')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  });
})();

/* ══════════════════════════════════════════════════════════════
   13. THREE.JS — SIGNATURE MORPHING ICOSAHEDRON
   A single object that travels the page and shifts between a
   faceted / geometric state and a soft / organic state.
   ══════════════════════════════════════════════════════════════ */
(function scene3D() {
  const canvas = $('#webgl');
  if (!canvas || REDUCED) return;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !TOUCH,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, TOUCH ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  /* ── Scene & camera ── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  /* ── Geometry: high-detail icosahedron, displaced in-shader ── */
  const geometry = new THREE.IcosahedronGeometry(1, TOUCH ? 24 : 48);

  /* ── Shader ── */
  const uniforms = {
    uTime:     { value: 0 },
    uMorph:    { value: 0.2 },   // 0 = faceted/geometric, 1 = organic/soft
    uSharp:    { value: 1.0 },   // facet normal blend
    uTheme:    { value: 0 },     // 0 = light, 1 = dark
    uColorA:   { value: new THREE.Color('#6A46F0') },
    uColorB:   { value: new THREE.Color('#B9A7FF') },
    uColorC:   { value: new THREE.Color('#2A2340') },
    uFreq:     { value: 1.35 },
  };

  const vertexShader = /* glsl */`
    uniform float uTime;
    uniform float uMorph;
    uniform float uFreq;

    varying vec3  vNormalW;
    varying vec3  vPosW;
    varying float vDisp;
    varying vec3  vViewPos;

    /* --- cheap 3D value noise --- */
    vec3 hash3(vec3 p) {
      p = vec3(
        dot(p, vec3(127.1, 311.7,  74.7)),
        dot(p, vec3(269.5, 183.3, 246.1)),
        dot(p, vec3(113.5, 271.9, 124.6))
      );
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
    }
    float fbm(vec3 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.02;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 p  = position;
      vec3 n  = normalize(normal);

      float d = fbm(p * uFreq + vec3(0.0, 0.0, uTime * 0.18));
      vDisp = d;

      // Organic displacement only kicks in as uMorph rises
      vec3 displaced = p + n * d * uMorph * 0.42;

      vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
      vec4 viewPos  = viewMatrix * worldPos;

      vPosW     = worldPos.xyz;
      vViewPos  = viewPos.xyz;
      vNormalW  = normalize(mat3(modelMatrix) * n);

      gl_Position = projectionMatrix * viewPos;
    }
  `;

  const fragmentShader = /* glsl */`
    uniform float uSharp;
    uniform float uTheme;
    uniform vec3  uColorA;
    uniform vec3  uColorB;
    uniform vec3  uColorC;

    varying vec3  vNormalW;
    varying vec3  vPosW;
    varying float vDisp;
    varying vec3  vViewPos;

    void main() {
      /* Facet normal from screen-space derivatives — gives the
         low-poly crystalline read without a second geometry. */
      vec3 facetN = normalize(cross(dFdx(vPosW), dFdy(vPosW)));
      vec3 smoothN = normalize(vNormalW);

      // Flip facet normal toward camera so lighting stays sane
      if (dot(facetN, normalize(cameraPosition - vPosW)) < 0.0) facetN = -facetN;

      vec3 N = normalize(mix(smoothN, facetN, clamp(uSharp, 0.0, 1.0)));
      vec3 V = normalize(cameraPosition - vPosW);

      float ndv   = max(dot(N, V), 0.0);
      float fres  = pow(1.0 - ndv, 2.6);

      /* Faux key light */
      vec3  L    = normalize(vec3(0.65, 0.85, 0.75));
      float diff = max(dot(N, L), 0.0);
      float spec = pow(max(dot(reflect(-L, N), V), 0.0), 42.0);

      /* Base colour blends by displacement so the surface has depth */
      float t   = clamp(vDisp * 0.5 + 0.5, 0.0, 1.0);
      vec3 base = mix(uColorA, uColorB, t);
      base      = mix(base, uColorC, (1.0 - ndv) * 0.35);

      vec3 col = base * (0.28 + diff * 0.72);

      /* Rim / glass edge glow */
      col += uColorA * fres * 1.15;

      /* Specular highlight */
      col += vec3(1.0) * spec * 0.55;

      /* Iridescent sheen */
      float sheen = sin(vDisp * 8.0 + ndv * 6.0) * 0.5 + 0.5;
      col += mix(uColorB, uColorA, sheen) * fres * 0.28;

      /* Theme tuning: lift the object slightly on light backgrounds */
      col = mix(col * 1.06, col * 0.94, uTheme);

      /* Soft alpha falloff on the silhouette so it never looks cut out */
      float alpha = mix(0.94, 1.0, ndv);

      gl_FragColor = vec4(col, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  /* ── Wireframe shell for the "sharp/geometric" state ── */
  const wireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#6A46F0'),
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const wireMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), wireMat);
  wireMesh.scale.setScalar(1.03);
  scene.add(wireMesh);

  /* ── Scroll keyframes ──
     Each entry drives position, scale, morph and wireframe at a
     given page-scroll progress (0 → 1).                              */
  const KEYFRAMES = [
    // hero
    { at: 0.00, x:  1.35, y:  0.00, z:  0.0, s: 1.10, morph: 0.16, sharp: 1.00, wire: 0.16 },
    // about — soft + organic
    { at: 0.18, x: -1.55, y:  0.10, z: -0.6, s: 0.86, morph: 1.00, sharp: 0.00, wire: 0.00 },
    // skills — sharp + geometric
    { at: 0.36, x:  1.70, y: -0.10, z: -0.9, s: 0.72, morph: 0.08, sharp: 1.00, wire: 0.24 },
    // experience
    { at: 0.53, x: -1.80, y:  0.00, z: -0.9, s: 0.70, morph: 0.52, sharp: 0.62, wire: 0.08 },
    // projects — sharp again
    { at: 0.71, x:  1.80, y:  0.00, z: -0.9, s: 0.70, morph: 0.08, sharp: 1.00, wire: 0.24 },
    // contact — resting
    { at: 0.90, x:  0.00, y:  0.28, z:  0.3, s: 0.92, morph: 0.42, sharp: 0.34, wire: 0.05 },
    // footer
    { at: 1.00, x:  0.00, y:  0.28, z:  0.3, s: 0.88, morph: 0.38, sharp: 0.38, wire: 0.04 },
  ];

  /* On small screens, pull the object toward the centre and shrink it
     so it sits behind content instead of fighting it. */
  function applyResponsive(kf) {
    const w = window.innerWidth;
    if (w < 700) {
      return {
        ...kf,
        x: kf.x * 0.32,
        s: kf.s * 0.62,
        z: kf.z - 0.9,
      };
    }
    if (w < 1000) {
      return { ...kf, x: kf.x * 0.62, s: kf.s * 0.82 };
    }
    return kf;
  }

  /* Sample the keyframe list at a given progress value */
  function sampleKeys(progress) {
    const p = clamp(progress);

    let a = KEYFRAMES[0];
    let b = KEYFRAMES[KEYFRAMES.length - 1];

    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (p >= KEYFRAMES[i].at && p <= KEYFRAMES[i + 1].at) {
        a = KEYFRAMES[i];
        b = KEYFRAMES[i + 1];
        break;
      }
    }

    const span = Math.max(b.at - a.at, 0.0001);
    const t = clamp((p - a.at) / span);
    // Smoothstep for a gentler ease between states
    const e = t * t * (3 - 2 * t);

    return {
      x:     lerp(a.x,     b.x,     e),
      y:     lerp(a.y,     b.y,     e),
      z:     lerp(a.z,     b.z,     e),
      s:     lerp(a.s,     b.s,     e),
      morph: lerp(a.morph, b.morph, e),
      sharp: lerp(a.sharp, b.sharp, e),
      wire:  lerp(a.wire,  b.wire,  e),
    };
  }

  /* ── State ── */
  const state = {
    x: 1.35, y: 0, z: 0, s: 1.1,
    morph: 0.16, sharp: 1, wire: 0.16,
  };

  /* ── Mouse parallax ── */
  const pointer = { x: 0, y: 0 };
  const target  = { x: 0, y: 0 };

  if (!TOUCH) {
    window.addEventListener('mousemove', (e) => {
      target.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* ── Theme sync ── */
  function syncTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    uniforms.uTheme.value = dark ? 1 : 0;

    uniforms.uColorA.value.set(dark ? '#7C5CFC' : '#6A46F0');
    uniforms.uColorB.value.set(dark ? '#C7B8FF' : '#B9A7FF');
    uniforms.uColorC.value.set(dark ? '#1A1730' : '#2A2340');
    wireMat.color.set(dark ? '#7C5CFC' : '#6A46F0');
  }
  syncTheme();
  window.addEventListener('theme:change', syncTheme);

  /* ── Resize ── */
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, TOUCH ? 1.5 : 2));
  }
  window.addEventListener('resize', resize);

  /* ── Visibility: pause when tab is hidden ── */
  let visible = true;
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
  });

  /* ── Render loop ── */
  const clock = new THREE.Clock();
  let ready = false;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.elapsedTime;

    /* Scroll progress across the whole document */
    const doc = document.documentElement;
    const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const progress = clamp(window.scrollY / maxScroll);

    /* Sample the target state, then damp toward it */
    const want = applyResponsive(sampleKeys(progress));

    state.x     = damp(state.x,     want.x,     3.2, dt);
    state.y     = damp(state.y,     want.y,     3.2, dt);
    state.z     = damp(state.z,     want.z,     3.2, dt);
    state.s     = damp(state.s,     want.s,     3.2, dt);
    state.morph = damp(state.morph, want.morph, 2.6, dt);
    state.sharp = damp(state.sharp, want.sharp, 2.6, dt);
    state.wire  = damp(state.wire,  want.wire,  2.6, dt);

    /* Pointer parallax */
    pointer.x = damp(pointer.x, target.x, 4.5, dt);
    pointer.y = damp(pointer.y, target.y, 4.5, dt);

    mesh.position.set(state.x, state.y, state.z);
    mesh.scale.setScalar(state.s);

    wireMesh.position.copy(mesh.position);
    wireMesh.scale.setScalar(state.s * 1.03);

    /* Idle rotation + gentle float */
    mesh.rotation.y = t * 0.16 + pointer.x * 0.34;
    mesh.rotation.x = Math.sin(t * 0.32) * 0.12 - pointer.y * 0.24;
    mesh.rotation.z = Math.sin(t * 0.19) * 0.06;

    wireMesh.rotation.copy(mesh.rotation);

    /* Shader uniforms */
    uniforms.uTime.value  = t;
    uniforms.uMorph.value = state.morph;
    uniforms.uSharp.value = state.sharp;
    wireMat.opacity       = state.wire * 0.55;

    renderer.render(scene, camera);

    if (!ready) {
      ready = true;
      canvas.classList.add('is-ready');
    }
  }

  requestAnimationFrame(frame);

  /* Dispose on unload (keeps memory tidy if the page is bfcached) */
  window.addEventListener('pagehide', () => {
    geometry.dispose();
    material.dispose();
    wireMesh.geometry.dispose();
    wireMat.dispose();
    renderer.dispose();
  });
})();

/* ══════════════════════════════════════════════════════════════
   14. CONTENT-AWARE BACKGROUND SHIFT
   Subtle accent drift per section, synced to scroll.
   ══════════════════════════════════════════════════════════════ */
(function bgShift() {
  if (REDUCED) return;

  const g1 = $('.bg__glow--1');
  const g2 = $('.bg__glow--2');
  if (!g1 || !g2) return;

  const sections = $$('main .section');
  let ticking = false;

  function update() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const p = clamp(window.scrollY / maxScroll);

      // Drift the two glows in opposite directions
      g1.style.transform = `translate3d(${p * -8}%, ${p * 14}%, 0) scale(${1 + p * 0.22})`;
      g2.style.transform = `translate3d(${p * 10}%, ${p * -12}%, 0) scale(${1 + p * 0.16})`;

      // Fade the glows down as we approach the contact/footer area
      const fade = 1 - clamp((p - 0.78) / 0.22) * 0.45;
      g1.style.opacity = String(0.55 * fade);
      g2.style.opacity = String(0.55 * fade);

      ticking = false;
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();