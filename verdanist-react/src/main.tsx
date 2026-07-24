import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initDeepLink } from './utils/deepLink';
import { requestAllPermissions } from './utils/permissions';

initDeepLink();
requestAllPermissions();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
