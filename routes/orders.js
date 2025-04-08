// routes/orders.js
const express = require('express');
const router = express.Router();
const checkAuth = require('../Utils/check_auth');
const ordersController = require('../controllers/ordersController');

// Tạo đơn hàng từ giỏ hàng
router.post(
  '/',
  checkAuth.check_authentication,
  checkAuth.check_authorization(['user']), // Chỉ user mới được tạo đơn hàng
  ordersController.createOrder
);

// Lấy danh sách đơn hàng của user
router.get(
  '/',
  checkAuth.check_authentication,
  ordersController.getUserOrders
);

module.exports = router;