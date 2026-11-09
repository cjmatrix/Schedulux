import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.tsx'),
      name: 'ScheduluxWidgetBundle',
      formats: ['es', 'iife'],
      fileName: (format) => (format === 'iife' ? 'widget.js' : 'index.js'),
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    minify: 'esbuild',
    target: 'es2020',
  },
});
