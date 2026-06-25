"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Route Đăng nhập
router.post('/login', authController_1.login);
// Route Quên mật khẩu (công khai)
router.post('/forgot-password', authController_1.forgotPassword);
// Route Lấy thông tin cá nhân hiện tại
router.get('/me', authMiddleware_1.authenticateToken, authController_1.getMe);
// Route Cập nhật thông tin cá nhân và đổi mật khẩu
router.put('/profile', authMiddleware_1.authenticateToken, authController_1.updateProfile);
router.put('/password', authMiddleware_1.authenticateToken, authController_1.updatePassword);
exports.default = router;
