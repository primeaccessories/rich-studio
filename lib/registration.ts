/**
 * REGISTRATION — the signature move.
 *
 * Decomposes an image into three process-ink plates (cyan / magenta /
 * yellow), screens each as a halftone dot pattern at a real print screen
 * angle (15deg / 75deg / 45deg), and offsets each by a registration error.
 *
 * A single driver `p` (0..1) controls plate offset and dot pitch together:
 *   p = 0.0  ->  plates 14px apart, 9px dots. A blown-out riso misprint.
 *   p = 0.5  ->  plates 5px apart, 4px dots. Colour fringing on every edge.
 *   p = 1.0  ->  perfect register, dots gone. The true photograph.
 *
 * This runs ONE WebGL context per instance, so it is reserved for heroes —
 * exactly one on screen at a time. Grid thumbnails use the CSS plate
 * fallback in globals.css instead, which costs no context at all.
 */

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_tex;
uniform vec2  u_res;      // drawing buffer size, device px
uniform vec2  u_imgRes;   // natural image size, px
uniform float u_p;        // registration progress 0..1
uniform float u_dpr;      // device pixel ratio

// Screen angles. These are the real ones a printer uses: K at 45 (the
// least visible angle, which is why the heaviest plate gets it), M at 75,
// C at 15, Y at 0 because yellow is faint enough to hide on-axis.
const float ANG_C = 15.0;
const float ANG_M = 75.0;
const float ANG_Y =  0.0;
const float ANG_K = 45.0;

// Process ink transmittances. Multiplying paper by these is what makes
// overlapping dots go dark the way real ink does, rather than additive.
const vec3 INK_C = vec3(0.16, 0.72, 0.93);
const vec3 INK_M = vec3(0.92, 0.22, 0.58);
const vec3 INK_Y = vec3(0.99, 0.94, 0.24);
const vec3 INK_K = vec3(0.06, 0.07, 0.09);
const vec3 PAPER = vec3(0.941, 0.941, 0.937); // #f0f0ef

// Separation with grey-component replacement. Without a K plate the dark
// areas of a photograph have to be built from all three colour inks at
// once, which overlaps into mud rather than into black — that is exactly
// what a real press uses black to avoid.
float densK(vec3 s) { return 1.0 - max(max(s.r, s.g), s.b); }
float densC(vec3 s) { float m = max(max(s.r, s.g), s.b); return (m - s.r) / max(m, 1e-4); }
float densM(vec3 s) { float m = max(max(s.r, s.g), s.b); return (m - s.g) / max(m, 1e-4); }
float densY(vec3 s) { float m = max(max(s.r, s.g), s.b); return (m - s.b) / max(m, 1e-4); }

// Dot coverage for a given ink density at a given screen angle.
// Radius goes as sqrt(density) so dot AREA tracks density linearly.
float halftone(vec2 fragPx, float density, float angleDeg, float pitch) {
  float a = radians(angleDeg);
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 cell = fract((rot * fragPx) / pitch) - 0.5;
  float d = length(cell) * 2.0;
  float r = sqrt(clamp(density, 0.0, 1.0));
  // Antialias the dot edge against the cell size so it never shimmers.
  float aa = max(fwidth(d), 0.03);
  return smoothstep(r + aa, r - aa, d);
}

