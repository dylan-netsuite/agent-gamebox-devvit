import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    logLevel: 'warn',
    build: {
      outDir: '../../dist/client',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          splash: 'splash.html',
          app: 'app.html',
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name][extname]',
          sourcemapFileNames: '[name].js.map',
        },
      },
      ...(mode === 'production' && {
        minify: 'terser',
        terserOptions: {
          compress: { passes: 2 },
          mangle: true,
          format: { comments: false },
        },
      }),
    },
  };
});
