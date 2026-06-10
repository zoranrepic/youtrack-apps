import {i18n} from '../../../lib/i18n/i18n.js';
import {Config} from '../../../@types/types.js';
import {QueryField} from '../../../lib/net/queryfields.js';
import {
  APP_PROBLEM_FIELDS,
  AppDetails,
  AppProblem,
  AppProject,
  AppRule,
  EnabledResult,
  findUsageForProject,
  LogEntry,
  LogsResponse,
  ProjectDetails,
  ProjectScopeResult,
  SearchResult,
} from './types.js';
import {YouTrackAppsClient, YouTrackAppsGateway} from '../youtrack/youtrack-apps-client.js';

export class AppManagementOperations {
  constructor(private readonly client: YouTrackAppsGateway) {}

  async search(query?: string): Promise<SearchResult[]> {
    if (!query) {
      throw new Error(i18n('Search query should be defined'));
    }

    const apps = await this.client.listApps();
    return findMatches(apps, query);
  }

  async getInfo(appName?: string): Promise<AppDetails> {
    return await this.requireApp(appName, APP_PROBLEM_FIELDS);
  }

  async deleteApp(appName?: string): Promise<AppDetails> {
    const app = await this.requireApp(appName);
    await this.client.deleteWorkflow(app.id);
    return app;
  }

  async setEnabled(appName: string | undefined, enabled: boolean, projectShortName?: string | null): Promise<EnabledResult> {
    const app = await this.requireApp(appName);

    if (!projectShortName) {
      await this.client.updateGlobalConfig(app.id, enabled);
      return {app, enabled};
    }

    const project = await this.requireProject(projectShortName);
    const usage = findUsageForProject(app, project);

    if (!usage) {
      throw new Error(i18n(`App "${app.name}" is not attached to project "${projectShortName}"`));
    }

    await this.client.updateProjectConfiguration(project.id, usage.id, {
      id: usage.id,
      app: {id: app.id},
      project: {id: project.id},
      enabled,
    });

    return {app, project, enabled};
  }

  async setProjectScope(
    appName: string | undefined,
    projectShortName: string | null,
    action: 'attach' | 'detach',
  ): Promise<ProjectScopeResult> {
    const project = await this.requireProject(projectShortName);
    const app = await this.requireApp(appName);

    const currentProjects = (app.usages ?? []).map(usage => usage.project).filter(isProject);
    const nextProjects = action === 'attach'
      ? addProject(currentProjects, project)
      : currentProjects.filter(candidate => candidate.id !== project.id);

    await this.client.updateAppUsages(app.id, nextProjects.map(candidate => candidate.id));
    return {app, project, projectIds: nextProjects.map(candidate => candidate.id)};
  }

  async getLogs(appName: string | undefined, top: string | null): Promise<LogEntry[]> {
    const normalizedTop = validateTop(top);
    const app = await this.requireApp(appName);
    return normalizeLogs(await this.client.getLogs(app.id, normalizedTop ?? undefined));
  }

  async getRequirementErrors(appName?: string): Promise<AppProblem[]> {
    const app = await this.requireApp(appName, APP_PROBLEM_FIELDS);
    return collectProblems(app);
  }

  private async requireApp(appName?: string, fields?: QueryField): Promise<AppDetails> {
    if (!appName) {
      throw new Error(i18n('App name should be defined'));
    }

    const app = await this.client.getApp(appName, fields);
    if (!app) {
      throw new Error(i18n(`App "${appName}" was not found`));
    }

    return app;
  }

  private async requireProject(projectShortName?: string | null): Promise<ProjectDetails> {
    if (!projectShortName) {
      throw new Error(i18n('Option "--project" is required'));
    }

    const project = await this.client.getProject(projectShortName);
    if (!project) {
      throw new Error(i18n(`Project "${projectShortName}" was not found`));
    }

    return project;
  }
}

export function createAppManagementOperations(config: Config): AppManagementOperations {
  return new AppManagementOperations(new YouTrackAppsClient(config));
}

function findMatches(apps: AppDetails[], query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase();

  return apps.reduce<SearchResult[]>((results, app) => {
    const matchedRules = (app.rules ?? []).filter(rule => ruleMatches(rule, normalizedQuery));
    const appMatches = [app.id, app.name].some(value => value.toLowerCase().includes(normalizedQuery));

    if (appMatches || matchedRules.length) {
      results.push({...app, matchedRules});
    }

    return results;
  }, []);
}

function ruleMatches(rule: AppRule, query: string): boolean {
  return [rule.id, rule.name, rule.title].some(value => value?.toLowerCase().includes(query));
}

function validateTop(top: string | null): string | null {
  if (!top) {
    return null;
  }

  const parsed = Number(top);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(i18n('Option "--top" should be a positive number'));
  }

  return top;
}

function normalizeLogs(data: LogEntry[] | LogsResponse | undefined): LogEntry[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.logs ?? data.entries ?? [];
}

function collectProblems(app: AppDetails): AppProblem[] {
  return (app.pluggableObjects ?? []).flatMap(object => {
    return (object.usages ?? []).flatMap(usage => {
      return (usage.problems ?? []).map(problem => ({
        ...problem,
        appId: app.id,
        appName: app.name,
        pluggableObjectId: object.id,
        pluggableObjectName: object.name ?? object.title,
        projectId: usage.configuration?.project?.id,
        projectName: usage.configuration?.project?.name,
        projectShortName: usage.configuration?.project?.shortName,
      }));
    });
  });
}

function isProject(project: AppProject | undefined): project is AppProject & {id: string} {
  return typeof project?.id === 'string';
}

function addProject(projects: (AppProject & {id: string})[], project: ProjectDetails): (AppProject & {id: string})[] {
  if (projects.some(candidate => candidate.id === project.id)) {
    return projects;
  }

  return projects.concat(project);
}
