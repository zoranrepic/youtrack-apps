/* eslint-disable @typescript-eslint/no-require-imports, no-undef, no-magic-numbers, no-nested-ternary, curly, no-console */
const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

const totalMinutes = (issue) => {
  let minutes = 0;
  issue.workItems.forEach((item) => {
    minutes += item.duration || 0;
  });
  return minutes;
};

exports.rule = entities.Issue.onSchedule({
  title: 'Monitor critical spent-time threshold',
  search: 'has: {Spent time}',
  cron: '0 * * * * ?', // every minute
  guard: (ctx) => ctx.issue.isReported && (ctx.settings.criticalTimeLimitMinutes || 0) > 0,
  action: (ctx) => {
    const limit = ctx.settings.criticalTimeLimitMinutes;
    const spent = totalMinutes(ctx.issue);
    const percent = Math.round((spent / limit) * 100);
    const state = spent >= limit ? 'critical' : percent >= 80 ? 'warning' : 'normal';
    const previousState = ctx.issue.extensionProperties.criticalTimeAlertState;

    if (previousState === state) return;

    ctx.issue.extensionProperties.criticalTimeAlertState = state;
    console.info('Critical time status changed', ctx.issue.id, state, spent, limit);

    if (state !== 'normal' && ctx.settings.notificationEmail) {
      notifications.sendEmail({
        fromName: 'Issue Delivery Control Center',
        to: [ctx.settings.notificationEmail],
        subject: `[${state.toUpperCase()}] ${ctx.issue.id} is at ${percent}% of its time limit`,
        body: `${ctx.issue.id}: ${ctx.issue.summary}\nSpent: ${spent} minutes\nLimit: ${limit} minutes\nStatus: ${state}`
      }, ctx.issue);
    }
  },
  requirements: {}
});
