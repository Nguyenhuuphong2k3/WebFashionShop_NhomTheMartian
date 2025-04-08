// models/cart.js
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Sửa 'User' thành 'user'
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product', // Sửa 'Product' thành 'product'
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  total: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('cart', CartSchema);