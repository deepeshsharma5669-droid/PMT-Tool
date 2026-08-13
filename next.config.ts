import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "71f6ab03-5831-4401-97ba-a82dbbb25c20.preview.emergentagent.com",
        "71f6ab03-5831-4401-97ba-a82dbbb25c20.cluster-7.preview.emergentcf.cloud",
      ],
    },
  },
};

export default nextConfig;
