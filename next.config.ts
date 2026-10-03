import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // スマホ実機など同一LAN内の端末から dev サーバーへアクセスするため
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
