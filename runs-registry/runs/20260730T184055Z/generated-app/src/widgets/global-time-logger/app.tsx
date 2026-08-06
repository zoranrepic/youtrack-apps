/* eslint-disable curly, no-void, react/jsx-wrap-multilines, react/jsx-tag-spacing */
import React, {memo, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

const host = await YTApp.register();
type Issue = {id: string; summary: string};

const AppComponent: React.FunctionComponent = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueId, setIssueId] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const result = await host.fetchYouTrack('issues', {query: {query: 'for: me', fields: 'id,summary', $top: 100}}) as Issue[];
      setIssues(result);
    };
    void load().catch(() => setMessage('Unable to load issues available to you.'));
  }, []);

  const save = async () => {
    setMessage('');
    try {
      const result = await host.fetchApp('time-tracking-global/time-entry', {method: 'POST', body: {issueId, minutes: Number(minutes), description}}) as {status?: string; error?: string};
      setMessage(result.status === 'saved' ? `Saved ${minutes} minutes to ${issueId}.` : result.error || 'Unable to save time.');
      if (result.status === 'saved') setDescription('');
    } catch {
      setMessage('Unable to save time. Verify the selected issue and permissions.');
    }
  };

  return <section className="widget page"><h2>{'Global Time Logger'}</h2><p className="hint">{'Select an issue, enter spent time, and save a work item.'}</p>
    <label>{'Issue'}<select value={issueId} onChange={(event) => setIssueId(event.target.value)}><option value="">{'Select an issue'}</option>{issues.map((issue) => <option key={issue.id} value={issue.id}>{`${issue.id} — ${issue.summary}`}</option>)}</select></label>
    <label>{'Minutes'}<input type="number" min="1" max="1440" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label>
    <label>{'Work description'}<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What did you work on?" /></label>
    <Button primary disabled={!issueId || !minutes} onClick={save}>{'Log time'}</Button>{message && <p className="message">{message}</p>}
  </section>;
};
export const App = memo(AppComponent);
