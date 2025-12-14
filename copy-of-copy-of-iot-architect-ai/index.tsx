import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Define the global mermaid object on window to avoid TS errors
declare global {
    interface Window {
        mermaid: any;
    }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
