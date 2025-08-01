/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Advanced performance optimizations
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', '@supabase/supabase-js'],
  },
  // Bundle analyzer and optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'recharts',
            chunks: 'all',
            priority: 20,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 20,
          },
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
            priority: 15,
          },
        },
      }
    }
    
    // Tree shaking optimization (removed usedExports to avoid conflict with cacheUnaffected)
    // usedExports is already handled by Next.js internally
    config.optimization.sideEffects = false
    
    return config
  },
  // Compress static assets
  compress: true,
  // Enable source maps in development only
  productionBrowserSourceMaps: false,
}

export default nextConfig
