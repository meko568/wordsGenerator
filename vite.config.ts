import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel: base "/" (default). GitHub Pages: workflow sets BASE_PATH=/wordsGenerator/
export default defineConfig({ base: process.env.BASE_PATH || '/', plugins: [react()] })
