"use client";

import { useEffect, useRef } from "react";

/**
 * AmbientCanvas — GPU-accelerated WebGL background animation.
 *
 * Renders 4 organic, flowing gradient blobs that drift slowly across the
 * screen — the kind seen on award-winning sites (Linear, Vercel, Stripe).
 *
 * PERFORMANCE:
 * - Uses WebGL (not Canvas 2D) — runs on the GPU, not the CPU
 * - Fragment shader renders all blobs in a SINGLE draw call
 * - Only runs when the canvas is in the viewport (IntersectionObserver)
 * - Paused on mobile (CSS fallback gradient handles it)
 * - Paused on prefers-reduced-motion
 * - Resolution capped at 0.5x device pixel ratio (saves 75% fill rate)
 *
 * AESTHETIC (Apple 2026-inspired):
 * - Warm monochromatic palette: gold + taupe + cream (no navy)
 * - Slow, organic movement (sine-wave based, not random)
 * - Very soft edges (smoothstep with wide falloff)
 * - Subtle intensity (0.15-0.28) so content remains the focal point
 * - Vignette focuses attention on the center
 */

// ── Fragment shader ─────────────────────────────────────────────────────────
// Renders 4 organic blobs with smoothstep falloff + a subtle vignette.
// All in a single draw call — the GPU handles the math per-pixel.
const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_blob_pos[4];
uniform vec3 u_blob_color[4];
uniform float u_blob_radius[4];

// Organic blob — smoothstep falloff for soft, natural edges
float blob(vec2 uv, vec2 center, float radius) {
  float d = distance(uv, center);
  return smoothstep(radius, radius * 0.25, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;

  // Base: warm ivory (#EFE9DC) — richer than pure white, content pops
  vec3 col = vec3(0.937, 0.913, 0.863);

  // 4 blobs — warm monochromatic palette (gold + taupe + cream)
  for (int i = 0; i < 4; i++) {
    float b = blob(uv, u_blob_pos[i], u_blob_radius[i]);
    // Intensities: 0.28, 0.20, 0.15, 0.22 — subtle, not overwhelming
    float intensity = 0.28 - float(i) * 0.04;
    if (i == 1) intensity = 0.20; // taupe — slightly more visible
    col = mix(col, u_blob_color[i], b * intensity);
  }

  // Subtle vignette — darkens edges ~8% to focus attention on center
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

    // Skip on touch devices — CSS fallback gradient handles the background
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
    function compileShader(type: number, source: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error("[AmbientCanvas] Shader compile error:", gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
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
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // ── Uniforms ──
    const u = {
      time: gl.getUniformLocation(program, "u_time"),
      res: gl.getUniformLocation(program, "u_resolution"),
      blobPos: gl.getUniformLocation(program, "u_blob_pos[0]"),
      blobColor: gl.getUniformLocation(program, "u_blob_color[0]"),
      blobRadius: gl.getUniformLocation(program, "u_blob_radius[0]"),
    };

    // ── Blob configs (Apple-inspired warm monochromatic palette) ──
    const blobs: BlobConfig[] = [
      // Warm gold — top left, primary glow
      { baseX: 0.15, baseY: 0.15, ampX: 0.08, ampY: 0.06, speed: 0.15, phase: 0, radius: 0.35,
        color: [0.722, 0.573, 0.306] }, // #B8924E
      // Soft taupe — bottom right (warm neutral, not dark navy)
      { baseX: 0.85, baseY: 0.7, ampX: 0.06, ampY: 0.05, speed: 0.12, phase: 2.0, radius: 0.30,
        color: [0.72, 0.66, 0.58] }, // #B8A894
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
      const scale = 0.5;
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
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
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
      const posArray = new Float32Array(8); // 4 blobs × 2 (x,y)
      const colorArray = new Float32Array(12); // 4 blobs × 3 (r,g,b)
      const radiusArray = new Float32Array(4); // 4 blobs × 1

      blobs.forEach((b, i) => {
        posArray[i * 2] = b.baseX + Math.sin(time * b.speed + b.phase) * b.ampX;
        posArray[i * 2 + 1] = b.baseY + Math.cos(time * b.speed * 0.8 + b.phase) * b.ampY;
        colorArray[i * 3] = b.color[0];
        colorArray[i * 3 + 1] = b.color[1];
        colorArray[i * 3 + 2] = b.color[2];
        radiusArray[i] = b.radius + Math.sin(time * b.speed * 0.5 + b.phase) * 0.02;
      });

      gl!.uniform2fv(u.blobPos, posArray);
      gl!.uniform3fv(u.blobColor, colorArray);
      gl!.uniform1fv(u.blobRadius, radiusArray);
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
        // CSS fallback — warm monochromatic (no navy), matches WebGL base
        background:
          "radial-gradient(circle at 15% 15%, rgba(184,146,78,0.10) 0%, transparent 50%), " +
          "radial-gradient(circle at 85% 70%, rgba(184,168,148,0.12) 0%, transparent 50%), " +
          "#EFE9DC",
      }}
    />
  );
}
