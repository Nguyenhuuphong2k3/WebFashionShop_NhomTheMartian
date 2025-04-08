// controllers/cartController.js
const mongoose = require('mongoose');
const Cart = mongoose.model('cart');
const Product = mongoose.model('product');

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });
    }
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Kiểm tra dữ liệu hợp lệ
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid productId or quantity' });
    }

    // Tìm sản phẩm theo ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Tìm giỏ hàng của người dùng
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Nếu chưa có giỏ hàng, tạo mới
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      // Nếu có rồi thì cập nhật số lượng
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Nếu chưa có thì thêm mới vào giỏ hàng
      cart.items.push({ product: productId, quantity });
    }

    // Lưu giỏ hàng trước để populate thông tin sản phẩm
    await cart.save();

    // Populate thông tin sản phẩm vào giỏ hàng
    cart = await Cart.findById(cart._id).populate('items.product');

    // Tính tổng giá trị của giỏ hàng
    cart.total = cart.items.reduce((acc, item) => {
      if (!item.product) {
        return acc; // Bỏ qua nếu sản phẩm không tồn tại
      }
      const price = Number(item.product.price) || 0;
      const qty = Number(item.quantity) || 0;
      return acc + (price * qty);
    }, 0);

    // Lưu lại giỏ hàng với tổng giá trị đã tính
    await cart.save();

    // Trả về giỏ hàng sau khi cập nhật
    res.status(201).json({ success: true, data: cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};