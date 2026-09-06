'use client';

import { useEffect, useRef, useState } from 'react';
import type { PressProject, Theme } from '@/lib/pressSheets';
/* Written by scripts/capture-spreads.mjs. The filenames carry a content
   hash, so the rail cannot guess them — and that is the point: at a stable
   name Cloudflare kept serving a stale capture from its edge after a
   successful deploy, with no way to purge a pages.dev alias. */
import SPREADS from '@/content/spreads.json';

/**
 * THE PRESS HERO
 *
 * A rail of work sheets rendered as thick cuboids — each one a stack of
 * printed leaves, artwork on the front face, hairline CMYK plate edges on
 * the sides. The rail loops infinitely both ways. Each sheet is separated
 * into C/M/Y/K and printed on screen: black first, then cyan, magenta,
 * yellow, each wiping across on a rake, each landing out of register and
 * pulling itself in.
 *
 * Three and the whole press module are dynamically imported so ~700KB of
 * WebGL never touches the initial bundle; the stage carries the paper
 * colour, so before it loads — or if it fails — the hero is a flat paper
 * field rather than a black rectangle.
 */

export const PRESS_PROJECTS: PressProject[] = [
  { slug: 'silverstone', title: 'REBRAND FOR SILVERSTONE RACECOURSE', client: 'SILVERSTONE',  tone: '#223549', kind: 4, words: ['HOME OF', 'RACING'],          art: '/press/silverstone.webp', hero: '/work/silverstone/00.webp' },
  { slug: 'hellmanns',   title: "HELLMANN'S AD CAMPAIGN",             client: "HELLMANN'S",   tone: '#c6a675', kind: 3, words: ['REAL', 'FOOD'],              art: '/press/hellmanns.webp', hero: '/work/hellmanns/00.webp' },
  { slug: 'walls',       title: "WALL'S MAKES IT HAPPIER",            client: "WALL'S",       tone: '#e1251a', kind: 0, words: ['TASTE', 'HAPPIER', 'TODAY'], art: '/press/walls.webp', hero: '/work/walls/00.webp' },
  { slug: 'absolut',     title: 'ABSOLUT HALLOWEEN',                  client: 'ABSOLUT',      tone: '#d66511', kind: 1, words: ['ABSOLUT'],                   art: '/press/absolut.webp', hero: '/work/absolut/00.webp' },
  { slug: 'networkrail', title: 'CREATIVE RETOUCH FOR NETWORK RAIL',  client: 'NETWORK RAIL', tone: '#533123', kind: 5, words: ['EVERY', 'JOURNEY'],          art: '/press/networkrail.webp', hero: '/work/networkrail/00.webp' },
  { slug: 'strongbow',   title: 'AD CAMPAIGN FOR STRONGBOW',          client: 'STRONGBOW',    tone: '#592e62', kind: 2, words: ['CRISP', 'GOLD'],             art: '/press/strongbow.webp', hero: '/work/strongbow/00.webp' },
];

/* Attach each capture from the manifest rather than naming it inline. */
for (const p of PRESS_PROJECTS) {
  p.page = (SPREADS as Record<string, string>)[p.slug];
}

const N = PRESS_PROJECTS.length;
export const PRESS_START = Math.floor((N - 1) / 2);

/* ---------- OPENING A BOOK ----------
   A cover has weight. You lift it, it goes over centre, its own mass
   takes it the rest of the way, it meets the table and settles. The
   motion is nearly all in that last third — a symmetrical ease reads as
   a panel rotating, not as a book being opened.

   Time-based rather than a per-frame lerp: the curve is then the same
   curve at any frame rate, and the settle at the end is not swallowed by
   one slow frame. */
const OPEN_SECS = 0.92;
const SHUT_SECS = 0.28;
/* Just under flat. A cover that lands at exactly 180 degrees reads as a
   diagram; a real one keeps a few degrees of its own spring. */
const OPEN_ANGLE = Math.PI * 0.985;
/* A beat with the spread actually open, before the page takes over. */
const OPEN_HOLD_MS = 520;

function openEase(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Slow off the mark while the cover is lifted...
  const s = x * x * (3 - 2 * x);
  // ...then it lands, and rebounds a couple of degrees before settling.
  const c = 0.35;
  const p = s - 1;
  return 1 + p * p * ((c + 1) * p + c);
}

