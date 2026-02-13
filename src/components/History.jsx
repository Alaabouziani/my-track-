import React, { useState, useEffect } from 'react'
import { db, isReady } from '../lib/db'
import { Calendar, Store, DollarSign, ChevronRight, ArrowLeft } from 'lucide-react'
import Receipt from './Receipt'

const History = () => {
    const [salesList, setSalesList] = useState([])
    const [expensesList, setExpensesList] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [viewingReceipt, setViewingReceipt] = useState(false)
    const [selectedSale, setSelectedSale] = useState(null)

    // Initialize with today's date in YYYY-MM-DD format
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        if (!isReady) {
            setError('CRITICAL: Database initialization failed.')
            setLoading(false)
            return
        }
        fetchHistory()
    }, [filterDate]) // Re-fetch when date changes

    const fetchHistory = async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch Sales
            const salesData = await db.sales.toArray()

            // Fetch Expenses
            const expensesData = await db.expenses.toArray()

            // Normalize Expenses
            const normalizedExpenses = expensesData
                .filter(e => e.date.startsWith(filterDate)) // Filter by date
                .map(e => ({
                    id: e.id,
                    type: 'expense',
                    expenseType: e.type,
                    description: e.description,
                    amount: e.amount,
                    created_at: e.date,
                    title: e.type === 'fuel' ? 'Truck Fuel' : e.type === 'repairs' ? 'Truck Repairs' : e.type === 'purchase' ? 'Product Purchase' : e.type === 'allowance' ? 'Allowance' : 'Expense'
                }))
            normalizedExpenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            // Normalize Sales
            const normalizedSales = await Promise.all(salesData
                .filter(s => s.created_at.startsWith(filterDate)) // Filter by date
                .map(async s => {
                    const client = await db.clients.get(s.client_id)
                    return {
                        ...s,
                        type: 'sale',
                        clients: client
                    }
                }))
            normalizedSales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            setSalesList(normalizedSales)
            setExpensesList(normalizedExpenses)
        } catch (err) {
            console.error('History error:', err)
            setError('Database Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadReceipt = async (sale) => {
        setLoading(true)
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

            const formattedSale = {
                sale_id: sale.id,
                date: new Date(sale.created_at).toLocaleDateString(),
                client: sale.clients,
                items: itemsWithNames.map(item => ({
                    id: item.id,
                    name: item.name,
                    sale_qty: item.quantity,
                    unit_price: item.price_at_sale
                })),
                total: sale.total_amount,
                amount_paid: sale.amount_paid
            }

            setSelectedSale(formattedSale)
            setViewingReceipt(true)
        } catch (err) {
            alert('Failed to load receipt details: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        return new Date(dateString).toLocaleDateString(undefined, options)
    }

    if (viewingReceipt) {
        return (
            <div className="container">
                <Receipt
                    sale={selectedSale}
                    onBack={() => setViewingReceipt(false)}
                />
            </div>
        )
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0 }}>History</h1>
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-color)',
                        fontSize: '1rem'
                    }}
                />
            </div>

            {error && (
                <div className="card" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
                    <p>{error}</p>
                    <button className="btn" onClick={fetchHistory} style={{ marginTop: '0.5rem', background: 'var(--danger)', color: 'white' }}>Retry</button>
                </div>
            )}

            {loading ? (
                <p>Loading history...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Sales Section */}
                    <div>
                        <h2 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>📦 Sales</h2>
                        <div className="history-list">
                            {salesList.length === 0 ? (
                                <p style={{ opacity: 0.6 }}>No sales recorded yet.</p>
                            ) : (
                                salesList.map(item => (
                                    <div key={'s-' + item.id} className="card flex-between" style={{ cursor: 'pointer' }} onClick={() => loadReceipt(item)}>
                                        <div style={{ flex: 1 }}>
                                            <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                                <h3 style={{ fontSize: '1.1rem' }}>{item.clients?.name || 'Unknown Client'}</h3>
                                                <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>+{item.total_amount.toFixed(2)} DA</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>
                                                <span>{formatDate(item.created_at)}</span>
                                                {item.amount_paid < item.total_amount && (
                                                    <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>• Balance</span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={20} style={{ opacity: 0.3, marginLeft: '0.5rem' }} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                        <h2 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--danger)', paddingBottom: '0.5rem' }}>💸 Payments (Expenses)</h2>
                        <div className="history-list">
                            {expensesList.length === 0 ? (
                                <p style={{ opacity: 0.6 }}>No expenses recorded yet.</p>
                            ) : (
                                expensesList.map(item => (
                                    <div key={'e-' + item.id} className="card flex-between" style={{ borderLeft: '4px solid var(--danger)' }}>
                                        <div style={{ flex: 1 }}>
                                            <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>{item.title}</h3>
                                                <span style={{ fontWeight: 'bold', color: 'var(--danger)' }}>-{item.amount.toFixed(2)} DA</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', opacity: 0.7, fontSize: '0.85rem' }}>
                                                <span>{formatDate(item.created_at)}</span>
                                                {item.description && <span style={{ fontStyle: 'italic' }}>{item.description}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default History
