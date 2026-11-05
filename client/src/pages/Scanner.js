
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  getProductByBarcode,
  createTransaction
} from '../services/api';

function Scanner() {
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState('in');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [matchedProduct, setMatchedProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);

  const scannerRef = useRef(null);
  const lastScannedRef = useRef('');

  const getError = (err) =>
    err.response?.data?.message || err.message || 'Something went wrong';

  const lookupBarcode = async (code) => {
    const cleanCode = code.trim();

    if (!cleanCode) return;

    try {
      const response = await getProductByBarcode(cleanCode);

      setMatchedProduct(response.data);
      setProductName(response.data.name);
      setError('');
      setMessage(`Product found: ${response.data.name}`);
    } catch (err) {
      setMatchedProduct(null);

      if (type === 'in' && err.response?.status === 404) {
        setProductName('');
        setMessage('New product. Enter its name to add stock.');
        setError('');
      } else {
        setMessage('');
        setError(getError(err));
      }
    }
  };

  const startCamera = async () => {
    setError('');
    setMessage('');

    if (scannerRef.current) return;

    try {
      const scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 }
        },
        (decodedText) => {
          if (lastScannedRef.current === decodedText) return;

          lastScannedRef.current = decodedText;
          setBarcode(decodedText);
          lookupBarcode(decodedText);
        },
        () => {}
      );

      setCameraRunning(true);
    } catch (err) {
      setError(
        'Camera could not start. Check browser permissions or enter barcode manually.'
      );

      scannerRef.current = null;
    }
  };

  const stopCamera = async () => {
    const scanner = scannerRef.current;

    if (!scanner) return;

    try {
      await scanner.stop();
    } catch (err) {
      // Scanner may already be stopped.
    }

    try {
      await scanner.clear();
    } catch (err) {
      // Ignore cleanup errors.
    }

    scannerRef.current = null;
    setCameraRunning(false);
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        scanner.stop()
          .catch(() => {})
          .then(() => scanner.clear().catch(() => {}));
      }
    };
  }, []);

  const handleBarcodeChange = (e) => {
    setBarcode(e.target.value);
    setMatchedProduct(null);
    setProductName('');
    setMessage('');
    setError('');
    lastScannedRef.current = '';
  };

  const handleAddItem = async () => {
    setError('');
    setMessage('');

    const cleanBarcode = barcode.trim();
    const qty = Number(quantity);

    if (!cleanBarcode) {
      setError('Enter or scan a barcode.');
      return;
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      setError('Quantity must be a positive whole number.');
      return;
    }

    let product = matchedProduct;

    if (!product) {
      try {
        const response = await getProductByBarcode(cleanBarcode);
        product = response.data;
        setMatchedProduct(product);
      } catch (err) {
        if (type === 'out') {
          setError('This product does not exist. Stock out is not possible.');
          return;
        }
      }
    }

    const existing = items.find(
      (item) => item.barcode === cleanBarcode
    );

    const totalQuantity = qty + (existing?.quantity || 0);

    if (type === 'out' && !product) {
      setError('Product not found.');
      return;
    }

    if (type === 'out' && totalQuantity > product.quantity) {
      setError(
        `Insufficient stock. Available quantity: ${product.quantity}`
      );
      return;
    }

    const newItem = {
      barcode: cleanBarcode,
      name: product?.name || productName.trim() || `Product ${cleanBarcode}`,
      quantity: totalQuantity,
      threshold: product?.threshold || 10
    };

    setItems((prev) => {
      const exists = prev.some(
        (item) => item.barcode === cleanBarcode
      );

      if (exists) {
        return prev.map((item) =>
          item.barcode === cleanBarcode ? newItem : item
        );
      }

      return [...prev, newItem];
    });

    setBarcode('');
    setProductName('');
    setQuantity(1);
    setMatchedProduct(null);
    lastScannedRef.current = '';
    setMessage('Item added to transaction.');
  };

  const removeItem = (barcodeToRemove) => {
    setItems((prev) =>
      prev.filter((item) => item.barcode !== barcodeToRemove)
    );
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setError('Add at least one product.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await createTransaction({
        type,
        items: items.map((item) => ({
          barcode: item.barcode,
          name: item.name,
          quantity: item.quantity,
          threshold: item.threshold
        })),
        notes
      });

      const failedItems = (response.data.results || []).filter(
        (item) => item.success === false
      );

      if (failedItems.length > 0) {
        setError(
          failedItems.map((item) =>
            `${item.barcode}: ${item.message}`
          ).join(', ')
        );
      } else {
        setMessage('Transaction completed successfully!');
      }

      setItems([]);
      setNotes('');
      setMatchedProduct(null);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Barcode Scanner</h1>
        <p>Scan products and update inventory</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Transaction Type</h3>

        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 12
        }}>
          <button
            className={`btn ${type === 'in' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => {
              setType('in');
              setItems([]);
            }}
          >
            Stock In
          </button>

          <button
            className={`btn ${type === 'out' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => {
              setType('out');
              setItems([]);
            }}
          >
            Stock Out
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Scan Barcode</h3>

        <div
          id="reader"
          style={{
            width: '100%',
            maxWidth: 500,
            margin: '20px auto'
          }}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 20
        }}>
          {!cameraRunning ? (
            <button
              className="btn btn-primary"
              onClick={startCamera}
            >
              Start Camera
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={stopCamera}
            >
              Stop Camera
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Enter Barcode Manually</label>

          <input
            className="input"
            value={barcode}
            onChange={handleBarcodeChange}
            placeholder="Enter barcode number"
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => lookupBarcode(barcode)}
        >
          Find Product
        </button>

        {matchedProduct && (
          <div style={{ marginTop: 15 }}>
            <strong>{matchedProduct.name}</strong>
            <p>Available: {matchedProduct.quantity}</p>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 20 }}>
          <label>Product Name (required for new stock-in products)</label>
          <input
            className="input"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
            disabled={!!matchedProduct}
          />
        </div>

        <div className="form-group">
          <label>Quantity</label>
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleAddItem}
        >
          Add to Transaction
        </button>

        {message && (
          <p style={{ color: 'green', marginTop: 12 }}>{message}</p>
        )}

        {error && (
          <p style={{ color: 'red', marginTop: 12 }}>{error}</p>
        )}
      </div>

      <div className="card">
        <h3>Transaction Items ({items.length})</h3>

        {items.length === 0 ? (
          <p style={{ marginTop: 15 }}>No items added yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th>Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.barcode}>
                    <td>{item.name}</td>
                    <td>{item.barcode}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => removeItem(item.barcode)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 20 }}>
          <label>Transaction Notes</label>
          <textarea
            className="input"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || items.length === 0}
        >
          {loading ? 'Processing...' : 'Complete Transaction'}
        </button>
      </div>
    </div>
  );
}

export default Scanner;
