"use client";

import { useEffect, useRef } from "react";

/**
 * AmbientCanvas — GPU-accelerated WebGL background animation.
 *
 * Renders 3-4 organic, flowing gradient blobs that drift slowly across the
 * screen — the kind seen on award-winning sites (Linear, Vercel, Stripe).
 *
 * PERFORMANCE:
 * - Uses WebGL (not Canvas 2D) — runs on the GPU, not the CPU
 * - Fragment shader renders all blobs in a SINGLE draw call (no per-blob
 *   JS overhead)
 * - Only runs when the canvas is in the viewport (IntersectionObserver)
 * - Paused on mobile (CSS handles fallback gradient)
 * - Paused on prefers-reduced-motion
 * - Resolution capped at 0.5x device pixel ratio (retina looks fine at
 *   0.5x for soft gradients — saves 75% fill rate vs 1.0x)
 *
 * AESTHETIC:
 * - Navy + gold + warm-cream palette matching the site design system
 * - Slow, organic movement (sine-wave based, not random)
 * - Soft edges (smoothstep falloff, not hard circles)
 * - Subtle opacity (0.3-0.5) so content remains readable
 */

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_blob1_pos;
uniform vec2 u_blob2_pos;
uniform vec2 u_blob3_pos;
uniform vec2 u_blob4_pos;
uniform vec3 u_blob1_color;
uniform vec3 u_blob2_color;
uniform vec3 u_blob3_color;
uniform vec3 u_blob4_color;
uniform float u_blob1_radius;
uniform float u_blob2_radius;
uniform float u_blob3_radius;
uniform float u_blob4_radius;

