import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {AppProject, AppRule, formatBoolean, formatProjectLabel, printJson} from '../management/types.js';

export async function search(config: Config, query?: string): Promise<void> {
  try {
    const results = await createAppManagementOperations(config).search(query);

    if (config.json) {
      printJson(results);
      return;
    }

    if (!results.length) {
      console.log(i18n('No apps found'));
      return;
    }

    for (const app of results) {
      console.log(`${app.name} (${app.id})`);
      for (const rule of app.matchedRules) {
        console.log(`  rule: ${formatRule(rule)}`);
      }
    }
  } catch (error) {
    exit(error);
  }
}

export async function info(config: Config, appName?: string): Promise<void> {
  try {
    const details = await createAppManagementOperations(config).getInfo(appName);

    if (config.json) {
      printJson(details);
      return;
    }

    console.log(`Name: ${details.name}`);
    console.log(`ID: ${details.id}`);
    console.log(`Global enabled: ${formatBoolean(details.globalConfig?.enabled ?? details.enabled)}`);

    if (details.usages) {
      console.log(`Projects: ${formatList(details.usages.map(usage => formatProject(usage.project ?? {})))}`);
    }

    if (details.rules) {
      console.log(`Rules: ${formatList(details.rules.map(formatRule))}`);
    }

    const problemCount = (details.pluggableObjects ?? []).reduce((count, object) => {
      return count + (object.usages ?? []).reduce((usageCount, usage) => usageCount + (usage.problems?.length ?? 0), 0);
    }, 0);
    if (problemCount) {
      console.log(`Requirement errors: ${problemCount}`);
    }
  } catch (error) {
    exit(error);
  }
}

function formatRule(rule: AppRule): string {
  const title = rule.title ?? rule.name ?? rule.id ?? 'unknown';
  return rule.id && rule.id !== title ? `${title} (${rule.id})` : title;
}

function formatProject(project: AppProject): string {
  const label = formatProjectLabel(project);
  return project.id && project.id !== label ? `${label} (${project.id})` : label;
}

function formatList(values: string[]): string {
  return values.length ? values.join(', ') : 'none';
}
