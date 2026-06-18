import { Response } from 'express';
import { query } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// 1. Thêm bình luận mới vào Ticket
export const postComment = async (req: AuthRequest, res: Response) => {
  const { id: ticket_id } = req.params; // ticket_id từ URL parameter
  const { content } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Nội dung bình luận không được để trống!' });
  }

  try {
    // Kiểm tra xem Ticket có tồn tại và user có quyền không
    const ticketResult = await query('SELECT requester_id, creator_id, assignee_id FROM tickets WHERE id = $1', [ticket_id]);
    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ticket yêu cầu!' });
    }
    const ticket = ticketResult.rows[0];

    // Quyền hạn bình luận: User chỉ được bình luận vào ticket của mình
    if (userRole === 'user' && ticket.requester_id !== userId && ticket.creator_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền bình luận trên ticket của người khác!' });
    }
    // Employee chỉ bình luận trên ticket được gán
    if (userRole === 'employee' && ticket.assignee_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền bình luận trên ticket không được giao!' });
    }

    // Insert bình luận
    const insertResult = await query(
      `INSERT INTO ticket_comments (ticket_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, ticket_id, user_id, content, created_at`,
      [ticket_id, userId, content]
    );

    // Lấy thông tin username để phản hồi ngay lập tức cho client
    const comment = insertResult.rows[0];
    comment.user_name = req.user?.username;
    comment.user_role = req.user?.role;

    return res.status(201).json({
      message: 'Gửi bình luận thành công!',
      comment
    });

  } catch (error: any) {
    console.error('[PostComment Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi gửi bình luận!' });
  }
};

// 2. Lấy danh sách timeline (Gồm cả Logs và Comments, sắp xếp theo thời gian tăng dần)
export const getTimeline = async (req: AuthRequest, res: Response) => {
  const { id: ticket_id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    // Kiểm tra quyền truy cập trước
    const ticketResult = await query('SELECT requester_id, creator_id, assignee_id FROM tickets WHERE id = $1', [ticket_id]);
    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ticket yêu cầu!' });
    }
    const ticket = ticketResult.rows[0];

    if (userRole === 'user' && ticket.requester_id !== userId && ticket.creator_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử hoạt động của ticket này!' });
    }
    if (userRole === 'employee' && ticket.assignee_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử hoạt động của ticket này!' });
    }

    // Lấy log gộp chung bình luận sử dụng UNION ALL
    const timelineResult = await query(
      `SELECT 'comment' as type, c.id, u.username as user_name, u.role as user_role, c.content, c.created_at
       FROM ticket_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = $1
       
       UNION ALL
       
       SELECT 'log' as type, l.id, u.username as user_name, u.role as user_role, l.action as content, l.created_at
       FROM ticket_logs l
       JOIN users u ON l.user_id = u.id
       WHERE l.ticket_id = $1
       
       ORDER BY created_at ASC`,
      [ticket_id]
    );

    return res.status(200).json(timelineResult.rows);

  } catch (error: any) {
    console.error('[GetTimeline Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tải timeline lịch sử!' });
  }
};
