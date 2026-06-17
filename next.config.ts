import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ❌ Remove or change this:
          // { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },

          // ✅ Use unsafe-none instead (required for Firebase popups):
          { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://vocabminer-app.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
