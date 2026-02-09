import React from 'react'
import { Printer, ArrowLeft } from 'lucide-react'

const Receipt = ({ sale, onBack }) => {
    if (!sale) return null

    const distributionName = localStorage.getItem('distributionName') || 'SARL distribution alahbab'

    const handlePrint = () => {
        // Create a hidden iframe
        const iframe = document.createElement('iframe')
        // Use visibility:hidden and absolute positioning instead of display:none
        // display:none prevents some browsers (like Safari/iOS) from rendering content for print
        iframe.style.visibility = 'hidden'
        iframe.style.position = 'absolute'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        document.body.appendChild(iframe)

        // Generate the receipt HTML
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body {
                        font-family: monospace;
                        font-size: 14px;
                        margin: 0;
                        padding: 20px;
                        color: black;
                    }
                    .receipt-container {
                        max-width: 300px;
                        margin: 0 auto;
                        text-align: left;
                    }
                    h2 {
                        font-size: 1.2rem;
                        margin: 0 0 5px 0;
                        text-align: center;
                    }
                    p {
                        margin: 5px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    th, td {
                        padding: 5px 0;
                    }
                    th {
                        border-bottom: 1px solid #000;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                    .border-top { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
                    .total { font-size: 1.2rem; font-weight: bold; }
                    .footer { text-align: center; margin-top: 20px; font-size: 0.75rem; }
                    @media print {
                        body { width: 100%; margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="text-center">
                        <h2>${distributionName}</h2>
                        <p>${sale.date}</p>
                    </div>

                    <div class="border-bottom">
                        <p><strong>STORE:</strong> ${sale.client.name}</p>
                        <p><strong>ADDR:</strong> ${sale.client.address}</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: left">Item</th>
                                <th style="text-align: center">Qty</th>
                                <th style="text-align: right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td class="text-center">${item.sale_qty}</td>
                                    <td class="text-right">${(item.unit_price * item.sale_qty).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="border-top text-right">
                        <p class="total">TOTAL: ${sale.total.toFixed(2)} DA</p>
                        <p>PAID: ${(sale.amount_paid || 0).toFixed(2)} DA</p>
                        <div style="border-top: 1px solid #000; margin-top: 5px; padding-top: 5px;">
                            <p style="font-size: 1.1rem; font-weight: bold;">
                                BALANCE: ${(sale.total - (sale.amount_paid || 0)).toFixed(2)} DA
                            </p>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>*** SALE CONFIRMED ***</p>
                    </div>
                </div>
            </body>
            </html>
        `

        // Write content to iframe
        const doc = iframe.contentWindow.document
        doc.open()
        doc.write(content)
        doc.close()

        // Wait for content to load then print
        iframe.onload = () => {
            // Use setTimeout to ensure rendering is complete on iOS
            setTimeout(() => {
                try {
                    iframe.contentWindow.focus()
                    iframe.contentWindow.print()
                } catch (e) {
                    console.error('Printing failed:', e)
                    alert('Printing failed. Please try again.')
                }

                // Cleanup after a longer delay to ensure print dialog has opened and user interaction is done
                // iOS print dialog might take time, destroying iframe too early can cancel print
                setTimeout(() => {
                    document.body.removeChild(iframe)
                }, 3000)
            }, 500)
        }
    }

    return (
        <div className="receipt-container">
            <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button className="btn" style={{ flex: 1, backgroundColor: 'var(--card-bg)' }} onClick={onBack}>
                    <ArrowLeft size={20} /> Back to Sales
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
                    <Printer size={20} /> Print Receipt
                </button>
            </div>

            <div className="card receipt-paper" style={{
                maxWidth: '300px',
                margin: '0 auto',
                padding: '20px',
                backgroundColor: 'white',
                color: 'black',
                fontFamily: 'monospace',
                fontSize: '14px',
                border: '1px dashed #ccc'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{distributionName}</h2>
                    <p style={{ fontSize: '0.8rem' }}>{sale.date}</p>
                </div>

                <div style={{ marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
                    <p><strong>STORE:</strong> {sale.client.name}</p>
                    <p><strong>ADDR:</strong> {sale.client.address}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <th style={{ textAlign: 'left' }}>Item</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Price (DA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map(item => (
                                <tr key={item.id}>
                                    <td style={{ padding: '5px 0' }}>{item.name}</td>
                                    <td style={{ textAlign: 'center' }}>{item.sale_qty}</td>
                                    <td style={{ textAlign: 'right' }}>{(item.unit_price * item.sale_qty).toFixed(2)} DA</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'right' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>TOTAL: {sale.total.toFixed(2)} DA</p>
                    <p style={{ fontSize: '1rem', marginTop: '5px' }}>PAID: {(sale.amount_paid || 0).toFixed(2)} DA</p>
                    <div style={{ borderTop: '1px solid #000', marginTop: '5px', paddingTop: '5px' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                            BALANCE: {(sale.total - (sale.amount_paid || 0)).toFixed(2)} DA
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.75rem' }}>
                    <p>Thank you for your business!</p>
                    <p>*** SALE CONFIRMED ***</p>
                </div>
            </div>
        </div>
    )
}

export default Receipt
