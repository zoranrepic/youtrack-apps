import React, {memo, useCallback, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';

// Register widget in YouTrack. See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

type IssueMatch = {
  idReadable: string;
  summary: string;
};

type LogResult = {
  ok?: boolean;
  issue?: string;
  loggedMinutes?: number;
  totalMinutes?: number;
  error?: string;
};

const AppComponent: React.FunctionComponent = () => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<IssueMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<IssueMatch | null>(null);
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setSearching(true);
    setMessage(null);
    try {
      const url = `issues?fields=idReadable,summary&$top=10&query=${encodeURIComponent(query)}`;
      const result = await host.fetchYouTrack<IssueMatch[]>(url);
      setMatches(result || []);
    } catch (e) {
      setMessage('Issue search failed.');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const submit = useCallback(async () => {
    if (!selected) {
      return;
    }
    const parsedMinutes = parseInt(minutes, 10);
    if (isNaN(parsedMinutes) || parsedMinutes <= 0) {
      setMessage('Enter a positive number of minutes.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await host.fetchApp<LogResult>('time-tracking/log-time', {
        method: 'POST',
        body: {
          issueId: selected.idReadable,
          minutes: parsedMinutes,
          description
        }
      });
      if (result.ok) {
        setMessage(`Logged ${result.loggedMinutes} min to ${result.issue}. Total: ${result.totalMinutes} min.`);
        host.alert(`Time logged to ${result.issue}.`);
        setMinutes('');
        setDescription('');
      } else {
        setMessage(result.error || 'Failed to log time.');
      }
    } catch (e) {
      setMessage('Failed to log time.');
    } finally {
      setSubmitting(false);
    }
  }, [selected, minutes, description]);

  return (
    <div className="widget">
      <h2 className="title">{'Global Time Logger'}</h2>

      <div className="row">
        <Input
          size={Size.L}
          label="Find an issue"
          placeholder="e.g. Unresolved assignee: me"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              void search();
            }
          }}
        />
        <Button onClick={search} loader={searching}>{'Search'}</Button>
      </div>

      {searching && <Loader message="Searching…"/>}

      {!searching && matches.length > 0 && (
        <ul className="matches">
          {matches.map(match => (
            <li key={match.idReadable}>
              <button
                type="button"
                className={selected?.idReadable === match.idReadable ? 'match selected' : 'match'}
                onClick={() => setSelected(match)}
              >
                <span className="match-id">{match.idReadable}</span>
                <span className="match-summary">{match.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="form">
          <div className="selected-line">{`Logging to ${selected.idReadable}: ${selected.summary}`}</div>
          <Input
            size={Size.L}
            type="number"
            label="Spent time (minutes)"
            value={minutes}
            onChange={event => setMinutes(event.target.value)}
          />
          <Input
            size={Size.L}
            label="Work description"
            value={description}
            onChange={event => setDescription(event.target.value)}
          />
          <Button primary onClick={submit} loader={submitting}>{'Log time'}</Button>
        </div>
      )}

      {message && <div className="message">{message}</div>}
    </div>
  );
};

export const App = memo(AppComponent);
