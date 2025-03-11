/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['antd', '@ant-design/icons'],
  
  // Ajouter la configuration webpack pour résoudre les problèmes de modules
  webpack: (config, { isServer }) => {
    // Résoudre le problème de next-flight-client-entry-loader
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Optimisation des performances
    config.optimization.minimize = true;
    
    // Optimisation des chunks
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        default: false,
        vendors: false,
        framework: {
          name: 'framework',
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
          priority: 40,
          chunks: 'all',
        },
        antd: {
          name: 'antd',
          test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
          priority: 30,
          chunks: 'all',
        },
        lib: {
          test: /[\\/]node_modules[\\/]/,
          priority: 20,
          chunks: 'all',
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    };
    
    return config;
  },
  
  // Optimisations de performance
  swcMinify: true,
  reactStrictMode: false, // Désactiver le mode strict peut améliorer les performances en développement
  
  // Optimisation des images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Optimisation du chargement des modules
  experimental: {
    // Désactiver temporairement l'optimisation CSS
    optimizeCss: false,
    optimizePackageImports: ['antd', '@ant-design/icons', 'react-beautiful-dnd', '@hello-pangea/dnd', 'lucide-react'],
  },
  
  // Optimisation de la compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig