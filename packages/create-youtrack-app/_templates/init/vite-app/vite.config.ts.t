---
 to: vite.config.ts
---
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

/*
      See https://vitejs.dev/config/
*/

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: getStaticCopyTargets()
    }),
    viteStaticCopy({
      targets: [
        // Widget icons and configurations
        {
          src: 'widgets/**/*.{svg,png,jpg,json}',
          dest: '.'
        }
      ],
      structured: true
    })
  ],
  root: './src',
  base: '',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: false,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    rollupOptions: {
      input: {
        ...getWidgetInputs()
      }
    }
  }
});

type ManifestWidget = {
  key?: string;
  indexPath?: string;
};

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
    hasTopLevelFiles(resolve(__dirname, 'public'))
      ? {
        src: '../public/*.*',
        dest: '.'
      }
      : null
  ].filter((target): target is {src: string; dest: string} => target !== null);
}

function getWidgetInputs(): Record<string, string> {
  const manifestPath = resolve(__dirname, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return {};
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const widgets = Array.isArray(manifest.widgets) ? manifest.widgets : [];

  return Object.fromEntries(
    widgets
      .filter((widget: ManifestWidget) => widget.key && widget.indexPath)
      .map((widget: ManifestWidget) => [
        toInputName(widget.key as string),
        resolve(__dirname, 'src/widgets', widget.indexPath as string)
      ])
  );
}

function toInputName(key: string): string {
  return key
    .replace(/-([a-z0-9])/g, (_, value: string) => value.toUpperCase())
    .replace(/[^a-zA-Z0-9_$]/g, '_');
}

function hasTopLevelFiles(dirPath: string): boolean {
  if (!existsSync(dirPath)) {
    return false;
  }

  return readdirSync(dirPath, {withFileTypes: true}).some(dirent => dirent.isFile());
}
