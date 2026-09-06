/**
 * THE PRESS PASS
 *
 * Four-colour separation and the shader that prints it. Each sheet is split
 * into C/M/Y/K plates packed into a single RGBA texture, then re-printed
 * plate by plate in the fragment shader: black lays down first, then cyan,
 * magenta and yellow, each wiping across the sheet on a rake, each landing
 * out of register and pulling itself in, halftone dots visible while the ink
 * is wet and dissolving to continuous tone as it dries.
 *
 * Kept as its own module rather than copied, so the hero rail and the /work
 * grid print through exactly the same code.
 */

import * as THREE from 'three';

/**
 * Three enables colour management by default since r152, which converts
 * every Color through linear-sRGB and re-encodes on output. This shader
 * works in raw sRGB values — the separation maths and the ink constants
 * are both authored that way — so leave it off or every colour shifts.
 */
THREE.ColorManagement.enabled = false;

/** Sheet resolution. Halved on narrow viewports — see `sheetSize`. */
export const FULL_W = 760;
export const FULL_H = 1000;

/**
 * A separation is FULL_W x FULL_H x RGBA ≈ 3MB in GPU memory, and the rail
 * holds six. That is fine on a desktop GPU and tight on a mid-range phone,
 * so narrow viewports get quarter-area sheets.
 */
export function sheetSize(viewportWidth: number) {
  const narrow = viewportWidth < 820;
  return narrow
    ? { w: Math.round(FULL_W / 2), h: Math.round(FULL_H / 2) }
    : { w: FULL_W, h: FULL_H };
}

/**
 * RGB -> CMYK, packed one plate per channel: R=cyan, G=magenta, B=yellow,
 * A=black. Rows are flipped because DataTexture reads bottom-up while a
 * 2D canvas reads top-down.
 */
export function separationData(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
): Uint8Array {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('press: no 2d context');
  // Throws a SecurityError if the canvas has been tainted by a cross-origin
  // image. Every sheet image must be same-origin or CORS-enabled.
  const src = ctx.getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    const flip = h - 1 - y;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const o = (flip * w + x) * 4;
      const r = src[i] / 255;
      const g = src[i + 1] / 255;
      const b = src[i + 2] / 255;
      const k = 1 - Math.max(r, Math.max(g, b));
      const d = 1 - k;
      out[o] = (d > 0.0001 ? (1 - r - k) / d : 0) * 255;
      out[o + 1] = (d > 0.0001 ? (1 - g - k) / d : 0) * 255;
      out[o + 2] = (d > 0.0001 ? (1 - b - k) / d : 0) * 255;
      out[o + 3] = k * 255;
    }
  }
  return out;
}

