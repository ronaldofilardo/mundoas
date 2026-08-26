/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NODE_ENV === "production" ? (process.env.NEXT_PUBLIC_BASE_PATH || "") : "",
  trailingSlash: false,
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
