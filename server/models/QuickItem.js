const mongoose = require('mongoose');

const quickItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  defaultBarcode: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuickItem', quickItemSchema);
