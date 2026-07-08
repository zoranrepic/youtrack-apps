import { Plugin, ResolvedConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

export interface WidgetEntriesOptions {
  /** Directory containing widget subdirectories, relative to config.root (default: 'widgets') */
  widgetsDir?: string;
  /** Allow builds with no widget entry points, useful for backend-only apps. */
  allowEmpty?: boolean;
}

const EMPTY_ENTRY_ID = 'youtrack-widget-entries-empty-entry';
const RESOLVED_EMPTY_ENTRY_ID = `\0${EMPTY_ENTRY_ID}`;

/**
 * Discover all widget entry points by scanning for index.html in widget subdirectories.
 */
export function discoverWidgetEntries(widgetsDir: string): Record<string, string> {
  const entries: Record<string, string> = {};

  if (!fs.existsSync(widgetsDir)) {
    return entries;
  }

  const dirs = fs.readdirSync(widgetsDir, { withFileTypes: true });
  for (const dirent of dirs) {
    if (!dirent.isDirectory()) continue;
    const htmlPath = path.resolve(widgetsDir, dirent.name, 'index.html');
    if (fs.existsSync(htmlPath)) {
      entries[dirent.name] = htmlPath;
    }
  }

  return entries;
}

export default function youtrackWidgetEntries(options: WidgetEntriesOptions = {}): Plugin {
  const { widgetsDir: widgetsDirOption = 'widgets', allowEmpty = false } = options;
  let resolvedWidgetsDir: string;
  let knownEntries: Set<string> = new Set();

  return {
    name: 'vite-plugin-youtrack-widget-entries',
    apply: 'build',

    configResolved(config: ResolvedConfig) {
      resolvedWidgetsDir = path.isAbsolute(widgetsDirOption)
        ? widgetsDirOption
        : path.resolve(config.root, widgetsDirOption);
    },

    options(opts) {
      const entries = discoverWidgetEntries(resolvedWidgetsDir);
      const names = Object.keys(entries).sort();
      knownEntries = new Set(names);

      if (names.length === 0) {
        if (allowEmpty) {
          // Vite falls back to <root>/index.html when input is missing.
          // Backend-only apps do not have that file, so provide a virtual entry
          // and remove its chunk before writing dist.
          console.log(`[widget-entries] No widgets found in ${resolvedWidgetsDir}; building backend-only app.`);
          return { ...opts, input: { [EMPTY_ENTRY_ID]: EMPTY_ENTRY_ID } };
        }

        throw new Error(
          `[widget-entries] No widgets found in ${resolvedWidgetsDir}.\n` +
          `Create at least one widget with: npm run g -- widget --key <name>`
        );
      }

      console.log(`[widget-entries] Discovered widgets: ${names.join(', ')}`);
      return { ...opts, input: entries };
    },

    resolveId(id) {
      if (id === EMPTY_ENTRY_ID) {
        return RESOLVED_EMPTY_ENTRY_ID;
      }

      return null;
    },

    load(id) {
      if (id === RESOLVED_EMPTY_ENTRY_ID) {
        return 'export default null;';
      }

      return null;
    },

    generateBundle(_, bundle) {
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'chunk' && item.facadeModuleId === RESOLVED_EMPTY_ENTRY_ID) {
          delete bundle[fileName];
        }
      }
    },

    buildStart() {
      this.addWatchFile(resolvedWidgetsDir);

      for (const entry of knownEntries) {
        this.addWatchFile(path.resolve(resolvedWidgetsDir, entry));
      }
    },
  };
}
