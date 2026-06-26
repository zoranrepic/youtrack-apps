import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {i18n} from '../../../lib/i18n/i18n.js';
import {createAppManagementOperations} from '../management/app-management-operations.js';
import {printJson, printYaml, TagDetails} from '../management/types.js';

export async function tagSearch(config: Config, query?: string): Promise<void> {
  try {
    const tags = await createAppManagementOperations(config).searchTags(query, config.project);

    if (config.json) {
      printJson(tags);
      return;
    }

    if (config.yaml) {
      printYaml(tags);
      return;
    }

    if (!tags.length) {
      console.log(i18n('No tags found'));
      return;
    }

    for (const tag of tags) {
      console.log(formatTag(tag));
    }
  } catch (error) {
    exit(error);
  }
}

function formatTag(tag: TagDetails): string {
  const owner = tag.owner?.login ?? tag.owner?.name ?? tag.owner?.id;
  const details = [
    tag.id,
    tag.isUsable === undefined ? undefined : `usable=${tag.isUsable ? 'yes' : 'no'}`,
    owner ? `owner=${owner}` : undefined,
  ].filter(Boolean);

  return details.length ? `${tag.name} (${details.join(', ')})` : tag.name;
}
