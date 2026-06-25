import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendResetEmail } from '../services/emailService';

// 1. QUẢN LÝ NGƯỜI DÙNG (User Management CRUD)
// ==========================================

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.role, u.location_id, l.name as location_name, u.room, u.created_at
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       ORDER BY u.created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[Admin GetAllUsers Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách người dùng!' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { username, email, role, password, location_id, room } = req.body;

  if (!username || !email || !role || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ: username, email, role và mật khẩu!' });
  }

  try {
    // Check trùng username/email
    const userCheck = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (userCheck.rowCount !== null && userCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Username hoặc Email đã được sử dụng!' });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await query(
      `INSERT INTO users (username, email, role, password_hash, location_id, room)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role, location_id, room`,
      [username, email, role, password_hash, location_id || null, room || null]
    );

    return res.status(201).json({
      message: 'Tạo tài khoản người dùng thành công!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin CreateUser Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo tài khoản người dùng!' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, role, password, location_id, room } = req.body;

  if (!username || !email || !role) {
    return res.status(400).json({ error: 'Vui lòng cung cấp username, email và role!' });
  }

  try {
    // Check trùng username/email với các user khác
    const userCheck = await query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, id]
    );
    if (userCheck.rowCount !== null && userCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Username hoặc Email đã được sử dụng bởi tài khoản khác!' });
    }

    let result;
    if (password && password.trim() !== '') {
      // Cập nhật cả mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      result = await query(
        `UPDATE users 
         SET username = $1, email = $2, role = $3, location_id = $4, password_hash = $5, room = $6
         WHERE id = $7
         RETURNING id, username, email, role, location_id, room`,
        [username, email, role, location_id || null, password_hash, room || null, id]
      );
    } else {
      // Cập nhật không đổi mật khẩu
      result = await query(
        `UPDATE users 
         SET username = $1, email = $2, role = $3, location_id = $4, room = $5
         WHERE id = $6
         RETURNING id, username, email, role, location_id, room`,
        [username, email, role, location_id || null, room || null, id]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng cần cập nhật!' });
    }

    return res.status(200).json({
      message: 'Cập nhật tài khoản thành công!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin UpdateUser Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật tài khoản!' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const currentAdminId = req.user?.id;

  if (id === currentAdminId) {
    return res.status(400).json({ error: 'Bạn không thể tự xóa chính tài khoản Admin của mình!' });
  }

  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng để xóa!' });
    }
    return res.status(200).json({ message: 'Xóa tài khoản người dùng thành công!' });
  } catch (error) {
    console.error('[Admin DeleteUser Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xóa người dùng!' });
  }
};


// ==========================================
// 2. QUẢN LÝ DANH MỤC (Category Management CRUD)
// ==========================================

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type, template_json } = req.body;

  if (!name || !type || !template_json) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên, loại và cấu hình form động!' });
  }

  try {
    const parsedTemplate = typeof template_json === 'string' ? JSON.parse(template_json) : template_json;
    const result = await query(
      `UPDATE categories 
       SET name = $1, type = $2, template_json = $3 
       WHERE id = $4
       RETURNING id, name, type, template_json`,
      [name, type, JSON.stringify(parsedTemplate), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục yêu cầu!' });
    }

    return res.status(200).json({
      message: 'Cập nhật danh mục thành công!',
      category: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Admin UpdateCategory Error]:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Danh mục này đã tồn tại trong nhóm này rồi!' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật danh mục!' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy danh mục cần xóa!' });
    }
    return res.status(200).json({ message: 'Xóa danh mục thành công!' });
  } catch (error) {
    console.error('[Admin DeleteCategory Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xóa danh mục!' });
  }
};


// ==========================================
// 3. QUẢN LÝ MẪU ĐIỀN SẴN (Service Template Management CRUD)
// ==========================================

