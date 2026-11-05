
import React, { useEffect, useState } from 'react';
import { getTransactions } from '../services/api';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getTransactions({
        type: filter || undefined,
        limit: 100
      });

      setTransactions(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load transactions'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const getTypeLabel = (type) => {
    if (type === 'in') return 'Stock In';
    if (type === 'out') return 'Stock Out';
    return 'Adjustment';
  };

  const getBadgeClass = (type) => {
    if (type === 'in') return 'badge-success';
    if (type === 'out') return 'badge-danger';
    return 'badge-warning';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';

    return new Date(date).toLocaleString();
  };

  return (
    <div>
      <div className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <h1>Transactions</h1>
          <p>Track all inventory stock movements</p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadTransactions}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="card" style={{
          color: '#dc2626',
          marginBottom: 20
        }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label>Filter Transactions</label>

          <select
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Transactions</option>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <p>
          Total transactions: <strong>{transactions.length}</strong>
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions found</h3>
            <p>Your stock movements will appear here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Products</th>
                  <th>Total Units</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => {
                  const products = transaction.products || [];

                  const totalUnits = products.reduce(
                    (total, item) =>
                      total + Number(item.quantity || 0),
                    0
                  );

                  return (
                    <tr key={transaction._id}>
                      <td>
                        <small>
                          {transaction._id?.slice(-8).toUpperCase()}
                        </small>
                      </td>

                      <td>
                        <span className={`badge ${
                          getBadgeClass(transaction.type)
                        }`}>
                          {getTypeLabel(transaction.type)}
                        </span>
                      </td>

                      <td>{products.length}</td>

                      <td>{totalUnits}</td>

                      <td>{formatDate(transaction.createdAt)}</td>

                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setSelectedTransaction(transaction)
                          }
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Transaction Details</h2>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedTransaction(null)}
              >
                Close
              </button>
            </div>

            <div className="modal-body">
              <p>
                <strong>Type:</strong>{' '}
                {getTypeLabel(selectedTransaction.type)}
              </p>

              <p style={{ marginTop: 10 }}>
                <strong>Date:</strong>{' '}
                {formatDate(selectedTransaction.createdAt)}
              </p>

              <p style={{ marginTop: 10 }}>
                <strong>Notes:</strong>{' '}
                {selectedTransaction.notes || 'No notes'}
              </p>

              <h3 style={{ marginTop: 20 }}>Products</h3>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Barcode</th>
                      <th>Quantity</th>
                      <th>Previous</th>
                      <th>New</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selectedTransaction.products || []).map(
                      (item, index) => (
                        <tr key={item._id || index}>
                          <td>
                            {item.name ||
                              item.product?.name ||
                              'Unknown Product'}
                          </td>

                          <td>{item.barcode || 'N/A'}</td>
                          <td>{item.quantity}</td>
                          <td>{item.previousStock ?? 'N/A'}</td>
                          <td>{item.newStock ?? 'N/A'}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedTransaction(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
