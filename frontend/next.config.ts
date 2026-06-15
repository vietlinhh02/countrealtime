import type { NextConfig } from "next";

const noStoreHeaders = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "Surrogate-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Caching is disabled project-wide. Every response ships with headers that
  // tell browsers and any reverse proxy (Caddy, Cloudflare, nginx…) to never
  // store or reuse the response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: noStoreHeaders,
      },
    ];
  },

  poweredByHeader: false,

  // Force a unique build id every compile so even the framework-level
  // chunk cache can never serve a stale bundle.
  generateBuildId: async () => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  },

  // Tells Next dev server to use the on-disk source every time and skip the
  // in-memory incremental cache.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
