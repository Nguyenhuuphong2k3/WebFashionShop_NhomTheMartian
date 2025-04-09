// controllers/promotionsController.js
const mongoose = require('mongoose');
const Promotion = require('../models/promotions');
const Product = require('../models/products');

// Tạo khuyến mãi (đã thêm trường products)
const createPromotion = async (req, res) => {
  try {
    const { code, discount, startDate, endDate, description, productIds } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!code || !discount || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Kiểm tra ngày hợp lệ
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'startDate must be before endDate' });
    }

    // Kiểm tra sản phẩm tồn tại nếu có productIds
    if (productIds && productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({ success: false, message: 'One or more products not found' });
      }
    }

    // Tạo khuyến mãi
    const promotion = new Promotion({
      code,
      discount,
      startDate,
      endDate,
      description,
      products: productIds || [], // Thêm danh sách sản phẩm
    });

    await promotion.save({ writeConcern: { w: "majority", j: true } });
    console.log('Created promotion:', promotion);

    // Cập nhật các sản phẩm có liên quan
    if (productIds && productIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $push: { promotionIDs: promotion._id } }
      );
    }

    res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    console.error('Error in createPromotion:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy danh sách sản phẩm có thể áp dụng khuyến mãi
const getAvailableProducts = async (req, res) => {
  try {
    // Lấy danh sách sản phẩm chưa có khuyến mãi hoặc có thể áp dụng thêm
    const products = await Product.find({});
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Error in getAvailableProducts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xem danh sách khuyến mãi (đã populate thông tin sản phẩm)
const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate('products', 'productName price') // Lấy thêm thông tin sản phẩm
      .sort({ createdAt: -1 });
    console.log('Fetched promotions:', promotions);
    res.status(200).json({ success: true, data: promotions });
  } catch (error) {
    console.error('Error in getPromotions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xem chi tiết khuyến mãi (đã populate thông tin sản phẩm)
const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('products', 'productName price'); // Lấy thêm thông tin sản phẩm
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }
    console.log('Fetched promotion by ID:', promotion);
    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    console.error('Error in getPromotionById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chỉnh sửa khuyến mãi (đã thêm trường products)
const updatePromotion = async (req, res) => {
  try {
    const { code, discount, startDate, endDate, description, isActive, productIds } = req.body;
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    // Kiểm tra sản phẩm tồn tại nếu có productIds
    if (productIds && productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({ success: false, message: 'One or more products not found' });
      }
    }

    // Lưu danh sách sản phẩm cũ để so sánh
    const oldProductIds = promotion.products.map(id => id.toString());

    // Cập nhật các trường
    promotion.code = code || promotion.code;
    promotion.discount = discount || promotion.discount;
    promotion.startDate = startDate || promotion.startDate;
    promotion.endDate = endDate || promotion.endDate;
    promotion.description = description || promotion.description;
    promotion.isActive = isActive !== undefined ? isActive : promotion.isActive;
    promotion.products = productIds || promotion.products;

    // Kiểm tra ngày hợp lệ nếu có cập nhật
    if (new Date(promotion.startDate) >= new Date(promotion.endDate)) {
      return res.status(400).json({ success: false, message: 'startDate must be before endDate' });
    }

    await promotion.save({ writeConcern: { w: "majority", j: true } });

    // Cập nhật lại danh sách sản phẩm có khuyến mãi
    if (productIds && productIds.length > 0) {
      // Xóa promotionID khỏi các sản phẩm không còn trong danh sách
      const removedProductIds = oldProductIds.filter(id => !productIds.includes(id));
      if (removedProductIds.length > 0) {
        await Product.updateMany(
          { _id: { $in: removedProductIds } },
          { $pull: { promotionIDs: promotion._id } }
        );
      }

      // Thêm promotionID vào các sản phẩm mới
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $addToSet: { promotionIDs: promotion._id } }
      );
    } else {
      // Nếu không còn sản phẩm nào, xóa promotionID khỏi tất cả sản phẩm cũ
      await Product.updateMany(
        { _id: { $in: oldProductIds } },
        { $pull: { promotionIDs: promotion._id } }
      );
    }

    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    console.error('Error in updatePromotion:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Thêm sản phẩm vào khuyến mãi
const addProductsToPromotion = async (req, res) => {
  try {
    const { productIds } = req.body;
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    // Đảm bảo rằng trường `products` luôn là một mảng
    promotion.products = promotion.products || [];

    // Kiểm tra sản phẩm tồn tại
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, message: 'One or more products not found' });
    }

    // Thêm sản phẩm vào khuyến mãi (loại bỏ trùng lặp)
    const existingProducts = promotion.products.map(id => id.toString());
    const newProducts = productIds.filter(id => !existingProducts.includes(id));

    if (newProducts.length === 0) {
      return res.status(400).json({ success: false, message: 'All products already in promotion' });
    }

    promotion.products = [...promotion.products, ...newProducts];
    await promotion.save({ writeConcern: { w: "majority", j: true } });

    // Cập nhật các sản phẩm có khuyến mãi
    await Product.updateMany(
      { _id: { $in: newProducts } },
      { $addToSet: { promotionIDs: promotion._id } }
    );

    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    console.error('Error in addProductsToPromotion:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa sản phẩm khỏi khuyến mãi
const removeProductsFromPromotion = async (req, res) => {
  try {
    const { productIds } = req.body;
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    // Kiểm tra nếu products là undefined, nếu có thì khởi tạo nó thành mảng rỗng
    if (!Array.isArray(promotion.products)) {
      promotion.products = [];
    }

    // Lọc ra các sản phẩm không nằm trong danh sách cần xóa
    promotion.products = promotion.products.filter(
      productId => !productIds.includes(productId.toString())
    );

    await promotion.save({ writeConcern: { w: "majority", j: true } });

    // Cập nhật lại các sản phẩm sau khi xóa
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $pull: { promotionIDs: promotion._id } }
    );

    res.status(200).json({ success: true, data: promotion });
  } catch (error) {
    console.error('Error in removeProductsFromPromotion:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa khuyến mãi
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    // Xóa promotionID khỏi các sản phẩm liên quan
    if (promotion.products && promotion.products.length > 0) {
      await Product.updateMany(
        { _id: { $in: promotion.products } },
        { $pull: { promotionIDs: promotion._id } }
      );
    }

    await Promotion.findByIdAndDelete(req.params.id, {
      writeConcern: { w: "majority", j: true }
    });
    console.log('Deleted promotion:', promotion);
    res.status(200).json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error in deletePromotion:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  getAvailableProducts,
  addProductsToPromotion,
  removeProductsFromPromotion,
};