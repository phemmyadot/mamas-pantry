import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary CDN
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Allow any HTTPS host (covers S3, product image CDNs, etc. during development)
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
