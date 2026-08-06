// Critical Time Monitor.
//
// Compares the total spent time of an issue against the configured critical boundary every minute
// and reports the current status against that boundary. Boundaries come from the Critical Threshold
// Configurator widget (app global storage) and fall back to the app settings.

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

const DEFAULT_CRITICAL_MINUTES = 480;
const DEFAULT_WARNING_PERCENTAGE = 80;
const DEFAULT_ALERT_REPEAT_MINUTES = 60;

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
    alertRepeatMinutes: toPositiveInt(parsed.alertRepeatMinutes,
      toPositiveInt(ctx.settings.alertRepeatMinutes, DEFAULT_ALERT_REPEAT_MINUTES)),
    notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean'
      ? parsed.notificationsEnabled
      : ctx.settings.notificationsEnabled !== false,
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

/** The alert text: current status of the issue against its limit. */
function statusLine(issue, status, spentMinutes, limitMinutes, limitSource) {
  const percentage = Math.round(spentMinutes * 100 / limitMinutes);
  const delta = spentMinutes - limitMinutes;
  const deltaText = delta >= 0
    ? formatMinutes(delta) + ' over the limit'
    : formatMinutes(-delta) + ' left before the limit';
  return status + ': ' + issue.id + ' has ' + formatMinutes(spentMinutes) + ' spent of the ' +
    formatMinutes(limitMinutes) + ' critical limit (' + percentage + '%, ' + deltaText +
    '). Limit source: ' + limitSource + '.';
}

exports.rule = entities.Issue.onSchedule({
  title: 'Critical Time Monitor',
  search: 'has: {Spent time}',
  cron: '0 * * * * ?', // every minute
  muteUpdateNotifications: true,
  modifyUpdatedProperties: false,
  guard: (ctx) => {
    return ctx.issue.workItems.isNotEmpty();
  },
  action: (ctx) => {
    const issue = ctx.issue;
    const config = readConfig(ctx);
    const limit = resolveLimitMinutes(issue, config);
    if (limit.minutes <= 0) {
      return;
    }

    const spentMinutes = totalSpentMinutes(issue);
    const status = evaluateStatus(spentMinutes, limit.minutes, config.warningPercentage);
    const previousStatus = issue.extensionProperties.criticalStatus || 'UNKNOWN';
    const statusChanged = status !== previousStatus;
    const now = Date.now();
    const lastAlertAt = issue.extensionProperties.lastAlertAt || 0;
    const repeatDue = now - lastAlertAt >= config.alertRepeatMinutes * 60 * 1000;

    if (statusChanged) {
      issue.extensionProperties.criticalStatus = status;
      issue.extensionProperties.criticalStatusAt = now;
    }
    // Below every boundary, or already alerted recently with the same status.
    if (status === 'OK' || (!statusChanged && !repeatDue)) {
      return;
    }

    const message = statusLine(issue, status, spentMinutes, limit.minutes, limit.source);
    issue.extensionProperties.lastAlertAt = now;
    issue.addComment(message);
    console.log('Critical time alert for', issue.id, '-', status, spentMinutes, 'of', limit.minutes, 'minutes');

    if (!config.notificationsEnabled) {
      return;
    }
    const recipients = parseRecipients(ctx.settings.notificationEmails);
    if (recipients.length === 0) {
      console.warn('No notification recipients are configured, skipping the email for', issue.id);
      return;
    }
    notifications.sendEmail({
      fromName: 'Issue Ops Suite',
      to: recipients,
      subject: '[' + status + '] Spent time on ' + issue.id + ' reached ' + formatMinutes(spentMinutes),
      body: '<div style="font-family: sans-serif; font-size: 13px;">' +
        '<p>' + message + '</p>' +
        '<p><b>' + issue.id + '</b>: ' + issue.summary + '</p>' +
        '<p><a href="' + issue.url + '">Open the issue in YouTrack</a></p>' +
        '</div>'
    }, issue);
  },
  requirements: {}
});
