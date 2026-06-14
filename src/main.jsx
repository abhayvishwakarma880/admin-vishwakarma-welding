import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { FontProvider } from './context/FontContext.jsx'
import { UserDataProvider } from './context/UserDataContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UserDataProvider>
        <ThemeProvider>
          <FontProvider>
            <App />
          </FontProvider>
        </ThemeProvider>
      </UserDataProvider>
    </AuthProvider>
  </StrictMode>,
)