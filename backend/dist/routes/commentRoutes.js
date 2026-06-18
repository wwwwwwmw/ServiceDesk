"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Yêu cầu đăng nhập cho tất cả các hoạt động
router.use(authMiddleware_1.authenticateToken);
// Gửi bình luận
router.post('/tickets/:id/comments', commentController_1.postComment);
// Lấy lịch sử timeline kết hợp (Comments & Logs)
router.get('/tickets/:id/timeline', commentController_1.getTimeline);
exports.default = router;
