import {Config} from '../../../@types/types.js';
import {exit} from '../../../lib/cli/exit.js';
import {YouTrackAppsClient} from '../youtrack/youtrack-apps-client.js';

export async function list(config: Config): Promise<void> {
  try {
    const apps = await new YouTrackAppsClient(config).listApps(['id', 'name']);
    apps.forEach(x => {
      print(x.name);
    });
  } catch (error) {
    exit(error);
  }

  function print(name: string) {
    console.log(name);
  }
}
