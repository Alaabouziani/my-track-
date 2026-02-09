import React, { useState, useEffect } from 'react'
import { db, isReady } from '../lib/db'
import { Plus, Store, MapPin, Trash2, ArrowLeft, DollarSign, History, CheckCircle } from 'lucide-react'
import Receipt from './Receipt'

const Clients = () => {
    const [clients, setClients] = useState([])
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isAdding, setIsAdding] = useState(false)
    const [newClient, setNewClient] = useState({ name: '', address: '' })

    // Account View State
    const [viewingAccount, setViewingAccount] = useState(null)
    const [loadingReceipt, setLoadingReceipt] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState(null)

    useEffect(() => {
        if (!isReady) {
            setError('CRITICAL: Database initialization failed.')
            setLoading(false)
            return
        }
        fetchClients()
    }, [])

    const fetchClients = async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch Clients
            const clientsData = await db.clients.orderBy('name').toArray()

            // Fetch all Sales to calculate balances
            const salesData = await db.sales.toArray()

            setSales(salesData || [])
            setClients(clientsData || [])
        } catch (err) {
            console.error('Fetch error:', err)
            setError('Database Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const calculateBalance = (clientId) => {
        const clientSales = sales.filter(s => s.client_id === clientId)
        const total = clientSales.reduce((sum, s) => sum + s.total_amount, 0)
        const paid = clientSales.reduce((sum, s) => sum + (s.amount_paid || 0), 0)
        return total - paid
    }

    const handleAddClient = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const id = await db.clients.add(newClient)
            const addedClient = { ...newClient, id }
            setClients([...clients, addedClient])
            setNewClient({ name: '', address: '' })
            setIsAdding(false)
        } catch (err) {
            alert('Failed to save store: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteClient = async (id) => {
        if (window.confirm('Delete store from database?')) {
            try {
                await db.clients.delete(id)
                setClients(clients.filter(c => c.id !== id))
            } catch (err) {
                alert('Failed to delete store: ' + err.message)
            }
        }
    }

    const handleRecordPayment = async (saleId, currentPaid, totalAmount) => {
        const amount = prompt(`Enter payment amount (Total Owed: ${((totalAmount || 0) - (currentPaid || 0)).toFixed(2)} DA):`)
        if (amount === null || amount === '') return

        const payment = parseFloat(amount)
        if (isNaN(payment)) return

        setLoading(true)
        try {
            await db.sales.update(saleId, { amount_paid: currentPaid + payment })

            // Refresh local state
            fetchClients()
            // Also refresh sales list for account view if needed
            if (viewingAccount) {
                const data = await db.sales
                    .where('client_id')
                    .equals(viewingAccount.id)
                    .reverse()
                    .sortBy('created_at')
                setAccountSales(data || [])
            }
        } catch (err) {
            alert('Failed to record payment: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    // State for account-specific sales
    const [accountSales, setAccountSales] = useState([])

    const openAccount = async (client) => {
        setLoading(true)
        setViewingAccount(client)
        try {
            const data = await db.sales
                .where('client_id')
                .equals(client.id)
                .reverse()
                .sortBy('created_at')
            setAccountSales(data || [])
        } catch (err) {
            alert('Error loading account history.')
        } finally {
            setLoading(false)
        }
    }

    const loadReceipt = async (sale) => {
        setLoadingReceipt(true)
        try {
            // Fetch sale items
            const items = await db.sale_items
                .where('sale_id')
                .equals(sale.id)
                .toArray()

            // Fetch product names for each item
            const itemsWithNames = await Promise.all(items.map(async item => {
                const product = await db.products.get(item.product_id)
                return {
                    ...item,
                    name: product ? product.name : 'Unknown Product'
                }
            }))

            setSelectedReceipt({
                sale_id: sale.id,
                date: new Date(sale.created_at).toLocaleDateString(),
                client: viewingAccount,
                items: itemsWithNames.map(item => ({
                    id: item.id,
                    name: item.name,
                    sale_qty: item.quantity,
                    unit_price: item.price_at_sale
                })),
                total: sale.total_amount,
                amount_paid: sale.amount_paid
            })
        } catch (err) {
            console.error('Receipt error:', err)
            alert('Failed to load receipt.')
        } finally {
            setLoadingReceipt(false)
        }
    }

    if (selectedReceipt) {
        return (
            <div className="container">
                <Receipt sale={selectedReceipt} onBack={() => setSelectedReceipt(null)} />
            </div>
        )
    }

    if (viewingAccount) {
        return (
            <div className="container">
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <button className="btn" onClick={() => setViewingAccount(null)}>
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h2 style={{ margin: 0 }}>{viewingAccount.name}</h2>
                </div>

                <div className="card" style={{ background: 'var(--primary)', color: 'white', textAlign: 'center' }}>
                    <p style={{ opacity: 0.9 }}>Total Outstanding Balance</p>
                    <h2 style={{ fontSize: '2.5rem' }}>{(calculateBalance(viewingAccount.id) || 0).toFixed(2)} DA</h2>
                </div>

                <h3 style={{ margin: '1.5rem 0 1rem' }}>Transaction History</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {accountSales.map(sale => (
                        <div key={sale.id} className="card">
                            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ opacity: 0.7 }}>{new Date(sale.created_at).toLocaleDateString()}</span>
                                <span style={{ fontWeight: 'bold' }}>{(sale.total_amount || 0).toFixed(2)} DA</span>
                            </div>
                            <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                                <div style={{ opacity: 0.8 }}>
                                    Paid: {(sale.amount_paid || 0).toFixed(2)} DA |
                                    <span style={{ color: ((sale.total_amount || 0) - (sale.amount_paid || 0)) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold', marginLeft: '5px' }}>
                                        Due: {((sale.total_amount || 0) - (sale.amount_paid || 0)).toFixed(2)} DA
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => loadReceipt(sale)}>
                                        Receipt
                                    </button>
                                    {(sale.total_amount - sale.amount_paid) > 0 && (
                                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleRecordPayment(sale.id, sale.amount_paid, sale.total_amount)}>
                                            Pay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem' }}>🏪 Store Database</h1>
                <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={20} /> Store
                </button>
            </div>

            {isAdding && (
                <form className="card" onSubmit={handleAddClient}>
                    <div className="input-group">
                        <label>Store Name</label>
                        <input
                            type="text"
                            required
                            value={newClient.name}
                            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                            placeholder="e.g. Sunrise Grocery"
                        />
                    </div>
                    <div className="input-group">
                        <label>Address</label>
                        <input
                            type="text"
                            required
                            value={newClient.address}
                            onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                            placeholder="123 Delivery Lane"
                        />
                    </div>
                    <div className="flex-between" style={{ gap: '1rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--border-color)' }} onClick={() => setIsAdding(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Store</button>
                    </div>
                </form>
            )}

            {error && (
                <div className="card" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
                    <p>{error}</p>
                    <button className="btn" onClick={fetchClients} style={{ marginTop: '0.5rem', background: 'var(--danger)', color: 'white' }}>Retry</button>
                </div>
            )}

            {loading ? (
                <p>Loading stores...</p>
            ) : (
                <div className="client-list">
                    {clients.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', opacity: 0.6 }}>
                            <Store size={48} style={{ marginBottom: '1rem' }} />
                            <p>No stores saved yet.</p>
                        </div>
                    ) : (
                        clients.map(client => {
                            const balance = calculateBalance(client.id)
                            return (
                                <div key={client.id} className="card">
                                    <div className="flex-between">
                                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openAccount(client)}>
                                            <h3 style={{ fontSize: '1.1rem' }}>{client.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.7, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                <MapPin size={14} />
                                                <span>{client.address}</span>
                                            </div>
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '5px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                backgroundColor: balance > 0 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                                color: balance > 0 ? 'var(--danger)' : 'var(--success)'
                                            }}>
                                                {balance > 0 ? `Owed: ${(balance || 0).toFixed(2)} DA` : 'No Balance'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn" style={{ padding: '0.5rem', background: 'transparent' }} onClick={() => openAccount(client)}>
                                                <History size={20} />
                                            </button>
                                            <button className="btn" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--danger)' }} onClick={() => deleteClient(client.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}

export default Clients
