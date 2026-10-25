import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/forum/400.css'
import '@fontsource-variable/manrope'
import './styles/app.css'
import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
