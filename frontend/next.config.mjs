/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    // Uploaded covers/avatars are already served by nginx at /uploads.
    // Disabling optimizer prevents 400 on /_next/image in Docker setup.
    unoptimized: true
  }
};

export default nextConfig;
