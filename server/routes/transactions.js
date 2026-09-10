const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { sendLowStockAlert } = require('../services/emailService');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { type, startDate, endDate, limit } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('products.product')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 100);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create transaction (stock in/out)
router.post('/', async (req, res) => {
  try {
    const { type, items, notes } = req.body;
    const transactionProducts = [];
    const lowStockProducts = [];

    for (const item of items) {
      let product = await Product.findOne({ barcode: item.barcode });
      
      // If product doesn't exist and it's a stock-in, create it
      if (!product && type === 'in') {
        product = new Product({
          barcode: item.barcode,
          name: item.name || `Product ${item.barcode}`,
          quantity: 0,
          threshold: item.threshold || 10,
          category: item.category
        });
      }

      if (product) {
        const previousStock = product.quantity;
        
        if (type === 'in') {
          product.quantity += item.quantity;
          product.lastRestocked = Date.now();
        } else if (type === 'out') {
          product.quantity = Math.max(0, product.quantity - item.quantity);
        } else if (type === 'adjustment') {
          product.quantity = item.quantity;
        }

        await product.save();

        if (product.isLowStock) {
          lowStockProducts.push(product);
        }

        transactionProducts.push({
          product: product._id,
          barcode: product.barcode,
          name: product.name,
          quantity: item.quantity,
          previousStock,
          newStock: product.quantity
        });
      }
    }

    const transaction = new Transaction({
      type,
      products: transactionProducts,
      notes
    });

    await transaction.save();

    // Send low stock alerts
    if (lowStockProducts.length > 0) {
      sendLowStockAlert(lowStockProducts);
    }

    res.status(201).json({
      transaction,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(p => ({ name: p.name, quantity: p.quantity }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('products.product');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
