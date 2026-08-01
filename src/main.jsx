import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Robust fail-safe fallback for localStorage inside restricted iframes
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn('localStorage is blocked or unavailable. Falling back to in-memory state storage.', e);
  const memoryStore = {};
  const mockStorage = {
    getItem: (key) => (key in memoryStore ? memoryStore[key] : null),
    setItem: (key, value) => { memoryStore[key] = String(value); },
    removeItem: (key) => { delete memoryStore[key]; },
    clear: () => { Object.keys(memoryStore).forEach((k) => delete memoryStore[k]); },
    key: (i) => Object.keys(memoryStore)[i] || null,
    length: 0
  };
  Object.defineProperty(mockStorage, 'length', {
    get: () => Object.keys(memoryStore).length
  });
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  } catch (err) {
    console.error('Failed to redefine window.localStorage', err);
  }
}

import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Register PWA Service Worker for PWABuilder / Bubblewrap Android APK compatibility
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('MediRemind PWA Service Worker registered successfully:', reg.scope);
    }).catch((err) => {
      console.warn('PWA Service Worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
