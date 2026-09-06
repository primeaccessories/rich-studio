/**
 * SHEET TEXTURES
 *
 * Everything here is drawn at runtime — nothing is downloaded. Generated
 * typographic sheets stand in until real artwork is supplied, the sheet
 * edges are a stack of printed leaves with hairline CMYK plates showing,
 * and the furniture is the register marks and trim rules around a press
 * sheet.
 */

import * as THREE from 'three';

export interface Theme {
  paper: string;
  ink: string;
  cy: string;
  mg: string;
  yl: string;
  gr: string;
  co: string;
}

export interface PressProject {
  slug: string;
  title: string;
  client: string;
  /** Ground colour — shows during the press pass before the ink lands. */
  tone: string;
  kind: number;
  words: string[];
  /** Same-origin image path, or null for a generated sheet. */
  art: string | null;
  /** The case study's own hero — what the zoom lands on, so the cut is
   *  seamless rather than a crossfade between two different pictures. */
  hero?: string;
  /** A capture of the case study PAGE, for the open book to show. See
   *  caseStudySpreadTexture: the book opens onto the site, not onto a
   *  drawing of what the site might look like. */
  page?: string;
}

export function cv(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function grain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  amount: number,
) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export function regMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  col: string,
) {
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r * 1.7, y);
  ctx.lineTo(x + r * 1.7, y);
  ctx.moveTo(x, y - r * 1.7);
  ctx.lineTo(x, y + r * 1.7);
  ctx.stroke();
}

/** Ink colour that reads on a given ground. */
export function contrastInk(hex: string): string {
  const c = new THREE.Color(hex);
  return c.r * 0.299 + c.g * 0.587 + c.b * 0.114 > 0.58 ? '#0d0d0d' : '#edede9';
}

export function isDarkPaper(theme: Theme): boolean {
  const c = new THREE.Color(theme.paper);
  return c.r * 0.299 + c.g * 0.587 + c.b * 0.114 < 0.42;
}

/** Largest size at which every supplied line still fits the sheet. */
function fitSize(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxW: number,
  start: number,
): number {
  let size = start;
  while (size > 22) {
    ctx.font = '800 ' + size + 'px Archivo, Arial';
    let widest = 0;
    for (const l of lines) widest = Math.max(widest, ctx.measureText(l).width);
    if (widest <= maxW) break;
    size -= 4;
  }
  return size;
}

