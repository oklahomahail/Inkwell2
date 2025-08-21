// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';

import App from './App';
import './index.css'; // if you use Tailwind/global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ToastProvider>
  </React.StrictMode>,
);
