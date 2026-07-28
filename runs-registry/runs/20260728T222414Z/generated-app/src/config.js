// Configuration Storage
// Global HTTP handler that persists user preferences, notification settings, and
// per-issue critical spent-time boundary thresholds in the app global storage.
// Read/written by the Critical Threshold Configurator widget and read by the
// Critical Time Monitor scheduled rule (via ctx.globalStorage).

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

function currentConfig(ctx) {
  return {
    thresholds: readJson(ctx.globalStorage.extensionProperties.thresholds),
    preferences: readJson(ctx.globalStorage.extensionProperties.preferences),
    defaultCriticalMinutes: ctx.settings.defaultCriticalMinutes || null
  };
}

exports.httpHandler = {
  endpoints: [
    {
      method: 'GET',
      path: 'config',
      handle: function handle(ctx) {
        ctx.response.json(currentConfig(ctx));
      }
    },
    {
      method: 'POST',
      path: 'config',
      handle: function handle(ctx) {
        const body = ctx.request.json() || {};

        if (body.thresholds && typeof body.thresholds === 'object') {
          const cleaned = {};
          Object.keys(body.thresholds).forEach(function(issueId) {
            const value = parseInt(body.thresholds[issueId], 10);
            if (!isNaN(value) && value > 0) {
              cleaned[issueId] = value;
            }
          });
          ctx.globalStorage.extensionProperties.thresholds = JSON.stringify(cleaned);
        }

        if (body.preferences && typeof body.preferences === 'object') {
          ctx.globalStorage.extensionProperties.preferences = JSON.stringify(body.preferences);
        }

        ctx.response.json(currentConfig(ctx));
      }
    }
  ]
};
