// controllers/ordersController.js
const mongoose = require('mongoose');
const Order = mongoose.model('order');
const Cart = mongoose.model('cart');

exports.createOrder = async (req, res) => {
  try {
    // Lấy giỏ hàng của user
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Giỏ hàng trống" });
    }

    // Tạo đơn hàng từ giỏ hàng
    const order = new Order({
      user: req.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      })),
      total: cart.total,
      shippingAddress: req.body.shippingAddress
    });

    // Lưu đơn hàng và xóa giỏ hàng
    await order.save();
    await Cart.deleteOne({ _id: cart._id });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};