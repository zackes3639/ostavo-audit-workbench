import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the headless browser out of the server bundle; it loads from node_modules at runtime.
  serverExternalPackages: ["playwright", "playwright-core"],
};

export default nextConfig;
