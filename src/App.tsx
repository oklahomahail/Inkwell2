// src/App.tsx - Fresh clean version with NavContext integration
import React from 'react';

import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';
import { AppProvider } from './context/AppContext';
import { ClaudeProvider } from './context/ClaudeProvider';
import { NavProvider, useNavigation } from './context/NavContext';

// Navigation test component
function NavTestComponent() {
  try {
    const nav = useNavigation();

    return (
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e6ffe6',
          border: '1px solid #4caf50',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>NavContext Test - SUCCESS</h3>

        <div style={{ marginBottom: '15px' }}>
          <p style={{ margin: '5px 0' }}>
            Current View: <strong>{nav.currentView}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Project ID: <strong>{nav.currentProjectId || 'None'}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Chapter ID: <strong>{nav.currentChapterId || 'None'}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Scene ID: <strong>{nav.currentSceneId || 'None'}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Focus Mode: <strong>{nav.focusMode ? 'ON' : 'OFF'}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Can Go Back: <strong>{nav.canGoBack ? 'YES' : 'NO'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => nav.navigateToView('writing')}
          >
            Go to Writing
          </button>

          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => nav.navigateToProject('test-project-123')}
          >
            Test Project Nav
          </button>

          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => nav.toggleFocusMode()}
          >
            Toggle Focus
          </button>

          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: nav.canGoBack ? 1 : 0.5,
            }}
            onClick={() => nav.goBack()}
            disabled={!nav.canGoBack}
          >
            Go Back
          </button>
        </div>

        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Check browser URL and console for navigation events
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#c62828' }}>NavContext Error</h3>
        <p style={{ margin: '5px 0', color: '#d32f2f' }}>Error: {error.message}</p>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
          Make sure NavProvider is properly wrapping this component
        </p>
      </div>
    );
  }
}

function AppShell() {
  console.log('AppShell rendering with NavContext integration...');

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'system-ui',
        maxWidth: '900px',
        margin: '0 auto',
        lineHeight: '1.6',
      }}
    >
      <h1 style={{ color: '#333', marginBottom: '10px' }}>Inkwell - NavContext Integration Test</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Testing unified navigation architecture with URL sync and session persistence
      </p>

      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>System Status</h3>
        <p style={{ margin: '5px 0' }}>Environment: {import.meta.env.MODE}</p>
        <p style={{ margin: '5px 0' }}>React: {React.version}</p>
        <p style={{ margin: '5px 0' }}>Timestamp: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* NavContext interactive test */}
      <NavTestComponent />

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Architecture Features</h3>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Single source of truth navigation state</li>
          <li>Intent-based API with reducer pattern</li>
          <li>URL synchronization (check query params)</li>
          <li>Session persistence (localStorage)</li>
          <li>Browser back/forward integration</li>
          <li>History management with deduplication</li>
        </ul>
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Next Integration Steps</h3>
        <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Test navigation buttons above</li>
          <li>Verify URL changes in browser bar</li>
          <li>Test browser back/forward buttons</li>
          <li>Refresh page to test session persistence</li>
          <li>Add search context integration</li>
          <li>Integrate with existing UI components</li>
        </ol>
      </div>
    </div>
  );
}

export default function App() {
  console.log('App rendering with full provider stack...');

  return (
    <ClaudeProvider>
      <AppProvider>
        <NavProvider>
          <CommandPaletteProvider>
            <AppShell />
          </CommandPaletteProvider>
        </NavProvider>
      </AppProvider>
    </ClaudeProvider>
  );
}
