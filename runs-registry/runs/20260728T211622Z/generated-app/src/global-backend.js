// Global-level endpoints of the Issue Ops Suite.
//
// These endpoints back the two widgets that have no entity context:
//   * Global Time Logger              -> POST log-time      (Time Tracking Service)
//   * Critical Threshold Configurator -> GET/POST thresholds (Configuration Storage)
//
// To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html

const entities = require('@jetbrains/youtrack-scripting-api/entities');

const DEFAULT_CRITICAL_MINUTES = 480;
const DEFAULT_WARNING_PERCENTAGE = 80;
const DEFAULT_ALERT_REPEAT_MINUTES = 60;
const MAX_OVERRIDES = 200;

/**
 * Parses a duration into whole minutes.
 * Accepts a number of minutes or a YouTrack period string such as '1w 2d 3h 10m'.
 */
function parseDurationToMinutes(value) {
  if (typeof value === 'number') {
    return isFinite(value) ? Math.round(value) : 0;
  }
  if (typeof value !== 'string') {
    return 0;
  }
  const text = value.trim().toLowerCase();
  if (!text) {
    return 0;
  }
  if (/^\d+$/.test(text)) {
    return parseInt(text, 10);
  }
  const unitMinutes = {w: 5 * 8 * 60, d: 8 * 60, h: 60, m: 1};
  const pattern = /(\d+)\s*(w|d|h|m)/g;
  let total = 0;
  let matched = false;
  let match = pattern.exec(text);
  while (match) {
    matched = true;
    total += parseInt(match[1], 10) * unitMinutes[match[2]];
    match = pattern.exec(text);
  }
  return matched ? total : 0;
}

/** Renders minutes as a YouTrack-style period string, for example '1d 2h 30m'. */
function formatMinutes(minutes) {
  const total = Math.max(0, Math.round(minutes || 0));
  if (total === 0) {
    return '0m';
  }
  const units = [['w', 5 * 8 * 60], ['d', 8 * 60], ['h', 60], ['m', 1]];
  const parts = [];
  let rest = total;
  units.forEach(function(unit) {
    const size = Math.floor(rest / unit[1]);
    if (size > 0) {
      parts.push(size + unit[0]);
      rest -= size * unit[1];
    }
  });
  return parts.join(' ');
}

/** Sums the duration of every work item of the issue, in minutes. */
function totalSpentMinutes(issue) {
  let total = 0;
  issue.workItems.forEach(function(workItem) {
    total += workItem.duration || 0;
  });
  return total;
}

