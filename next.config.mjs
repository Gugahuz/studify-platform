/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['studify.digital', 'www.studify.digital'],
    unoptimized: true,
  },
  // Comentado temporariamente para resolver loop de redirects
  // async redirects() {
  //   return [
  //     {
  //       source: '/:path*',
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'www.studify.digital',
  //         },
  //       ],
  //       destination: 'https://studify.digital/:path*',
  //       permanent: true,
  //     },
  //   ]
  // },
}

export default nextConfig
