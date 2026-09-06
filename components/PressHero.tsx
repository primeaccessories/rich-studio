'use client';

import { useEffect, useRef } from 'react';
import type { PressProject, Theme } from '@/lib/pressSheets';

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
  { slug: 'silverstone', title: 'REBRAND FOR SILVERSTONE RACECOURSE', client: 'SILVERSTONE',  tone: '#223549', kind: 4, words: ['HOME OF', 'RACING'],          art: '/press/silverstone.webp' },
  { slug: 'hellmanns',   title: "HELLMANN'S AD CAMPAIGN",             client: "HELLMANN'S",   tone: '#c6a675', kind: 3, words: ['REAL', 'FOOD'],              art: '/press/hellmanns.webp' },
  { slug: 'walls',       title: "WALL'S MAKES IT HAPPIER",            client: "WALL'S",       tone: '#e1251a', kind: 0, words: ['TASTE', 'HAPPIER', 'TODAY'], art: '/press/walls.webp' },
  { slug: 'absolut',     title: 'ABSOLUT HALLOWEEN',                  client: 'ABSOLUT',      tone: '#d66511', kind: 1, words: ['ABSOLUT'],                   art: '/press/absolut.webp' },
  { slug: 'networkrail', title: 'CREATIVE RETOUCH FOR NETWORK RAIL',  client: 'NETWORK RAIL', tone: '#533123', kind: 5, words: ['EVERY', 'JOURNEY'],          art: '/press/networkrail.webp' },
  { slug: 'strongbow',   title: 'AD CAMPAIGN FOR STRONGBOW',          client: 'STRONGBOW',    tone: '#592e62', kind: 2, words: ['CRISP', 'GOLD'],             art: '/press/strongbow.webp' },
];