// Smooth falloff — soft edges, not hard circles
float blob(vec2 uv, vec2 center, float radius) {
  float d = distance(uv, center);
  return smoothstep(radius, radius * 0.3, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y; // correct aspect ratio

  // Base background — slightly darker warm ivory for better text contrast.
  // Was #F7F4ED (0.969, 0.957, 0.929) — too bright, washed out content.
  // Now #EFE9DC (0.937, 0.913, 0.863) — warmer, richer, content pops.
  vec3 col = vec3(0.937, 0.913, 0.863);

  // Layer 1: Gold (top-left, warm) — reduced intensity for subtlety
  float b1 = blob(uv, u_blob1_pos, u_blob1_radius);
  col = mix(col, u_blob1_color, b1 * 0.28);

  // Layer 2: Navy (bottom-right, deep) — increased for darker, richer base
  float b2 = blob(uv, u_blob2_pos, u_blob2_radius);
  col = mix(col, u_blob2_color, b2 * 0.35);

  // Layer 3: Warm gold haze (center, gentle) — reduced for less brightness
  float b3 = blob(uv, u_blob3_pos, u_blob3_radius);
  col = mix(col, u_blob3_color, b3 * 0.15);

  // Layer 4: Accent gold (mid-right, small vivid) — reduced
  float b4 = blob(uv, u_blob4_pos, u_blob4_radius);
  col = mix(col, u_blob4_color, b4 * 0.22);

  // Subtle vignette — darkens edges slightly to focus attention on center
  float vignette = 1.0 - smoothstep(0.5, 1.4, distance(uv, vec2(0.5, 0.45)));
  col *= 0.92 + vignette * 0.08;

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

interface BlobConfig {
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  speed: number;
  phase: number;
  radius: number;
  color: [number, number, number];
}

export default function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Skip on touch devices — CSS fallback handles the background
    if (window.matchMedia("(pointer: coarse)").matches) return;
    // Skip on reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    // ── Compile shaders ──
    function compileShader(type: number, source: string): WebGLShader {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error("[AmbientCanvas] Shader compile error:", gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null!;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[AmbientCanvas] Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // ── Full-screen quad ──
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // ── Uniforms ──
    const u = {
      time: gl.getUniformLocation(program, "u_time"),
      res: gl.getUniformLocation(program, "u_resolution"),
      blob1Pos: gl.getUniformLocation(program, "u_blob1_pos"),
      blob2Pos: gl.getUniformLocation(program, "u_blob2_pos"),
      blob3Pos: gl.getUniformLocation(program, "u_blob3_pos"),
      blob4Pos: gl.getUniformLocation(program, "u_blob4_pos"),
      blob1Color: gl.getUniformLocation(program, "u_blob1_color"),
      blob2Color: gl.getUniformLocation(program, "u_blob2_color"),
      blob3Color: gl.getUniformLocation(program, "u_blob3_color"),
      blob4Color: gl.getUniformLocation(program, "u_blob4_color"),
      blob1Radius: gl.getUniformLocation(program, "u_blob1_radius"),
      blob2Radius: gl.getUniformLocation(program, "u_blob2_radius"),
      blob3Radius: gl.getUniformLocation(program, "u_blob3_radius"),
      blob4Radius: gl.getUniformLocation(program, "u_blob4_radius"),
    };

    // ── Blob configs ──
    // Colors as normalized RGB (0-1)
    // Apple-inspired: warm, monochromatic palette — no navy, just warm
    // gold/cream tones flowing over a soft ivory base.
    const blobs: BlobConfig[] = [
      // Warm gold — top left, primary glow
      { baseX: 0.15, baseY: 0.15, ampX: 0.08, ampY: 0.06, speed: 0.15, phase: 0, radius: 0.35,
        color: [0.722, 0.573, 0.306] }, // #B8924E
      // Soft taupe — bottom right (replaces navy — warm neutral, not dark)
      { baseX: 0.85, baseY: 0.7, ampX: 0.06, ampY: 0.05, speed: 0.12, phase: 2.0, radius: 0.30,
        color: [0.72, 0.66, 0.58] }, // #B8A894 — warm taupe/greige
      // Warm gold haze — center, gentle
      { baseX: 0.5, baseY: 0.4, ampX: 0.05, ampY: 0.04, speed: 0.08, phase: 4.0, radius: 0.40,
        color: [0.831, 0.698, 0.416] }, // #D4B26A
      // Accent gold — mid-right, small vivid
      { baseX: 0.75, baseY: 0.5, ampX: 0.04, ampY: 0.03, speed: 0.18, phase: 1.0, radius: 0.22,
        color: [0.722, 0.573, 0.306] }, // #B8924E
    ];

    // ── Resize handler (capped at 0.5x DPR for performance) ──
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = 0.5; // 0.5x of DPR — soft gradients look fine
      const w = Math.floor(window.innerWidth * dpr * scale);
      const h = Math.floor(window.innerHeight * dpr * scale);
      canvas!.width = w;
      canvas!.height = h;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      gl!.viewport(0, 0, w, h);
      gl!.uniform2f(u.res, w, h);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // ── IntersectionObserver — pause when offscreen ──
    const io = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    io.observe(canvas);

    // ── Render loop ──
    const startTime = performance.now();
    function render() {
      if (!isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const time = (performance.now() - startTime) / 1000;

      // Update blob positions (sine-wave organic movement)
      blobs.forEach((b, i) => {
        const x = b.baseX + Math.sin(time * b.speed + b.phase) * b.ampX;
        const y = b.baseY + Math.cos(time * b.speed * 0.8 + b.phase) * b.ampY;
        const radius = b.radius + Math.sin(time * b.speed * 0.5 + b.phase) * 0.02;

        const posLoc = [u.blob1Pos, u.blob2Pos, u.blob3Pos, u.blob4Pos][i];
        const colorLoc = [u.blob1Color, u.blob2Color, u.blob3Color, u.blob4Color][i];
        const radiusLoc = [u.blob1Radius, u.blob2Radius, u.blob3Radius, u.blob4Radius][i];

        gl!.uniform2f(posLoc, x, y);
        gl!.uniform3f(colorLoc, b.color[0], b.color[1], b.color[2]);
        gl!.uniform1f(radiusLoc, radius);
      });

      gl!.uniform1f(u.time, time);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      io.disconnect();
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
      style={{
        // CSS fallback background — darker warm ivory matching the WebGL base
        background:
          "radial-gradient(circle at 15% 15%, rgba(184,146,78,0.10) 0%, transparent 50%), " +
          "radial-gradient(circle at 85% 70%, rgba(11,27,46,0.12) 0%, transparent 50%), " +
          "#EFE9DC",
      }}
    />
  );
}
