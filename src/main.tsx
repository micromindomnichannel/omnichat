import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { VerticalProvider } from './state/verticalContext';
import { StoreProvider } from './state/store';
import App from './App';
import './styles/base.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <VerticalProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </VerticalProvider>
    </BrowserRouter>
  </React.StrictMode>
);
