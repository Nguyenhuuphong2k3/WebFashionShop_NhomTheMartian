var express = require('express');
var router = express.Router();
let userController = require('../controllers/users');
const { check_authentication } = require('../Utils/check_auth');
let crypto = require('crypto')
let mailMiddleware = require('../Utils/sendMail')

router.post('/signup', async function (req, res, next) {
  try {
    let body = req.body;
    let result = await userController.createUser(
      body.username,
      body.password,
      body.email,
      'user'
    )
    res.status(200).send({
      success: true,
      data: result
    })
  } catch (error) {
    next(error);
  }

})
router.post('/login', async function (req, res, next) {
  try {
    let username = req.body.username;
    let password = req.body.password;
    let result = await userController.checkLogin(username, password);
    res.cookie('token', result, {
      httpOnly: true,
      expires: new Date(Date.now() + 30 * 60 * 1000),
      signed: true
    })
    res.status(200).send({
      success: true,
      data: result
    })
  } catch (error) {
    next(error);
  }
})
router.get('/me', check_authentication, async function (req, res, next) {
  try {
    res.status(200).send({
      success: true,
      data: req.user
    })
  } catch (error) {
    next();
  }
})

// Đăng xuất
router.post('/logout', async function (req, res, next) {
  try {
    res.clearCookie('token');
    sendResponse(res, true, null, 'Đăng xuất thành công!');
  } catch (error) {
    next(error);
  }
})

router.post('/forgotpasswood', async function (req, res, next) {
  let body = req.body;
  let email = body.email;
  let user = await userController.getUserByEmail(email);
  user.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenExp = new Date(Date.now() + 30 * 60 * 1000).getTime();
  await user.save();
  let url = `http://localhost:3000/auth/changepasswordforgot/${user.resetPasswordToken}`;
  let result = await mailMiddleware.sendmail(user.email, "link tim lai mk", url)
  res.send({
    message: "da gui thanh cong"
  })
})
router.post('/changepasswordforgot/:token', async function (req, res, next) {
  let body = req.body;
  let token = req.params.token;
  let password = body.password
  let user = await userController.getUserByToken(token)
  if (user.resetPasswordTokenExp > Date.now()) {
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExp = null;
    await user.save();
    res.send("da up date password")
  } else {
    res.send("token khong chinh xac")
  }
})

module.exports = router