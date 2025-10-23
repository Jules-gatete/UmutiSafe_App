import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Force new filenames by adding build timestamp to chunks
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
        // create separate vendor chunks for heavy libraries
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Bundle react and react-dom together to avoid circular import issues
            // (some runtime helpers may be shared and splitting them caused
            // vendor chunks to form circular dependencies where createContext
            // could be undefined at module execution time).
            if (id.includes('react') || id.includes('react-dom') || id.includes('/react/index')) return 'vendor_react';
            if (id.includes('react-router-dom')) return 'vendor_router';
            if (id.includes('recharts')) return 'vendor_recharts';
            if (id.includes('leaflet') || id.includes('react-leaflet') || id.includes('@react-leaflet')) return 'vendor_leaflet';
            if (id.includes('lucide-react')) return 'vendor_icons';
            if (id.includes('axios')) return 'vendor_axios';
            if (id.includes('@supabase')) return 'vendor_supabase';
            return 'vendor_misc';
          }
        },
      },
    },
  },
});
