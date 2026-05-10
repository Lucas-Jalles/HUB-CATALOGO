import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

/* 
  SEGURANÇA: Headers HTTP de Produção
  Garanta que o servidor que for hospedar este frontend (ex: Vercel, Netlify, Nginx) possua:
  - Content-Security-Policy: default-src 'self'; connect-src 'self' https://script.google.com;
  - X-Frame-Options: DENY (Previne Clickjacking)
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
  - Referrer-Policy: strict-origin-when-cross-origin
*/

// Proteção contra inspeção e F12
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' || 
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
    (e.ctrlKey && e.key === 'U') // Ctrl+U = Ver código fonte
  ) {
    e.preventDefault();
  }
});

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
