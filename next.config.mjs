/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: "/Users/davidcavalcante/Takk/Hub/projects/Preceto/preceto-website",
  },
}

export default nextConfig
