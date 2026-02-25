/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Mock __dirname and __filename for Edge Runtime (required by next-auth v5 beta internals).
  // Using config.node is more reliable than DefinePlugin — it injects a module-level
  // variable declaration instead of doing a global text replacement, which properly
  // handles dynamic usages inside next-auth's bundled dependencies.
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === 'edge') {
      config.node = {
        ...(config.node || {}),
        __dirname: 'mock',
        __filename: 'mock',
      };
    }
    return config;
  },
}

export default nextConfig
