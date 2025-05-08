import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

export default defineConfig(async () => {
  const { viteStaticCopy } = await import('vite-plugin-static-copy');

  return {
    base: './', // 相対パスを使用
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          { src: 'manifest.json', dest: '' },
          { src: 'src/icons/*', dest: 'icons' },
        ]
      })
    ],
    build: {
      outDir: 'dist', // 出力先
      emptyOutDir: true, // ビルド前にディレクトリを空にする
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('index.html', import.meta.url)),
          dictionary: fileURLToPath(new URL('dictionary.html', import.meta.url)),
          background: fileURLToPath(new URL('src/background/background.ts', import.meta.url)),
          content: fileURLToPath(new URL('src/content/content.ts', import.meta.url)),
        },
        output: {
          entryFileNames: 'assets/[name].js', // ハッシュなしでシンプルなファイル名
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
    server: {
      open: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
  };
});