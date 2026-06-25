import { Router } from 'express';
import { 
  createTicket, 
  getTickets, 
  getTicketDetail, 
  assignTicket, 
  updateTicketStatus, 
  reopenTicket,
  getEmployees,
  getUsers,
  findUserByEmail,
  getReports
} from '../controllers/ticketController';
import { 
  getServiceTemplates,
  getServiceTemplateById,
  getKnowledgeBaseArticles,
  getKnowledgeBaseArticleById
} from '../controllers/serviceController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Tất cả các API yêu cầu đăng nhập
router.use(authenticateToken);

// Tìm kiếm người dùng qua email (cho mọi vai trò khi tạo ticket hộ)
router.get('/users/by-email', findUserByEmail);

// Lấy danh sách kỹ thuật viên (Chỉ Manager/Admin mới có quyền để giao việc)
router.get('/employees', requireRole(['manager', 'admin']), getEmployees);

// Lấy danh sách người dùng thông thường (Chỉ Manager/Admin mới có quyền tạo hộ)
router.get('/users', requireRole(['manager', 'admin']), getUsers);

// API Mẫu Yêu Cầu Dịch Vụ
router.get('/service-templates', getServiceTemplates);
router.get('/service-templates/:id', getServiceTemplateById);

// API Bài viết hướng dẫn xử lý sự cố (Knowledge Base)
router.get('/knowledge-base', getKnowledgeBaseArticles);
router.get('/knowledge-base/:id', getKnowledgeBaseArticleById);

// Tạo mới ticket
router.post('/tickets', createTicket);

// Lấy danh sách ticket (lọc phân quyền tự động bên trong Controller)
router.get('/tickets', getTickets);

// Lấy danh sách ticket thống kê báo cáo (lọc nâng cao)
router.get('/reports', getReports);

// Lấy chi tiết ticket (kèm form động)
router.get('/tickets/:id', getTicketDetail);

// Giao việc kỹ thuật viên (Chỉ Manager/Admin)
router.patch('/tickets/:id/assign', requireRole(['manager', 'admin']), assignTicket);

// Cập nhật trạng thái (đang sửa/hoàn thành/đóng)
router.patch('/tickets/:id/status', updateTicketStatus);

// Mở lại ticket (Reopen)
router.post('/tickets/:id/reopen', reopenTicket);

export default router;
