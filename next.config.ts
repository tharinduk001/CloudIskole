import type { NextConfig } from "next";

/**
 * Static security headers.
 *
 * Content-Security-Policy is deliberately NOT set here — it is generated
 * per-request with a nonce in `src/proxy.ts`, because Next.js injects inline
 * bootstrap scripts that a static policy could only allow via `unsafe-inline`.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on type errors rather than shipping them.
  // (Next 16 removed the `eslint` key — linting runs via the ESLint CLI in CI.)
  typescript: { ignoreBuildErrors: false },

  // Do not advertise the framework version.
  poweredByHeader: false,

  images: {
    // Supabase Storage objects, YouTube thumbnails, Google avatars.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
