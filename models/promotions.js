// models/promotions.js
const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Mã khuyến mãi (ví dụ: "SALE20")
  discount: { type: Number, required: true }, // Mức giảm giá (ví dụ: 20% thì lưu 20)
  startDate: { type: Date, required: true }, // Ngày bắt đầu
  endDate: { type: Date, required: true }, // Ngày kết thúc
  description: { type: String }, // Mô tả (không bắt buộc)
  isActive: { type: Boolean, default: true }, // Trạng thái (kích hoạt hay không)
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'product' }], // Danh sách sản phẩm áp dụng khuyến mãi
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);