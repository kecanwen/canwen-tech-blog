import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev is bound to 0.0.0.0; browsers and the in-VM checker use 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Static files for Cloudflare Pages. Each route is a directory with
  // index.html so it does not collide with the Next.js payload folder.
  // Cache Components enables PPR, which cannot run in export mode.
  output: "export",
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
