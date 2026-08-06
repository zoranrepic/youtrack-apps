import React, {memo, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

const host = await YTApp.register();

const AppComponent: React.FunctionComponent = () => {
  const [issueId, setIssueId] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [description, setDescription] = useState('Work logged from Issue Operations Suite');
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('Saving time entry…');
    try {
      const result = await host.fetchApp('time-tracking/time-log', {method: 'POST', body: {issueId, minutes: Number(minutes), description}}) as {issueId: string; minutes: number};
      setMessage(`Saved ${result.minutes} minutes to ${result.issueId}.`);
    } catch {
      setMessage('Time entry could not be saved. Check the issue ID and your permissions.');
    }
  };

  return <div className="widget form">
    <h2>Global Time Logger</h2>
    <label>Issue ID <input value={issueId} onChange={event => setIssueId(event.target.value)} placeholder="DEMO-1" /></label>
    <label>Minutes <input type="number" min="1" value={minutes} onChange={event => setMinutes(event.target.value)} /></label>
    <label>Description <input value={description} onChange={event => setDescription(event.target.value)} /></label>
    <Button primary onClick={() => void submit()}>Log time</Button>
    {message && <span>{message}</span>}
  </div>;
};

export const App = memo(AppComponent);
