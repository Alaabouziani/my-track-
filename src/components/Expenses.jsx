import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { ArrowLeft, Save } from 'lucide-react';

const Expenses = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const type = searchParams.get('type') || 'generic';

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const getTitle = () => {
        switch (type) {
            case 'fuel': return 'Truck Fuel';
            case 'repairs': return 'Truck Repairs';
            case 'purchase': return 'Product Purchase';
            case 'allowance': return 'Allowance';
            default: return 'Expense';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount) return;

        setLoading(true);
        try {
            await db.expenses.add({
                type,
                amount: parseFloat(amount),
                description,
                date: new Date().toISOString()
            });
            alert('Expense saved successfully!');
            navigate('/');
        } catch (error) {
            console.error('Failed to save expense:', error);
            alert('Error saving expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button onClick={() => navigate('/')} className="btn" style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Add {getTitle()}</h1>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="input-group">
                    <label>Amount (DA)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        required
                        autoFocus
                    />
                </div>

                <div className="input-group">
                    <label>Description (Optional)</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Details about the expense..."
                        rows="3"
                        style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius)', border: '2px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={loading}
                >
                    <Save size={24} />
                    {loading ? 'Saving...' : 'Save Expense'}
                </button>
            </form>
        </div>
    );
};

export default Expenses;
