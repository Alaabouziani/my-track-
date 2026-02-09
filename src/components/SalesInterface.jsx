import React, { useState, useEffect } from 'react'
import { db, isReady } from '../lib/db'
import { ShoppingCart, Send, Plus, Minus, X, CheckCircle, Camera } from 'lucide-react'
import Receipt from './Receipt'
import Scanner from './Scanner'

const SalesInterface = () => {
    const [clients, setClients] = useState([])
    const [products, setProducts] = useState([])
    const [selectedClient, setSelectedClient] = useState('')
    const [cart, setCart] = useState([])
    const [showReceipt, setShowReceipt] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [lastSale, setLastSale] = useState(null)
    const [paidAmount, setPaidAmount] = useState('')
    const [storeSearch, setStoreSearch] = useState('')
    const [productSearch, setProductSearch] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isReady) {
            alert('CRITICAL: Database initialization failed.')
            return
        }
        fetchData()
    }, [])

    const fetchData = async () => {
        const clientsData = await db.clients.toArray()
        const productsData = await db.products.where('quantity').above(0).toArray()
        if (clientsData) setClients(clientsData)
        if (productsData) setProducts(productsData)
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        c.address.toLowerCase().includes(storeSearch.toLowerCase())
    )

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    )

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id)
        if (existing) {
            if (existing.sale_qty < product.quantity) {
                setCart(cart.map(item => item.id === product.id ? { ...item, sale_qty: item.sale_qty + 1 } : item))
            }
        } else {
            setCart([...cart, { ...product, sale_qty: 1 }])
        }
    }

    const updateQty = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.sale_qty + delta)
                const product = products.find(p => p.id === id)
                if (newQty <= product.quantity) return { ...item, sale_qty: newQty }
            }
            return item
        }).filter(item => item.sale_qty > 0))
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.unit_price * item.sale_qty), 0)

    const confirmSale = async () => {
        if (!selectedClient || cart.length === 0) return
        setLoading(true)

        try {
            const finalPaidAmount = parseFloat(paidAmount) || 0

            // Dexie Transaction for atomic updates
            const saleId = await db.transaction('rw', db.sales, db.sale_items, db.products, async () => {
                // 1. Create Sale record
                const sId = await db.sales.add({
                    client_id: parseInt(selectedClient),
                    total_amount: totalAmount,
                    amount_paid: finalPaidAmount,
                    created_at: new Date().toISOString()
                })

                // 2. Create Sale Items and Update Inventory
                for (const item of cart) {
                    // Record sale item
                    await db.sale_items.add({
                        sale_id: sId,
                        product_id: item.id,
                        quantity: Number(item.sale_qty || 0),
                        price_at_sale: Number(item.unit_price || 0),
                        purchase_price_at_sale: Number(item.purchase_price || 0)
                    })

                    // Subtract from inventory
                    const product = await db.products.get(item.id)
                    await db.products.update(item.id, {
                        quantity: product.quantity - item.sale_qty
                    })
                }
                return sId
            })

            setLastSale({
                sale_id: saleId,
                date: new Date().toLocaleDateString(),
                client: clients.find(c => c.id === parseInt(selectedClient)),
                items: cart,
                total: totalAmount,
                amount_paid: finalPaidAmount
            })

            setCart([])
            setSelectedClient('')
            setPaidAmount('')
            setStoreSearch('')
            setProductSearch('')
            setShowReceipt(true)
            fetchData() // Refresh inventory
        } catch (error) {
            console.error('Sale failed:', error)
            alert('Error recording sale: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (showReceipt) {
        return (
            <div className="container">
                <Receipt sale={lastSale} onBack={() => setShowReceipt(false)} />
            </div>
        )
    }

    return (
        <div className="container">
            {showScanner && (
                <Scanner
                    onClose={() => setShowScanner(false)}
                    onScan={(code) => {
                        console.log('Scanned:', code)
                        setShowScanner(false)
                    }}
                />
            )}
            <h1 style={{ marginBottom: '1.5rem' }}>📦 New Delivery</h1>

            <div className="card">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Store</label>
                <input
                    type="text"
                    placeholder="🔍 Search store..."
                    value={storeSearch}
                    onChange={e => setStoreSearch(e.target.value)}
                    style={{ marginBottom: '0.75rem', padding: '0.75rem' }}
                />
                <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ padding: '1rem', fontSize: '1.1rem' }}>
                    <option value="">-- {storeSearch ? `Matching Stores (${filteredClients.length})` : 'Choose Store'} --</option>
                    {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Select Products</h3>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={() => setShowScanner(true)}
                    >
                        <Camera size={18} /> Scan
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="🔍 Search products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ marginBottom: '1rem', padding: '0.75rem' }}
                />

                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gap: '0.5rem' }}>
                    {filteredProducts.map(p => (
                        <button
                            key={p.id}
                            className="btn"
                            style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', justifyContent: 'flex-start' }}
                            onClick={() => addToCart(p)}
                        >
                            <div style={{ textAlign: 'left', flex: 1 }}>
                                <div>{p.name}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Stock: {p.quantity} | {p.unit_price} DA</div>
                            </div>
                            <Plus size={18} />
                        </button>
                    ))}
                    {filteredProducts.length === 0 && (
                        <p style={{ textAlign: 'center', opacity: 0.5, padding: '1rem' }}>No matching products found.</p>
                    )}
                </div>
            </div>

            {cart.length > 0 && (
                <div className="card" style={{ border: '2px solid var(--primary)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Cart Summary</h3>
                    {cart.map(item => (
                        <div key={item.id} className="flex-between" style={{ marginBottom: '0.75rem' }}>
                            <div style={{ flex: 1 }}>{item.name}</div>
                            <div className="flex-between" style={{ gap: '0.5rem' }}>
                                <button className="btn" style={{ padding: '0.5rem' }} onClick={() => updateQty(item.id, -1)}><Minus size={16} /></button>
                                <span style={{ fontWeight: 'bold', minWidth: '2ch', textAlign: 'center' }}>{item.sale_qty}</span>
                                <button className="btn" style={{ padding: '0.5rem' }} onClick={() => updateQty(item.id, 1)}><Plus size={16} /></button>
                            </div>
                            <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 'bold' }}>
                                {(item.unit_price * item.sale_qty).toFixed(2)} DA
                            </div>
                        </div>
                    ))}
                    <div className="flex-between" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid var(--border-color)', fontSize: '1.25rem' }}>
                        <strong>Total</strong>
                        <strong style={{ color: 'var(--primary)' }}>{totalAmount.toFixed(2)} DA</strong>
                    </div>

                    <div className="input-group" style={{ marginTop: '1.5rem' }}>
                        <label style={{ fontWeight: 'bold' }}>Amount Paid (DA)</label>
                        <input
                            type="number"
                            placeholder="How much did they pay?"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            style={{ padding: '0.75rem', fontSize: '1.1rem' }}
                        />
                    </div>

                    <button
                        className="btn btn-primary btn-large"
                        style={{ marginTop: '1.5rem' }}
                        disabled={loading}
                        onClick={confirmSale}
                    >
                        {loading ? 'Processing...' : <><CheckCircle size={24} /> Confirm Sale</>}
                    </button>
                </div>
            )}
        </div>
    )
}

export default SalesInterface
