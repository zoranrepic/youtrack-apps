// Critical Time Monitor Rule
// Runs every minute over issues that have spent time. Compares each issue's total
// spent time against the configured critical boundary (per-issue threshold from the
// Critical Threshold Configurator, or the global default), and alerts with the
// current status whenever that status changes.

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

function readJson(raw) {
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

function totalSpentMinutes(issue) {
  let total = 0;
  issue.workItems.forEach(function(item) {
    total += item.duration || 0;
  });
  return total;
}

function resolveLimit(ctx, issue) {
  const thresholds = readJson(ctx.globalStorage.extensionProperties.thresholds);
  // Per-issue threshold keyed by the readable id set from the configurator widget.
  if (thresholds[issue.idReadable]) {
    return parseInt(thresholds[issue.idReadable], 10);
  }
  if (ctx.settings.defaultCriticalMinutes) {
    return parseInt(ctx.settings.defaultCriticalMinutes, 10);
  }
  return null;
}

exports.rule = entities.Issue.onSchedule({
  title: 'Critical Time Monitor',
  search: 'has: {Spent time}',
  cron: '0 * * * * ?', // every minute
  action: (ctx) => {
    const issue = ctx.issue;
    const limit = resolveLimit(ctx, issue);
    if (!limit || limit <= 0) {
      return;
    }

    const spent = totalSpentMinutes(issue);
    const status = spent >= limit ? 'CRITICAL' : 'OK';
    const previous = issue.extensionProperties.lastCriticalStatus || 'UNKNOWN';

    // Only alert when the status against the limit changes, to avoid per-minute noise.
    if (status === previous) {
      return;
    }
    issue.extensionProperties.lastCriticalStatus = status;

    const summary = 'Spent time ' + spent + ' min vs critical limit ' + limit + ' min: ' + status + '.';
    console.log('Critical time monitor: ' + issue.idReadable + ' - ' + summary);
    issue.addComment('**Critical time monitor**: ' + summary);

    if (status === 'CRITICAL' && ctx.settings.enableEmailAlerts && ctx.settings.notificationEmail) {
      notifications.sendEmail({
        fromName: ctx.settings.senderName || 'Ops Command Center',
        to: [ctx.settings.notificationEmail],
        subject: 'Critical spent time reached for ' + issue.idReadable,
        body: '<div style="font-family: sans-serif">' + summary + '</div>'
      }, issue);
    }
  },
  requirements: {}
});
