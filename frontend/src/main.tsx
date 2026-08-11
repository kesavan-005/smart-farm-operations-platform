// Application entry point
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// i18n must be imported before App to initialize translations
import './i18n/config';

import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Theme tokens
import './theme/tokens.css';

// Global styles
import './index.css';

// Offline sync manager
import { startSyncManager } from './offline';

// App
import App from './app/App';

// Start background sync
startSyncManager();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
