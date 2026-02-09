import React, { useState, useEffect } from 'react'
import { db, isReady } from '../lib/db'
import { TrendingUp, Store, Package, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const Home = () => {
    const [stats, setStats] = useState({
        totalSalesToday: 0,
        moneyCollectedToday: 0,
        totalMoneyCollected: 0,
        profitToday: 0,
        totalProfit: 0,
        storesVisited: 0,
        lowStock: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (!isReady) {
            setError('CRITICAL: Database initialization failed.')
            setLoading(false)
            return
        }
        fetchStats()
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchStats()
        setRefreshing(false)
    }

    const fetchStats = async () => {
        try {
            setError(null)
            const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD

            // 1. Fetch Sales
            const allSales = await db.sales.toArray()

            // Filter today's sales
            const todaySales = allSales.filter(s => s.created_at.startsWith(todayStr))

            const salesToday = todaySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
            const collectedToday = todaySales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)
            const totalCollected = allSales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)

            // 2. Profit Calculations
            const allSaleItems = await db.sale_items.toArray()

            // Map sales for easy date lookup
            const salesMap = new Map(allSales.map(s => [s.id, s.created_at]))

            let totalProfit = 0
            let profitToday = 0

            allSaleItems.forEach(item => {
                const qty = Number(item.quantity || 0)
                const price = Number(item.price_at_sale || 0)
                const cost = Number(item.purchase_price_at_sale || 0)
                const profitOnItem = (price - cost) * qty

                totalProfit += profitOnItem

                const saleDate = salesMap.get(item.sale_id)
                if (saleDate && saleDate.startsWith(todayStr)) {
                    profitToday += profitOnItem
                }
            })

            // 3. Stores Visited Today
            const uniqueStores = new Set(todaySales.map(s => s.client_id)).size

            // 4. Low Stock Items
            const lowStockCount = await db.products.where('quantity').below(5).count()

            setStats({
                totalSalesToday: salesToday,
                moneyCollectedToday: collectedToday,
                totalMoneyCollected: totalCollected,
                profitToday,
                totalProfit,
                storesVisited: uniqueStores,
                lowStock: lowStockCount || 0
            })
        } catch (err) {
            console.error('Stats fetch error:', err)
            setError('Dashboard Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Dashboard</h1>
                <button
                    className="btn"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: 'var(--card-bg)' }}
                >
                    {refreshing ? 'Refreshing...' : '🔄 Refresh'}
                </button>
            </div>

            {error && (
                <div className="card" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', textAlign: 'center' }}>
                    <p>{error} Check your .env setup.</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card" style={{ background: 'var(--primary)', color: 'white', marginBottom: 0 }}>
                    <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>Sales Today</p>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalSalesToday.toFixed(2)} DA</h2>
                </div>
                <div className="card" style={{ background: 'var(--success)', color: 'white', marginBottom: 0 }}>
                    <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>Profit Today</p>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.profitToday.toFixed(2)} DA</h2>
                </div>
            </div>

            <div className="card" style={{ background: 'var(--card-bg)', border: '2px solid var(--success)', padding: '1.5rem', marginBottom: '1rem' }}>
                <p style={{ opacity: 0.7, fontSize: '1rem', marginBottom: '0.25rem' }}>Total Profit (All Time)</p>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--success)' }}>{stats.totalProfit.toFixed(2)} DA</h2>
            </div>

            <div className="card" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '1.5rem', marginBottom: '2rem' }}>
                <p style={{ opacity: 0.7, fontSize: '1rem', marginBottom: '0.25rem' }}>Money Collected (Total)</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalMoneyCollected.toFixed(2)} DA</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
                    <TrendingUp size={16} />
                    <span>Today: {stats.moneyCollectedToday.toFixed(2)} DA</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                    <p style={{ opacity: 0.7 }}>Stores Visited</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Store size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.5rem' }}>{stats.storesVisited}</h3>
                    </div>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                    <p style={{ opacity: 0.7 }}>Low Stock</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={20} color={stats.lowStock > 0 ? 'var(--danger)' : 'var(--success)'} />
                        <h3 style={{ fontSize: '1.5rem' }}>{stats.lowStock}</h3>
                    </div>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
                <Link to="/sales" className="btn btn-primary btn-large" style={{ textDecoration: 'none' }}>
                    <PlusCircle size={24} /> New Delivery
                </Link>
                <Link to="/inventory" className="btn btn-large" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', textDecoration: 'none' }}>
                    Manage Products
                </Link>
                <button
                    className="btn btn-large"
                    style={{ backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', marginTop: '1rem' }}
                    onClick={async () => {
                        if (window.confirm('WARNING: This will delete ALL data (products, sales, stores). This cannot be undone. Are you sure?')) {
                            try {
                                await db.delete()
                                window.location.reload()
                            } catch (err) {
                                alert('Reset failed: ' + err.message)
                            }
                        }
                    }}
                >
                    Reset All App Data
                </button>
            </div>
        </div>
    )
}

export default Home
