import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages（プロジェクトページ）配下で配信するため base を設定。
  // https://haruisi.github.io/study-tool/ で動くようにする。
  base: '/study-tool/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