function toPositiveInt(value, fallback) {
  const parsed = typeof value === 'number' ? Math.round(value) : parseInt(value, 10);
  return isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Boundary defaults taken from the app settings. */
function settingDefaults(ctx) {
  return {
    defaultMinutes: toPositiveInt(ctx.settings.criticalSpentTimeMinutes, DEFAULT_CRITICAL_MINUTES),
    warningPercentage: toPositiveInt(ctx.settings.warningPercentage, DEFAULT_WARNING_PERCENTAGE),
    alertRepeatMinutes: toPositiveInt(ctx.settings.alertRepeatMinutes, DEFAULT_ALERT_REPEAT_MINUTES),
    notificationsEnabled: ctx.settings.notificationsEnabled !== false
  };
}

/** Reads the persisted threshold configuration, falling back to the app settings. */
function readConfig(ctx) {
  let stored = null;
  try {
    stored = ctx.globalStorage.extensionProperties.thresholdConfig;
  } catch (e) {
    console.warn('Threshold configuration is not readable:', e.message);
  }
  let parsed = {};
  if (stored) {
    try {
      parsed = JSON.parse(stored) || {};
    } catch (e) {
      console.warn('Stored threshold configuration is not valid JSON, falling back to the app settings');
      parsed = {};
    }
  }
  const defaults = settingDefaults(ctx);
  return {
    defaultMinutes: toPositiveInt(parsed.defaultMinutes, defaults.defaultMinutes),
    warningPercentage: toPositiveInt(parsed.warningPercentage, defaults.warningPercentage),
    alertRepeatMinutes: toPositiveInt(parsed.alertRepeatMinutes, defaults.alertRepeatMinutes),
    notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean'
      ? parsed.notificationsEnabled
      : defaults.notificationsEnabled,
    projects: parsed.projects && typeof parsed.projects === 'object' ? parsed.projects : {},
    issues: parsed.issues && typeof parsed.issues === 'object' ? parsed.issues : {},
    updatedAt: parsed.updatedAt || null,
    updatedBy: parsed.updatedBy || null
  };
}

/** Resolves the critical boundary for one issue: issue override, then project override, then default. */
function resolveLimitMinutes(issue, config) {
  const issueOverride = toPositiveInt(config.issues[issue.id], 0);
  if (issueOverride > 0) {
    return {minutes: issueOverride, source: 'issue'};
  }
  const projectOverride = toPositiveInt(config.projects[issue.project.key], 0);
  if (projectOverride > 0) {
    return {minutes: projectOverride, source: 'project'};
  }
  return {minutes: config.defaultMinutes, source: 'default'};
}

function evaluateStatus(spentMinutes, limitMinutes, warningPercentage) {
  if (!limitMinutes) {
    return 'UNKNOWN';
  }
  if (spentMinutes >= limitMinutes) {
    return 'CRITICAL';
  }
  if (spentMinutes >= Math.round(limitMinutes * warningPercentage / 100)) {
    return 'WARNING';
  }
  return 'OK';
}

function badRequest(ctx, message) {
  ctx.response.code = 400;
  ctx.response.json({error: message});
}

exports.httpHandler = {
  endpoints: [
    {
      // Time Tracking Service: receives spent-time entries from the Global Time Logger widget.
      // Called from the widget as:
      // host.fetchApp('global-backend/log-time', {method: 'POST', body: {issueId, duration, ...}})
      method: 'POST',
      path: 'log-time',
      scope: 'GLOBAL',
      handle: function handle(ctx) {
        let payload;
        try {
          payload = ctx.request.json() || {};
        } catch (e) {
          badRequest(ctx, 'The request body must be a JSON object.');
          return;
        }

        const issueId = typeof payload.issueId === 'string' ? payload.issueId.trim() : '';
        if (!issueId) {
          badRequest(ctx, 'issueId is required.');
          return;
        }
        const minutes = parseDurationToMinutes(payload.duration);
        if (minutes <= 0) {
          badRequest(ctx, 'duration must be a positive number of minutes or a period such as "2h 30m".');
          return;
        }

        const issue = entities.Issue.findById(issueId);
        // Global endpoints do not inherit issue visibility, so it is checked explicitly.
        if (!issue || !issue.isVisibleTo(ctx.currentUser)) {
          ctx.response.code = 404;
          ctx.response.json({error: 'Issue ' + issueId + ' was not found.'});
          return;
        }
        if (!ctx.currentUser.hasPermission('CREATE_WORK_ITEM', issue.project)) {
          ctx.response.code = 403;
          ctx.response.json({error: 'You are not allowed to log time in ' + issue.project.key + '.'});
          return;
        }
        if (!issue.project.isTimeTrackingEnabled) {
          badRequest(ctx, 'Time tracking is disabled in ' + issue.project.key + '.');
          return;
        }

        const workItemJson = {
          description: typeof payload.description === 'string' && payload.description.trim()
            ? payload.description.trim()
            : 'Logged from the Global Time Logger',
          date: toPositiveInt(payload.date, Date.now()),
          author: ctx.currentUser,
          duration: minutes
        };
        const requestedType = typeof payload.workType === 'string' ? payload.workType.trim() : '';
        if (requestedType) {
          const type = entities.WorkItemType.findByProject(issue.project).find(function(candidate) {
            return candidate.name === requestedType;
          });
          if (!type) {
            badRequest(ctx, 'Work type "' + requestedType + '" is not available in ' + issue.project.key + '.');
            return;
          }
          workItemJson.type = type;
        }

        const spentBefore = totalSpentMinutes(issue);
        issue.addWorkItem(workItemJson);
        const spentAfter = spentBefore + minutes;

        const config = readConfig(ctx);
        const limit = resolveLimitMinutes(issue, config);
        const status = evaluateStatus(spentAfter, limit.minutes, config.warningPercentage);
        console.log('Logged', minutes, 'minutes on', issue.id, 'for', ctx.currentUser.login, '- status', status);

        ctx.response.json({
          issueId: issue.id,
          summary: issue.summary,
          loggedMinutes: minutes,
          loggedPresentation: formatMinutes(minutes),
          totalSpentMinutes: spentAfter,
          totalSpentPresentation: formatMinutes(spentAfter),
          limitMinutes: limit.minutes,
          limitPresentation: formatMinutes(limit.minutes),
          limitSource: limit.source,
          status: status
        });
      }
    },

    {
      // Configuration Storage: reads notification settings and critical boundaries.
      // host.fetchApp('global-backend/thresholds')
      method: 'GET',
      path: 'thresholds',
      scope: 'GLOBAL',
      handle: function handle(ctx) {
        const config = readConfig(ctx);
        ctx.response.json({
          config: config,
          configPresentation: {
            defaultLimit: formatMinutes(config.defaultMinutes),
            alertRepeat: formatMinutes(config.alertRepeatMinutes)
          },
          settingDefaults: settingDefaults(ctx),
          notificationEmails: ctx.settings.notificationEmails || '',
          canEditGlobalDefaults: ctx.currentUser.hasPermission('ADMIN_UPDATE_APP')
        });
      }
    },

    {
      // Configuration Storage: persists the boundaries defined in the configurator widget.
      // host.fetchApp('global-backend/thresholds', {method: 'POST', body: {...}})
      method: 'POST',
      path: 'thresholds',
      scope: 'GLOBAL',
      handle: function handle(ctx) {
        let payload;
        try {
          payload = ctx.request.json() || {};
        } catch (e) {
          badRequest(ctx, 'The request body must be a JSON object.');
          return;
        }

        const current = readConfig(ctx);
        const isAppAdmin = ctx.currentUser.hasPermission('ADMIN_UPDATE_APP');
        const next = {
          defaultMinutes: current.defaultMinutes,
          warningPercentage: current.warningPercentage,
          alertRepeatMinutes: current.alertRepeatMinutes,
          notificationsEnabled: current.notificationsEnabled,
          projects: {},
          issues: {},
          updatedAt: Date.now(),
          updatedBy: ctx.currentUser.login
        };

        // The app-wide defaults may be changed by app administrators only.
        const changesGlobalDefaults = payload.defaultMinutes !== undefined ||
          payload.warningPercentage !== undefined ||
          payload.alertRepeatMinutes !== undefined ||
          payload.notificationsEnabled !== undefined;
        if (changesGlobalDefaults && !isAppAdmin) {
          ctx.response.code = 403;
          ctx.response.json({error: 'Only app administrators can change the global defaults.'});
          return;
        }
        if (payload.defaultMinutes !== undefined) {
          const defaultMinutes = toPositiveInt(payload.defaultMinutes, 0);
          if (defaultMinutes <= 0) {
            badRequest(ctx, 'defaultMinutes must be a positive number of minutes.');
            return;
          }
          next.defaultMinutes = defaultMinutes;
        }
        if (payload.warningPercentage !== undefined) {
          const warningPercentage = toPositiveInt(payload.warningPercentage, 0);
          if (warningPercentage <= 0 || warningPercentage > 100) {
            badRequest(ctx, 'warningPercentage must be between 1 and 100.');
            return;
          }
          next.warningPercentage = warningPercentage;
        }
        if (payload.alertRepeatMinutes !== undefined) {
          const alertRepeatMinutes = toPositiveInt(payload.alertRepeatMinutes, 0);
          if (alertRepeatMinutes <= 0) {
            badRequest(ctx, 'alertRepeatMinutes must be a positive number of minutes.');
            return;
          }
          next.alertRepeatMinutes = alertRepeatMinutes;
        }
        if (payload.notificationsEnabled !== undefined) {
          next.notificationsEnabled = payload.notificationsEnabled === true;
        }

        const projectOverrides = payload.projects && typeof payload.projects === 'object' ? payload.projects : {};
        const projectKeys = Object.keys(projectOverrides);
        if (projectKeys.length > MAX_OVERRIDES) {
          badRequest(ctx, 'At most ' + MAX_OVERRIDES + ' project boundaries are supported.');
          return;
        }
        for (let i = 0; i < projectKeys.length; i++) {
          const projectKey = projectKeys[i].trim();
          const projectMinutes = toPositiveInt(projectOverrides[projectKeys[i]], 0);
          if (projectMinutes <= 0) {
            badRequest(ctx, 'The boundary for project ' + projectKey + ' must be a positive number of minutes.');
            return;
          }
          const project = entities.Project.findByKey(projectKey);
          if (!project) {
            badRequest(ctx, 'Project ' + projectKey + ' was not found.');
            return;
          }
          if (!isAppAdmin && !ctx.currentUser.hasPermission('UPDATE_PROJECT', project)) {
            ctx.response.code = 403;
            ctx.response.json({error: 'You are not allowed to configure boundaries for ' + project.key + '.'});
            return;
          }
          next.projects[project.key] = projectMinutes;
        }

        const issueOverrides = payload.issues && typeof payload.issues === 'object' ? payload.issues : {};
        const issueIds = Object.keys(issueOverrides);
        if (issueIds.length > MAX_OVERRIDES) {
          badRequest(ctx, 'At most ' + MAX_OVERRIDES + ' issue boundaries are supported.');
          return;
        }
        for (let j = 0; j < issueIds.length; j++) {
          const issueId = issueIds[j].trim();
          const issueMinutes = toPositiveInt(issueOverrides[issueIds[j]], 0);
          if (issueMinutes <= 0) {
            badRequest(ctx, 'The boundary for issue ' + issueId + ' must be a positive number of minutes.');
            return;
          }
          const issue = entities.Issue.findById(issueId);
          if (!issue || !issue.isVisibleTo(ctx.currentUser)) {
            badRequest(ctx, 'Issue ' + issueId + ' was not found.');
            return;
          }
          if (!isAppAdmin && !ctx.currentUser.hasPermission('UPDATE_PROJECT', issue.project)) {
            ctx.response.code = 403;
            ctx.response.json({error: 'You are not allowed to configure boundaries for ' + issue.project.key + '.'});
            return;
          }
          next.issues[issue.id] = issueMinutes;
        }

        try {
          ctx.globalStorage.extensionProperties.thresholdConfig = JSON.stringify(next);
        } catch (e) {
          console.error('Failed to persist the threshold configuration:', e.message);
          ctx.response.code = 500;
          ctx.response.json({error: 'The threshold configuration could not be saved.'});
          return;
        }
        console.log('Threshold configuration saved by', ctx.currentUser.login,
          '- project boundaries:', Object.keys(next.projects).length,
          'issue boundaries:', Object.keys(next.issues).length);

        ctx.response.json({config: next, saved: true});
      }
    }
  ]
};
