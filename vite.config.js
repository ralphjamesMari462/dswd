import { defineConfig } from 'vite';
const base = process.env.GITHUB_PAGES === 'true' ? '/dswd-sanchez/' : '/';
export default defineConfig({base,build:{chunkSizeWarningLimit:1600},server:{host:'0.0.0.0',allowedHosts:true}});
