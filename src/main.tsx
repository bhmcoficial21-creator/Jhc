import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { DEMO } from './lib/supabase'
import App from './App'
import { AuthProvider } from './lib/auth'
import './index.css'

if (!DEMO) import('virtual:pwa-register').then((m) => m.registerSW({ immediate: true }))
const Router = DEMO ? HashRouter : BrowserRouter
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Router><AuthProvider><App /></AuthProvider></Router></React.StrictMode>,
)
