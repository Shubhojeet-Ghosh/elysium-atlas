import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sgdevstudio.in",
        pathname: "/elysium-atlas/**",
      },
    ],
  },
};

export default nextConfig;
