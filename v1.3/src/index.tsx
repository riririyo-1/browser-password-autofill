import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './popup/Popup';
import './popup/style.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('React root element found, initializing app...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found! Check your index.html file.');
}