const N = PRESS_PROJECTS.length;
export const PRESS_START = Math.floor((N - 1) / 2);

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
  const hintRef = useRef<HTMLParagraphElement>(null);
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
        canvas.style.display = 'none';
        return;
      }
      if (disposed) return;

      const gsap = gsapMod.default;
      const { ScrollTrigger } = stMod;
      gsap.registerPlugin(ScrollTrigger);

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      if (!supported) { canvas.style.display = 'none'; return; }

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        canvas.style.display = 'none';
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

        const mats: import('three').Material[] = [
          side(edgeV, 0xffffff),
          side(edgeV, 0xd8d8d4),
          side(edgeH, 0xffffff),
          side(edgeH, 0xc9c9c5),
          press.frontMaterial(sep, i),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(T.ink), transparent: true }),
        ];

        const mesh = new THREE.Mesh(geo, mats);
        mesh.userData.index = i;
        scene.add(mesh);

        const sh = new THREE.Mesh(
          new THREE.PlaneGeometry(SLAB_W * 2.1, SLAB_W * 1.5),
          new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }),
        );
        sh.rotation.x = -Math.PI / 2;
        scene.add(sh);

        slabs.push({ mesh, shadow: sh, canvas: c, sep, mats, project: p, printT: i === PRESS_START ? -0.45 : 1 });
      });

      /* ---------- real artwork ---------- */
      PRESS_PROJECTS.forEach((p, i) => {
        if (!p.art) return;
        const img = new Image();
        // Same-origin, but state it: the separation reads the canvas back
        // with getImageData and a tainted canvas throws a SecurityError.
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onload = () => {
          if (disposed) return;
          try {
            sheets.paintArt(slabs[i].canvas, img, PW, PH);
            press.refreshSeparation(slabs[i].sep, slabs[i].canvas, PW, PH);
            slabs[i].printT = 0;
          } catch {
            /* tainted canvas — keep the generated sheet */
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

      function pickIndex(clientX: number, clientY: number) {
        const r = stage!.getBoundingClientRect();
        ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
        ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(slabs.map((s) => s.mesh), false);
        return hits.length ? (hits[0].object.userData.index as number) : -1;
      }

      const onDown = (e: PointerEvent) => {
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
          const i = pickIndex(e.clientX, e.clientY);
          if (i >= 0) {
            const rel = wrapRel(i - Math.round(target));
            if (Math.abs(rel) < 0.01) {
              focusTarget = focus > 0.5 ? 0 : 1;
              if (focusTarget === 1) slabs[i].printT = -0.1;
              // A second click on an already-open sheet opens the case study.
              if (focusTarget === 0 && onOpenRef.current) onOpenRef.current(PRESS_PROJECTS[i].slug);
            } else { target = Math.round(target) + rel; focusTarget = 0; }
          } else focusTarget = 0;
        } else target = Math.round(target);
      };
      const onCancel = () => { dragging = false; stage!.classList.remove('dragging'); };
      const onWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
          target += e.deltaX * 0.006;
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') { target = Math.round(target) + 1; focusTarget = 0; }
        if (e.key === 'ArrowLeft') { target = Math.round(target) - 1; focusTarget = 0; }
        if (e.key === 'Escape') focusTarget = 0;
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
      };

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
          if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - scrollT * 1.6));
        },
      });
      cleanups.push(() => st.kill(true));

      /* ---------- loop ---------- */
      const clock = new THREE.Clock();
      let elapsed = 0, mx = 0, my = 0, shownIndex = PRESS_START;
      let raf = 0;
      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
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
        raf = requestAnimationFrame(frame);
        const dt = Math.min(clock.getDelta(), 0.05);
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
              cancelAnimationFrame(raf);
              return;
            }
            samples.length = 0;
          } else if (samples.length > 400) samples.length = 0;
        }
        // Off-screen the hero costs nothing: the band and the rest of the
        // page scroll over it for the whole document otherwise.
        if (!visible) return;
        elapsed += dt;
        const t = elapsed;

        if (!isFinite(pos) || !isFinite(target)) { pos = target = PRESS_START; vel = 0; }
        if (!dragging && Math.abs(target) > N * 50) {
          const fold = Math.round(target / N) * N;
          target -= fold; pos -= fold;
        }

        const prev = pos;
        pos = lerp(pos, target, dragging ? 0.28 : 0.11);
        vel = lerp(vel, (pos - prev) / Math.max(dt, 0.004), 0.25);
        if (!isFinite(vel)) vel = 0;
        focus = lerp(focus, focusTarget, 0.1);

        mx = lerp(mx, pointer.x, 0.06);
        my = lerp(my, pointer.y, 0.06);

        const centre = wrapIndex(pos);
        if (centre !== shownIndex) {
          shownIndex = centre;
          onIndexRef.current?.(centre);
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
          s.mesh.position.set(x, y, z);

          let yaw = -0.3 + rel * 0.11 + mx * 0.1;
          if (isCentre) yaw = lerp(yaw, 0.02 + mx * 0.05, focus);
          s.mesh.rotation.y = yaw;
          s.mesh.rotation.x = (reduced ? 0 : Math.sin(t * 0.4 + i) * 0.015) + my * 0.05 * (1 - focus);
          s.mesh.rotation.z = rel * 0.012;

          const edge = 1 - smooth(N / 2 - 1.25, N / 2 - 0.15, Math.abs(rel));
          const op = (isCentre ? 1 : lerp(1, 0.06, focus)) * edge;
          for (let m = 0; m < 6; m++) {
            if (m !== 4) (s.mats[m] as import('three').MeshBasicMaterial).opacity = op;
          }

          s.printT = press.advancePrint(s.printT, dt, reduced);
          const fm = s.mats[4] as import('three').ShaderMaterial;
          fm.uniforms.uProgress.value = s.printT;
          fm.uniforms.uOpacity.value = op;

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
      frame();
      cleanups.push(() => cancelAnimationFrame(raf));

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
        <p className="hint t-mono" ref={hintRef}>
          <b>DRAG</b> TO MOVE THE STACK · CLICK A SHEET TO OPEN
        </p>
        <div className="veil" ref={veilRef} />
      </section>
    </div>
  );
}
