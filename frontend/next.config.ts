import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API calls through the Next.js origin so the browser only ever
  // talks to one host: the session cookie stays first-party and no CORS or
  // credentials plumbing is needed.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_PROXY_URL ?? "http://127.0.0.1:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
