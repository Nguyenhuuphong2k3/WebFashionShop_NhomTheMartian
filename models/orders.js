// models/orders.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Sửa 'User' thành 'user'
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product', // Sửa 'Product' thành 'product'
        required: true
      },
      quantity: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'shipped', 'delivered']
  }
}, { timestamps: true });

module.exports = mongoose.model('order', orderSchema);