export const createServiceTemplate = async (req: Request, res: Response) => {
  const { title, category_id, description, prefilled_data } = req.body;

  if (!title || !category_id || !prefilled_data) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tiêu đề, danh mục và dữ liệu điền sẵn!' });
  }

  try {
    const parsedPrefill = typeof prefilled_data === 'string' ? JSON.parse(prefilled_data) : prefilled_data;
    const result = await query(
      `INSERT INTO service_templates (title, category_id, description, prefilled_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category_id, description, prefilled_data`,
      [title, category_id, description || '', JSON.stringify(parsedPrefill)]
    );

    return res.status(201).json({
      message: 'Tạo mẫu dịch vụ điền sẵn thành công!',
      template: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin CreateServiceTemplate Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo mẫu dịch vụ!' });
  }
};

export const updateServiceTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, category_id, description, prefilled_data } = req.body;

  if (!title || !category_id || !prefilled_data) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tiêu đề, danh mục và dữ liệu điền sẵn!' });
  }

  try {
    const parsedPrefill = typeof prefilled_data === 'string' ? JSON.parse(prefilled_data) : prefilled_data;
    const result = await query(
      `UPDATE service_templates 
       SET title = $1, category_id = $2, description = $3, prefilled_data = $4
       WHERE id = $5
       RETURNING id, title, category_id, description, prefilled_data`,
      [title, category_id, description || '', JSON.stringify(parsedPrefill), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy mẫu dịch vụ cần cập nhật!' });
    }

    return res.status(200).json({
      message: 'Cập nhật mẫu dịch vụ thành công!',
      template: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin UpdateServiceTemplate Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật mẫu dịch vụ!' });
  }
};

export const deleteServiceTemplate = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM service_templates WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy mẫu dịch vụ cần xóa!' });
    }
    return res.status(200).json({ message: 'Xóa mẫu dịch vụ thành công!' });
  } catch (error) {
    console.error('[Admin DeleteServiceTemplate Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xóa mẫu dịch vụ!' });
  }
};


// ==========================================
// 4. QUẢN LÝ CẨM NANG HƯỚNG DẪN (Knowledge Base CRUD)
// ==========================================

export const createKBArticle = async (req: Request, res: Response) => {
  const { title, category_id, issue_description, resolution_guide } = req.body;

  if (!title || !category_id || !issue_description || !resolution_guide) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tiêu đề, danh mục, mô tả lỗi và cẩm nang sửa lỗi!' });
  }

  try {
    const result = await query(
      `INSERT INTO knowledge_base (title, category_id, issue_description, resolution_guide)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category_id, issue_description, resolution_guide`,
      [title, category_id, issue_description, resolution_guide]
    );

    return res.status(201).json({
      message: 'Tạo bài hướng dẫn xử lý sự cố thành công!',
      article: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin CreateKBArticle Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo hướng dẫn!' });
  }
};

export const updateKBArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, category_id, issue_description, resolution_guide } = req.body;

  if (!title || !category_id || !issue_description || !resolution_guide) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tiêu đề, danh mục, mô tả lỗi và hướng dẫn khắc phục!' });
  }

  try {
    const result = await query(
      `UPDATE knowledge_base 
       SET title = $1, category_id = $2, issue_description = $3, resolution_guide = $4
       WHERE id = $5
       RETURNING id, title, category_id, issue_description, resolution_guide`,
      [title, category_id, issue_description, resolution_guide, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết hướng dẫn cần cập nhật!' });
    }

    return res.status(200).json({
      message: 'Cập nhật hướng dẫn thành công!',
      article: result.rows[0]
    });
  } catch (error) {
    console.error('[Admin UpdateKBArticle Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật hướng dẫn!' });
  }
};

export const deleteKBArticle = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM knowledge_base WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy hướng dẫn cần xóa!' });
    }
    return res.status(200).json({ message: 'Xóa bài viết hướng dẫn thành công!' });
  } catch (error) {
    console.error('[Admin DeleteKBArticle Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xóa hướng dẫn!' });
  }
};

// ==========================================
// 5. QUẢN LÝ KHU VỰC (Location Management CRUD)
// ==========================================

