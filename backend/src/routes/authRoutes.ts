import { Router } from 'express';
import { login, getMe, updateProfile, updatePassword } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Route Đăng nhập
router.post('/login', login);

// Route Lấy thông tin cá nhân hiện tại
router.get('/me', authenticateToken, getMe);

// Route Cập nhật thông tin cá nhân và đổi mật khẩu
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, updatePassword);

export default router;
