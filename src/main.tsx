// src/main.tsx - Remove duplicate AppProvider
import React from 'react';
import ReactDOM from 'react-dom/client';

import { EditorProvider } from '@/context/EditorContext';
import { ToastProvider } from '@/context/ToastContext';

import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <EditorProvider>
        <App />
      </EditorProvider>
    </ToastProvider>
  </React.StrictMode>,
);
