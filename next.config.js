/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['lib', 'types', 'pages', 'components']
  }
};

module.exports = nextConfig;
