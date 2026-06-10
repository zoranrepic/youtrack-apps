---
to: src/widgets/<%= folderName %>/app.tsx
---
<% if (isEnhancedDX) { %>import React, {memo, useCallback, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import {createApi} from '@/api';

const host = await YTApp.register();
const api = createApi(host);

const AppComponent: React.FunctionComponent = () => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const callApi = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.global.demo.GET();
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="widget">
      <Button primary onClick={callApi} disabled={loading}>{'Call API'}</Button>
      {response && <pre>{response}</pre>}
    </div>
  );
};
<% } else { %>import React, {memo} from 'react';

await YTApp.register();

const AppComponent: React.FunctionComponent = () => {
  return (
    <div className="widget">
      <h2><%= name %></h2>
    </div>
  );
};
<% } %>

export const App = memo(AppComponent);
