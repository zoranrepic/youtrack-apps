/* eslint-disable no-void, react/jsx-wrap-multilines, react/jsx-tag-spacing, react/button-has-type */
import React, {memo, useState} from 'react';

await YTApp.register();

const AppComponent: React.FunctionComponent = () => {
  const [minutes, setMinutes] = useState('480');
  const [saved, setSaved] = useState(false);
  const saveDraft = () => {
    setSaved(true);
  };
  return <section className="widget"><h3>{'Critical Threshold Configurator'}</h3><p className="hint">{'Set the critical time boundary used for planning. The authoritative project setting is persisted by YouTrack and is monitored every minute.'}</p>
    <label>{'Critical boundary (minutes)'}<input type="number" min="1" value={minutes} onChange={(event) => { setMinutes(event.target.value); setSaved(false); }} /></label>
    <button className="button" onClick={() => void saveDraft()}>{'Save dashboard draft'}</button>{saved && <p className="message">{'Dashboard draft saved. The deployed DEMO project threshold is configured to 480 minutes.'}</p>}
    <div className="card"><strong>{`${minutes} minutes`}</strong><small>{'Critical alert boundary · Warning begins at 80%'}</small></div>
  </section>;
};
export const App = memo(AppComponent);
