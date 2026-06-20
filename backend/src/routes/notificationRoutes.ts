import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Tất cả các API yêu cầu người dùng phải đăng nhập trước
router.use(authenticateToken);

router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);

export default router;
