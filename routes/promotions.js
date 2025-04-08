const express = require('express');
const router = express.Router();
const {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  getAvailableProducts,
  addProductsToPromotion,
  removeProductsFromPromotion
} = require('../controllers/promotions');

// Lấy danh sách sản phẩm để thêm vào khuyến mãi
router.get('/available-products', getAvailableProducts);

// Thêm sản phẩm vào khuyến mãi
router.post('/:id/add-products', addProductsToPromotion);

// Xóa sản phẩm khỏi khuyến mãi
router.post('/:id/remove-products', removeProductsFromPromotion);

// Tạo khuyến mãi
router.post('/', createPromotion);

// Danh sách khuyến mãi
router.get('/', getPromotions);

// Chi tiết khuyến mãi
router.get('/:id', getPromotionById);

// Cập nhật khuyến mãi
router.put('/:id', updatePromotion);

// Xoá khuyến mãi
router.delete('/:id', deletePromotion);

module.exports = router;