
import React, { useEffect, useState } from 'react';
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
} from '../services/api';

const emptyForm = {
  barcode: '',
  name: '',
  description: '',
  category: '',
  quantity: 0,
  unit: 'pcs',
  price: 0,
  costPrice: 0,
  threshold: 10,
  supplier: '',
  location: ''
};

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getError = (err) =>
    err.response?.data?.message || err.message || 'Something went wrong';

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [productRes, categoryRes] = await Promise.all([
        getProducts(),
        getCategories()
      ]);

      setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      setCategories(Array.isArray(categoryRes.data) ? categoryRes.data : []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product._id);

    setForm({
      ...emptyForm,
      barcode: product.barcode || '',
      name: product.name || '',
      description: product.description || '',
      category: product.category?._id || product.category || '',
      quantity: product.quantity ?? 0,
      unit: product.unit || 'pcs',
      price: product.price ?? 0,
      costPrice: product.costPrice ?? 0,
      threshold: product.threshold ?? 10,
      supplier: product.supplier || '',
      location: product.location || ''
    });

    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        barcode: form.barcode.trim(),
        name: form.name.trim(),
        quantity: Number(form.quantity),
        price: Number(form.price),
        costPrice: Number(form.costPrice),
        threshold: Number(form.threshold)
      };

      if (!payload.category) {
        delete payload.category;
      }

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteProduct(id);
      await loadData();
    } catch (err) {
      setError(getError(err));
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase();

    const matchesSearch =
      product.name?.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query);

    const isLow =
      Number(product.quantity) <= Number(product.threshold);

    if (filter === 'low') {
      return matchesSearch && isLow && Number(product.quantity) > 0;
    }

    if (filter === 'out') {
      return matchesSearch && Number(product.quantity) === 0;
    }

    return matchesSearch;
  });

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
          <h1>Products</h1>
          <p>Manage your inventory and products</p>
        </div>

        <button className="btn btn-primary" onClick={openAddForm}>
          + Add Product
        </button>
      </div>

      {error && (
        <div className="card" style={{ color: '#dc2626', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Search by product name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="input"
            style={{ width: 180 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Add your first product to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const isOut = Number(product.quantity) === 0;
                  const isLow =
                    Number(product.quantity) <= Number(product.threshold);

                  return (
                    <tr
                      key={product._id}
                      className={isLow ? 'low-stock-row' : ''}
                    >
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <small>{product.supplier}</small>
                      </td>

                      <td>{product.barcode}</td>

                      <td>
                        {product.category?.name || 'Uncategorized'}
                      </td>

                      <td>
                        {product.quantity} {product.unit}
                      </td>

                      <td>
                        ${Number(product.price || 0).toFixed(2)}
                      </td>

                      <td>
                        <span className={`badge ${
                          isOut
                            ? 'badge-danger'
                            : isLow
                              ? 'badge-warning'
                              : 'badge-success'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditForm(product)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(product._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <p style={{ color: '#dc2626' }}>{error}</p>
                )}

                {[
                  ['barcode', 'Barcode', 'text'],
                  ['name', 'Product Name', 'text'],
                  ['description', 'Description', 'text'],
                  ['quantity', 'Quantity', 'number'],
                  ['unit', 'Unit (pcs, kg, etc.)', 'text'],
                  ['price', 'Selling Price', 'number'],
                  ['costPrice', 'Cost Price', 'number'],
                  ['threshold', 'Low Stock Threshold', 'number'],
                  ['supplier', 'Supplier', 'text'],
                  ['location', 'Storage Location', 'text']
                ].map(([name, label, type]) => (
                  <div className="form-group" key={name}>
                    <label>{label}</label>
                    <input
                      className="input"
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      required={['barcode', 'name'].includes(name)}
                      min={type === 'number' ? 0 : undefined}
                    />
                  </div>
                ))}

                <div className="form-group">
                  <label>Category</label>

                  <select
                    className="input"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="">Uncategorized</option>

                    {categories.map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
