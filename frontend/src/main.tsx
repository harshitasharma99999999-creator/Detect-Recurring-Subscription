import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigGuard } from './components/ConfigGuard';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigGuard>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigGuard>
    </ErrorBoundary>
  </React.StrictMode>
);
