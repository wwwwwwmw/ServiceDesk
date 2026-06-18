import { Router } from 'express';
import { getLocations, getCategories, createCategory } from '../controllers/categoryController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Tất cả các API yêu cầu đăng nhập
router.use(authenticateToken);

// Lấy danh sách khu vực
router.get('/locations', getLocations);

// Lấy danh sách danh mục (có thể lọc theo query ?type=request hoặc ?type=incident)
router.get('/categories', getCategories);

// Tạo danh mục mới (Yêu cầu vai trò Admin)
router.post('/categories', requireRole(['admin']), createCategory);

export default router;
