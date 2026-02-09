import React from 'react'
import { Printer, ArrowLeft } from 'lucide-react'

const StockReport = ({ products, onBack }) => {
    const handlePrint = () => {
        window.print()
    }

    const today = new Date().toLocaleDateString()
    const distributionName = localStorage.getItem('distributionName') || 'SARL distribution alahbab'

    return (
        <div className="receipt-container">
            <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button className="btn" style={{ flex: 1, backgroundColor: 'var(--card-bg)' }} onClick={onBack}>
                    <ArrowLeft size={20} /> Back to Inventory
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
                    <Printer size={20} /> Print Report
                </button>
            </div>

            <div className="card receipt-paper" style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '20px',
                backgroundColor: 'white',
                color: 'black',
                fontFamily: 'monospace',
                fontSize: '14px',
                border: '1px solid #eee'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.4rem', margin: '0 0 5px 0' }}>{distributionName}</h2>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 5px 0' }}>INVENTORY STOCK REPORT</h3>
                    <p style={{ fontSize: '0.9rem' }}>Date: {today}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #000' }}>
                                <th style={{ textAlign: 'left', padding: '8px 0' }}>Product</th>
                                <th style={{ textAlign: 'center', padding: '8px 0' }}>Stock</th>
                                <th style={{ textAlign: 'right', padding: '8px 0' }}>Price (DA)</th>
                                <th style={{ textAlign: 'right', padding: '8px 0' }}>Total (DA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px 0' }}>{product.name}</td>
                                    <td style={{ textAlign: 'center', padding: '8px 0' }}>{product.quantity}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 0' }}>{(product.unit_price || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '8px 0' }}>{((product.quantity || 0) * (product.unit_price || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '5px' }}>
                        <span>Total Items:</span>
                        <span>{products.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        <span>Total Stock Value:</span>
                        <span>
                            {products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.unit_price || 0)), 0).toFixed(2)} DA
                        </span>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.8rem', opacity: 0.7 }}>
                    <p>*** END OF STOCK REPORT ***</p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body * { visibility: hidden; }
          .receipt-paper, .receipt-paper * { visibility: visible; }
          .receipt-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}} />
        </div>
    )
}

export default StockReport
