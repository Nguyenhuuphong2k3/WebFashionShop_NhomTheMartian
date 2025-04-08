// controllers/paymentController.js
const mongoose = require('mongoose');
const Payment = mongoose.model('payment');
const Order = mongoose.model('order');

exports.createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;
    const order = await Order.findById(orderId);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const payment = new Payment({
      order: orderId,
      amount: order.total,
      method
    });

    await payment.save();
    
    // Cập nhật trạng thái đơn hàng (giả sử sau khi thanh toán thành công)
    order.status = 'processing';
    await order.save();

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};