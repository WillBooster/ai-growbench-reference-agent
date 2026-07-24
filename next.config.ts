import type { NextConfig } from 'next';

const nextConfig: NextConfig = { reactCompiler: true, reactStrictMode: true, typescript: { ignoreBuildErrors: true } };

export default nextConfig;
