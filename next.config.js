/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const repoBasePath = '/parejas'

const nextConfig = {
  output: 'export',
  basePath: isProd ? repoBasePath : '',
  assetPrefix: isProd ? `${repoBasePath}/` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? repoBasePath : '',
  },
}

module.exports = nextConfig
