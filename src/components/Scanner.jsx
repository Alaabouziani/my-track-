import React, { useRef, useEffect, useState } from 'react'
import { X, Camera } from 'lucide-react'

const Scanner = ({ onScan, onClose }) => {
    const videoRef = useRef(null)
    const [error, setError] = useState(null)
    const [stream, setStream] = useState(null)

    useEffect(() => {
        async function startCamera() {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                })
                setStream(newStream)
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream
                }
            } catch (err) {
                console.error('Camera error:', err)
                setError('Camera access denied or not available.')
            }
        }

        startCamera()

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="flex-between" style={{ padding: '1rem', color: 'white' }}>
                <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={24} /> Barcode Scanner
                </h2>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', color: 'white' }} onClick={onClose}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {error ? (
                    <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Scanner Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '70%',
                            height: '30%',
                            border: '2px solid var(--primary)',
                            borderRadius: '10px',
                            boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)'
                        }} />
                    </>
                )}
            </div>

            <div style={{ padding: '2rem', textAlign: 'center', color: 'white', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                <p style={{ opacity: 0.8 }}>Pointer your camera at a barcode</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    Scanning logic skeleton active - permissions enabled.
                </p>
            </div>
        </div>
    )
}

export default Scanner
