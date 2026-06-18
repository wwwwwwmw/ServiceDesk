import { Response } from 'express';
import pool, { query } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// 1. Tạo mới Ticket (Tạo cho bản thân hoặc tạo hộ)
export const createTicket = async (req: AuthRequest, res: Response) => {
  const { title, requester_id, requester_email, category_id, location_id: custom_location_id, dynamic_data, priority, attachments } = req.body;
  const creator_id = req.user?.id;

  if (!title || !category_id || !dynamic_data) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tiêu đề, danh mục và điền dữ liệu form động!' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let finalRequesterId = requester_id;

    // Nếu truyền requester_email, tra cứu để tìm requester_id tương ứng
    if (requester_email) {
      const userByEmailResult = await client.query('SELECT id, location_id FROM users WHERE email = $1', [requester_email]);
      if (userByEmailResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Không tìm thấy người yêu cầu với email: ${requester_email}!` });
      }
      finalRequesterId = userByEmailResult.rows[0].id;
    }

    if (!finalRequesterId) {
      finalRequesterId = creator_id;
    }

    // Tra cứu thông tin người yêu cầu để lấy location_id mặc định
    const requesterResult = await client.query('SELECT location_id FROM users WHERE id = $1', [finalRequesterId]);
    if (requesterResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Không tìm thấy thông tin người yêu cầu thực tế trong hệ thống!' });
    }

    // Ưu tiên sử dụng custom_location_id từ request body, nếu không có mới dùng location_id mặc định của requester
    const finalLocationId = custom_location_id || requesterResult.rows[0].location_id;
    if (!finalLocationId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Người yêu cầu chưa được gán khu vực mặc định. Vui lòng liên hệ Admin thiết lập!' });
    }

    // Kiểm tra khu vực có tồn tại không
    const locationCheck = await client.query('SELECT id FROM locations WHERE id = $1', [finalLocationId]);
    if (locationCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Khu vực được chọn không hợp lệ hoặc không tồn tại!' });
    }

    // Kiểm tra danh mục hợp lệ
    const categoryResult = await client.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (categoryResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Danh mục sự cố/yêu cầu không tồn tại!' });
    }

    // Insert Ticket vào PostgreSQL
    const ticketResult = await client.query(
      `INSERT INTO tickets (title, requester_id, creator_id, category_id, location_id, priority, status, dynamic_data) 
       VALUES ($1, $2, $3, $4, $5, $6, 'open', $7) 
       RETURNING id, title, requester_id, creator_id, category_id, location_id, priority, status, created_at`,
      [
        title,
        finalRequesterId,
        creator_id,
        category_id,
        finalLocationId,
        priority || 'medium',
        JSON.stringify(dynamic_data)
      ]
    );

    const ticket = ticketResult.rows[0];

    // Ghi nhận log khởi tạo tự động
    await client.query(
      'INSERT INTO ticket_logs (ticket_id, user_id, action) VALUES ($1, $2, $3)',
      [ticket.id, creator_id, 'Khởi tạo ticket trạng thái OPEN']
    );

    // Lưu các file đính kèm nếu có gửi lên
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        const { file_name, file_type, file_data } = att;
        if (file_name && file_type && file_data) {
          await client.query(
            `INSERT INTO ticket_attachments (ticket_id, file_name, file_type, file_data)
             VALUES ($1, $2, $3, $4)`,
            [ticket.id, file_name, file_type, file_data]
          );
        }
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Gửi yêu cầu thành công!',
      ticket
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[CreateTicket Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo yêu cầu mới!' });
  } finally {
    client.release();
  }
};

// 2. Lấy danh sách Ticket (Có phân quyền dữ liệu dựa theo vai trò của User)
export const getTickets = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  const { status, location_id, priority } = req.query;

  try {
    let sql = `
      SELECT t.id, t.title, t.priority, t.status, t.created_at, t.resolved_at, t.closed_at,
             req.username as requester_name, 
             assign.username as assignee_name,
             cat.name as category_name, 
             loc.name as location_name 
      FROM tickets t
      JOIN users req ON t.requester_id = req.id
      LEFT JOIN users assign ON t.assignee_id = assign.id
      JOIN categories cat ON t.category_id = cat.id
      JOIN locations loc ON t.location_id = loc.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];

    // Phân quyền dữ liệu theo Role
    if (userRole === 'user') {
      // User thường chỉ được xem ticket mình yêu cầu hoặc mình tạo hộ
      conditions.push(`(t.requester_id = $${params.length + 1} OR t.creator_id = $${params.length + 1})`);
      params.push(userId);
    } else if (userRole === 'employee') {
      // Employee chỉ xem ticket được giao cho mình
      conditions.push(`t.assignee_id = $${params.length + 1}`);
      params.push(userId);
    }

    // Các bộ lọc bổ sung từ query params
    if (status) {
      conditions.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }
    if (location_id) {
      conditions.push(`t.location_id = $${params.length + 1}`);
      params.push(location_id);
    }
    if (priority) {
      conditions.push(`t.priority = $${params.length + 1}`);
      params.push(priority);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY t.created_at DESC';

    const result = await query(sql, params);
    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[GetTickets Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tải danh sách ticket!' });
  }
};

// 3. Lấy chi tiết một Ticket (Bao gồm dữ liệu Form động)
export const getTicketDetail = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const ticketResult = await query(
      `SELECT t.*, 
              req.username as requester_name, req.email as requester_email,
              creator.username as creator_name,
              assign.username as assignee_name,
              cat.name as category_name, cat.template_json,
              loc.name as location_name
       FROM tickets t
       JOIN users req ON t.requester_id = req.id
       JOIN users creator ON t.creator_id = creator.id
       LEFT JOIN users assign ON t.assignee_id = assign.id
       JOIN categories cat ON t.category_id = cat.id
       JOIN locations loc ON t.location_id = loc.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ticket yêu cầu!' });
    }

    const ticket = ticketResult.rows[0];

    // Kiểm tra quyền xem ticket chi tiết
    if (userRole === 'user' && ticket.requester_id !== userId && ticket.creator_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập thông tin ticket này!' });
    }
    if (userRole === 'employee' && ticket.assignee_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập ticket không được giao này!' });
    }

    // Lấy danh sách tệp đính kèm
    const attachmentsResult = await query(
      `SELECT id, file_name, file_type, file_data, created_at 
       FROM ticket_attachments 
       WHERE ticket_id = $1`,
      [id]
    );
    ticket.attachments = attachmentsResult.rows;

    return res.status(200).json(ticket);
  } catch (error: any) {
    console.error('[GetTicketDetail Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy thông tin chi tiết ticket!' });
  }
};

// 4. Manager phân công kỹ thuật viên (Assign Ticket)
export const assignTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { assignee_id, priority } = req.body;
  const managerId = req.user?.id;

  if (!assignee_id) {
    return res.status(400).json({ error: 'Vui lòng chọn nhân viên kỹ thuật cần phân công!' });
  }

  try {
    // Kiểm tra xem Employee có tồn tại và đúng role hay không
    const empResult = await query("SELECT username FROM users WHERE id = $1 AND role = 'employee'", [assignee_id]);
    if (empResult.rowCount === 0) {
      return res.status(400).json({ error: 'Nhân viên kỹ thuật được chọn không hợp lệ!' });
    }
    const employeeUsername = empResult.rows[0].username;

    // Cập nhật ticket
    let updateSql = `UPDATE tickets SET assignee_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP`;
    const params = [assignee_id, id];

    if (priority) {
      updateSql += `, priority = $3`;
      params.push(priority);
    }
    updateSql += ` WHERE id = $2 RETURNING id, status, priority`;

    const ticketResult = await query(updateSql, params);
    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ticket yêu cầu hoặc không gán được!' });
    }

    // Ghi nhận log hoạt động
    const actionText = `Đã phân công cho nhân viên: ${employeeUsername}${priority ? ` (Mức ưu tiên: ${priority})` : ''}`;
    await query(
      'INSERT INTO ticket_logs (ticket_id, user_id, action) VALUES ($1, $2, $3)',
      [id, managerId, actionText]
    );

    return res.status(200).json({
      message: 'Giao việc thành công!',
      ticket: ticketResult.rows[0]
    });

  } catch (error: any) {
    console.error('[AssignTicket Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi phân công việc!' });
  }
};

// 5. Cập nhật trạng thái xử lý (Employee: in_progress/resolved; Manager: closed)
export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!status) {
    return res.status(400).json({ error: 'Vui lòng cung cấp trạng thái mới!' });
  }

  // Danh sách các trạng thái hợp lệ để chuyển đổi
  const allowedStatuses = ['in_progress', 'resolved', 'closed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái chuyển đổi không hợp lệ!' });
  }

  try {
    // Lấy thông tin ticket hiện tại để check quyền
    const ticketResult = await query('SELECT requester_id, creator_id, assignee_id, status FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ticket yêu cầu!' });
    }
    const ticket = ticketResult.rows[0];

    // Ràng buộc quyền cập nhật:
    if (userRole === 'employee') {
      // Nhân viên chỉ được cập nhật ticket gán cho họ
      if (ticket.assignee_id !== userId) {
        return res.status(403).json({ error: 'Bạn không thể cập nhật trạng thái của ticket không thuộc về mình!' });
      }
      if (status === 'closed') {
        return res.status(403).json({ error: 'Chỉ Manager hoặc Admin mới được phép đóng ticket!' });
      }
    } else if (userRole === 'user') {
      // User thường không được gán trạng thái qua API này (phải dùng api /reopen riêng)
      return res.status(403).json({ error: 'Quyền hạn của bạn không được tự ý đổi trạng thái trực tiếp!' });
    }

    // Xây dựng SQL cập nhật tương ứng
    let updateSql = 'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status, id];

    if (status === 'resolved') {
      updateSql += ', resolved_at = CURRENT_TIMESTAMP';
    } else if (status === 'closed') {
      updateSql += ', closed_at = CURRENT_TIMESTAMP';
    }

    updateSql += ' WHERE id = $2 RETURNING id, status, resolved_at, closed_at';

    const updatedResult = await query(updateSql, params);

    // Ghi nhận log
    const logAction = `Đã cập nhật trạng thái từ [${ticket.status.toUpperCase()}] sang [${status.toUpperCase()}]`;
    await query(
      'INSERT INTO ticket_logs (ticket_id, user_id, action) VALUES ($1, $2, $3)',
      [id, userId, logAction]
    );

    return res.status(200).json({
      message: 'Cập nhật trạng thái thành công!',
      ticket: updatedResult.rows[0]
    });

  } catch (error: any) {
    console.error('[UpdateStatus Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật trạng thái!' });
  }
};

// 6. Mở lại Ticket (Reopen Ticket - Cho phép User yêu cầu hoặc Manager/Admin)
export const reopenTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ error: 'Vui lòng cung cấp lý do mở lại sự cố/yêu cầu!' });
  }

  try {
    // Lấy thông tin ticket để kiểm tra quyền
    const ticketResult = await query('SELECT requester_id, creator_id, status FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ticket yêu cầu!' });
    }
    const ticket = ticketResult.rows[0];

    // Chỉ cho phép Reopen các ticket đã hoàn thành (resolved)
    if (ticket.status !== 'resolved') {
      return res.status(400).json({ error: 'Chỉ các ticket ở trạng thái ĐÃ XONG (Resolved) mới có thể mở lại (Reopen)!' });
    }

    // Kiểm tra quyền Reopen: Phải là Requester, Creator, Manager hoặc Admin
    const isOwner = ticket.requester_id === userId || ticket.creator_id === userId;
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';

    if (!isOwner && !isManagerOrAdmin) {
      return res.status(403).json({ error: 'Bạn không có quyền mở lại sự cố này!' });
    }

    // Thực hiện mở lại
    const updatedResult = await query(
      `UPDATE tickets 
       SET status = 'reopened', resolved_at = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, status, resolved_at`,
      [id]
    );

    // Tự động chèn bình luận về lý do mở lại
    const commentContent = `[Yêu cầu mở lại] Lý do: ${reason}`;
    await query(
      'INSERT INTO ticket_comments (ticket_id, user_id, content) VALUES ($1, $2, $3)',
      [id, userId, commentContent]
    );

    // Ghi nhận log hoạt động
    await query(
      'INSERT INTO ticket_logs (ticket_id, user_id, action) VALUES ($1, $2, $3)',
      [id, userId, `Mở lại ticket (Reopen) với lý do: ${reason}`]
    );

    return res.status(200).json({
      message: 'Đã mở lại ticket thành công!',
      ticket: updatedResult.rows[0]
    });

  } catch (error: any) {
    console.error('[ReopenTicket Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi mở lại ticket!' });
  }
};

// 7. Lấy danh sách kỹ thuật viên (Employee) để gán việc
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.location_id, l.name as location_name 
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       WHERE u.role = 'employee' 
       ORDER BY u.username ASC`
    );
    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[GetEmployees Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách kỹ thuật viên!' });
  }
};

// 8. Lấy danh sách toàn bộ người dùng (Role = user) để Manager/Admin chọn tạo hộ ticket
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.location_id, l.name as location_name 
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       WHERE u.role = 'user' 
       ORDER BY u.username ASC`
    );
    return res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('[GetUsers Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách người dùng!' });
  }
};

// 9. Tìm kiếm người dùng bằng email để hỗ trợ tạo ticket hộ
export const findUserByEmail = async (req: AuthRequest, res: Response) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Vui lòng cung cấp email cần tra cứu!' });
  }

  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.location_id, l.name as location_name 
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng với email này!' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error('[FindUserByEmail Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tra cứu email người dùng!' });
  }
};
