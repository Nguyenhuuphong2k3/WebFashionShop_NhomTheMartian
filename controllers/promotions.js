const Promotion = require('../models/promotions');
const Product = require('../models/products');

// Tạo khuyến mãi (đã thêm trường products)
const createPromotion = async (req, res) => {
  try {
    const { code, discount, startDate, endDate, description, productIds } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!code || !discount || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Kiểm tra ngày hợp lệ
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    // Kiểm tra sản phẩm tồn tại nếu có productIds
    if (productIds && productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({ error: 'One or more products not found' });
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

    res.status(201).json(promotion);
  } catch (error) {
    console.error('Error in createPromotion:', error);
    res.status(400).json({ error: error.message });
  }
};

// Lấy danh sách sản phẩm có thể áp dụng khuyến mãi
const getAvailableProducts = async (req, res) => {
  try {
    // Lấy danh sách sản phẩm chưa có khuyến mãi hoặc có thể áp dụng thêm
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error('Error in getAvailableProducts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Xem danh sách khuyến mãi (đã populate thông tin sản phẩm)
const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate('products', 'name price') // Lấy thêm thông tin sản phẩm
      .sort({ createdAt: -1 });
    console.log('Fetched promotions:', promotions);
    res.json(promotions);
  } catch (error) {
    console.error('Error in getPromotions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Xem chi tiết khuyến mãi (đã populate thông tin sản phẩm)
const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('products', 'name price'); // Lấy thêm thông tin sản phẩm
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    console.log('Fetched promotion by ID:', promotion);
    res.json(promotion);
  } catch (error) {
    console.error('Error in getPromotionById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Chỉnh sửa khuyến mãi (đã thêm trường products)
const updatePromotion = async (req, res) => {
  try {
    const { code, discount, startDate, endDate, description, isActive, productIds } = req.body;
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Kiểm tra sản phẩm tồn tại nếu có productIds
    if (productIds && productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({ error: 'One or more products not found' });
      }
    }

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
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    await promotion.save({ writeConcern: { w: "majority", j: true } });

    // Cập nhật lại danh sách sản phẩm có khuyến mãi
    if (productIds && productIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $addToSet: { promotionIDs: promotion._id } }
      );
    }

    res.json(promotion);
  } catch (error) {
    console.error('Error in updatePromotion:', error);
    res.status(400).json({ error: error.message });
  }
};

// Thêm sản phẩm vào khuyến mãi
const addProductsToPromotion = async (req, res) => {
  try {
    const { productIds } = req.body;
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Đảm bảo rằng trường `products` luôn là một mảng
    promotion.products = promotion.products || [];

    // Kiểm tra sản phẩm tồn tại
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more products not found' });
    }

    // Thêm sản phẩm vào khuyến mãi (loại bỏ trùng lặp)
    const existingProducts = promotion.products.map(id => id.toString());
    const newProducts = productIds.filter(id => !existingProducts.includes(id));

    if (newProducts.length === 0) {
      return res.status(400).json({ error: 'All products already in promotion' });
    }

    promotion.products = [...promotion.products, ...newProducts];
    await promotion.save({ writeConcern: { w: "majority", j: true } });

    // Cập nhật các sản phẩm có khuyến mãi
    await Product.updateMany(
      { _id: { $in: newProducts } },
      { $addToSet: { promotionIDs: promotion._id } }
    );

    res.json(promotion);
  } catch (error) {
    console.error('Error in addProductsToPromotion:', error);
    res.status(400).json({ error: error.message });
  }
};

// Xóa sản phẩm khỏi khuyến mãi
const removeProductsFromPromotion = async (req, res) => {
  try {
    const { productIds } = req.body;
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
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

    res.json(promotion);
  } catch (error) {
    console.error('Error in removeProductsFromPromotion:', error);
    res.status(400).json({ error: error.message });
  }
};

// Xóa khuyến mãi
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id, {
      writeConcern: { w: "majority", j: true }
    });
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    console.log('Deleted promotion:', promotion);
    res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error in deletePromotion:', error);
    res.status(500).json({ error: error.message });
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