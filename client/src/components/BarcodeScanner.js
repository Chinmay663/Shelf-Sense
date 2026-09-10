import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';
import './BarcodeScanner.css';

function BarcodeScanner({ onScan, isActive, onToggle }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive]);

  const startScanner = async () => {
    try {
      setError(null);
      html5QrCodeRef.current = new Html5Qrcode('barcode-reader');
      
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778
        },
        (decodedText) => {
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors (no barcode found)
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Unable to access camera. Please check permissions.');
      onToggle(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <div className="barcode-scanner">
      <div className="scanner-controls">
        <button 
          className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => onToggle(!isActive)}
        >
          {isActive ? <CameraOff size={20} /> : <Camera size={20} />}
          {isActive ? 'Stop Camera' : 'Start Camera'}
        </button>
      </div>

      {error && (
        <div className="scanner-error">
          {error}
        </div>
      )}

      <div 
        id="barcode-reader" 
        ref={scannerRef}
        className={`scanner-viewport ${isActive ? 'active' : ''}`}
      />

      {isActive && (
        <p className="scanner-hint">
          Point your camera at a barcode to scan
        </p>
      )}
    </div>
  );
}

export default BarcodeScanner;
