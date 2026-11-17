/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the whole site is plain HTML/JS, deployable free on Vercel or any static host.
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
