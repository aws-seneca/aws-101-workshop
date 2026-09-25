/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Docker image uses Next's small self-contained "standalone" server.
  // `npm run build && npm start` on EC2 does not need it.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
}

export default nextConfig
