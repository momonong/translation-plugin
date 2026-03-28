import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'extension/manifest.json', dest: '.' },
        { src: 'extension/icon.png', dest: '.' },
        { src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs', dest: 'assets' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // 只設定 entry 為兩個 html（Vite自動處理 js chunk）、以及 extension 三個 JS
      input: {
        index: resolve(__dirname, 'index.html'),
        pdf: resolve(__dirname, 'pdf.html'),
        background: resolve(__dirname, 'extension/background.js'),
        'content-script': resolve(__dirname, 'extension/content-script.js'),
        config: resolve(__dirname, 'extension/config.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (['background', 'content-script', 'config'].includes(chunkInfo.name)) {
            return `assets/[name].js`;
          }
          return `assets/[name]-[hash].js`;
        }
      }
    }
  }
})
