import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow an isolated build dir (e.g. a second dev server) via env, without
  // touching the default `.next` used by the primary server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