export const createLocation = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tên khu vực!' });
  }
  try {
    const result = await query(
      'INSERT INTO locations (name) VALUES ($1) RETURNING id, name, created_at',
      [name]
    );
    return res.status(201).json({
      message: 'Tạo khu vực thành công!',
      location: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Admin CreateLocation Error]:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Khu vực này đã tồn tại!' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ khi tạo khu vực!' });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tên khu vực!' });
  }
  try {
    const result = await query(
      'UPDATE locations SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
      [name, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khu vực để cập nhật!' });
    }
    return res.status(200).json({
      message: 'Cập nhật khu vực thành công!',
      location: result.rows[0]
    });
  } catch (error: any) {
    console.error('[Admin UpdateLocation Error]:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Khu vực này đã tồn tại!' });
    }
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật khu vực!' });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM locations WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khu vực để xóa!' });
    }
    return res.status(200).json({ message: 'Xóa khu vực thành công!' });
  } catch (error) {
    console.error('[Admin DeleteLocation Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xóa khu vực!' });
  }
};

// ==========================================
// 6. THỐNG KÊ QUẢN TRỊ (Admin Dashboard Stats)
// ==========================================

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const usersRes = await query('SELECT COUNT(*)::int as count FROM users');
    const locationsRes = await query('SELECT COUNT(*)::int as count FROM locations');
    const categoriesRes = await query('SELECT COUNT(*)::int as count FROM categories');
    const templatesRes = await query('SELECT COUNT(*)::int as count FROM service_templates');
    const guidesRes = await query('SELECT COUNT(*)::int as count FROM knowledge_base');
    const resetsRes = await query(`SELECT COUNT(*)::int as count FROM password_reset_requests WHERE status = 'pending'`);

    return res.status(200).json({
      usersCount: usersRes.rows[0]?.count || 0,
      locationsCount: locationsRes.rows[0]?.count || 0,
      categoriesCount: categoriesRes.rows[0]?.count || 0,
      templatesCount: templatesRes.rows[0]?.count || 0,
      guidesCount: guidesRes.rows[0]?.count || 0,
      passwordResetsCount: resetsRes.rows[0]?.count || 0
    });
  } catch (error) {
    console.error('[Admin GetStats Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy thống kê quản trị!' });
  }
};

// Lấy danh sách yêu cầu đặt lại mật khẩu
export const getPasswordResets = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT pr.id, pr.status, pr.created_at, pr.completed_at,
              u.id as user_id, u.username, u.email
       FROM password_reset_requests pr
       JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('[Admin GetPasswordResets Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách yêu cầu đặt lại mật khẩu!' });
  }
};

// Xử lý đặt lại mật khẩu và gửi email
export const processPasswordReset = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.trim() === '') {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu mới!' });
  }

  try {
    // 1. Kiểm tra yêu cầu tồn tại và chưa hoàn thành
    const prCheck = await query(
      `SELECT pr.user_id, u.email, u.username 
       FROM password_reset_requests pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.id = $1 AND pr.status = 'pending'`,
      [id]
    );

    if (prCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Yêu cầu không tồn tại hoặc đã được xử lý từ trước!' });
    }

    const { user_id, email, username } = prCheck.rows[0];

    // 2. Mã hóa và cập nhật mật khẩu cho user
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password.trim(), salt);

    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, user_id]);

    // 3. Cập nhật trạng thái yêu cầu
    await query(
      `UPDATE password_reset_requests 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );

    // 4. Gửi email thông báo cho người dùng (Chạy bất đồng bộ để tránh chặn phản hồi API của Admin)
    sendResetEmail(email, username, new_password.trim()).then(success => {
      console.log(`[EmailService Result]: Gửi mail đặt lại mật khẩu tới ${email}: ${success ? 'Thành công' : 'Thất bại'}`);
    }).catch(err => {
      console.error('[EmailService Promise Error]:', err);
    });

    // 5. Tạo thông báo trong hệ thống cho người dùng đó biết
    await query(
      `INSERT INTO notifications (user_id, title, content) 
       VALUES ($1, 'Đặt lại mật khẩu thành công', 'Mật khẩu tài khoản của bạn đã được quản trị viên đặt lại và gửi qua email.')`,
      [user_id]
    );

    return res.status(200).json({
      message: 'Đặt lại mật khẩu thành công và đã gửi email thông báo cho người dùng!'
    });
  } catch (error) {
    console.error('[Admin ProcessPasswordReset Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi xử lý đặt lại mật khẩu!' });
  }
};


