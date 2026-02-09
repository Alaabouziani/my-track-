import React, { useState, useEffect } from 'react'
import { db, isReady } from '../lib/db'
import { Calendar, Store, DollarSign, ChevronRight, ArrowLeft } from 'lucide-react'
import Receipt from './Receipt'

const History = () => {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [viewingReceipt, setViewingReceipt] = useState(false)
    const [selectedSale, setSelectedSale] = useState(null)

    useEffect(() => {
        if (!isReady) {
            setError('CRITICAL: Database initialization failed.')
            setLoading(false)
            return
        }
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        setLoading(true)
        setError(null)
        try {
            const salesData = await db.sales
                .reverse()
                .sortBy('created_at')

            // Manually "join" with clients
            const salesWithClients = await Promise.all(salesData.map(async sale => {
                const client = await db.clients.get(sale.client_id)
                return { ...sale, clients: client }
            }))

            setSales(salesWithClients)
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
            <h1 style={{ marginBottom: '1.5rem' }}>📦 Sales History</h1>

            {error && (
                <div className="card" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
                    <p>{error}</p>
                    <button className="btn" onClick={fetchHistory} style={{ marginTop: '0.5rem', background: 'var(--danger)', color: 'white' }}>Retry</button>
                </div>
            )}

            {loading ? (
                <p>Loading history...</p>
            ) : (
                <div className="history-list">
                    {sales.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', opacity: 0.6 }}>
                            <Calendar size={48} style={{ marginBottom: '1rem' }} />
                            <p>No sales recorded yet.</p>
                        </div>
                    ) : (
                        sales.map(sale => (
                            <div key={sale.id} className="card flex-between" style={{ cursor: 'pointer' }} onClick={() => loadReceipt(sale)}>
                                <div style={{ flex: 1 }}>
                                    <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                        <h3 style={{ fontSize: '1.1rem' }}>{sale.clients?.name}</h3>
                                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{sale.total_amount.toFixed(2)} DA</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>
                                        <span>{formatDate(sale.created_at)}</span>
                                        {sale.amount_paid < sale.total_amount && (
                                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>• Balance Due</span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={20} style={{ opacity: 0.3, marginLeft: '0.5rem' }} />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default History
