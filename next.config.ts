import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // Active le mode standalone (crucial pour Docker)
  output: 'standalone',
  
  // Optimisations
  poweredByHeader: false,
  compress: true,
  
  // Si tu utilises des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  /* config options here */
   experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

};

export default nextConfig;
