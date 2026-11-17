/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pages are still pre-rendered as static HTML where possible. API routes under app/api
  // and /q/<id> run as Vercel Functions (they need the database).
  trailingSlash: true,
};

export default nextConfig;
