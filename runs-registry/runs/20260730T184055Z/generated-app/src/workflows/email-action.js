/* eslint-disable @typescript-eslint/no-require-imports, no-undef, no-magic-numbers, no-console */
const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

exports.rule = entities.Issue.action({
  title: 'Email current time-threshold status',
  command: 'email-time-status',
  guard: (ctx) => ctx.issue.isReported && !!ctx.settings.notificationEmail,
  action: (ctx) => {
    let spent = 0;
    ctx.issue.workItems.forEach((item) => {
      spent += item.duration || 0;
    });
    const limit = ctx.settings.criticalTimeLimitMinutes || 0;
    const percent = limit ? Math.round((spent / limit) * 100) : 0;

    notifications.sendEmail({
      fromName: 'Issue Delivery Control Center',
      to: [ctx.settings.notificationEmail],
      subject: `${ctx.issue.id} time-threshold status`,
      body: `${ctx.issue.id}: ${ctx.issue.summary}\nSpent: ${spent} minutes\nConfigured limit: ${limit} minutes\nCurrent status: ${percent}% of limit.`
    }, ctx.issue);
    console.info('Sent requested time status email', ctx.issue.id);
  },
  requirements: {}
});
