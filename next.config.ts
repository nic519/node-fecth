import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingExcludes: {
    "*": ["node_modules/@vercel/og/**/*", "./**/@vercel/og/**"],
  },
  experimental: {
  },
};

export default nextConfig;
