// Email Action.
//
// Sends an email notification with the current spent-time status of the issue when a user explicitly
// invokes the 'email-time-status' command from the issue, so the same status the Critical Time Monitor
// reports automatically can also be requested on demand.

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const DEFAULT_CRITICAL_MINUTES = 480;
const DEFAULT_WARNING_PERCENTAGE = 80;

function toPositiveInt(value, fallback) {
  const parsed = typeof value === 'number' ? Math.round(value) : parseInt(value, 10);
  return isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

/** Reads the boundaries stored by the configurator widget, falling back to the app settings. */
function readConfig(ctx) {
  let stored = null;
  try {
    stored = ctx.globalStorage.extensionProperties.thresholdConfig;
  } catch (e) {
    console.warn('Threshold configuration is not readable, using the app settings:', e.message);
  }
  let parsed = {};
  if (stored) {
    try {
      parsed = JSON.parse(stored) || {};
    } catch (e) {
      console.warn('Stored threshold configuration is not valid JSON, using the app settings');
      parsed = {};
    }
  }
  return {
    defaultMinutes: toPositiveInt(parsed.defaultMinutes,
      toPositiveInt(ctx.settings.criticalSpentTimeMinutes, DEFAULT_CRITICAL_MINUTES)),
    warningPercentage: toPositiveInt(parsed.warningPercentage,
      toPositiveInt(ctx.settings.warningPercentage, DEFAULT_WARNING_PERCENTAGE)),
    projects: parsed.projects && typeof parsed.projects === 'object' ? parsed.projects : {},
    issues: parsed.issues && typeof parsed.issues === 'object' ? parsed.issues : {}
  };
}

/** The issue boundary wins over the project boundary, which wins over the default. */
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
  if (spentMinutes >= limitMinutes) {
    return 'CRITICAL';
  }
  if (spentMinutes >= Math.round(limitMinutes * warningPercentage / 100)) {
    return 'WARNING';
  }
  return 'OK';
}

function parseRecipients(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value.split(/[,;\s]+/).filter(function(address) {
    return address.indexOf('@') > 0;
  });
}

exports.rule = entities.Issue.action({
  title: 'Email the spent time status of the issue',
  command: 'email-time-status',
  guard: (ctx) => {
    return ctx.issue.isReported && ctx.issue.project.isTimeTrackingEnabled;
  },
  action: (ctx) => {
    const issue = ctx.issue;
    const recipients = parseRecipients(ctx.settings.notificationEmails);
    workflow.check(ctx.settings.notificationsEnabled !== false,
      'Email notifications are turned off in the Issue Ops Suite settings.');
    workflow.check(recipients.length > 0,
      'No notification recipients are configured in the Issue Ops Suite settings.');

    const config = readConfig(ctx);
    const limit = resolveLimitMinutes(issue, config);
    const spentMinutes = totalSpentMinutes(issue);
    const status = evaluateStatus(spentMinutes, limit.minutes, config.warningPercentage);
    const percentage = limit.minutes > 0 ? Math.round(spentMinutes * 100 / limit.minutes) : 0;
    const delta = spentMinutes - limit.minutes;
    const deltaText = delta >= 0
      ? formatMinutes(delta) + ' over the limit'
      : formatMinutes(-delta) + ' left before the limit';

    notifications.sendEmail({
      fromName: 'Issue Ops Suite',
      to: recipients,
      subject: '[' + status + '] Spent time report for ' + issue.id,
      body: '<div style="font-family: sans-serif; font-size: 13px;">' +
        '<p><b>' + issue.id + '</b>: ' + issue.summary + '</p>' +
        '<p>Status against the critical limit: <b>' + status + '</b></p>' +
        '<ul>' +
        '<li>Spent time: ' + formatMinutes(spentMinutes) + '</li>' +
        '<li>Critical limit: ' + formatMinutes(limit.minutes) + ' (source: ' + limit.source + ')</li>' +
        '<li>Usage: ' + percentage + '%, ' + deltaText + '</li>' +
        '<li>Requested by: ' + ctx.currentUser.fullName + '</li>' +
        '</ul>' +
        '<p><a href="' + issue.url + '">Open the issue in YouTrack</a></p>' +
        '</div>'
    }, issue);

    console.log('Spent time report for', issue.id, 'emailed to', recipients.length, 'recipients, status:', status);
    workflow.message('Spent time report for ' + issue.id + ' (' + status + ') was emailed to ' +
      recipients.length + ' recipient(s).');
  },
  requirements: {}
});
