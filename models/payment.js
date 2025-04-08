// models/payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order', // Sửa 'Order' thành 'order'
    required: true
  },
  amount: { type: Number, required: true },
  method: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('payment', paymentSchema);