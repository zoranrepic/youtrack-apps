---
 to: vite.config.ts
---
import {existsSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';
import youtrackWidgetEntries from '@jetbrains/youtrack-apps-tools/dx/plugins/widget-entries';

/*
      See https://vitejs.dev/config/
*/

export default defineConfig({
  plugins: [
    react(),
    youtrackWidgetEntries({allowEmpty: true}),
    viteStaticCopy({
      targets: getStaticCopyTargets(),
      silent: true
    }),
    viteStaticCopy({
      targets: [
        // Widget icons and configurations
        {
          src: 'widgets/**/*.{svg,png,jpg,json}',
          dest: '.'
        }
      ],
      structured: true,
      silent: true
    })
  ],
  root: './src',
  base: '',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: true,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    rollupOptions: {
      // Widget entries are discovered by youtrackWidgetEntries().
    }
  }
});

function getStaticCopyTargets(): Array<{src: string; dest: string}> {
  return [
    {
      src: '../manifest.json',
      dest: '.'
    },
    hasTopLevelFiles(resolve(__dirname, 'src'))
      ? {
        src: '*.*',
        dest: '.'
      }
      : null,
    hasTopLevelFiles(resolve(__dirname, 'src', 'backend', 'workflows'), fileName => fileName.endsWith('.js'))
      ? {
        src: 'backend/workflows/*.js',
        dest: '.'
      }
      : null
  ].filter((target): target is {src: string; dest: string} => target !== null);
}

function hasTopLevelFiles(dirPath: string, filter: (fileName: string) => boolean = () => true): boolean {
  if (!existsSync(dirPath)) {
    return false;
  }

  return readdirSync(dirPath, {withFileTypes: true}).some(dirent => dirent.isFile() && filter(dirent.name));
}
