import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    ".space.z.ai",
    ".space-z.ai",
    "*.vercel.app",
    "*.now.sh",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
