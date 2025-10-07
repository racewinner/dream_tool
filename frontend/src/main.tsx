import React from 'react';
import ReactDOM from 'react-dom/client';
import MainApp from './MainApp';
import './index.css';

console.log('main.tsx executing');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find the root element');
  throw new Error('Failed to find the root element');
}

console.log('Root element found:', rootElement);

try {
  console.log('About to create root');
  const root = ReactDOM.createRoot(rootElement);
  console.log('Root created, about to render');
  
  root.render(
    <React.StrictMode>
      <MainApp />
    </React.StrictMode>
  );
  
  console.log('Render called');
} catch (error) {
  console.error('Error during rendering:', error);
}
