const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

exports.rule = entities.Issue.onSchedule({
  title: 'Critical Time Monitor',
  search: 'has: {Spent time}',
  cron: '0 * * * * ?', // every minute
  action: (ctx) => {
    const issue = ctx.issue;
    const limit = issue.extensionProperties.criticalTimeLimitMinutes || ctx.settings.defaultCriticalLimitMinutes;
    if (!limit) return;
    let spent = 0;
    issue.workItems.forEach(function(item) { spent += item.duration; });
    const status = spent >= limit ? 'critical' : spent >= Math.ceil(limit * 0.8) ? 'warning' : 'normal';
    const oldStatus = issue.extensionProperties.criticalTimeStatus;
    issue.extensionProperties.criticalTimeStatus = status;
    if (status === 'critical' && oldStatus !== 'critical' && ctx.settings.notificationsEnabled && ctx.settings.notificationEmails) {
      notifications.sendEmail({
        to: ctx.settings.notificationEmails.split(',').map(function(email) { return email.trim(); }),
        subject: 'Critical time limit reached: ' + issue.id,
        body: 'Issue ' + issue.id + ' has ' + spent + ' logged minutes against its ' + limit + '-minute limit.'
      }, issue);
      issue.extensionProperties.lastCriticalAlertAt = Date.now();
    }
  },
  requirements: {},
});
