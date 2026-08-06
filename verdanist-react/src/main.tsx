import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initDeepLink } from './utils/deepLink';
import { requestAllPermissions } from './utils/permissions';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

initDeepLink();
requestAllPermissions();
defineCustomElements(window);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
