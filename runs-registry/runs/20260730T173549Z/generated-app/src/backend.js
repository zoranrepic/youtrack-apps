const entities = require('@jetbrains/youtrack-scripting-api/entities');

const MINUTES_PER_HOUR = 60;

/**
 * Reads the app-owned configuration storage and merges it with the app settings defaults.
 */
const readConfig = (ctx) => {
  let stored = {};
  try {
    stored = JSON.parse(ctx.globalStorage.extensionProperties.thresholdConfig || '{}');
  } catch (e) {
    console.warn('Stored threshold configuration is not valid JSON, falling back to settings', e.message);
    stored = {};
  }
  return {
    warningHours: typeof stored.warningHours === 'number' ? stored.warningHours : (ctx.settings.warningSpentTimeHours || 6),
    criticalHours: typeof stored.criticalHours === 'number' ? stored.criticalHours : (ctx.settings.criticalSpentTimeHours || 8),
    notifyOnCritical: typeof stored.notifyOnCritical === 'boolean' ? stored.notifyOnCritical : (ctx.settings.notifyOnCritical !== false),
    recipients: typeof stored.recipients === 'string' ? stored.recipients : (ctx.settings.notificationRecipients || ''),
    projects: stored.projects && typeof stored.projects === 'object' ? stored.projects : {}
  };
};

const writeConfig = (ctx, config) => {
  ctx.globalStorage.extensionProperties.thresholdConfig = JSON.stringify(config);
};

const totalSpentMinutes = (issue) => {
  let total = 0;
  issue.workItems.forEach((workItem) => {
    total += workItem.duration || 0;
  });
  return total;
};

exports.httpHandler = {
  endpoints: [
    {
      // Time Tracking Service: receives spent-time entries from the Global Time Logger widget.
      method: 'POST',
      path: 'time-tracking',
      scope: 'GLOBAL',
      handle: (ctx) => {
        const body = ctx.request.json() || {};
        const issueId = body.issueId;
        const minutes = Math.round(Number(body.minutes));

        if (!issueId || !isFinite(minutes) || minutes <= 0) {
          ctx.response.code = 400;
          ctx.response.json({error: 'issueId and a positive minutes value are required'});
          return;
        }

        const issue = entities.Issue.findById(issueId);
        if (!issue || !issue.isVisibleTo(ctx.currentUser)) {
          console.warn('Time logging rejected for issue', issueId, 'user', ctx.currentUser.login);
          ctx.response.code = 404;
          ctx.response.json({error: 'Issue not found'});
          return;
        }

        const date = body.date ? Date.parse(body.date) : Date.now();
        issue.addWorkItem({
          description: body.description || 'Logged from the Global Time Logger',
          date: isNaN(date) ? Date.now() : date,
          author: ctx.currentUser,
          duration: minutes
        });

        const spentMinutes = totalSpentMinutes(issue);
        console.log('Work item added', issue.id, minutes, 'min by', ctx.currentUser.login);
        ctx.response.json({
          issueId: issue.id,
          summary: issue.summary,
          addedMinutes: minutes,
          totalSpentMinutes: spentMinutes,
          totalSpentHours: Math.round((spentMinutes / MINUTES_PER_HOUR) * 100) / 100
        });
      }
    },
    {
      // Configuration Storage: current preferences, notification settings, and critical boundaries.
      method: 'GET',
      path: 'config',
      scope: 'GLOBAL',
      handle: (ctx) => {
        ctx.response.json(readConfig(ctx));
      }
    },
    {
      // Configuration Storage: persists preferences edited in the Critical Threshold Configurator.
      method: 'POST',
      path: 'config',
      scope: 'GLOBAL',
      handle: (ctx) => {
        const body = ctx.request.json() || {};
        const current = readConfig(ctx);

        const next = {
          warningHours: typeof body.warningHours === 'number' ? body.warningHours : current.warningHours,
          criticalHours: typeof body.criticalHours === 'number' ? body.criticalHours : current.criticalHours,
          notifyOnCritical: typeof body.notifyOnCritical === 'boolean' ? body.notifyOnCritical : current.notifyOnCritical,
          recipients: typeof body.recipients === 'string' ? body.recipients : current.recipients,
          projects: current.projects
        };

        if (next.criticalHours < next.warningHours) {
          ctx.response.code = 400;
          ctx.response.json({error: 'The critical limit must be greater than or equal to the warning limit'});
          return;
        }

        if (body.projectKey) {
          const projectOverride = {
            warningHours: typeof body.projectWarningHours === 'number' ? body.projectWarningHours : next.warningHours,
            criticalHours: typeof body.projectCriticalHours === 'number' ? body.projectCriticalHours : next.criticalHours
          };
          if (body.removeProject === true) {
            delete next.projects[body.projectKey];
          } else {
            next.projects[body.projectKey] = projectOverride;
          }
        }

        writeConfig(ctx, next);
        console.log('Threshold configuration updated by', ctx.currentUser.login);
        ctx.response.json(next);
      }
    }
  ]
};
