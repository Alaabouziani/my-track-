import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, RotateCcw } from 'lucide-react'

const Settings = ({ onBack }) => {
    const [appName, setAppName] = useState(() => {
        return localStorage.getItem('appName') || 'BIFA'
    })
    const [distributionName, setDistributionName] = useState(() => {
        return localStorage.getItem('distributionName') || 'SARL distribution alahbab'
    })
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        localStorage.setItem('appName', appName)
        localStorage.setItem('distributionName', distributionName)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('settingsUpdated'))
    }

    const handleReset = () => {
        setAppName('BIFA')
        setDistributionName('SARL distribution alahbab')
        localStorage.setItem('appName', 'BIFA')
        localStorage.setItem('distributionName', 'SARL distribution alahbab')
        window.dispatchEvent(new Event('settingsUpdated'))
    }

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button className="btn" style={{ backgroundColor: 'var(--card-bg)' }} onClick={onBack}>
                    <ArrowLeft size={20} /> Back
                </button>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>⚙️ Settings</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        App Name (Header)
                    </label>
                    <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="Enter app name"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text)',
                            fontSize: '1rem'
                        }}
                    />
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
                        This name appears in the app header (e.g., "BIFA")
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Distribution Name (Receipt)
                    </label>
                    <input
                        type="text"
                        value={distributionName}
                        onChange={(e) => setDistributionName(e.target.value)}
                        placeholder="Enter distribution name"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text)',
                            fontSize: '1rem'
                        }}
                    />
                    <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
                        This name appears on receipts and reports (e.g., "SARL distribution alahbab")
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button 
                        className="btn btn-primary" 
                        style={{ flex: 1 }} 
                        onClick={handleSave}
                    >
                        <Save size={20} /> {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                    <button 
                        className="btn" 
                        style={{ backgroundColor: 'var(--card-bg)' }} 
                        onClick={handleReset}
                    >
                        <RotateCcw size={20} /> Reset
                    </button>
                </div>

                {saved && (
                    <div style={{ 
                        marginTop: '1rem', 
                        padding: '0.75rem', 
                        backgroundColor: '#10b98120', 
                        color: '#10b981',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        ✓ Settings saved successfully!
                    </div>
                )}
            </div>
        </div>
    )
}

export default Settings
