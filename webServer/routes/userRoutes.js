const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const convertUserDataMiddleware = require('../middlewares/convertUserDataMiddleware');

// thông tin client
router.get('/getUserInfo', authMiddleware.authenticateToken, userController.getUserInfo);
// ls giao dịch client
router.get('/getUserPaymentHistory', authMiddleware.authenticateToken, userController.getUserPaymentHistory);
// thanh toán
router.post('/pay', authMiddleware.authenticateToken, userController.getUserInfo);
// render trang đăng ký tour
router.get('/getOrderPage'
, authMiddleware.authenticateToken
, convertUserDataMiddleware.getUserData
, userController.getOrderPage);
module.exports = router;
