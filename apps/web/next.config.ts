import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/api/auth/:path*",
      },
      {
        source: "/trpc/:path*",
        destination: "http://localhost:3001/trpc/:path*",
      },
    ];
  },
};

export default nextConfig;
