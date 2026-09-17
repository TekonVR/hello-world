import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { StoreProvider } from './state/store';
import { App } from './web/App';
import './web/styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

createRoot(container).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

// Offline support, so a sprint survives a patchy connection on the bus home.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // No service worker: the app still works, it just needs the network.
    });
  });
}
