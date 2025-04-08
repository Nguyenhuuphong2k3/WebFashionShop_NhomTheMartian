const express = require('express');
const router = express.Router();
const checkAuth = require('../Utils/check_auth');
const cartController = require('../controllers/cartController');

// Route để lấy giỏ hàng
router.get('/', checkAuth.check_authentication, cartController.getCart);

// Route để thêm sản phẩm vào giỏ hàng
router.post('/add', checkAuth.check_authentication, cartController.addToCart);

module.exports = router;