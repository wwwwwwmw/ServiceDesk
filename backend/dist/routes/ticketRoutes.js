"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketController_1 = require("../controllers/ticketController");
const serviceController_1 = require("../controllers/serviceController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Tất cả các API yêu cầu đăng nhập
router.use(authMiddleware_1.authenticateToken);
// Tìm kiếm người dùng qua email (cho mọi vai trò khi tạo ticket hộ)
router.get('/users/by-email', ticketController_1.findUserByEmail);
// Lấy danh sách kỹ thuật viên (Chỉ Manager/Admin mới có quyền để giao việc)
router.get('/employees', (0, authMiddleware_1.requireRole)(['manager', 'admin']), ticketController_1.getEmployees);
// Lấy danh sách người dùng thông thường (Chỉ Manager/Admin mới có quyền tạo hộ)
router.get('/users', (0, authMiddleware_1.requireRole)(['manager', 'admin']), ticketController_1.getUsers);
// API Mẫu Yêu Cầu Dịch Vụ
router.get('/service-templates', serviceController_1.getServiceTemplates);
router.get('/service-templates/:id', serviceController_1.getServiceTemplateById);
// API Bài viết hướng dẫn xử lý sự cố (Knowledge Base)
router.get('/knowledge-base', serviceController_1.getKnowledgeBaseArticles);
router.get('/knowledge-base/:id', serviceController_1.getKnowledgeBaseArticleById);
// Tạo mới ticket
router.post('/tickets', ticketController_1.createTicket);
// Lấy danh sách ticket (lọc phân quyền tự động bên trong Controller)
router.get('/tickets', ticketController_1.getTickets);
// Lấy chi tiết ticket (kèm form động)
router.get('/tickets/:id', ticketController_1.getTicketDetail);
// Giao việc kỹ thuật viên (Chỉ Manager/Admin)
router.patch('/tickets/:id/assign', (0, authMiddleware_1.requireRole)(['manager', 'admin']), ticketController_1.assignTicket);
// Cập nhật trạng thái (đang sửa/hoàn thành/đóng)
router.patch('/tickets/:id/status', ticketController_1.updateTicketStatus);
// Mở lại ticket (Reopen)
router.post('/tickets/:id/reopen', ticketController_1.reopenTicket);
exports.default = router;
