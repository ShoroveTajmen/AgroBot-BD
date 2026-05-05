/**
 * main.jsx — React Application Entry Point
 *
 * Mounts the React app into the #root DOM element.
 * Wraps the entire app in:
 *   - React.StrictMode    — highlights potential issues during development
 *   - ThemeProvider       — provides global dark/light theme state to all components
 *   - BrowserRouter       — enables client-side routing via React Router
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
