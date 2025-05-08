import React from 'react';
import ReactDOM from 'react-dom/client';
import DictionaryPage from './dictionaryPage';
import '../popup/style.css';

const rootElement = document.getElementById('root-dictionary');
if (rootElement) {
  console.log('Dictionary page React root found, initializing...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <DictionaryPage />
    </React.StrictMode>
  );
} else {
  console.error('Dictionary root element (root-dictionary) not found! Check your dictionary.html file.');
}