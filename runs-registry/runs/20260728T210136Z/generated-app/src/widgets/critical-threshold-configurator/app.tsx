import React, {memo, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
const host = await YTApp.register();
const AppComponent: React.FunctionComponent = () => {
  const [issueId, setIssueId] = useState(''); const [limitMinutes, setLimitMinutes] = useState('480'); const [result, setResult] = useState('');
  const save = async () => { try { const res: {ok: boolean; message?: string} = await host.fetchApp('time-tracking-service/time-entries', {method: 'POST', query: {issueId, limitMinutes, configureOnly: 'true'}}); setResult(res.ok ? `Critical threshold saved for ${issueId}: ${limitMinutes} minutes.` : (res.message || 'Unable to save threshold.')); } catch { setResult('Unable to save threshold.'); } };
  return <div className="widget logger"><h2>Critical Threshold Configurator</h2><label>Issue ID<input value={issueId} onChange={e => setIssueId(e.target.value)} placeholder="DEMO-1" /></label><label>Critical limit (minutes)<input type="number" min="1" value={limitMinutes} onChange={e => setLimitMinutes(e.target.value)} /></label><Button primary onClick={save}>Save critical threshold</Button>{result && <div className="result">{result}</div>}<small>The monitor evaluates configured issues every minute and sends alerts when the limit is reached.</small></div>;
};
export const App = memo(AppComponent);