export function drawSheet(
  c: HTMLCanvasElement,
  p: PressProject,
  T: Theme,
  PW: number,
  PH: number,
) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  // Sheets are authored at 760x1000; on narrow viewports the canvas is
  // half that, so scale the whole drawing rather than re-tuning every value.
  const S = PW / 760;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  const W = 760;
  const H = 1000;

  const ink = contrastInk(p.tone);
  const k = p.kind;
  const wds = p.words && p.words.length ? p.words : [p.client];
  const w0 = wds[0] || '';
  const w1 = wds[1] || '';
  const w2 = wds[2] || '';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = p.tone;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  if (k === 0) {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = ink;
    ctx.fillRect(0, H * 0.62, W, 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = ink;
    const lines = [w0, w1, w2].filter(Boolean);
    const fs = fitSize(ctx, lines, W - 124, 132);
    ctx.font = '800 ' + fs + 'px Archivo, Arial';
    for (let i = 0; i < lines.length; i++)
      ctx.fillText(lines[i], 62, 380 + i * (fs * 0.98));
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(W - 150, H - 210, 86, 0, Math.PI * 2);
    ctx.fillStyle = T.yl;
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (k === 1) {
    ctx.fillStyle = ink;
    ctx.font = '800 780px Archivo, Arial';
    ctx.fillText(w0.charAt(0) || 'R', -70, H - 140);
    ctx.fillStyle = T.mg;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(W * 0.55, 0, 10, H);
    ctx.globalAlpha = 1;
  } else if (k === 2) {
    const cols = ['#edede9', T.cy, T.mg, T.yl];
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 4; x++) {
        ctx.globalAlpha = (x + y) % 3 === 0 ? 0.95 : 0.28;
        ctx.fillStyle = cols[(x + y) % 4];
        ctx.fillRect(60 + x * 160, 120 + y * 160, 132, 132);
      }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#edede9';
    ctx.font = '700 46px Archivo, Arial';
    ctx.fillText(w0, 60, H - 120);
    ctx.fillText(w1, 60, H - 66);
  } else if (k === 3) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(W / 2 - 170, 190, 340, 520);
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.tone;
    const fs3 = fitSize(ctx, [w0, w1], 300, 96);
    ctx.font = '800 ' + fs3 + 'px Archivo, Arial';
    ctx.fillText(w0, W / 2 - 150, 400);
    ctx.fillText(w1, W / 2 - 150, 400 + fs3);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 210, 150, 420, 600);
  } else if (k === 4) {
    for (let t = 0; t < 26; t++) {
      ctx.globalAlpha = 0.06 + t * 0.03;
      ctx.fillStyle = t % 2 ? ink : T.cy;
      ctx.fillRect(70 + t * 7, 250 + Math.sin(t * 0.4) * 90, 300, 12);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = ink;
    const fs4 = fitSize(ctx, [w0, w1], W - 124, 112);
    ctx.font = '800 ' + fs4 + 'px Archivo, Arial';
    ctx.fillText(w0, 62, H - 260);
    ctx.fillText(w1, 62, H - 150);
  } else {
    for (let yy = 0; yy < 20; yy++)
      for (let xx = 0; xx < 15; xx++) {
        const r = 3 + (yy / 19) * 17;
        ctx.beginPath();
        ctx.arc(46 + xx * 49, 60 + yy * 49, r, 0, Math.PI * 2);
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.75;
        ctx.fill();
      }
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.tone;
    ctx.fillRect(0, H - 250, W, 250);
    ctx.fillStyle = ink;
    const fs5 = fitSize(ctx, [w0, w1], W - 112, 70);
    ctx.font = '700 ' + fs5 + 'px Archivo, Arial';
    ctx.fillText(w0, 56, H - 150);
    ctx.fillText(w1, 56, H - 80);
  }

  // shared furniture: registration + slug line
  ctx.globalAlpha = 0.55;
  regMark(ctx, 40, 40, 11, ink);
  regMark(ctx, W - 40, H - 40, 11, ink);
  ctx.globalAlpha = 1;
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.7;
  ctx.fillText('®RC / ' + p.client, 40, H - 22);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(0,0,0,.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  grain(ctx, PW, PH, 16);
}

/** Paint supplied artwork over the sheet, cover-cropped. */
export function paintArt(
  c: HTMLCanvasElement,
  img: HTMLImageElement,
  PW: number,
  PH: number,
) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const scale = Math.max(PW / img.width, PH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (PW - w) / 2, (PH - h) / 2, w, h);
}

