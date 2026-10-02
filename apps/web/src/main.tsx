import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { installDevHook } from './features/profiles';
import './ui/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element in index.html');

installDevHook();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
