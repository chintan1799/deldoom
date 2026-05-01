import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// After installing Capacitor (`npm install @capacitor/core @capacitor/app`),
// uncomment the block below to handle Android back button:
//
// import { Capacitor } from '@capacitor/core';
// if (Capacitor.isNativePlatform()) {
//   import('@capacitor/app').then(({ App }) => {
//     App.addListener('backButton', ({ canGoBack }) => {
//       if (canGoBack) window.history.back();
//     });
//   });
// }
