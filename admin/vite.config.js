import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 3001,
      host: true,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    resolve: {
      alias: {
        "@shared": path.resolve(__dirname, "../shared"),
      },
    },
    define: {
      // Define environment variables for production builds
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'production' 
          ? 'https://teerthanker-server.vercel.app/api'
          : (env.VITE_API_URL || 'http://localhost:5000/api')
      ),
      'import.meta.env.VITE_NODE_ENV': JSON.stringify(mode || 'development'),
    },
  };
});
