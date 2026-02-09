import React, { useState, useEffect } from 'react'
import { db, isReady } from '../lib/db'
import { Plus, Edit2, Trash2, Package, Printer } from 'lucide-react'
import StockReport from './StockReport'

const Inventory = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isAdding, setIsAdding] = useState(false)
    const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit_price: 0, purchase_price: 0 })
    const [editingProduct, setEditingProduct] = useState(null)
    const [showReport, setShowReport] = useState(false)

    useEffect(() => {
        if (!isReady) {
            setError('CRITICAL: Database initialization failed.')
            setLoading(false)
            return
        }
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await db.products.orderBy('name').toArray()
            setProducts(data)
        } catch (err) {
            console.error('Fetch error:', err)
            setError('Database Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const id = await db.products.add(newProduct)
            const addedProduct = { ...newProduct, id }
            setProducts([...products, addedProduct])
            setNewProduct({ name: '', quantity: 0, unit_price: 0, purchase_price: 0 })
            setIsAdding(false)
        } catch (err) {
            alert('Failed to save product: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProduct = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await db.products.update(editingProduct.id, {
                name: editingProduct.name,
                quantity: editingProduct.quantity,
                unit_price: editingProduct.unit_price,
                purchase_price: editingProduct.purchase_price
            })

            setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p))
            setEditingProduct(null)
        } catch (err) {
            alert('Failed to update product: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const deleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await db.products.delete(id)
                setProducts(products.filter(p => p.id !== id))
            } catch (err) {
                alert('Failed to delete product: ' + err.message)
            }
        }
    }

    if (showReport) {
        return <StockReport products={products} onBack={() => setShowReport(false)} />
    }

    return (
        <div className="container">
            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem' }}>📦 Product Inventory</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: 'var(--card-bg)' }} onClick={() => setShowReport(true)}>
                        <Printer size={18} /> Print Stock
                    </button>
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => {
                        setIsAdding(!isAdding)
                        setEditingProduct(null)
                    }}>
                        <Plus size={18} /> Add
                    </button>
                </div>
            </div>

            {isAdding && (
                <form className="card" onSubmit={handleAddProduct}>
                    <h3 style={{ marginBottom: '1rem' }}>Add New Product</h3>
                    <div className="input-group">
                        <label>Product Name</label>
                        <input
                            type="text"
                            required
                            value={newProduct.name}
                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="e.g. Fresh Milk 1L"
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Purchase Price (DA)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={newProduct.purchase_price}
                                onChange={e => setNewProduct({ ...newProduct, purchase_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Selling Price (DA)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={newProduct.unit_price}
                                onChange={e => setNewProduct({ ...newProduct, unit_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Initial Stock Quantity</label>
                        <input
                            type="number"
                            required
                            value={newProduct.quantity}
                            onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="flex-between" style={{ gap: '1rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--border-color)' }} onClick={() => setIsAdding(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Product</button>
                    </div>
                </form>
            )}

            {editingProduct && (
                <form className="card" onSubmit={handleUpdateProduct} style={{ border: '2px solid var(--primary)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Edit Product</h3>
                    <div className="input-group">
                        <label>Product Name</label>
                        <input
                            type="text"
                            required
                            value={editingProduct.name}
                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Purchase Price (DA)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={editingProduct.purchase_price || 0}
                                onChange={e => setEditingProduct({ ...editingProduct, purchase_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Selling Price (DA)</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={editingProduct.unit_price || 0}
                                onChange={e => setEditingProduct({ ...editingProduct, unit_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Current Stock Quantity</label>
                        <input
                            type="number"
                            required
                            value={editingProduct.quantity}
                            onChange={e => setEditingProduct({ ...editingProduct, quantity: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="flex-between" style={{ gap: '1rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--border-color)' }} onClick={() => setEditingProduct(null)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Product</button>
                    </div>
                </form>
            )}

            {error && (
                <div className="card" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
                    <p>{error}</p>
                    <button className="btn" onClick={fetchProducts} style={{ marginTop: '0.5rem', background: 'var(--danger)', color: 'white' }}>Retry</button>
                </div>
            )}

            {loading ? (
                <p>Loading inventory...</p>
            ) : (
                <div className="inventory-list">
                    {products.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', opacity: 0.6 }}>
                            <Package size={48} style={{ marginBottom: '1rem' }} />
                            <p>No products in truck. Add some to get started!</p>
                        </div>
                    ) : (
                        products.map(product => (
                            <div key={product.id} className="card">
                                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem' }}>{product.name}</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn"
                                            style={{ padding: '0.5rem', background: 'transparent' }}
                                            onClick={() => {
                                                setEditingProduct(product)
                                                setIsAdding(false)
                                            }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="btn" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--danger)' }} onClick={() => deleteProduct(product.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', opacity: 0.8 }}>
                                    <div>
                                        Stock: <b style={{ color: product.quantity < 5 ? 'var(--danger)' : 'inherit' }}>{product.quantity}</b>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Buy: {(product.purchase_price || 0).toFixed(2)} DA</span> | <b>Sell: {(product.unit_price || 0).toFixed(2)} DA</b>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default Inventory
