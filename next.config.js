/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  allowedDevOrigins: [
    "192.168.1.14",
    "localhost",
  ],
}

module.exports = nextConfig
