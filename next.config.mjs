/** @type {import('next').NextConfig} */
const apiProxyTarget =
  process.env.API_PROXY_TARGET || "http://161.97.114.108/hss/api";

const nextConfig = {
  images: {
    domains: ["i.ibb.co", "ibb.co", "cdn.simpleicons.org"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
      { protocol: "https", hostname: "cdn.simpleicons.org" },
    ],
  },
  experimental: { images: { unoptimized: false } },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
