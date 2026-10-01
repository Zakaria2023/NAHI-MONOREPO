import { NextConfig } from "next";
import path from "path";

const repoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  transpilePackages: ["ui", "utils"],
};

export default nextConfig;
