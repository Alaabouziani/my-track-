import React from 'react';
import { X, Truck, Wrench, ShoppingBag, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleNav = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <div className="sidebar-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-start'
        }} onClick={onClose}>
            <div className="sidebar" style={{
                width: '80%',
                maxWidth: '300px',
                height: '100%',
                backgroundColor: 'var(--card-bg)',
                boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Menu</h2>
                    <button onClick={onClose} style={{ background: 'none', padding: 0 }}><X size={24} /></button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => handleNav('/expenses?type=fuel')}>
                        <Truck size={20} /> Truck Fuel
                    </button>
                    <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => handleNav('/expenses?type=repairs')}>
                        <Wrench size={20} /> Truck Repairs
                    </button>
                    <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => handleNav('/expenses?type=purchase')}>
                        <ShoppingBag size={20} /> Product Purchase
                    </button>
                    <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => handleNav('/expenses?type=allowance')}>
                        <span style={{ fontSize: '1.25rem' }}>💵</span> Take Allowance
                    </button>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center' }}>Version 1.0.0</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
