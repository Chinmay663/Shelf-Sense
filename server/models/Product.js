const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    default: 'pcs'
  },
  price: {
    type: Number,
    default: 0
  },
  costPrice: {
    type: Number,
    default: 0
  },
  threshold: {
    type: Number,
    default: 10
  },
  supplier: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  isLowStock: {
    type: Boolean,
    default: false
  },
  lastRestocked: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update isLowStock before saving
productSchema.pre('save', function(next) {
  this.isLowStock = this.quantity <= this.threshold;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
