import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai"],
  async rewrites() {
    return [
      {
        source: "/ogi-submissions.xlsx",
        destination: "/api/ogi/export",
      },
    ];
  },
  async headers() {
    // Scoped to /admin + /api/admin only — the root layout's inline bootstrap
    // script and Google Fonts @import mean a strict CSP site-wide would break
    // the public marketing pages. This is deliberately narrower.
    const adminSecurityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // 'unsafe-eval' is required in dev only — Turbopack/webpack HMR and
          // React's dev-mode stack-trace reconstruction use eval(). Never
          // included in production.
          process.env.NODE_ENV === "production"
            ? "script-src 'self' 'unsafe-inline'"
            : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];
    return [
      { source: "/admin/:path*", headers: adminSecurityHeaders },
      { source: "/api/admin/:path*", headers: adminSecurityHeaders },
    ];
  },
};

export default nextConfig;
