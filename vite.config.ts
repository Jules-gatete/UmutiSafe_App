import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime']
  },
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
            // CRITICAL: Bundle ALL react-related packages together
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react-is') ||
              id.includes('scheduler') ||
              id.includes('react/jsx-runtime') ||
              id.includes('use-sync-external-store')
            ) {
              return 'vendor_react';
            }
            
            // Keep router separate but AFTER react check
            if (id.includes('react-router')) return 'vendor_router';
            
            // Recharts and its dependencies
            if (
              id.includes('recharts') || 
              id.includes('victory-') ||
              id.includes('d3-')
            ) {
              return 'vendor_recharts';
            }
            
            if (id.includes('leaflet') || id.includes('@react-leaflet')) return 'vendor_leaflet';
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