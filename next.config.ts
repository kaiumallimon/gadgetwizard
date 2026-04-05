import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      }
    ],
  },
};

export default nextConfig;
