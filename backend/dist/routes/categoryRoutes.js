"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = require("../controllers/categoryController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Tất cả các API yêu cầu đăng nhập
router.use(authMiddleware_1.authenticateToken);
// Lấy danh sách khu vực
router.get('/locations', categoryController_1.getLocations);
// Lấy danh sách danh mục (có thể lọc theo query ?type=request hoặc ?type=incident)
router.get('/categories', categoryController_1.getCategories);
// Tạo danh mục mới (Yêu cầu vai trò Admin)
router.post('/categories', (0, authMiddleware_1.requireRole)(['admin']), categoryController_1.createCategory);
exports.default = router;
