// app.js
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
let cors = require('cors');
const multer = require('multer');

// Import các model trước mọi thứ khác
require('./models/products');
require('./models/categories');
require('./models/cart');
require('./models/users');
require('./models/orders');
require('./models/payment');
require('./models/roles');
require('./models/promotions'); // Thêm model promotions
require('./models/reviews');

// Sau khi các model đã được import, mới yêu cầu các route
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payment');
var promotionsRouter = require('./routes/promotions');

var app = express();

// Cấu hình multer để lưu file vào thư mục public/uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Tạo thư mục uploads nếu chưa tồn tại
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // Cho phép gửi cookie
}));

mongoose.connect("mongodb://localhost:27017/C2");
mongoose.connection.on("connected", () => {
    console.log("connected");
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('NNPTUD'));
app.use(express.static(path.join(__dirname, 'public')));

// Thêm route để upload ảnh
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ success: false, message: 'No file uploaded' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).send({ success: true, filePath });
});

// Định nghĩa các route
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/menus', require('./routes/menus'));
app.use('/roles', require('./routes/roles'));
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/categories', require('./routes/categories'));
app.use('/reviews', require('./routes/reviews'));
app.use('/orders', ordersRouter);
app.use('/cart', cartRoutes);
app.use('/payment', paymentRoutes);
app.use('/promotions', promotionsRouter);

// Phục vụ file tĩnh trong thư mục public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ==== ROUTES GIAO DIỆN (FRONTEND - THÊM VÔ ĐÂY) ====

// Trang chủ
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Trang đăng nhập
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Trang đăng ký
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Trang sản phẩm
app.get("/products", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "products.html"));
});

// Trang danh mục
app.get("/categories", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "categories.html"));
});

// Trang giỏ hàng
app.get("/cart", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "cart.html"));
});

// Trang đơn hàng
app.get("/orders", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "orders.html"));
});

// Trang thanh toán
app.get("/payment", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "payment.html"));
});

// Trang khuyến mãi
app.get("/promotions", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "promotions.html"));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.send({
        success: false,
        message: err.message
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;