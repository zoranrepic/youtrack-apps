const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

const MINUTES_PER_HOUR = 60;

const readConfig = (ctx) => {
  let stored = {};
  try {
    stored = JSON.parse((ctx.globalStorage && ctx.globalStorage.extensionProperties.thresholdConfig) || '{}');
  } catch (e) {
    console.warn('Stored threshold configuration is not valid JSON', e.message);
    stored = {};
  }

  const projectKey = ctx.issue.project.key;
  const override = (stored.projects && stored.projects[projectKey]) || {};

  return {
    warningHours: typeof override.warningHours === 'number' ? override.warningHours
      : (typeof stored.warningHours === 'number' ? stored.warningHours : (ctx.settings.warningSpentTimeHours || 6)),
    criticalHours: typeof override.criticalHours === 'number' ? override.criticalHours
      : (typeof stored.criticalHours === 'number' ? stored.criticalHours : (ctx.settings.criticalSpentTimeHours || 8)),
    notifyOnCritical: typeof stored.notifyOnCritical === 'boolean' ? stored.notifyOnCritical : (ctx.settings.notifyOnCritical !== false),
    recipients: (typeof stored.recipients === 'string' && stored.recipients) || ctx.settings.notificationRecipients || ''
  };
};

const totalSpentMinutes = (issue) => {
  let total = 0;
  issue.workItems.forEach((workItem) => {
    total += workItem.duration || 0;
  });
  return total;
};

const parseRecipients = (value) => value.split(',')
  .map((address) => address.trim())
  .filter((address) => address.length > 0);

exports.rule = entities.Issue.onSchedule({
  title: 'Critical time monitor',
  search: 'has: {Spent time}',
  cron: '0 * * * * ?', // every minute
  muteUpdateNotifications: true,
  modifyUpdatedProperties: false,
  action: (ctx) => {
    const issue = ctx.issue;
    const config = readConfig(ctx);
    const spentMinutes = totalSpentMinutes(issue);
    const spentHours = Math.round((spentMinutes / MINUTES_PER_HOUR) * 100) / 100;

    let status = 'OK';
    if (spentHours >= config.criticalHours) {
      status = 'CRITICAL';
    } else if (spentHours >= config.warningHours) {
      status = 'WARNING';
    }

    const previousStatus = issue.extensionProperties.criticalTimeStatus || 'OK';
    if (previousStatus === status) {
      return;
    }

    issue.extensionProperties.criticalTimeStatus = status;
    const summaryLine = issue.id + ': spent ' + spentHours + 'h of the ' + config.criticalHours
      + 'h critical limit (warning at ' + config.warningHours + 'h). Status: ' + status + '.';
    console.log('Critical time monitor status change', issue.id, previousStatus, '->', status);

    issue.addComment(summaryLine);

    if (status === 'CRITICAL' && config.notifyOnCritical) {
      const recipients = parseRecipients(config.recipients);
      if (recipients.length === 0) {
        console.warn('Critical limit reached but no notification recipients are configured', issue.id);
        return;
      }
      notifications.sendEmail({
        to: recipients,
        subject: 'Critical spent time reached in ' + issue.id,
        body: '<div style="font-family: sans-serif">' + summaryLine + '<br/><a href="' + issue.url + '">' + issue.id + '</a></div>'
      }, issue);
    }
  },
  requirements: {}
});