// object-fit: cover, done in the shader so the canvas can be any aspect.
vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float rCanvas = res.x / res.y;
  float rImg = img.x / img.y;
  vec2 s = rCanvas > rImg
    ? vec2(1.0, rImg / rCanvas)
    : vec2(rCanvas / rImg, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec2 uv = coverUV(v_uv, u_res, u_imgRes);

  float p = clamp(u_p, 0.0, 1.0);
  float e = 1.0 - p;                       // how far out of register
  // Offsets and pitch are both in DEVICE pixels, so both must scale with
  // DPR or the screen goes twice as fine on a retina display and the dots
  // collapse into moire instead of reading as a coarse print screen.
  float spread = 11.0 * e * u_dpr;

  // Each plate errs in its own direction — that is what reads as a
  // misprint rather than as a blur. K stays near true so the image never
  // loses its structure entirely.
  vec2 offC = vec2(-0.78,  0.36) * spread / u_res;
  vec2 offM = vec2( 0.62, -0.52) * spread / u_res;
  vec2 offY = vec2( 0.14,  0.72) * spread / u_res;
  vec2 offK = vec2( 0.10,  0.08) * spread / u_res;

  vec3 sC = texture(u_tex, clamp(uv + offC, 0.0, 1.0)).rgb;
  vec3 sM = texture(u_tex, clamp(uv + offM, 0.0, 1.0)).rgb;
  vec3 sY = texture(u_tex, clamp(uv + offY, 0.0, 1.0)).rgb;
  vec3 sK = texture(u_tex, clamp(uv + offK, 0.0, 1.0)).rgb;

  // Colour plates carry only the colour that is left after black takes the
  // grey component; damped so the fringing reads as ink, not as neon.
  float dC = densC(sC) * 0.70;
  float dM = densM(sM) * 0.70;
  float dY = densY(sY) * 0.70;
  // Dark photographs would otherwise pin K near solid across the whole
  // frame and print as a black slab. Curve it so midtones open up and the
  // dot structure stays visible.
  float dK = pow(densK(sK), 1.45) * 0.9;

  // A coarse screen at rest, closing to nothing as it registers.
  float pitch = mix(13.0, 2.0, p) * u_dpr;
  vec2 fp = gl_FragCoord.xy;

  float hC = halftone(fp, dC, ANG_C, pitch);
  float hM = halftone(fp, dM, ANG_M, pitch);
  float hY = halftone(fp, dY, ANG_Y, pitch);
  float hK = halftone(fp, dK, ANG_K, pitch);

  // Subtractive: start at paper, multiply each ink down where its dot lands.
  vec3 col = PAPER;
  col *= mix(vec3(1.0), INK_C, hC);
  col *= mix(vec3(1.0), INK_M, hM);
  col *= mix(vec3(1.0), INK_Y, hY);
  col *= mix(vec3(1.0), INK_K, hK);

  // Cross-fade to the true photograph over the last quarter of the travel,
  // so full registration is genuinely sharp rather than a fine screen.
  vec3 truth = texture(u_tex, uv).rgb;
  float k = smoothstep(0.74, 1.0, u_p);

  outColor = vec4(mix(col, truth, k), 1.0);
}`;

export interface RegistrationHandle {
  /** Set registration progress, 0 (misprint) .. 1 (true image). */
  setProgress(p: number): void;
  /** Recompute buffer size after a layout change. */
  resize(): void;
  destroy(): void;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // Surfacing this matters — a silent shader failure looks like a blank tile.
    console.warn('[registration] shader failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * Attach a registration renderer to a canvas.
 * Returns null when WebGL2 is unavailable — callers must keep the CSS
 * fallback visible in that case rather than showing an empty canvas.
 */
export function createRegistration(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
): RegistrationHandle | null {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[registration] link failed:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // Fullscreen triangle pair.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // WebGL's texture origin is bottom-left but an <img>'s is top-left, so
  // without this every hero renders upside down.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uImgRes = gl.getUniformLocation(prog, 'u_imgRes');
  const uP = gl.getUniformLocation(prog, 'u_p');
  const uDpr = gl.getUniformLocation(prog, 'u_dpr');
  gl.uniform1i(gl.getUniformLocation(prog, 'u_tex'), 0);
  gl.uniform2f(
    uImgRes,
    image.naturalWidth || image.width || 1,
    image.naturalHeight || image.height || 1,
  );

  let progress = 0;
  let queued = false;
  let destroyed = false;

  function draw() {
    queued = false;
    if (destroyed) return;
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.uniform1f(uP, progress);
    gl!.uniform1f(uDpr, Math.min(window.devicePixelRatio || 1, 2));
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  // Render on demand only. With no scroll or hover this costs zero frames,
  // which is the difference between a site that idles cool and one that
  // drains a phone battery sitting still.
  function schedule() {
    if (queued || destroyed) return;
    queued = true;
    requestAnimationFrame(draw);
  }

  function resize() {
    if (destroyed) return;
    // Cap DPR at 2 — beyond that the halftone is invisible and the fill
    // cost is quadratic.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    schedule();
  }

  resize();

  return {
    setProgress(p: number) {
      const next = Math.min(1, Math.max(0, p));
      if (Math.abs(next - progress) < 0.001) return;
      progress = next;
      schedule();
    },
    resize,
    destroy() {
      destroyed = true;
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
