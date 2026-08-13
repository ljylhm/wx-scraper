import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/bilibili/mp3": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};

export default nextConfig;
