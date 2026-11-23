import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The gallery runs on the sources, under the names the package exports.
const src = (f) => resolve(__dirname, 'src', f)
const NAME = '@bartor-net/ui-kit'

export default defineConfig({
  root: resolve(__dirname, 'demo'),
  plugins: [react()],
  resolve: {
    alias: [
      { find: `${NAME}/styles.css`, replacement: src('styles.css') },
      { find: `${NAME}/base.css`, replacement: src('base.css') },
      { find: `${NAME}/map`, replacement: src('map.ts') },
      { find: `${NAME}/charts`, replacement: src('charts.ts') },
      { find: `${NAME}/pl`, replacement: src('strings/pl.ts') },
      { find: NAME, replacement: src('index.ts') },
    ],
  },
  server: { port: 5180 },
  build: { outDir: resolve(__dirname, 'demo-dist'), emptyOutDir: true },
})
