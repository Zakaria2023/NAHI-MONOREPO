import { NextConfig } from "next";
import path from "path";

const repoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  // The services read the JSON store in the repo-root db/ folder, outside this
  // app; both the bundler and the file tracer need to see the whole repo.
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  transpilePackages: ["services", "ui", "utils", "validators"],
};

export default nextConfig;
