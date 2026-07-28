import React, {memo, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

const host = await YTApp.register();

type Configuration = {criticalMinutes: number; warningPercent: number; notificationsEnabled: boolean};

const AppComponent: React.FunctionComponent = () => {
  const [config, setConfig] = useState<Configuration>({criticalMinutes: 480, warningPercent: 80, notificationsEnabled: true});
  const [message, setMessage] = useState('');

  useEffect(() => {
    void (async () => setConfig(await host.fetchApp('time-tracking/critical-config') as Configuration))().catch(() => setMessage('Using default limits.'));
  }, []);

  const save = async () => {
    try {
      await host.fetchApp('time-tracking/critical-config', {method: 'POST', body: config});
      setMessage('Critical thresholds saved. The monitor evaluates issues every minute.');
    } catch {
      setMessage('Thresholds could not be saved.');
    }
  };

  return <div className="widget form">
    <h3>Critical Time Limits</h3>
    <label>Critical minutes <input type="number" min="1" value={config.criticalMinutes} onChange={event => setConfig({...config, criticalMinutes: Number(event.target.value)})} /></label>
    <label>Warning percent <input type="number" min="1" max="100" value={config.warningPercent} onChange={event => setConfig({...config, warningPercent: Number(event.target.value)})} /></label>
    <label><input type="checkbox" checked={config.notificationsEnabled} onChange={event => setConfig({...config, notificationsEnabled: event.target.checked})} /> Email notifications</label>
    <Button primary onClick={() => void save()}>Save thresholds</Button>
    {message && <span>{message}</span>}
  </div>;
};

export const App = memo(AppComponent);
