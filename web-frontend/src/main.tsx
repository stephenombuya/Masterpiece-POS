import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from './routes/AppRouter'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter/>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '10px',
          background: '#1a1a2e',
          color: '#fff',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#2e7d32', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#c62828', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>
)