export function separationTexture(
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
): THREE.DataTexture {
  const tex = new THREE.DataTexture(
    separationData(canvas, w, h),
    w,
    h,
    THREE.RGBAFormat,
  );
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function refreshSeparation(
  tex: THREE.DataTexture,
  canvas: HTMLCanvasElement,
  w: number,
  h: number,
) {
  (tex.image.data as Uint8Array).set(separationData(canvas, w, h));
  tex.needsUpdate = true;
}

export const FRONT_FRAG = [
  'uniform sampler2D uSep;',
  'uniform float uProgress; uniform float uOpacity; uniform float uSeed;',
  'varying vec2 vUv;',

  // process ink colours — subtractive, so overprints darken like real ink
  'const vec3 INK_C = vec3(0.00, 0.62, 0.87);',
  'const vec3 INK_M = vec3(0.90, 0.07, 0.49);',
  'const vec3 INK_Y = vec3(1.00, 0.93, 0.00);',
  'const vec3 INK_K = vec3(0.09, 0.08, 0.10);',
  'const vec3 STOCK = vec3(0.965, 0.960, 0.945);',

  'float win(float p, float a, float b){ return clamp((p - a) / (b - a), 0.0, 1.0); }',

  // ink lays down as a wipe travelling across the sheet on a slight rake
  'float wiped(vec2 uv, float pr){',
  '  float e = pr * 1.32 - 0.16;',
  '  float x = uv.x + (uv.y - 0.5) * 0.09;',
  '  return 1.0 - smoothstep(e - 0.14, e, x);',
  '}',

  // halftone while the ink is fresh, continuous tone once it settles
  'float screened(float v, vec2 uv, float ang, float amt){',
  '  if(amt < 0.004) return v;',
  '  vec2 p = vec2(uv.x * 0.754, uv.y) / 0.021;',
  '  float s = sin(ang), c = cos(ang);',
  '  vec2 q = vec2(p.x * c - p.y * s, p.x * s + p.y * c);',
  '  float d = length(fract(q) - 0.5);',
  '  float r = sqrt(clamp(v, 0.0, 1.0)) * 0.72;',
  '  float w = fwidth(d) * 1.4 + 0.02;',
  '  return mix(v, 1.0 - smoothstep(r - w, r + w, d), amt);',
  '}',

  'void main(){',
  '  float pr = clamp(uProgress, 0.0, 1.0);',
  '  float pK = win(pr, 0.00, 0.34);',
  '  float pC = win(pr, 0.16, 0.52);',
  '  float pM = win(pr, 0.32, 0.70);',
  '  float pY = win(pr, 0.48, 0.88);',

  // each plate hits off-register and pulls itself in
  '  float gK = (1.0 - pK) * (1.0 - pK);',
  '  float gC = (1.0 - pC) * (1.0 - pC);',
  '  float gM = (1.0 - pM) * (1.0 - pM);',
  '  float gY = (1.0 - pY) * (1.0 - pY);',
  '  vec2 oK = vec2( 0.004, -0.003) * gK;',
  '  vec2 oC = vec2(-0.016,  0.009) * gC;',
  '  vec2 oM = vec2( 0.014,  0.011) * gM;',
  '  vec2 oY = vec2(-0.009, -0.014) * gY;',

  '  float k = texture2D(uSep, vUv + oK).a * wiped(vUv, pK);',
  '  float c = texture2D(uSep, vUv + oC).r * wiped(vUv, pC);',
  '  float m = texture2D(uSep, vUv + oM).g * wiped(vUv, pM);',
  '  float y = texture2D(uSep, vUv + oY).b * wiped(vUv, pY);',

  '  float wet = 1.0 - smoothstep(0.62, 1.0, pr);',
  '  k = screened(k, vUv, 0.0000, wet);',
  '  c = screened(c, vUv, 0.2618, wet);',
  '  m = screened(m, vUv, 1.3090, wet);',
  '  y = screened(y, vUv, 0.7854, wet);',

  '  vec3 col = STOCK;',
  '  col *= mix(vec3(1.0), INK_C, c);',
  '  col *= mix(vec3(1.0), INK_M, m);',
  '  col *= mix(vec3(1.0), INK_Y, y);',
  '  col *= mix(vec3(1.0), INK_K, k);',
  // wet ink sits fractionally darker until it dries
  '  col *= 1.0 - (1.0 - smoothstep(0.55, 1.0, pr)) * 0.06;',
  '  gl_FragColor = vec4(col, uOpacity);',
  '}',
].join('\n');

const FRONT_VERT = [
  'varying vec2 vUv;',
  'void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
].join('\n');

export function frontMaterial(
  sep: THREE.Texture,
  seed: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSep: { value: sep },
      uProgress: { value: 1 },
      uOpacity: { value: 1 },
      uSeed: { value: seed },
    },
    vertexShader: FRONT_VERT,
    fragmentShader: FRONT_FRAG,
    transparent: true,
  });
}

/** Advance a press pass. Returns the clamped progress. */
export function advancePrint(t: number, dt: number, reduced: boolean): number {
  return Math.min(1, t + dt * (reduced ? 4 : 0.62));
}
