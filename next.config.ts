import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf2json", "pdf-parse", "pdf-lib"],
};

export default nextConfig;
