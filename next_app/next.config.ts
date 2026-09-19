import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development";
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (isDev ? "http://localhost:8000" : "https://rescuegrid-ai-lmyh.onrender.com")
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
