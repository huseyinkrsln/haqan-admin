import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: [
    "192.168.1.111",
    "192.168.1.111:3000",
    "192.168.1.111:3001",
    "localhost:3000",
    "localhost:3001",
  ],
  images: {
    dangerouslyAllowLocalIP: true,
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
