/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Prisma warnings about self-referential models during build
  webpack: (config) => {
    config.externals.push('@prisma/client')
    return config
  },
}

module.exports = nextConfig
