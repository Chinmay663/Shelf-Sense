const express = require('express');
const router = express.Router();
const QuickItem = require('../models/QuickItem');

// Get all quick items (sorted by usage)
router.get('/', async (req, res) => {
  try {
    const quickItems = await QuickItem.find()
      .populate('category')
      .sort({ usageCount: -1 });
    res.json(quickItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create quick item
router.post('/', async (req, res) => {
  try {
    const quickItem = new QuickItem(req.body);
    const savedItem = await quickItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Quick item already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update quick item
router.put('/:id', async (req, res) => {
  try {
    const quickItem = await QuickItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!quickItem) {
      return res.status(404).json({ message: 'Quick item not found' });
    }
    res.json(quickItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Increment usage count
router.post('/:id/use', async (req, res) => {
  try {
    const quickItem = await QuickItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    if (!quickItem) {
      return res.status(404).json({ message: 'Quick item not found' });
    }
    res.json(quickItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete quick item
router.delete('/:id', async (req, res) => {
  try {
    const quickItem = await QuickItem.findByIdAndDelete(req.params.id);
    if (!quickItem) {
      return res.status(404).json({ message: 'Quick item not found' });
    }
    res.json({ message: 'Quick item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
