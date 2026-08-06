import React, {memo, useCallback, useEffect, useRef, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Text from '@jetbrains/ring-ui-built/components/text/text';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_LIMIT = 20;

interface IssueSuggestion {
  id: string;
  idReadable: string;
  summary: string | null;
  resolved: number | null;
  project: {shortName: string} | null;
}

interface LogTimeResponse {
  issueId: string;
  summary: string;
  loggedPresentation: string;
  totalSpentPresentation: string;
  limitPresentation: string;
  limitSource: string;
  status: string;
  error?: string;
}

const AppComponent: React.FunctionComponent = () => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<IssueSuggestion[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [selected, setSelected] = useState<IssueSuggestion | null>(null);

  const [duration, setDuration] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [workType, setWorkType] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<LogTimeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const trimmed = query.trim();
    window.clearTimeout(timerRef.current);
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    timerRef.current = window.setTimeout(() => {
      host.fetchYouTrack<IssueSuggestion[]>('issues', {
        query: {
          query: trimmed,
          fields: 'id,idReadable,summary,resolved,project(shortName)',
          $top: SEARCH_LIMIT
        }
      }).then(issues => {
        setSuggestions(issues ?? []);
        setSearching(false);
      }).catch((e: Error) => {
        setError(e.message || 'The issue search failed.');
        setSearching(false);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [query]);

  const selectIssue = useCallback((issue: IssueSuggestion) => {
    setSelected(issue);
    setSuggestions([]);
    setQuery('');
    setResult(null);
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setResult(null);
    setError(null);
  }, []);

  const submit = useCallback(() => {
    if (!selected || !duration.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);
    const body: Record<string, unknown> = {
      issueId: selected.idReadable,
      duration: duration.trim()
    };
    if (description.trim()) {
      body.description = description.trim();
    }
    if (workType.trim()) {
      body.workType = workType.trim();
    }
    if (date) {
      const parsed = Date.parse(`${date}T12:00:00`);
      if (!isNaN(parsed)) {
        body.date = parsed;
      }
    }
    host.fetchApp<LogTimeResponse>('global-backend/log-time', {method: 'POST', body})
      .then(response => {
        setResult(response);
        setDuration('');
        setDescription('');
        setSubmitting(false);
      })
      .catch((e: Error) => {
        setError(e.message || 'The spent time could not be logged.');
        setSubmitting(false);
      });
  }, [selected, duration, description, workType, date]);

  return (
    <div className="widget">
      <Text bold size={Text.Size.L}>{'Log spent time'}</Text>

      {!selected && (
        <div className="logger-search">
          <Input
            label="Find an issue"
            placeholder="Issue ID or search query, for example: project: DEMO #Unresolved"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          {searching && <LoaderInline/>}
          {!searching && query.trim().length >= 2 && suggestions.length === 0 && (
            <Text info>{'No issues match this query.'}</Text>
          )}
          <ul className="logger-suggestions">
            {suggestions.map(issue => (
              <li key={issue.id}>
                <Button text onClick={() => selectIssue(issue)}>
                  {`${issue.idReadable} · ${issue.summary ?? ''}`}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div className="logger-form">
          <div className="logger-selected">
            <Text bold>{selected.idReadable}</Text>
            <Text>{selected.summary ?? ''}</Text>
            <Button text onClick={clearSelection}>{'Change issue'}</Button>
          </div>

          <Input
            label="Spent time"
            placeholder="For example: 90, 1h 30m, 2d"
            value={duration}
            onChange={event => setDuration(event.target.value)}
          />
          <Input
            label="Work description"
            placeholder="Optional"
            value={description}
            onChange={event => setDescription(event.target.value)}
          />
          <Input
            label="Work type"
            placeholder="Optional, must exist in the project"
            value={workType}
            onChange={event => setWorkType(event.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
          />

          <div className="logger-actions">
            <Button primary loader={submitting} disabled={submitting || !duration.trim()} onClick={submit}>
              {'Log time'}
            </Button>
          </div>
        </div>
      )}

      {error && <Text info>{`Error: ${error}`}</Text>}

      {result && (
        <div className="logger-result">
          <Text bold>{`${result.loggedPresentation} logged on ${result.issueId}`}</Text>
          <Text info>
            {`Total spent: ${result.totalSpentPresentation} of the ${result.limitPresentation} ` +
              `critical limit (${result.limitSource}). Current status: ${result.status}.`}
          </Text>
        </div>
      )}
    </div>
  );
};


export const App = memo(AppComponent);
