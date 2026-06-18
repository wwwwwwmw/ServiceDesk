import { Router } from 'express';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateCategory,
  deleteCategory,
  createServiceTemplate,
  updateServiceTemplate,
  deleteServiceTemplate,
  createKBArticle,
  updateKBArticle,
  deleteKBArticle,
  createLocation,
  updateLocation,
  deleteLocation,
  getAdminStats
} from '../controllers/adminController';

const router = Router();

// Toàn bộ các API trong router này đều yêu cầu đăng nhập và có role là admin
router.use(authenticateToken, requireRole(['admin']));

// Thống kê tổng quan quản trị
router.get('/stats', getAdminStats);

// Quản lý người dùng
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Quản lý khu vực
router.post('/locations', createLocation);
router.put('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

// Quản lý danh mục
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Quản lý mẫu điền sẵn
router.post('/service-templates', createServiceTemplate);
router.put('/service-templates/:id', updateServiceTemplate);
router.delete('/service-templates/:id', deleteServiceTemplate);

// Quản lý cẩm nang sửa lỗi
router.post('/knowledge-base', createKBArticle);
router.put('/knowledge-base/:id', updateKBArticle);
router.delete('/knowledge-base/:id', deleteKBArticle);

export default router;
