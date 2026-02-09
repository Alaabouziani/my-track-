import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Users, ShoppingCart, History as HistoryIcon, Sun, Moon, Settings as SettingsIcon } from 'lucide-react'
import Home from './components/Home'
import Inventory from './components/Inventory'
import Clients from './components/Clients'
import SalesInterface from './components/SalesInterface'
import History from './components/History'
import Settings from './components/Settings'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('appName') || 'BIFA'
  })
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setAppName(localStorage.getItem('appName') || 'BIFA')
    }
    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate)
  }, [])

  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />
  }

  return (
    <Router>
      <div className="app-wrapper">
        <header className="no-print" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowSettings(true)}>📦 {appName}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowSettings(true)}
              className="btn"
              style={{ padding: '0.5rem' }}
              title="Settings"
            >
              <SettingsIcon size={20} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn"
              style={{ padding: '0.5rem' }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/sales" element={<SalesInterface />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        <nav className="bottom-nav no-print">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={24} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package size={24} />
            <span>Products</span>
          </NavLink>
          <NavLink to="/sales" className={({ isActive }) => `nav-item active`} style={{
            marginTop: '-2rem',
            background: 'var(--primary)',
            color: 'white',
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
            opacity: 1
          }}>
            <ShoppingCart size={28} />
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={24} />
            <span>Stores</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <HistoryIcon size={24} />
            <span>History</span>
          </NavLink>
        </nav>
      </div>
    </Router>
  )
}

export default App
