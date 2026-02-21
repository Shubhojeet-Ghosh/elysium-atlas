import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sgdevstudio.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
    qualities: [75, 100],
  },
};

export default nextConfig;