export default function PressHero({
  onIndex,
  onOpen,
}: {
  onIndex?: (i: number) => void;
  onOpen?: (slug: string) => void;
}) {
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  // The loop reads a ref so toggling never re-runs the whole init effect.
  const pausedRef = useRef(false);
  const onIndexRef = useRef(onIndex);
  const onOpenRef = useRef(onOpen);
  onIndexRef.current = onIndex;
  onOpenRef.current = onOpen;

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let disposed = false;
    // Every teardown the async init might need to register.
    const cleanups: Array<() => void> = [];

    /* ---------- the stage always ends in a defined state ----------
       The press either comes up or it does not, and both endings are
       designed. What must never happen is neither: a 64svh band holding
       an invisible canvas, a hint telling you to drag it and a button
       offering to stop it. Every failure path below routes through
       pressDown(), and a backstop timer catches the ones that hang
       rather than throw — a stalled import, a device that never returns
       a context. */
    let settled = false;
    // Assigned once the rail is built; see "the page each book opens onto".
    let onLive: (() => void) | null = null;
    function pressLive() {
      if (settled || disposed) return;
      settled = true;
      window.clearTimeout(backstop);
      canvas!.classList.add('is-ready');
      document.documentElement.dataset.press = 'live';
      onLive?.();
    }
    function pressDown() {
      if (settled || disposed) return;
      settled = true;
      window.clearTimeout(backstop);
      canvas!.style.display = 'none';
      // Hands the hero to .hero-index — the same six links the rail was
      // carrying, already in the markup and already correct.
      document.documentElement.dataset.press = 'down';
    }
    const backstop = window.setTimeout(pressDown, 6000);
    cleanups.push(() => {
      window.clearTimeout(backstop);
      delete document.documentElement.dataset.press;
    });

    (async () => {
      let THREE: typeof import('three');
      let press: typeof import('@/lib/press');
      let sheets: typeof import('@/lib/pressSheets');
      let gsapMod: typeof import('gsap');
      let stMod: typeof import('gsap/ScrollTrigger');
      try {
        [THREE, press, sheets, gsapMod, stMod] = await Promise.all([
          import('three'),
          import('@/lib/press'),
          import('@/lib/pressSheets'),
          import('gsap'),
          import('gsap/ScrollTrigger'),
        ]);
      } catch {
        pressDown();
        return;
      }
      if (disposed) return;

      const gsap = gsapMod.default;
      const { ScrollTrigger } = stMod;
      gsap.registerPlugin(ScrollTrigger);

      const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
      let reduced = reducedMQ.matches;
      const onReduced = () => { reduced = reducedMQ.matches; };
      reducedMQ.addEventListener('change', onReduced);
      cleanups.push(() => reducedMQ.removeEventListener('change', onReduced));
      const cssVar = (n: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(n).trim();

      const T: Theme = {
        paper: '', ink: '', cy: '', mg: '', yl: '', gr: '', co: '',
      };
      function readTheme() {
        T.paper = cssVar('--press-paper') || cssVar('--paper') || '#edede9';
        T.ink = cssVar('--press-ink') || cssVar('--ink') || '#0d0d0d';
        T.cy = cssVar('--press-cy') || '#8fcbe8';
        T.mg = cssVar('--press-mg') || '#f0a3c8';
        T.yl = cssVar('--press-yl') || '#f7e8a4';
        T.gr = cssVar('--press-gr') || '#2c3b2d';
        T.co = cssVar('--press-co') || '#e8836b';
      }
      readTheme();

      let { w: PW, h: PH } = press.sheetSize(stage.clientWidth || window.innerWidth);

      // Probe support FIRST. Constructing a WebGLRenderer without a
      // context makes three log its own console.error, which a try/catch
      // here cannot suppress — and that is a real best-practices failure.
      const supported = (() => {
        try {
          const t = document.createElement('canvas');
          return !!(t.getContext('webgl2') || t.getContext('webgl'));
        } catch { return false; }
      })();
      if (!supported) { pressDown(); return; }

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        pressDown();
        return;
      }
      // Narrow screens are the ones most likely to be fill-rate bound.
      let dprCap = stage.clientWidth < 820 ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0, 10);

      let W = stage.clientWidth;
      let H = stage.clientHeight;
      let isNarrow = W < 820;

      /* ---------- backdrop ---------- */
      const BACK_W = 46, BACK_H = 26;
      const backMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uRail: { value: 0 },
          uLight: { value: new THREE.Vector2(-0.35, 0.5) },
          uScale: { value: new THREE.Vector2(BACK_W, BACK_H) },
          uPaper: { value: new THREE.Color(T.paper) },
          uInkC: { value: new THREE.Color(T.cy) },
          uInkM: { value: new THREE.Color(T.mg) },
          uInkY: { value: new THREE.Color(T.yl) },
          uDark: { value: sheets.isDarkPaper(T) ? 1 : 0 },
        },
        vertexShader: sheets.PLAIN_VERT,
        fragmentShader: sheets.BACKDROP_FRAG,
        depthWrite: false,
      });
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(BACK_W, BACK_H), backMat);
      backdrop.position.z = -9;
      scene.add(backdrop);

      /* ---------- printer's furniture ---------- */
      const FURN_Z = -8.2;
      const furnMat = new THREE.MeshBasicMaterial({
        map: sheets.furnitureTexture(T), transparent: true, opacity: 0.3, depthWrite: false,
      });
      const furniture = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), furnMat);
      furniture.position.z = FURN_Z;
      scene.add(furniture);

      /* ---------- the rail ---------- */
      const SPACING = 3.15, SLAB_W = 2.15, SLAB_H = 2.85, SLAB_D = 0.62;
      let edgeV = sheets.edgeTexture(true, T);
      let edgeH = sheets.edgeTexture(false, T);
      const shadowTex = sheets.shadowTexture();
      const geo = new THREE.BoxGeometry(SLAB_W, SLAB_H, SLAB_D);

      interface Slab {
        group: import('three').Group;
        hinge: import('three').Object3D;
        pageMat: import('three').MeshBasicMaterial;   // recto — the block's face
        pageMatL: import('three').MeshBasicMaterial;  // verso — the cover's inside
        verso: import('three').Mesh;                  // the left leaf itself
        pageBuilt: boolean;
        heroImg: HTMLImageElement | null;
        pageImg: HTMLImageElement | null;   // the case study page capture
        artImg: HTMLImageElement | null;    // the cover art, kept to re-stamp
        openT: number;
        mesh: import('three').Mesh;
        shadow: import('three').Mesh;
        canvas: HTMLCanvasElement;
        sep: import('three').DataTexture;
        mats: import('three').Material[];
        project: PressProject;
        printT: number;
      }
      const slabs: Slab[] = [];

      PRESS_PROJECTS.forEach((p, i) => {
        const c = sheets.cv(PW, PH);
        sheets.drawSheet(c, p, T, PW, PH);
        const sep = press.separationTexture(c, PW, PH);

        const side = (tex: import('three').Texture, tint: number) =>
          new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(tint), transparent: true });

        // The BLOCK is the body of the book. Its front face is the page
        // the cover opens onto — a preview of the case study this sheet
        // navigates to, so opening it shows you where you are going.
        // Deliberately NOT drawn here. Six 760x1000 canvases on the
        // critical path cost ~110ms of blocking time for pages nobody has
        // opened yet; they are built during idle time below.
        const pageMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(p.tone),
          transparent: true,
        });

        const mats: import('three').Material[] = [
          side(edgeV, 0xffffff),
          side(edgeV, 0xd8d8d4),
          side(edgeH, 0xffffff),
          side(edgeH, 0xc9c9c5),
          pageMat,
          new THREE.MeshBasicMaterial({ color: new THREE.Color(T.ink), transparent: true }),
        ];

        const mesh = new THREE.Mesh(geo, mats);
        mesh.userData.index = i;

        const group = new THREE.Group();
        group.userData.index = i;
        group.add(mesh);

        // The COVER, hinged on the front-left edge like a real book. The
        // press pass prints onto this, and the client's name sits in a
        // band across its foot.
        const hinge = new THREE.Object3D();
        hinge.position.set(-SLAB_W / 2, 0, SLAB_D / 2 + 0.006);
        group.add(hinge);

        const coverGeo = new THREE.PlaneGeometry(SLAB_W, SLAB_H);
        const coverFront = new THREE.Mesh(coverGeo, press.frontMaterial(sep, i));
        coverFront.position.x = SLAB_W / 2;
        coverFront.userData.index = i;
        hinge.add(coverFront);

        // The inside of the cover — the VERSO. It carries the left half of
        // the spread. Plain stock until the page is built, so the book is
        // never caught holding a blank leaf next to a printed one.
        const pageMatL = new THREE.MeshBasicMaterial({
          color: new THREE.Color(T.paper),
          transparent: true,
        });
        const coverBack = new THREE.Mesh(coverGeo, pageMatL);
        coverBack.position.set(SLAB_W / 2, 0, -0.008);
        coverBack.rotation.y = Math.PI;
        coverBack.userData.index = i;
        hinge.add(coverBack);

        mats.push(coverFront.material as import('three').Material);
        mats.push(coverBack.material as import('three').Material);

        scene.add(group);

        const sh = new THREE.Mesh(
          new THREE.PlaneGeometry(SLAB_W * 2.1, SLAB_W * 1.5),
          new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }),
        );
        sh.rotation.x = -Math.PI / 2;
        scene.add(sh);

        slabs.push({
          group, hinge, pageMat, pageMatL, verso: coverBack,
          openT: 0, pageBuilt: false, heroImg: null, pageImg: null, artImg: null,
          mesh, shadow: sh, canvas: c, sep, mats, project: p,
          // Fully printed from the first frame. Running the press pass on
          // load meant landing on a halftone dot field that resolved while
          // the artwork was still downloading — it read as the page being
          // broken, not as a press.
          printT: 1,
        });
      });

      /* ---------- inner pages, built off the critical path ---------- */
      const idle: (cb: () => void) => void =
        typeof (window as unknown as { requestIdleCallback?: unknown })
          .requestIdleCallback === 'function'
          ? (cb) => (window as unknown as {
              requestIdleCallback: (c: () => void, o?: { timeout: number }) => void
            }).requestIdleCallback(cb, { timeout: 2500 })
          : (cb) => window.setTimeout(cb, 240);

      /* ---------- one spread, two leaves ----------
         The destination page is drawn once, at double width, and the two
         halves are addressed with UV offsets rather than redrawn. The
         verso samples the left half through a flipped V, because its plane
         is turned through pi to face out of the open cover: the geometry
         already mirrors it, and correcting only U would leave the leaf
         upside down. Derived by opening the book and looking at it, which
         is the only way to settle a UV convention. */
      function dressSpread(s: Slab, spread: import('three').CanvasTexture) {
        const oldR = s.pageMat.map;
        const oldL = s.pageMatL.map;

        spread.wrapS = spread.wrapT = THREE.ClampToEdgeWrapping;
        const verso = spread.clone();

        spread.repeat.set(0.5, 1);
        spread.offset.set(0.5, 0);   // recto: the right half
        verso.repeat.set(0.5, 1);
        verso.offset.set(0, 0);      // verso: the left half
        verso.needsUpdate = true;

        s.pageMat.map = spread;
        s.pageMat.color = new THREE.Color(0xffffff);
        s.pageMat.needsUpdate = true;

        s.pageMatL.map = verso;
        s.pageMatL.color = new THREE.Color(0xffffff);
        s.pageMatL.needsUpdate = true;

        oldR?.dispose();
        oldL?.dispose();
      }

      let built = 0;
      const buildNextPage = () => {
        if (disposed || built >= slabs.length) return;
        const i = built++;
        const s0 = slabs[i];
        // Skip if the artwork load already supplied a better page.
        if (!s0.pageBuilt) {
          dressSpread(s0, sheets.caseStudySpreadTexture(s0.project, T, PW, PH, s0.heroImg));
          s0.pageBuilt = true;
        }
        idle(buildNextPage);
      };
      idle(buildNextPage);

      /* ---------- hold the canvas until the sheets are real ----------
         The generated typographic sheets are a fallback, not something to
         look at: without this you watch six placeholder sheets swap to the
         artwork one by one, which is most of what read as "glitchy". */
      const artTotal = PRESS_PROJECTS.filter((x) => x.art).length;
      let artLoaded = 0;
      function reveal() {
        pressLive();
      }
      // Never hold the hero hostage to a slow or failed image.
      const revealTimer = window.setTimeout(reveal, 2600);
      cleanups.push(() => window.clearTimeout(revealTimer));

      /* ---------- the page each book opens onto ----------
         Half a megabyte of case study captures, so NOT on the critical
         path: they start only once the rail is up and then one at a time
         through idle time. Until one lands its book opens onto the drawn
         layout, which is a floor, not a placeholder that must be waited
         for. */
      onLive = () => {
        let n = 0;
        const next = () => {
          if (disposed || n >= PRESS_PROJECTS.length) return;
          const i = n++;
          const src = PRESS_PROJECTS[i].page;
          if (!src) { idle(next); return; }
          const pi = new Image();
          pi.crossOrigin = 'anonymous';
          pi.decoding = 'async';
          pi.onload = () => {
            if (disposed) return;
            slabs[i].pageImg = pi;
            try {
              dressSpread(slabs[i], sheets.caseStudySpreadTexture(
                PRESS_PROJECTS[i], T, PW, PH, slabs[i].heroImg, pi));
              slabs[i].pageBuilt = true;
            } catch { /* keep whatever spread is already there */ }
            idle(next);
          };
          pi.onerror = () => idle(next);
          pi.src = src;
        };
        idle(next);
      };

      /* ---------- the destination hero, for the page inside ---------- */
      PRESS_PROJECTS.forEach((p, i) => {
        if (!p.hero) return;
        const hi = new Image();
        hi.crossOrigin = 'anonymous';
        hi.decoding = 'async';
        hi.onload = () => {
          if (disposed) return;
          slabs[i].heroImg = hi;
          try {
            dressSpread(slabs[i], sheets.caseStudySpreadTexture(p, T, PW, PH, hi));
            slabs[i].pageBuilt = true;
          } catch { /* keep whatever page is already there */ }
        };
        hi.src = p.hero;
      });

      /* ---------- his mark, for the band on every cover ----------
         18KB and same-origin, so it almost always beats the artwork it
         has to be stamped beside — but almost always is not good enough
         for a logo that would otherwise be missing from some covers and
         not others. Any cover already painted when it lands is stamped
         again. */
      let markImg: HTMLImageElement | null = null;
      const mark = new Image();
      mark.crossOrigin = 'anonymous';
      mark.decoding = 'async';
      mark.onload = () => {
        if (disposed) return;
        markImg = mark;
        slabs.forEach((s, i) => {
          if (!s.artImg) return;
          try {
            sheets.paintArt(s.canvas, s.artImg, PW, PH);
            sheets.stampCoverTitle(s.canvas, s.project, T, PW, PH, markImg);
            press.refreshSeparation(s.sep, s.canvas, PW, PH);
          } catch { /* tainted canvas — leave the cover as it is */ }
          void i;
        });
      };
      mark.src = '/rc-creature.webp';

      /* ---------- real artwork ---------- */
      PRESS_PROJECTS.forEach((p, i) => {
        if (!p.art) return;
        const img = new Image();
        // Same-origin, but state it: the separation reads the canvas back
        // with getImageData and a tainted canvas throws a SecurityError.
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onerror = () => { artLoaded++; if (artLoaded >= artTotal) reveal(); };
        img.onload = () => {
          if (disposed) return;
          try {
            slabs[i].artImg = img;
            sheets.paintArt(slabs[i].canvas, img, PW, PH);
            sheets.stampCoverTitle(slabs[i].canvas, p, T, PW, PH, markImg);
            press.refreshSeparation(slabs[i].sep, slabs[i].canvas, PW, PH);
            slabs[i].printT = 1;      // swap in silently; do not re-print
            artLoaded++;
            if (artLoaded >= artTotal) reveal();
            // The page inside is drawn from the DESTINATION hero, loaded
            // separately above — not from this cover art.
          } catch {
            /* tainted canvas — keep the generated sheet */
            artLoaded++;
            if (artLoaded >= artTotal) reveal();
          }
        };
        img.src = p.art;
      });

      /* ---------- misregistration pass ---------- */
      const rt = new THREE.WebGLRenderTarget(2, 2, {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      });
      const postScene = new THREE.Scene();
      const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const postMat = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: rt.texture },
          uAmt: { value: 0 },
          uTime: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: [
          'uniform sampler2D tDiffuse;',
          'uniform float uAmt; uniform float uTime; uniform vec2 uRes;',
          'varying vec2 vUv;',
          'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
          'void main(){',
          '  vec2 uv = vUv;',
          '  vec2 d = uv - 0.5;',
          '  float r2 = dot(d,d);',
          '  vec2 off = d * (0.0008 + uAmt * 0.045) * (0.25 + r2 * 1.7);',
          '  float cr = texture2D(tDiffuse, uv - off).r;',
          '  float cg = texture2D(tDiffuse, uv + off * 0.18).g;',
          '  float cb = texture2D(tDiffuse, uv + off).b;',
          '  vec3 col = vec3(cr, cg, cb);',
          '  float g = hash(uv * uRes + fract(uTime)) - 0.5;',
          '  col += g * 0.013;',
          '  gl_FragColor = vec4(col, 1.0);',
          '}',
        ].join('\n'),
      });
      postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

      function resize() {
        W = stage!.clientWidth;
        H = stage!.clientHeight;
        if (!W || !H) return;
        isNarrow = W < 820;
        camera.aspect = W / H;
        camera.position.z = isNarrow ? 12.6 : 10;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H, false);

        const dist = camera.position.z - FURN_Z;
        const visH = 2 * dist * Math.tan(((camera.fov * Math.PI) / 180) / 2);
        const visW = visH * camera.aspect;
        furniture.scale.set(visW, visH, 1);
        (furnMat.map as import('three').Texture).repeat.x = Math.max(0.35, visW / (visH * 2));

        const dpr = renderer.getPixelRatio();
        rt.setSize(Math.max(2, W * dpr), Math.max(2, H * dpr));
        postMat.uniforms.uRes.value.set(W * dpr, H * dpr);
      }
      resize();

      const onResize = () => resize();
      window.addEventListener('resize', onResize);
      const onOrient = () => setTimeout(resize, 120);
      window.addEventListener('orientationchange', onOrient);
      const onLost = (e: Event) => e.preventDefault();
      const onRestored = () => resize();
      canvas.addEventListener('webglcontextlost', onLost, false);
      canvas.addEventListener('webglcontextrestored', onRestored, false);
      cleanups.push(() => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onOrient);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
      });

      /* ---------- interaction ---------- */
      let pos = PRESS_START, target = PRESS_START, vel = 0;
      let focus = 0, focusTarget = 0;

      // The rail runs on its own — an idle carousel reads as broken. Drag
      // and page-scroll add to that motion rather than replacing it.
      const AUTO_DRIFT = 0.17;      // sheets per second at rest
      const BOOST_K = 0.0006;       // per px of scroll
      const BOOST_MAX = 0.9;        // ~6x resting at full fling, not 31x
      let boost = 0;                // decaying bonus from scrolling
      // An explicit choice (tick, arrow key, centring click) must survive
      // long enough to read; drift would otherwise carry it straight off.
      let holdUntil = 0;
      // A press on any sheet flies it to centre, opens it, then navigates.
      let opening:
        | { i: number; slug: string; at: number; settledAt?: number }
        | null = null;
      let lastScrollY = window.scrollY;
      const pointer = { x: 0, y: 0 };
      let dragging = false, dragStart = 0, posStart = 0, moved = 0, lastX = 0;
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();

      const wrapRel = (r: number) => (((r % N) + N + N / 2) % N) - N / 2;
      const wrapIndex = (i: number) => ((Math.round(i) % N) + N) % N;
      const smooth = (a: number, b: number, x: number) => {
        const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      /**
       * Nearest book to a press that missed. The rail is always drifting,
       * so an exact hit-test means the occasional press lands in the gap
       * between two books and is silently ignored — which reads as the
       * site being broken rather than as the visitor having missed.
       */
      const nearPt = new THREE.Vector3();
      function nearestIndex(clientX: number, clientY: number) {
        const sr = stage!.getBoundingClientRect();
        const px = clientX - sr.left, py = clientY - sr.top;
        let best = -1, bestD = Infinity;
        slabs.forEach((sl, i) => {
          if (Math.abs(wrapRel(i - pos)) > 2.2) return;   // only what is on screen
          nearPt.set(0, 0, SLAB_D / 2);
          sl.mesh.localToWorld(nearPt);
          nearPt.project(camera);
          const x = (nearPt.x * 0.5 + 0.5) * W;
          const y = (-nearPt.y * 0.5 + 0.5) * H;
          const d = Math.hypot(x - px, y - py);
          if (d < bestD) { bestD = d; best = i; }
        });
        // Only forgive a near miss — a press out in the margins still does
        // nothing, as it should.
        return bestD < Math.min(W, H) * 0.28 ? best : -1;
      }

      function pickIndex(clientX: number, clientY: number) {
        const r = stage!.getBoundingClientRect();
        ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
        ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        // recursive: the book is a group of block + two cover faces
        const hits = raycaster.intersectObjects(slabs.map((s) => s.group), true);
        if (hits.length) return hits[0].object.userData.index as number;
        return nearestIndex(clientX, clientY);
      }

      const onDown = (e: PointerEvent) => {
        // The stage calls setPointerCapture below, which redirects every
        // subsequent pointer event to the stage — so a button inside it
        // never receives its click. Let controls have their event.
        if ((e.target as HTMLElement | null)?.closest('button, a')) return;
        dragging = true; moved = 0;
        dragStart = lastX = e.clientX; posStart = target;
        stage!.classList.add('dragging');
        stage!.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        const r = stage!.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
        if (!dragging) return;
        moved += Math.abs(e.clientX - lastX);
        lastX = e.clientX;
        if (!focus) target = posStart - (e.clientX - dragStart) / (W / (isNarrow ? 2.6 : 3.6));
      };
      const onUp = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        stage!.classList.remove('dragging');
        if (moved < 7) {
          const hit = pickIndex(e.clientX, e.clientY);
          // A press inside the stage ALWAYS opens something. The rail is
          // drifting, so an exact hit-test occasionally lands between two
          // books and the press is silently ignored — which reads as the
          // site being broken. Falling back to whatever is centred is both
          // predictable and what the visitor almost certainly meant.
          const i =
            typeof hit === 'number' && hit >= 0 ? hit : wrapIndex(pos);
          if (i >= 0 && !opening) {
            // One press does the lot: the sheet flies to centre, opens,
            // and hands over to its case study. Rebased on pos, which is
            // what the raycast and the visible rail agree on — target has
            // already drifted past it.
            target = Math.round(pos) + wrapRel(i - Math.round(pos));
            focusTarget = 1;
            // Deliberately NOT re-printed. Running the press pass again on
            // press turned the one book you had just chosen into a blank
            // sheet resolving out of halftone for the whole of its flight
            // to centre — so you pressed an image and watched a different,
            // emptier thing arrive. The ink belongs at the ARRIVAL: the
            // case study's own hero prints itself when the page lands.
            holdUntil = performance.now() + 8000;
            const slug = PRESS_PROJECTS[i].slug;
            opening = { i, slug, at: performance.now() };
            // Belt and braces, independent of the render loop: the loop is
            // what normally triggers the cinematic, and if it is throttled,
            // descheduled or retired the press would strand.
            window.setTimeout(() => {
              if (!disposed && opening && opening.slug === slug) {
                opening = null;
                runCinematic(i, slug);
              }
            }, 5600);
          }
        }
        // Deliberately no snap-to-integer here. The rail is always
        // drifting, so snapping would fight it and jerk on every release.
      };
      const onCancel = () => { dragging = false; stage!.classList.remove('dragging'); };
      const onWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          target += e.deltaX * 0.006;
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') { target = Math.round(pos) + 1; focusTarget = 0; holdUntil = performance.now() + 2600; }
        if (e.key === 'ArrowLeft') { target = Math.round(pos) - 1; focusTarget = 0; holdUntil = performance.now() + 2600; }
        if (e.key === 'Escape') { opening = null; focusTarget = 0; holdUntil = 0; }
      };

      stage.addEventListener('pointerdown', onDown);
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerup', onUp);
      stage.addEventListener('pointercancel', onCancel);
      stage.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('keydown', onKey);
      cleanups.push(() => {
        stage.removeEventListener('pointerdown', onDown);
        stage.removeEventListener('pointermove', onMove);
        stage.removeEventListener('pointerup', onUp);
        stage.removeEventListener('pointercancel', onCancel);
        stage.removeEventListener('wheel', onWheel);
        window.removeEventListener('keydown', onKey);
      });

      /* ---------- expose rail control for the featured ticks ---------- */
      (stage as HTMLElement & { __goTo?: (i: number) => void }).__goTo = (i: number) => {
        target += wrapRel(i - target);
        focusTarget = 0;
        holdUntil = performance.now() + 2600;   // let the choice be read
      };

      /**
       * Screen-space rect of the opened page, so the cinematic zoom can
       * start exactly where the page is sitting in 3D rather than from a
       * guessed position.
       */
      const projPt = new THREE.Vector3();
      function pageScreenRect(i: number) {
        const hw = SLAB_W / 2, hh = SLAB_H / 2, zf = SLAB_D / 2;
        const xs: number[] = [], ys: number[] = [];

        const take = (
          obj: import('three').Object3D,
          corners: Array<[number, number, number]>,
        ) => {
          for (const [cx, cy, cz] of corners) {
            projPt.set(cx, cy, cz);
            obj.localToWorld(projPt);
            projPt.project(camera);
            xs.push((projPt.x * 0.5 + 0.5) * W);
            ys.push((-projPt.y * 0.5 + 0.5) * H);
          }
        };

        // BOTH leaves, not just the block's face. Measuring the recto
        // alone put the cinematic over the right hand page, so the zoom
        // grew out of one side of an open book instead of out of the
        // middle of the spread you were actually looking at.
        take(slabs[i].mesh, [
          [-hw, hh, zf], [hw, hh, zf], [hw, -hh, zf], [-hw, -hh, zf],
        ]);
        take(slabs[i].verso, [
          [-hw, hh, 0], [hw, hh, 0], [hw, -hh, 0], [-hw, -hh, 0],
        ]);
        const sr = stage!.getBoundingClientRect();
        const left = Math.min(...xs), top = Math.min(...ys);
        return {
          left: sr.left + left,
          top: sr.top + top,
          width: Math.max(...xs) - left,
          height: Math.max(...ys) - top,
        };
      }

      /**
       * The cinematic: a real DOM copy of the case study's own hero appears
       * exactly over the opened page, then zooms to fill the screen while
       * the route changes underneath it. Because it IS the destination's
       * hero image, the cut has nothing to give away.
       */
      let cineEl: HTMLDivElement | null = null;
      function runCinematic(i: number, slug: string) {
        const proj = PRESS_PROJECTS[i];
        const r = pageScreenRect(i);
        const el = document.createElement('div');
        cineEl = el;
        el.className = 'cine';
        el.setAttribute('aria-hidden', 'true');
        el.style.left = r.left + 'px';
        el.style.top = r.top + 'px';
        el.style.width = r.width + 'px';
        el.style.height = r.height + 'px';
        /* The PAGE, not the picture off it.

           This used to zoom the bare hero image and draw the client and
           title over it, which meant the thing growing to fill the screen
           looked nothing like the page that then loaded underneath it —
           no header, no nav, its own typography. Zooming the same capture
           the book opened onto makes the whole move one continuous shot:
           the page you are looking at simply gets bigger until it is the
           page you are on.

           The hero is still the fallback, for any project without a
           capture yet. */
        el.innerHTML =
          '<img class="cine-img" alt="" src="' +
          (proj.page || proj.hero || proj.art || '') + '">';
        document.body.appendChild(el);

        gsap.to(el, {
          left: 0, top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          duration: 0.86,
          ease: 'expo.inOut',
          onComplete: () => {
            onOpenRef.current?.(slug);
            // Hold through the route change, then dissolve onto the real
            // page — which is the same image, full bleed.
            window.setTimeout(() => {
              gsap.to(el, {
                opacity: 0, duration: 0.32, ease: 'power2.out',
                onComplete: () => { el.remove(); if (cineEl === el) cineEl = null; },
              });
            }, 340);
          },
        });
        // Never strand the overlay if the timeline is interrupted.
        window.setTimeout(() => {
          if (cineEl === el && document.body.contains(el)) {
            el.remove(); cineEl = null;
          }
        }, 4200);
      }
      cleanups.push(() => { cineEl?.remove(); cineEl = null; });

      /* ---------- pin + veil ----------
         ScrollTrigger, not CSS position:sticky: #smooth-content is
         transformed by ScrollSmoother, and sticky inside a transformed
         ancestor tracks the transform rather than the viewport. */
      let scrollT = 0;
      const st = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: '+=100%',
        pin: true,
        pinType: 'transform',
        // pinSpacing:false reproduces the position:sticky behaviour the
        // stage was designed around — no spacer is inserted, so the band
        // flows straight after the stage and rides up over it. With the
        // default spacing ScrollTrigger pushes the band down by the pin
        // distance and leaves a band of empty paper under the hero.
        pinSpacing: false,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scrollT = self.progress;
          if (veilRef.current) veilRef.current.style.opacity = (scrollT * scrollT * 0.82).toFixed(3);
        },
      });
      cleanups.push(() => st.kill(true));

      /* ---------- the band hooks under the header ----------
         The band rides up over the pinned stage, and used to carry
         straight on past the top edge and away. It now catches under the
         header and holds there while the page keeps moving, then lets go.

         Built here rather than in Masthead, which owns the markup, for
         one reason: ordering. A pin created before ScrollSmoother exists
         measures against the wrong scroller, and React runs a child's
         effects before its parent's — so a pin set up in Masthead would
         race the one below it. This effect already runs after both. */
      const bandEl = document.querySelector<HTMLElement>('.hero-band');
      if (bandEl) {
        const headH = () =>
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--head-h'),
          ) || 72;
        const bandST = ScrollTrigger.create({
          trigger: bandEl,
          start: () => `top ${headH()}px`,
          end: '+=42%',
          pin: true,
          pinType: 'transform',
          invalidateOnRefresh: true,
        });
        cleanups.push(() => bandST.kill(true));
      }

      /* ---------- loop ---------- */
      const clock = new THREE.Clock();
      let elapsed = 0, mx = 0, my = 0, shownIndex = PRESS_START;
      let lastEmit = 0, pendingEmit: number | null = null;
      let raf = 0;
      let visible = true;
      const io = new IntersectionObserver(([e]) => {
        const was = visible;
        visible = e.isIntersecting;
        // Restart the loop on re-entry; it stops scheduling when hidden.
        if (visible && !was && !retired && !raf) {
          clock.getDelta();               // drop the gap so dt is not a jump
          lastScrollY = window.scrollY;   // and do not bank the scroll we missed
          raf = requestAnimationFrame(frame);
        }
      }, { threshold: 0 });
      io.observe(stage);
      cleanups.push(() => io.disconnect());

      // I cannot test a real mid-range phone from here, so the hero
      // measures itself: it steps the resolution down if frames are slow,
      // and retires to the flat paper hero if they stay slow. Better a
      // still hero than a site that judders.
      const samples: number[] = [];
      let degraded = false, retired = false;
      const median = (a: number[]) => {
        const b = [...a].sort((x, y) => x - y);
        return b[Math.floor(b.length / 2)];
      };

      function frame() {
        raf = 0;
        const rawDt = clock.getDelta();
        const realDt = rawDt;               // uncapped, for decay
        const dt = Math.min(rawDt, 0.05);   // capped, for motion
        // window.scrollY is the RAW native scroll position: ScrollSmoother
        // really does scroll the page and lerps the content transform, so
        // the smoothed visual position LAGS this. That is the behaviour we
        // want — the boost should answer the visitor's input, not the
        // eased result of it.
        //
        // The per-frame delta is CLAMPED, and that clamp is load-bearing.
        // The loop stops while the hero is off screen, so lastScrollY does
        // go stale; without the clamp, returning after a 9000px scroll
        // dumped ~90 straight into the boost, pinned it at the ceiling and
        // the rail flew — measured at 2 sheets in 1.4s against a resting
        // 6s per sheet. It also covers anchor jumps and restored scroll.
        const sy = window.scrollY;
        const scrolled = Math.min(Math.abs(sy - lastScrollY), 180);
        lastScrollY = sy;
        // Decay on REAL elapsed time, not the 0.05-capped dt: after a
        // backgrounded tab or a long stall, capped dt barely decays the
        // boost and the rail bursts on return.
        boost = Math.min(boost + scrolled * BOOST_K, BOOST_MAX) *
                Math.pow(0.93, Math.min(realDt, 1) * 60);

        if (visible && !retired) {
          samples.push(dt * 1000);
          if (samples.length === 90 && !degraded) {
            if (median(samples) > 34) {           // under ~30fps
              degraded = true;
              dprCap = 1;
              renderer.setPixelRatio(1);
              resize();
              samples.length = 0;
            }
          } else if (samples.length >= 210 && degraded) {
            if (median(samples.slice(-120)) > 55) { // still under ~18fps
              retired = true;
              canvas!.style.display = 'none';
              if (raf) cancelAnimationFrame(raf);
              raf = 0;
              return;
            }
            samples.length = 0;
          } else if (samples.length > 400) samples.length = 0;
        }
        // Truly idle off screen — stop scheduling rather than scheduling a
        // frame that returns immediately. The rest of the page is long, so
        // that is most of the session. The IntersectionObserver restarts it.
        if (!visible || retired) return;
        raf = requestAnimationFrame(frame);
        elapsed += dt;
        const t = elapsed;

        if (!isFinite(pos) || !isFinite(target)) { pos = target = PRESS_START; vel = 0; }
        if (!dragging && Math.abs(target) > N * 50) {
          const fold = Math.round(target / N) * N;
          target -= fold; pos -= fold;
        }

        // Drift pauses while the visitor is holding a sheet, or has one
        // opened — both are moments where they want it to stay put.
        // Hold the rail while keyboard focus is on the featured link: the
        // drift re-points that link's href, so letting it move under a
        // focused target means the visitor activates something other than
        // what they read.
        const ae = document.activeElement;
        const holdingFocus =
          !!ae && ae !== document.body && !!ae.closest?.('.masthead-feature');

        // focus (eased) as well as focusTarget: resuming on focusTarget
        // alone starts the rail moving while the opened sheet is still
        // visibly shrinking back.
        const settled = focusTarget === 0 && focus < 0.02;
        const held = performance.now() < holdUntil;

        if (!reduced && !dragging && settled && !pausedRef.current &&
            !holdingFocus && !held) {
          target += (AUTO_DRIFT + boost) * dt;
        }

        const prev = pos;
        pos = lerp(pos, target, dragging ? 0.28 : 0.11);
        vel = lerp(vel, (pos - prev) / Math.max(dt, 0.004), 0.25);
        if (!isFinite(vel)) vel = 0;
        focus = lerp(focus, focusTarget, 0.1);

        mx = lerp(mx, pointer.x, 0.06);
        my = lerp(my, pointer.y, 0.06);

        // Hand over once the sheet has actually arrived and opened, so the
        // navigation lands on the beat rather than at a fixed delay that is
        // right for exactly one travel distance.
        // Nothing to instruct once a book is on its way open — but this is
        // computed from scratch every frame rather than forced to 0 once,
        // so cancelling with Escape brings the hint back rather than
        // leaving it hidden for good.
        if (opening) {
          // Wait for the book to be OPEN, not merely arrived — the whole
          // point is that you see the page before the page loads.
          const square =
            Math.abs(wrapRel(opening.i - pos)) < 0.06 && focus > 0.86;
          // FULLY open, not nearly: the cinematic used to take over at 0.9,
          // which is before the cover has finished swinging, so the spread
          // was never once seen at rest.
          if (square && slabs[opening.i].openT >= 1 && !opening.settledAt) {
            opening.settledAt = performance.now();
          }
          const arrived =
            !!opening.settledAt &&
            performance.now() - opening.settledAt > OPEN_HOLD_MS;
          const overdue = performance.now() - opening.at > 5200;  // never strand a press
          if (arrived || overdue) {
            const { slug, i } = opening;
            opening = null;
            runCinematic(i, slug);
          }
        }

        const centre = wrapIndex(pos);
        if (centre !== shownIndex) {
          shownIndex = centre;
          // Throttled: Masthead keys the featured title on the slug, so
          // every emit remounts it and restarts a 620ms entry animation
          // from opacity 0 + blur. Faster than that and the title never
          // finishes fading in — it just sits blurred. The trailing emit
          // guarantees the band ends on the settled sheet.
          const now = performance.now();
          if (now - lastEmit > 320) {
            lastEmit = now;
            pendingEmit = null;
            onIndexRef.current?.(centre);
          } else {
            pendingEmit = centre;
          }
        } else if (pendingEmit !== null && performance.now() - lastEmit > 320) {
          lastEmit = performance.now();
          const v = pendingEmit; pendingEmit = null;
          onIndexRef.current?.(v);
        }

        stage!.classList.toggle('focused', focus > 0.5);

        const spread = lerp(SPACING, SPACING * 1.9, focus);

        slabs.forEach((s, i) => {
          const rel = wrapRel(i - pos);
          const isCentre = Math.abs(rel) < 0.5;
          const float = reduced ? 0 : Math.sin(t * 0.55 + i * 1.7) * 0.07;

          const x = rel * spread + (isCentre ? 0 : Math.sign(rel) * focus * 1.4);
          const y = float - my * 0.28 * (1 - focus);
          const z = -Math.abs(rel) * 0.85 + (isCentre ? lerp(0.5, 2.9, focus) : 0);
          s.group.position.set(x, y, z);

          let yaw = -0.3 + rel * 0.11 + mx * 0.1;
          if (isCentre) yaw = lerp(yaw, 0.02 + mx * 0.05, focus);
          s.group.rotation.y = yaw;
          s.group.rotation.x = (reduced ? 0 : Math.sin(t * 0.4 + i) * 0.015) + my * 0.05 * (1 - focus);
          s.group.rotation.z = rel * 0.012;

          const edge = 1 - smooth(N / 2 - 1.25, N / 2 - 0.15, Math.abs(rel));
          const op = (isCentre ? 1 : lerp(1, 0.06, focus)) * edge;
          for (let m = 0; m < s.mats.length; m++) {
            if (m !== 4 && m !== 6) (s.mats[m] as import('three').MeshBasicMaterial).opacity = op;
          }
          (s.mats[4] as import('three').MeshBasicMaterial).opacity = op;

          s.printT = press.advancePrint(s.printT, dt, reduced);
          const fm = s.mats[6] as import('three').ShaderMaterial;   // cover front
          fm.uniforms.uProgress.value = s.printT;
          fm.uniforms.uOpacity.value = op;

          // Open the cover only on the book being pressed, and only once
          // it has reached the centre — a book that opens while still
          // flying reads as a glitch rather than as a book.
          const isOpening = !!opening && opening.i === i;
          const atCentre = Math.abs(rel) < 0.12;
          // Arrive, square up, THEN open. Starting the cover while the book
          // is still flying is most of why it never read as a book.
          const wantOpen = isOpening && atCentre && focus > 0.55;
          s.openT = Math.max(0, Math.min(1,
            s.openT + (wantOpen ? dt / OPEN_SECS : -dt / SHUT_SECS)));
          const e2 = openEase(s.openT);

          s.hinge.rotation.y = -e2 * OPEN_ANGLE;

          // The cover swings out to the LEFT of the spine, so the open
          // book is twice as wide as the shut one and its centre is half a
          // leaf left of the block. Without this shift the spread opens
          // off to one side of the screen instead of into the middle.
          s.group.position.x = x + e2 * (SLAB_W / 2);

          // Square to the camera once it is open: a spread you are reading
          // is not yawed away from you, and the mouse parallax that gives
          // the shut rail its life just skews the page.
          s.group.rotation.y = yaw * (1 - e2 * 0.92);

          s.shadow.position.set(x, -SLAB_H / 2 - 0.45 + y * 0.25, z - 0.1);
          (s.shadow.material as import('three').MeshBasicMaterial).opacity =
            0.5 * op * (1 - Math.min(Math.abs(rel) * 0.25, 0.6));
          s.shadow.scale.setScalar(lerp(1, 1.5, isCentre ? focus : 0));
        });

        backMat.uniforms.uTime.value = reduced ? 8.0 : t;
        backMat.uniforms.uRail.value = pos * 2.1;
        backMat.uniforms.uLight.value.set(-mx * 0.9, -my * 0.7);
        (furnMat.map as import('three').Texture).offset.x = pos * 0.055 + mx * 0.006;
        furnMat.opacity = 0.3 * (1 - focus * 0.8);

        const amt = Math.abs(vel) * 0.08;
        postMat.uniforms.uAmt.value = isFinite(amt) ? Math.min(amt, 0.28) : 0;
        postMat.uniforms.uTime.value = t;

        renderer.setClearColor(new THREE.Color(T.paper), 1);
        renderer.setRenderTarget(rt);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCam);
      }
      raf = requestAnimationFrame(frame);
      cleanups.push(() => { if (raf) cancelAnimationFrame(raf); });

      /* ---------- redraw once the real fonts land ---------- */
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (disposed) return;
          slabs.forEach((s) => {
            if (s.project.art) return; // artwork sheets are not typographic
            sheets.drawSheet(s.canvas, s.project, T, PW, PH);
            press.refreshSeparation(s.sep, s.canvas, PW, PH);
          });
        });
      }

      /* ---------- theme switch ---------- */
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onScheme = () => {
        if (disposed) return;
        readTheme();
        backMat.uniforms.uPaper.value = new THREE.Color(T.paper);
        backMat.uniforms.uInkC.value = new THREE.Color(T.cy);
        backMat.uniforms.uInkM.value = new THREE.Color(T.mg);
        backMat.uniforms.uInkY.value = new THREE.Color(T.yl);
        backMat.uniforms.uDark.value = sheets.isDarkPaper(T) ? 1 : 0;
        const oldFurn = furnMat.map as import('three').Texture;
        const nf = sheets.furnitureTexture(T);
        nf.repeat.x = oldFurn.repeat.x;
        furnMat.map = nf;
        furnMat.needsUpdate = true;
        oldFurn.dispose();
        const ev = sheets.edgeTexture(true, T);
        const eh = sheets.edgeTexture(false, T);
        edgeV.dispose(); edgeH.dispose();
        edgeV = ev; edgeH = eh;
        slabs.forEach((s) => {
          (s.mats[0] as import('three').MeshBasicMaterial).map = ev;
          (s.mats[1] as import('three').MeshBasicMaterial).map = ev;
          (s.mats[2] as import('three').MeshBasicMaterial).map = eh;
          (s.mats[3] as import('three').MeshBasicMaterial).map = eh;
          (s.mats[5] as import('three').MeshBasicMaterial).color = new THREE.Color(T.ink);
          for (let m = 0; m < 6; m++) if (m !== 4) s.mats[m].needsUpdate = true;
          if (!s.project.art) {
            sheets.drawSheet(s.canvas, s.project, T, PW, PH);
            press.refreshSeparation(s.sep, s.canvas, PW, PH);
          }
          if (s.pageBuilt) {
            dressSpread(s, sheets.caseStudySpreadTexture(
              s.project, T, PW, PH, s.heroImg, s.pageImg));
          } else {
            s.pageMatL.color = new THREE.Color(T.paper);
            s.pageMatL.needsUpdate = true;
          }
        });
      };
      mq.addEventListener('change', onScheme);
      cleanups.push(() => mq.removeEventListener('change', onScheme));

      cleanups.push(() => {
        slabs.forEach((s) => {
          s.sep.dispose();
          s.mats.forEach((m) => m.dispose());
          (s.shadow.material as import('three').Material).dispose();
        });
        geo.dispose(); edgeV.dispose(); edgeH.dispose(); shadowTex.dispose();
        rt.dispose(); renderer.dispose();
      });
    })();

    return () => {
      disposed = true;
      cleanups.forEach((f) => { try { f(); } catch { /* teardown is best-effort */ } });
    };
  }, []);

  return (
    /* Wrapper React owns: ScrollTrigger's pin reparents the stage into a
       generated .pin-spacer, and React must never unmount against that. */
    <div className="pin-host">
      <section className="stage" ref={stageRef} aria-label="Selected work">
        <canvas className="press-gl" ref={canvasRef} />

        {/* The instruction line is gone at the client's request — the rail
            reads as pressable without being told.

            The stop is NOT gone, it is only invisible until focused. WCAG
            2.2.2 Pause, Stop, Hide is a Level A requirement and this rail
            starts on its own, runs far longer than five seconds and sits
            alongside text; respecting prefers-reduced-motion is not on its
            own a sufficient technique, the content has to carry a
            mechanism. Hidden the way a skip link is hidden, it costs the
            design nothing and keeps the page conformant: tab to it and it
            appears. */}
        <button
          type="button"
          className="press-pause t-mono is-quiet"
          aria-pressed={paused}
          onClick={() => {
            const next = !pausedRef.current;
            pausedRef.current = next;
            setPaused(next);
          }}
        >
          {paused ? '\u25B6 RUN PRESS' : '\u25A0 STOP PRESS'}
        </button>
        <div className="veil" ref={veilRef} />
      </section>
    </div>
  );
}
