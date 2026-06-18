import { Router } from 'express';
import { postComment, getTimeline } from '../controllers/commentController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Yêu cầu đăng nhập cho tất cả các hoạt động
router.use(authenticateToken);

// Gửi bình luận
router.post('/tickets/:id/comments', postComment);

// Lấy lịch sử timeline kết hợp (Comments & Logs)
router.get('/tickets/:id/timeline', getTimeline);

export default router;
