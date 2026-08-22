import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initDeepLink } from './utils/deepLink';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Tell Capgo this version loaded successfully (prevents auto-rollback)
CapacitorUpdater.notifyAppReady();

initDeepLink();
defineCustomElements(window);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
