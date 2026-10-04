import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  // スマホ実機など同一LAN内の端末から dev サーバーへアクセスするため
  allowedDevOrigins: ["192.168.*.*"],
};

export default withSerwist(nextConfig);
