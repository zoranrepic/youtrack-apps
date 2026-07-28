import React, {memo, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
const host = await YTApp.register();
const AppComponent: React.FunctionComponent = () => {
  const [issueId, setIssueId] = useState(''); const [minutes, setMinutes] = useState('30'); const [description, setDescription] = useState(''); const [result, setResult] = useState('');
  const submit = async () => { try { const res: {ok: boolean; message?: string} = await host.fetchApp('time-tracking-service/time-entries', {method: 'POST', query: {issueId, minutes, description}}); setResult(res.ok ? `Logged ${minutes} minutes to ${issueId}.` : (res.message || 'Time entry was rejected.')); } catch { setResult('Unable to save the time entry.'); } };
  return <div className="widget logger"><h2>Global Time Logger</h2><label>Issue ID<input value={issueId} onChange={e => setIssueId(e.target.value)} placeholder="DEMO-1" /></label><label>Minutes<input type="number" min="1" value={minutes} onChange={e => setMinutes(e.target.value)} /></label><label>Description<input value={description} onChange={e => setDescription(e.target.value)} placeholder="What was done?" /></label><Button primary onClick={submit}>Log spent time</Button>{result && <div className="result">{result}</div>}</div>;
};
export const App = memo(AppComponent);
