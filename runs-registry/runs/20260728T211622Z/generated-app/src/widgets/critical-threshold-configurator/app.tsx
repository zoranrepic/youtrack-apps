import React, {memo, useCallback, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Checkbox from '@jetbrains/ring-ui-built/components/checkbox/checkbox';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Text from '@jetbrains/ring-ui-built/components/text/text';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

interface ThresholdConfig {
  defaultMinutes: number;
  warningPercentage: number;
  alertRepeatMinutes: number;
  notificationsEnabled: boolean;
  projects: Record<string, number>;
  issues: Record<string, number>;
  updatedAt?: number;
  updatedBy?: string;
}

interface ThresholdsResponse {
  config: ThresholdConfig;
  configPresentation: {defaultLimit: string; alertRepeat: string};
  settingDefaults: {
    criticalSpentTimeMinutes: number;
    warningPercentage: number;
    alertRepeatMinutes: number;
    notificationsEnabled: boolean;
  };
  notificationEmails: string;
  canEditGlobalDefaults: boolean;
  error?: string;
}

interface Override {
  key: string;
  minutes: string;
}

function toOverrideRows(source: Record<string, number> | undefined): Override[] {
  return Object.keys(source ?? {}).map(key => ({key, minutes: String((source ?? {})[key])}));
}

function toOverrideMap(rows: Override[]): Record<string, number> {
  const map: Record<string, number> = {};
  rows.forEach(row => {
    const key = row.key.trim();
    const minutes = parseInt(row.minutes, 10);
    if (key && !isNaN(minutes) && minutes > 0) {
      map[key] = minutes;
    }
  });
  return map;
}

const AppComponent: React.FunctionComponent = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [data, setData] = useState<ThresholdsResponse | null>(null);

  const [defaultMinutes, setDefaultMinutes] = useState<string>('');
  const [warningPercentage, setWarningPercentage] = useState<string>('');
  const [alertRepeatMinutes, setAlertRepeatMinutes] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [projectRows, setProjectRows] = useState<Override[]>([]);
  const [issueRows, setIssueRows] = useState<Override[]>([]);

  const applyConfig = useCallback((response: ThresholdsResponse) => {
    setData(response);
    setDefaultMinutes(String(response.config.defaultMinutes));
    setWarningPercentage(String(response.config.warningPercentage));
    setAlertRepeatMinutes(String(response.config.alertRepeatMinutes));
    setNotificationsEnabled(response.config.notificationsEnabled !== false);
    setProjectRows(toOverrideRows(response.config.projects));
    setIssueRows(toOverrideRows(response.config.issues));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    host.fetchApp<ThresholdsResponse>('global-backend/thresholds')
      .then(response => {
        applyConfig(response);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message || 'Failed to load the critical thresholds.');
        setLoading(false);
      });
  }, [applyConfig]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(() => {
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const body: Record<string, unknown> = {
      projects: toOverrideMap(projectRows),
      issues: toOverrideMap(issueRows)
    };
    // The app-wide defaults are editable by app administrators only.
    if (data?.canEditGlobalDefaults) {
      body.defaultMinutes = parseInt(defaultMinutes, 10);
      body.warningPercentage = parseInt(warningPercentage, 10);
      body.alertRepeatMinutes = parseInt(alertRepeatMinutes, 10);
      body.notificationsEnabled = notificationsEnabled;
    }
    host.fetchApp<{config: ThresholdConfig; saved: boolean; error?: string}>(
      'global-backend/thresholds',
      {method: 'POST', body}
    ).then(() => {
      setSaving(false);
      setSavedAt(new Date().toLocaleTimeString());
      load();
    }).catch((e: Error) => {
      setError(e.message || 'The critical thresholds could not be saved.');
      setSaving(false);
    });
  }, [data, defaultMinutes, warningPercentage, alertRepeatMinutes, notificationsEnabled,
    projectRows, issueRows, load]);

  const updateRow = useCallback((
    rows: Override[],
    setRows: (next: Override[]) => void,
    index: number,
    patch: Partial<Override>
  ) => {
    setRows(rows.map((row, i) => (i === index ? {...row, ...patch} : row)));
  }, []);

  const readOnlyDefaults = !data?.canEditGlobalDefaults;

  const renderOverrides = (
    title: string,
    hint: string,
    rows: Override[],
    setRows: (next: Override[]) => void
  ) => (
    <section className="config-section">
      <Text bold>{title}</Text>
      <Text info>{hint}</Text>
      {rows.map((row, index) => (
        // eslint-disable-next-line react/no-array-index-key -- rows are positional and keys may be empty while typing.
        <div className="config-row" key={`${title}-${index}`}>
          <Input
            value={row.key}
            placeholder={title === 'Project limits' ? 'DEMO' : 'DEMO-1'}
            onChange={event => updateRow(rows, setRows, index, {key: event.target.value})}
          />
          <Input
            value={row.minutes}
            type="number"
            placeholder="Minutes"
            onChange={event => updateRow(rows, setRows, index, {minutes: event.target.value})}
          />
          <Button danger text onClick={() => setRows(rows.filter((_, i) => i !== index))}>
            {'Remove'}
          </Button>
        </div>
      ))}
      <Button onClick={() => setRows([...rows, {key: '', minutes: ''}])}>{'Add limit'}</Button>
    </section>
  );

  return (
    <div className="widget">
      <div className="config-header">
        <Text bold size={Text.Size.L}>{'Critical time limits'}</Text>
        {loading && <LoaderInline/>}
      </div>

      {error && <Text info>{`Error: ${error}`}</Text>}

      {!loading && data && (
        <>
          <section className="config-section">
            <Text bold>{'Defaults for every issue'}</Text>
            <Text info>
              {readOnlyDefaults
                ? 'Only app administrators can change the app-wide defaults. Project and issue limits below are still editable.'
                : 'Applied when no project or issue limit matches the issue.'}
            </Text>
            <div className="config-row">
              <Input
                label="Critical limit, minutes"
                type="number"
                value={defaultMinutes}
                disabled={readOnlyDefaults}
                onChange={event => setDefaultMinutes(event.target.value)}
              />
              <Input
                label="Warning at, % of the limit"
                type="number"
                value={warningPercentage}
                disabled={readOnlyDefaults}
                onChange={event => setWarningPercentage(event.target.value)}
              />
              <Input
                label="Repeat alerts every, minutes"
                type="number"
                value={alertRepeatMinutes}
                disabled={readOnlyDefaults}
                onChange={event => setAlertRepeatMinutes(event.target.value)}
              />
            </div>
            <Checkbox
              label="Send email notifications when a limit is reached"
              checked={notificationsEnabled}
              disabled={readOnlyDefaults}
              onChange={event => setNotificationsEnabled(event.target.checked)}
            />
            <Text info>
              {data.notificationEmails
                ? `Recipients from the app settings: ${data.notificationEmails}`
                : 'No recipients are set in the app settings, so emails are skipped.'}
            </Text>
            <Text info>
              {`Current limit: ${data.configPresentation.defaultLimit}, ` +
                `alerts repeat every ${data.configPresentation.alertRepeat}.`}
            </Text>
          </section>

          {renderOverrides(
            'Project limits',
            'A limit for every issue of the project, by project short name. Overrides the default.',
            projectRows,
            setProjectRows
          )}

          {renderOverrides(
            'Issue limits',
            'A limit for one issue, by issue ID. Overrides the project limit.',
            issueRows,
            setIssueRows
          )}

          <div className="config-actions">
            <Button primary loader={saving} disabled={saving} onClick={save}>{'Save limits'}</Button>
            <Button onClick={load} disabled={saving}>{'Reset'}</Button>
            {savedAt && <Text info>{`Saved at ${savedAt}`}</Text>}
            {data.config.updatedBy && (
              <Text info>{`Last change by ${data.config.updatedBy}`}</Text>
            )}
          </div>
        </>
      )}
    </div>
  );
};


export const App = memo(AppComponent);
