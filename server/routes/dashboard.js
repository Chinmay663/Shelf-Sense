const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockCount = await Product.countDocuments({ isLowStock: true });
    const outOfStock = await Product.countDocuments({ quantity: 0 });
    const totalValue = await Product.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } }
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTransactions = await Transaction.countDocuments({
      createdAt: { $gte: todayStart }
    });

    const categories = await Category.countDocuments();

    res.json({
      totalProducts,
      lowStockCount,
      outOfStock,
      totalValue: totalValue[0]?.total || 0,
      todayTransactions,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock trends (last 30 days)
router.get('/trends', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await Transaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          totalQuantity: { $sum: '$products.quantity' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get category distribution
router.get('/category-distribution', async (req, res) => {
  try {
    const distribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } }
    ]);

    res.json(distribution);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get top products by movement
router.get('/top-products', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await Transaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalMovement: { $sum: '$products.quantity' },
          name: { $first: '$products.name' }
        }
      },
      { $sort: { totalMovement: -1 } },
      { $limit: 10 }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('products.product');

    res.json(recentTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
