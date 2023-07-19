const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.renderRegisterPage);
router.post('/register', authController.register);
router.get('/login', authController.renderLoginPage);
router.post('/login', authController.login);
module.exports = router;
