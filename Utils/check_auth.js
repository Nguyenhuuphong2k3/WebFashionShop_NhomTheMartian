let jwt = require('jsonwebtoken')
let constants = require('../Utils/constants')
let userController = require('../controllers/users')
module.exports = {
  check_authentication: async function (req, res, next) {
    let token;
    if (!req.headers.authorization) {
      if (req.signedCookies.token) {
        token = req.signedCookies.token;
      }
    } else {
      let token_authorization = req.headers.authorization;
      if (token_authorization.startsWith("Bearer")) {
        token = token_authorization.split(" ")[1];
      }
    }
    if (!token) {
      next(new Error("ban chua dang nhap"))
    } else {
      let verifiedToken = jwt.verify(token, constants.SECRET_KEY);
      if (verifiedToken) {
        if (verifiedToken.expireIn > Date.now()) {
          console.log(verifiedToken);
          let user = await userController.getUserById(
            verifiedToken.id
          )
          req.user = user;
          next()
        } else {
          next(new Error("ban chua dang nhap"))
        }
      }
    }
  },
  check_authorization: function (roles) {
    return function (req, res, next) {
      if (roles.includes(req.user.role.roleName)) {
        next();
      } else {
        throw new Error("ban khong co quyen")
      }
    }
  }
}