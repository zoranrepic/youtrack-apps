import React, {memo, useCallback, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';

// Register widget in YouTrack. See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

type ConfigResponse = {
  thresholds: Record<string, number>;
  preferences: Record<string, unknown>;
  defaultCriticalMinutes: number | null;
};

type Row = {
  issueId: string;
  minutes: string;
};

function toRows(thresholds: Record<string, number>): Row[] {
  return Object.keys(thresholds || {}).map(issueId => ({
    issueId,
    minutes: String(thresholds[issueId])
  }));
}

const AppComponent: React.FunctionComponent = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [defaultMinutes, setDefaultMinutes] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    host.fetchApp<ConfigResponse>('config/config')
      .then(config => {
        setRows(toRows(config.thresholds));
        setDefaultMinutes(config.defaultCriticalMinutes);
        setLoading(false);
      })
      .catch(() => {
        setMessage('Failed to load configuration.');
        setLoading(false);
      });
  }, []);

  const updateRow = useCallback((index: number, patch: Partial<Row>) => {
    setRows(current => current.map((row, i) => (i === index ? {...row, ...patch} : row)));
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows(current => current.filter((_, i) => i !== index));
  }, []);

  const addRow = useCallback(() => {
    setRows(current => [...current, {issueId: '', minutes: ''}]);
  }, []);

  const save = useCallback(async () => {
    const thresholds: Record<string, number> = {};
    for (const row of rows) {
      const id = row.issueId.trim();
      const value = parseInt(row.minutes, 10);
      if (id && !isNaN(value) && value > 0) {
        thresholds[id] = value;
      }
    }
    setSaving(true);
    setMessage(null);
    try {
      const config = await host.fetchApp<ConfigResponse>('config/config', {
        method: 'POST',
        body: {thresholds}
      });
      setRows(toRows(config.thresholds));
      setDefaultMinutes(config.defaultCriticalMinutes);
      setMessage('Critical thresholds saved.');
    } catch (e) {
      setMessage('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  }, [rows]);

  if (loading) {
    return <div className="widget"><Loader message="Loading configuration…"/></div>;
  }

  return (
    <div className="widget">
      <div className="default-line">
        {defaultMinutes
          ? `Global default critical limit: ${defaultMinutes} min (used when an issue has no per-issue limit).`
          : 'No global default critical limit configured in app settings.'}
      </div>

      <div className="rows">
        <div className="row header">
          <span>{'Issue id'}</span>
          <span>{'Critical minutes'}</span>
          <span/>
        </div>
        {rows.map((row, index) => (
          <div className="row" key={index}>
            <Input
              size={Size.M}
              placeholder="DEMO-1"
              value={row.issueId}
              onChange={event => updateRow(index, {issueId: event.target.value})}
            />
            <Input
              size={Size.M}
              type="number"
              placeholder="120"
              value={row.minutes}
              onChange={event => updateRow(index, {minutes: event.target.value})}
            />
            <Button danger onClick={() => removeRow(index)}>{'Remove'}</Button>
          </div>
        ))}
        {rows.length === 0 && <div className="empty">{'No per-issue thresholds yet.'}</div>}
      </div>

      <div className="actions">
        <Button onClick={addRow}>{'Add threshold'}</Button>
        <Button primary onClick={save} loader={saving}>{'Save'}</Button>
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
};

export const App = memo(AppComponent);
