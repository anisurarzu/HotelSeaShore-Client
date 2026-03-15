/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["i.ibb.co", "ibb.co", "cdn.simpleicons.org"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ibb.co" },
      { protocol: "https", hostname: "cdn.simpleicons.org" },
    ],
  },
  // allow external img src (e.g. card logos in invoice)
  experimental: { images: { unoptimized: false } },
};

export default nextConfig;
