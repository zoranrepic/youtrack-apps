const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

exports.rule = entities.Issue.action({
  title: 'Send Critical Time Email',
  command: 'send-critical-time-email',
  guard: (ctx) => {
    return Boolean(ctx.settings.notificationEmails);
  },
  action: (ctx) => {
    notifications.sendEmail({
      to: ctx.settings.notificationEmails.split(',').map(function(email) { return email.trim(); }),
      subject: 'Time status requested: ' + ctx.issue.id,
      body: 'A critical-time status email was requested for ' + ctx.issue.id + '.'
    }, ctx.issue);
  },
  requirements: {},
});
