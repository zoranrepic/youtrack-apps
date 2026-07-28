const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.onSchedule({
  title: 'Critical time monitor',
  search: 'has: {Spent time}',
  cron: '0 * * * * ?', // every minute
  action: (ctx) => {
    const totalMinutes = getSpentMinutes(ctx.issue);
    const limit = ctx.globalStorage.extensionProperties.dashboardCriticalMinutes || ctx.settings.criticalThresholdMinutes || 480;
    const warningPercent = ctx.globalStorage.extensionProperties.dashboardWarningPercent || ctx.settings.warningThresholdPercent || 80;
    const notificationsEnabled = ctx.globalStorage.extensionProperties.dashboardNotificationsEnabled !== false && ctx.settings.notificationsEnabled !== false;
    const status = totalMinutes >= limit ? 'critical' : totalMinutes >= Math.ceil(limit * warningPercent / 100) ? 'warning' : 'normal';
    if (notificationsEnabled && status !== 'normal' && ctx.issue.extensionProperties.criticalTimeAlertState !== status) {
      const recipient = ctx.issue.fields.Assignee || ctx.issue.reporter;
      if (recipient) {
        recipient.sendMail(
          'Time ' + status + ': ' + ctx.issue.idReadable,
          'Issue ' + ctx.issue.idReadable + ' has ' + totalMinutes + ' logged minutes against a ' + limit + '-minute limit (' + status + ').'
        );
      }
    }
    ctx.issue.extensionProperties.criticalTimeAlertState = status;
  },
  requirements: {
    Assignee: {
      type: entities.User.fieldType,
      name: 'Assignee'
    }
  },
});

function getSpentMinutes(issue) {
  let total = 0;
  issue.workItems.forEach(function(workItem) { total += workItem.duration; });
  return total;
}
