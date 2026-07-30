import React, {memo, useCallback, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';

const host = await YTApp.register();

type IssueSuggestion = {
  idReadable: string;
  summary: string;
};

type LogResponse = {
  issueId: string;
  summary: string;
  addedMinutes: number;
  totalSpentHours: number;
  error?: string;
};

const AppComponent: React.FunctionComponent = () => {
  const [query, setQuery] = useState('');
  const [issues, setIssues] = useState<IssueSuggestion[]>([]);
  const [selected, setSelected] = useState<IssueSuggestion | null>(null);
  const [minutes, setMinutes] = useState('60');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const result = await host.fetchYouTrack<IssueSuggestion[]>('issues', {
        query: {query, fields: 'idReadable,summary', $top: 20}
      });
      setIssues(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Issue search failed');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const logTime = useCallback(async () => {
    if (!selected) {
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await host.fetchApp<LogResponse>('backend/time-tracking', {
        method: 'POST',
        body: {
          issueId: selected.idReadable,
          minutes: Number(minutes),
          date,
          description
        }
      });
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(`Logged ${result.addedMinutes} min to ${result.issueId}. Total: ${result.totalSpentHours}h.`);
        setDescription('');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log spent time');
    } finally {
      setSaving(false);
    }
  }, [selected, minutes, date, description]);

  return (
    <div className="widget">
      <h2>{'Global Time Logger'}</h2>

      <div className="row">
        <Input
          label="Issue search query"
          placeholder="for example: project: DEMO #Unresolved"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              void search();
            }
          }}
        />
        <Button primary onClick={search} disabled={searching}>{'Search'}</Button>
      </div>

      {searching && <Loader message="Searching issues..."/>}

      {issues.length > 0 && (
        <ul className="issue-list">
          {issues.map(issue => (
            <li key={issue.idReadable}>
              <Button
                text
                active={selected?.idReadable === issue.idReadable}
                onClick={() => setSelected(issue)}
              >{`${issue.idReadable} - ${issue.summary}`}</Button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="form">
          <span className="title">{`Log time to ${selected.idReadable}`}</span>
          <Input label="Spent time (minutes)" type="number" value={minutes} onChange={e => setMinutes(e.target.value)}/>
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)}/>
          <Input label="Work description" value={description} onChange={e => setDescription(e.target.value)}/>
          <Button primary onClick={logTime} loader={saving} disabled={saving || Number(minutes) <= 0}>
            {'Log spent time'}
          </Button>
        </div>
      )}

      {message && <span className="success">{message}</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
};

export const App = memo(AppComponent);
