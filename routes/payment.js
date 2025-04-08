const express = require('express');
const router = express.Router();
const checkAuth = require('../Utils/check_auth');
const paymentController = require('../controllers/paymentController');

router.post('/create', checkAuth.check_authentication, paymentController.createPayment);

module.exports = router;