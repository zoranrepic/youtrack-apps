const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.rule = entities.Issue.action({
  title: 'Email issue time status',
  command: 'email-time-status',
  guard: (ctx) => {
    return ctx.issue.isReported && !!ctx.issue.reporter;
  },
  action: (ctx) => {
    const totalMinutes = getSpentMinutes(ctx.issue);
    const limit = ctx.settings.criticalThresholdMinutes || 480;
    ctx.issue.reporter.sendMail(
      'Time status for ' + ctx.issue.idReadable,
      'Issue ' + ctx.issue.idReadable + ' has ' + totalMinutes + ' logged minutes against the ' + limit + '-minute limit.'
    );
  },
  requirements: {},
});

function getSpentMinutes(issue) {
  let total = 0;
  issue.workItems.forEach(function(workItem) { total += workItem.duration; });
  return total;
}