/** The edge of a stack of printed sheets. */
export function edgeTexture(vertical: boolean, T: Theme): THREE.CanvasTexture {
  const S = 512;
  const c = cv(S, S);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, S, S);
  const plates = [T.cy, T.mg, T.yl, T.co, T.gr];
  for (let i = 0; i < 86; i++) {
    const t = i / 86;
    const pos = t * S + Math.random() * 2;
    const accent = i % 9 === 4;
    ctx.strokeStyle = accent ? plates[i % plates.length] : T.ink;
    ctx.globalAlpha = accent ? 0.8 : 0.1 + Math.random() * 0.16;
    ctx.lineWidth = accent ? 2.5 : 1;
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, S);
    } else {
      ctx.moveTo(0, pos);
      ctx.lineTo(S, pos);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  grain(ctx, S, S, 10);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export function shadowTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = cv(S, S);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,.42)');
  g.addColorStop(0.55, 'rgba(0,0,0,.14)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

/** Printer's furniture: the marks around a press sheet. */
export function furnitureTexture(T: Theme): THREE.CanvasTexture {
  const FW = 2048;
  const FH = 1024;
  const c = cv(FW, FH);
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, FW, FH);
  const ink = T.ink;

  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.05;
  ctx.lineWidth = 2;
  ctx.setLineDash([16, 14]);
  for (let v = 0; v < 6; v++) {
    const x = v * (FW / 6) + 60;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FH);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.3;
  regMark(ctx, 120, 96, 13, ink);
  regMark(ctx, FW - 120, 96, 13, ink);
  regMark(ctx, 120, FH - 96, 13, ink);
  regMark(ctx, FW - 120, FH - 96, 13, ink);

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = ink;
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText('®RICH COLVILL / 300GSM UNCOATED', 120, FH - 150);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Paper stock: fibre, tooth and a raking light that follows the cursor. */
export const BACKDROP_FRAG = [
  'uniform vec2 uScale; uniform vec2 uLight;',
  'uniform float uTime; uniform float uRail; uniform float uDark;',
  'uniform vec3 uPaper; uniform vec3 uInkC; uniform vec3 uInkM; uniform vec3 uInkY;',
  'varying vec2 vUv;',

  'float hash21(vec2 p){',
  '  p = fract(p * vec2(123.34, 345.45));',
  '  p += dot(p, p + 34.345);',
  '  return fract(p.x * p.y);',
  '}',

  'float vnoise(vec2 p){',
  '  vec2 i = floor(p), f = fract(p);',
  '  vec2 u = f * f * (3.0 - 2.0 * f);',
  '  float a = hash21(i);',
  '  float b = hash21(i + vec2(1.0, 0.0));',
  '  float c = hash21(i + vec2(0.0, 1.0));',
  '  float d = hash21(i + vec2(1.0, 1.0));',
  '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
  '}',

  'float fbm(vec2 p){',
  '  float v = 0.0, a = 0.5;',
  '  for(int i = 0; i < 4; i++){ v += a * vnoise(p); p *= 2.03; a *= 0.5; }',
  '  return v;',
  '}',

  'float tooth(vec2 p){',
  '  return fbm(p * 2.6) * 0.50',
  '       + fbm(vec2(p.x * 13.0, p.y * 3.2)) * 0.28',
  '       + vnoise(p * 44.0) * 0.22;',
  '}',

  'void main(){',
  '  vec2 p = (vUv - 0.5) * uScale + vec2(uRail * 0.30, 0.0);',
  '  float e = 0.022;',
  '  float h  = tooth(p);',
  '  float hx = tooth(p + vec2(e, 0.0));',
  '  float hy = tooth(p + vec2(0.0, e));',
  '  vec3 n = normalize(vec3((h - hx) * 2.6, (h - hy) * 2.6, 1.0));',
  '  vec3 L = normalize(vec3(uLight * 1.5, 0.80));',
  '  float lam = dot(n, L) * 0.5 + 0.5;',
  '  float shade = mix(0.945, 1.055, lam);',
  '  float wc = smoothstep(0.42, 0.86, fbm(p * 0.16 + vec2( 1.7, 0.0) + uTime * 0.004));',
  '  float wm = smoothstep(0.44, 0.88, fbm(p * 0.13 + vec2(-2.4, 1.1) - uTime * 0.003));',
  '  float wy = smoothstep(0.46, 0.90, fbm(p * 0.19 + vec2( 0.6, -1.8) + uTime * 0.002));',
  '  vec3 base = uPaper;',
  '  base = mix(base, uInkC, wc * 0.030);',
  '  base = mix(base, uInkM, wm * 0.024);',
  '  base = mix(base, uInkY, wy * 0.018);',
  '  vec3 col = base * shade;',
  '  float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);',
  '  col *= mix(mix(0.94, 1.0, edge), mix(1.05, 1.0, edge), uDark);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}',
].join('\n');

export const PLAIN_VERT = [
  'varying vec2 vUv;',
  'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
].join('\n');

/**
 * The client's name on the cover, set in a paper band across the foot.
 *
 * A band rather than type laid straight over the artwork: Rich's covers
 * are his own work and usually already carry type, so a title printed on
 * top of them fights the thing it is meant to label. A band is how a book
 * jacket does it anyway.
 */
export function stampCoverTitle(
  c: HTMLCanvasElement,
  p: PressProject,
  T: Theme,
  PW: number,
  PH: number,
  /** Rich's creature mark, set beside his name in the band. Optional: if
   *  it has not loaded the name is stamped on its own and the cover is
   *  re-stamped when it arrives, rather than the band waiting on it. */
  mark?: HTMLImageElement | null,
) {
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const S = PW / 760;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  const W = 760;
  const H = 1000;

  const bandTop = H - 208;
  ctx.fillStyle = T.paper;
  ctx.fillRect(0, bandTop, W, 208);
  ctx.fillStyle = T.ink;
  ctx.globalAlpha = 0.16;
  ctx.fillRect(0, bandTop, W, 2);
  ctx.globalAlpha = 1;

  // Client name as large as it will go across the band.
  let size = 92;
  const name = p.client.toUpperCase();
  for (; size > 26; size -= 3) {
    ctx.font = '800 ' + size + 'px Archivo, Arial';
    if (ctx.measureText(name).width <= W - 112) break;
  }
  ctx.fillStyle = T.ink;
  ctx.fillText(name, 56, bandTop + 108);

  /* His mark, then his name. The mark is black on transparency so it sets
     straight onto the paper of the band — no plate behind it. */
  // Dropped from 158 to give the mark room to grow without reaching the
  // client name's baseline at 108. The band is 208 deep, so a baseline at
  // 172 still leaves 36 beneath it.
  const sigY = bandTop + 172;
  let sigX = 56;
  if (mark && mark.naturalWidth) {
    // 34 was too small to read at the size a book actually appears on the
    // rail. At 60, sitting on a baseline of 172, the mark spans 119-179 —
    // clear of the client name's baseline at 108, and clear of the band's
    // foot at 208. Client names are set in caps and have no descenders,
    // so that 11 units of headroom is real.
    const mh = 60;
    const mw = Math.round(mh * (mark.naturalWidth / mark.naturalHeight));
    ctx.globalAlpha = 0.9;
    // Optically centred on the name's x-height rather than its baseline.
    ctx.drawImage(mark, sigX, sigY - mh + 7, mw, mh);
    ctx.globalAlpha = 1;
    sigX += mw + 14;
  }

  ctx.font = '500 19px "JetBrains Mono", monospace';
  ctx.globalAlpha = 0.6;
  ctx.fillText('®RICH COLVILL', sigX, sigY);
  ctx.globalAlpha = 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}


/* The fold. A real spread is never flat across the gutter, and it is the
   single thing that stops a full-bleed page capture reading as a poster. */
function gutter(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(W - 54, 0, W + 54, 0);
  g.addColorStop(0, 'rgba(10,10,10,0)');
  g.addColorStop(0.42, 'rgba(10,10,10,.22)');
  g.addColorStop(0.5, 'rgba(10,10,10,.34)');
  g.addColorStop(0.58, 'rgba(10,10,10,.22)');
  g.addColorStop(1, 'rgba(10,10,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(W - 54, 0, 108, H);
}

/**
 * THE SPREAD
 *
 * What is inside the book when it opens. The destination page is laid
 * across BOTH leaves as one continuous spread — hero bleeding over the
 * fold, caption on the verso, the rest of the layout on the recto —
 * rather than the same page printed twice, which is what a duplicated
 * texture looks like and reads as a mistake.
 *
 * Drawn at 2:1 of a single leaf. The caller splits it with UV offsets, so
 * the halves can never drift apart: they are literally the same canvas.
 *
 * Nothing that must be read is placed near the gutter — a real spread
 * keeps text clear of the fold, and here the fold has a shadow across it.
 */
export function caseStudySpreadTexture(
  p: PressProject,
  T: Theme,
  PW: number,
  PH: number,
  hero?: HTMLImageElement | null,
  page?: HTMLImageElement | null,
): THREE.CanvasTexture {
  const c = cv(PW * 2, PH);
  const ctx = c.getContext('2d')!;
  const S = PW / 760;
  ctx.setTransform(S, 0, 0, S, 0, 0);
  const W = 760;            // one leaf
  const SW = W * 2;         // the spread
  const H = 1000;

  ctx.fillStyle = T.paper;
  ctx.fillRect(0, 0, SW, H);
  ctx.textBaseline = 'alphabetic';

  /* THE PAGE ITSELF.
     When the capture has arrived the book opens onto the actual case
     study — its header, its hero, its title — laid across both leaves.
     The drawn layout below is the floor: it is what you get for the
     second or two before the capture lands, and if it never lands. */
  if (page && page.naturalWidth) {
    ctx.drawImage(page, 0, 0, SW, H);
    gutter(ctx, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    grain(ctx, PW * 2, PH, 8);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }

  /* The hero, bleeding across the whole spread. */
  const heroH = 560;
  if (hero && hero.naturalWidth) {
    const scale = Math.max(SW / hero.naturalWidth, heroH / hero.naturalHeight);
    const dw = hero.naturalWidth * scale;
    const dh = hero.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, SW, heroH);
    ctx.clip();
    ctx.drawImage(hero, (SW - dw) / 2, (heroH - dh) / 2, dw, dh);
    ctx.restore();
  } else {
    ctx.fillStyle = p.tone;
    ctx.fillRect(0, 0, SW, heroH);
  }

  const sc = ctx.createLinearGradient(0, heroH - 300, 0, heroH);
  sc.addColorStop(0, 'rgba(10,10,10,0)');
  sc.addColorStop(1, 'rgba(10,10,10,.82)');
  ctx.fillStyle = sc;
  ctx.fillRect(0, heroH - 300, SW, 300);

  /* Caption on the verso, wrapped inside one leaf so it never crosses
     the fold. */
  ctx.fillStyle = '#f0f0ef';
  ctx.font = '500 19px "JetBrains Mono", monospace';
  ctx.globalAlpha = 0.85;
  ctx.fillText(p.client.toUpperCase(), 56, heroH - 132);
  ctx.globalAlpha = 1;

  let ts = 62;
  let lines: string[] = [];
  for (; ts > 22; ts -= 3) {
    ctx.font = '800 ' + ts + 'px Archivo, Arial';
    lines = [];
    let line = '';
    for (const word of p.title.split(/\s+/)) {
      const t = line ? line + ' ' + word : word;
      if (ctx.measureText(t).width > W - 112 && line) { lines.push(line); line = word; }
      else line = t;
    }
    if (line) lines.push(line);
    if (lines.length <= 2) break;
  }
  ctx.fillStyle = '#f0f0ef';
  lines.forEach((l, i) => ctx.fillText(l, 56, heroH - 96 + i * ts * 0.98));

  /* Verso: the brief. Recto: the plates. */
  ctx.fillStyle = T.ink;
  ctx.globalAlpha = 0.5;
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText('BRIEF', 56, heroH + 76);
  ctx.fillText('PLATES', W + 56, heroH + 76);
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(56, heroH + 108 + i * 26, W - 112 - (i === 4 ? 240 : 0), 9);
  }
  ctx.globalAlpha = 0.16;
  const bw = (W - 124) / 2;
  ctx.fillRect(W + 56, heroH + 108, bw, 150);
  ctx.fillRect(W + 56 + bw + 12, heroH + 108, bw, 150);
  ctx.fillRect(W + 56, heroH + 270, W - 112, 96);
  ctx.globalAlpha = 1;

  gutter(ctx, W, H);

  /* Folios, and the register mark on the recto. */
  ctx.fillStyle = T.ink;
  ctx.globalAlpha = 0.45;
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillText('® RICH COLVILL', 56, H - 44);
  const folio = p.slug.toUpperCase();
  ctx.fillText(folio, SW - 56 - ctx.measureText(folio).width, H - 44);
  regMark(ctx, SW - 40, 40, 11, T.ink);
  ctx.globalAlpha = 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  grain(ctx, PW * 2, PH, 10);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
