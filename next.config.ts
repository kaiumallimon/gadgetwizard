import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    turbopackFileSystemCacheForDev: false,
    imgOptTimeoutInSeconds: 30,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "adminapi.applegadgetsbd.com",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
      },
      {
        protocol: "https",
        hostname: "cdn.gadgetwizard.com.au",
      },
      {
        protocol: "https",
        hostname: "blocks.astratic.com",
      }
    ],
    minimumCacheTTL: 60 * 60 * 24,
  },
};

export default nextConfig;
