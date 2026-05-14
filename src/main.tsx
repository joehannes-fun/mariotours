import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './contexts/I18nContext';
import { BrandProvider } from './contexts/BrandContext';
import { BlogProvider } from './contexts/BlogContext';
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <BrandProvider>
        <BlogProvider>
          <App />
        </BlogProvider>
      </BrandProvider>
    </I18nProvider>
  </React.StrictMode>
);