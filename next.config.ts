import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-a96a56dd913b4928b29b2128f09cc88f.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "c6373c0b1358e339f7e91abebc95b0e0.r2.cloudflarestorage.com",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;
