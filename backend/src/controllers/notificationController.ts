import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

/**
 * Lấy danh sách 50 thông báo gần nhất của người dùng.
 */
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Người dùng chưa được xác thực!' });
  }

  try {
    const result = await query(
      'SELECT id, title, content, is_read, ticket_id, created_at FROM notifications WHERE user_id = $1 ORDER BY is_read ASC, created_at DESC LIMIT 50',
      [userId]
    );
    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[GetNotifications Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách thông báo!' });
  }
};

/**
 * Đánh dấu một thông báo cụ thể là đã đọc.
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Người dùng chưa được xác thực!' });
  }

  try {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo hoặc bạn không có quyền thao tác!' });
    }

    return res.status(200).json({
      message: 'Đã đánh dấu đã đọc!',
      notification: result.rows[0]
    });
  } catch (error: any) {
    console.error('[MarkAsRead Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật thông báo!' });
  }
};

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc.
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Người dùng chưa được xác thực!' });
  }

  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    
    return res.status(200).json({
      message: 'Đã đánh dấu tất cả thông báo là đã đọc!'
    });
  } catch (error: any) {
    console.error('[MarkAllAsRead Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật toàn bộ thông báo!' });
  }
};
