const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { sendLowStockAlert } = require('../services/emailService');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { search, category, lowStock, sort } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (lowStock === 'true') query.isLowStock = true;

    let sortOption = { updatedAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'quantity') sortOption = { quantity: 1 };
    if (sort === 'lowStock') sortOption = { isLowStock: -1, quantity: 1 };

    const products = await Product.find(query)
      .populate('category')
      .sort(sortOption);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode })
      .populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Barcode already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('category');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product became low stock
    if (product.isLowStock) {
      sendLowStockAlert([product]);
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk update stock (for batch scanning)
router.post('/bulk-update', async (req, res) => {
  try {
    const { items, type } = req.body; // type: 'in' or 'out'
    const results = [];
    const lowStockProducts = [];

    for (const item of items) {
      const product = await Product.findOne({ barcode: item.barcode });
      if (product) {
        const previousStock = product.quantity;
        if (type === 'in') {
          product.quantity += item.quantity;
          product.lastRestocked = Date.now();
        } else {
          product.quantity = Math.max(0, product.quantity - item.quantity);
        }
        await product.save();
        
        if (product.isLowStock) {
          lowStockProducts.push(product);
        }

        results.push({
          barcode: item.barcode,
          name: product.name,
          previousStock,
          newStock: product.quantity,
          success: true
        });
      } else {
        results.push({
          barcode: item.barcode,
          success: false,
          message: 'Product not found'
        });
      }
    }

    // Send alert for low stock products
    if (lowStockProducts.length > 0) {
      sendLowStockAlert(lowStockProducts);
    }

    res.json({ results, lowStockCount: lowStockProducts.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get low stock products
router.get('/status/low-stock', async (req, res) => {
  try {
    const products = await Product.find({ isLowStock: true })
      .populate('category')
      .sort({ quantity: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
