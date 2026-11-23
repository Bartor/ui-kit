import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const at = (p) => resolve(__dirname, p)

/** The stylesheets ship as written; the components do not import them. */
function copyCss() {
  return {
    name: 'copy-css',
    apply: 'build',
    closeBundle() {
      for (const f of ['styles.css', 'base.css']) copyFileSync(at(`src/${f}`), at(`dist/${f}`))
    },
  }
}

// Entry points follow the optional peers: the core needs React alone, the map
// Leaflet, the charts Recharts - so an app can load the charts late, or never.
export default defineConfig({
  plugins: [react(), copyCss()],
  build: {
    lib: {
      entry: ['index.ts', 'map.ts', 'charts.ts', 'strings/pl.ts'].map((f) => at(`src/${f}`)),
      formats: ['es'],
    },
    minify: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'leaflet', 'react-leaflet', 'recharts'],
      // one file per module: readable, and an app takes only what it imports
      output: { preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js' },
    },
  },
})
