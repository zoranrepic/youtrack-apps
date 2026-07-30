import React, {memo, useCallback, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Checkbox from '@jetbrains/ring-ui-built/components/checkbox/checkbox';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';

const host = await YTApp.register();

type ThresholdConfig = {
  warningHours: number;
  criticalHours: number;
  notifyOnCritical: boolean;
  recipients: string;
  projects: Record<string, {warningHours: number; criticalHours: number}>;
  error?: string;
};

const AppComponent: React.FunctionComponent = () => {
  const [config, setConfig] = useState<ThresholdConfig | null>(null);
  const [warningHours, setWarningHours] = useState('6');
  const [criticalHours, setCriticalHours] = useState('8');
  const [notifyOnCritical, setNotifyOnCritical] = useState(true);
  const [recipients, setRecipients] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [projectWarningHours, setProjectWarningHours] = useState('');
  const [projectCriticalHours, setProjectCriticalHours] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((next: ThresholdConfig) => {
    setConfig(next);
    setWarningHours(String(next.warningHours));
    setCriticalHours(String(next.criticalHours));
    setNotifyOnCritical(next.notifyOnCritical);
    setRecipients(next.recipients || '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await host.fetchApp<ThresholdConfig>('backend/config', {});
      apply(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        warningHours: Number(warningHours),
        criticalHours: Number(criticalHours),
        notifyOnCritical,
        recipients
      };
      if (projectKey.trim()) {
        body.projectKey = projectKey.trim().toUpperCase();
        if (projectWarningHours) {
          body.projectWarningHours = Number(projectWarningHours);
        }
        if (projectCriticalHours) {
          body.projectCriticalHours = Number(projectCriticalHours);
        }
      }
      const result = await host.fetchApp<ThresholdConfig>('backend/config', {method: 'POST', body});
      if (result.error) {
        setError(result.error);
      } else {
        apply(result);
        setMessage('Critical thresholds saved.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, [warningHours, criticalHours, notifyOnCritical, recipients, projectKey, projectWarningHours, projectCriticalHours, apply]);

  if (loading) {
    return <div className="widget"><Loader message="Loading configuration..."/></div>;
  }

  const overrides = Object.entries(config?.projects ?? {});

  return (
    <div className="widget">
      <h2>{'Critical Threshold Configurator'}</h2>

      <Input
        label="Warning limit (hours)"
        type="number"
        value={warningHours}
        onChange={e => setWarningHours(e.target.value)}
      />
      <Input
        label="Critical limit (hours)"
        type="number"
        value={criticalHours}
        onChange={e => setCriticalHours(e.target.value)}
      />
      <Input
        label="Notification recipients (comma separated)"
        value={recipients}
        onChange={e => setRecipients(e.target.value)}
      />
      <Checkbox
        label="Send email when an issue becomes critical"
        checked={notifyOnCritical}
        onChange={e => setNotifyOnCritical(e.target.checked)}
      />

      <fieldset className="project-override">
        <legend>{'Project override (optional)'}</legend>
        <Input label="Project short name" value={projectKey} onChange={e => setProjectKey(e.target.value)}/>
        <Input
          label="Project warning limit (hours)"
          type="number"
          value={projectWarningHours}
          onChange={e => setProjectWarningHours(e.target.value)}
        />
        <Input
          label="Project critical limit (hours)"
          type="number"
          value={projectCriticalHours}
          onChange={e => setProjectCriticalHours(e.target.value)}
        />
      </fieldset>

      <Button primary onClick={save} loader={saving} disabled={saving}>{'Save thresholds'}</Button>

      {overrides.length > 0 && (
        <ul className="legend">
          {overrides.map(([key, value]) => (
            <li key={key}>{`${key}: warning ${value.warningHours}h / critical ${value.criticalHours}h`}</li>
          ))}
        </ul>
      )}

      {message && <span className="success">{message}</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
};

export const App = memo(AppComponent);
