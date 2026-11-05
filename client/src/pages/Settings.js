
import React, { useEffect, useState } from 'react';

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getQuickItems,
  createQuickItem,
  useQuickItem as recordQuickItemUsage,
  deleteQuickItem
} from '../services/api';

const emptyCategory = {
  name: '',
  description: '',
  color: '#3B82F6'
};

function Settings() {
  const [categories, setCategories] = useState([]);
  const [quickItems, setQuickItems] = useState([]);

  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [quickForm, setQuickForm] = useState({
    name: '',
    defaultBarcode: '',
    category: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getError = (err) =>
    err.response?.data?.message || err.message || 'Something went wrong';

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [categoryRes, quickRes] = await Promise.all([
        getCategories(),
        getQuickItems()
      ]);

      setCategories(
        Array.isArray(categoryRes.data) ? categoryRes.data : []
      );

      setQuickItems(
        Array.isArray(quickRes.data) ? quickRes.data : []
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;

    setCategoryForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickChange = (e) => {
    const { name, value } = e.target;

    setQuickForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        ...categoryForm,
        name: categoryForm.name.trim()
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        setMessage('Category updated successfully.');
      } else {
        await createCategory(payload);
        setMessage('Category created successfully.');
      }

      setCategoryForm(emptyCategory);
      setEditingId(null);

      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const editCategory = (category) => {
    setEditingId(category._id);

    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      color: category.color || '#3B82F6'
    });

    setError('');
    setMessage('');
  };

  const removeCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;

    try {
      await deleteCategory(id);
      setMessage('Category deleted.');

      if (editingId === id) {
        setEditingId(null);
        setCategoryForm(emptyCategory);
      }

      await loadData();
    } catch (err) {
      setError(getError(err));
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        name: quickForm.name.trim(),
        defaultBarcode: quickForm.defaultBarcode.trim()
      };

      if (quickForm.category) {
        payload.category = quickForm.category;
      }

      await createQuickItem(payload);

      setQuickForm({
        name: '',
        defaultBarcode: '',
        category: ''
      });

      setMessage('Quick item created successfully.');
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  };


 const handleUseQuickItem = async (id) => {
  try {
    await recordQuickItemUsage(id);
    setMessage('Quick item usage recorded.');
    await loadData();
  } catch (err) {
    setError(getError(err));
  }
};


  const removeQuickItem = async (id) => {
    if (!window.confirm('Delete this quick item?')) return;

    try {
      await deleteQuickItem(id);
      setMessage('Quick item deleted.');
      await loadData();
    } catch (err) {
      setError(getError(err));
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your inventory categories and quick items</p>
      </div>

      {error && (
        <div className="card" style={{
          color: '#dc2626',
          marginBottom: 20
        }}>
          {error}
        </div>
      )}

      {message && (
        <div className="card" style={{
          color: '#059669',
          marginBottom: 20
        }}>
          {message}
        </div>
      )}

      {/* Categories */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Category Management</h3>

        <form onSubmit={handleCategorySubmit}>
          <div className="form-group">
            <label>Category Name</label>

            <input
              className="input"
              name="name"
              value={categoryForm.name}
              onChange={handleCategoryChange}
              placeholder="e.g. Electronics"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <input
              className="input"
              name="description"
              value={categoryForm.description}
              onChange={handleCategoryChange}
              placeholder="Category description"
            />
          </div>

          <div className="form-group">
            <label>Category Color</label>

            <input
              type="color"
              name="color"
              value={categoryForm.color}
              onChange={handleCategoryChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Category'
                : 'Add Category'}
          </button>

          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginLeft: 10 }}
              onClick={() => {
                setEditingId(null);
                setCategoryForm(emptyCategory);
              }}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <h3 style={{ marginTop: 30 }}>Existing Categories</h3>

        {categories.length === 0 ? (
          <p>No categories created yet.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: category.color,
                          marginRight: 10
                        }}
                      />

                      {category.name}
                    </td>

                    <td>{category.description || '-'}</td>

                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => editCategory(category)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: 8 }}
                        onClick={() => removeCategory(category._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Items */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Quick Item Management</h3>

        <p style={{ marginBottom: 20 }}>
          Create frequently used products for quicker inventory operations.
        </p>

        <form onSubmit={handleQuickSubmit}>
          <div className="form-group">
            <label>Item Name</label>

            <input
              className="input"
              name="name"
              value={quickForm.name}
              onChange={handleQuickChange}
              placeholder="e.g. Water Bottle"
              required
            />
          </div>

          <div className="form-group">
            <label>Default Barcode</label>

            <input
              className="input"
              name="defaultBarcode"
              value={quickForm.defaultBarcode}
              onChange={handleQuickChange}
              placeholder="Optional barcode"
            />
          </div>

          <div className="form-group">
            <label>Category</label>

            <select
              className="input"
              name="category"
              value={quickForm.category}
              onChange={handleQuickChange}
            >
              <option value="">No Category</option>

              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={saving}
          >
            Add Quick Item
          </button>
        </form>

        <h3 style={{ marginTop: 30 }}>Saved Quick Items</h3>

        {quickItems.length === 0 ? (
          <p>No quick items available.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Barcode</th>
                  <th>Category</th>
                  <th>Usage</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {quickItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.defaultBarcode || '-'}</td>
                    <td>{item.category?.name || '-'}</td>
                    <td>{item.usageCount || 0}</td>

                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleUseQuickItem(item._id)}
                      >
                        Mark Used
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: 8 }}
                        onClick={() => removeQuickItem(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
