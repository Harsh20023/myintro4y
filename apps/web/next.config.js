// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   transpilePackages: ['@LedgerHQ/ui', '@LedgerHQ/types'],
// }

// module.exports = nextConfig
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@LedgerHQ/ui', '@LedgerHQ/types'],
  output: 'export',       // <--- Crucial line for static files
  images: {
    unoptimized: true,    // <--- Crucial line to bypass next/image runtime restrictions
  },
}

module.exports = nextConfig