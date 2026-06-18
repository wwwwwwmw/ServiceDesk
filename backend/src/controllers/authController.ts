import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';

// Đăng nhập hệ thống (hỗ trợ cả Username và Email)
export const login = async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên đăng nhập/email và mật khẩu!' });
  }

  try {
    // Tìm kiếm người dùng bằng username hoặc email, kết hợp lấy tên khu vực
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.role, u.location_id, l.name as location_name 
       FROM users u 
       LEFT JOIN locations l ON u.location_id = l.id 
       WHERE u.username = $1 OR u.email = $1`,
      [usernameOrEmail]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập, email hoặc mật khẩu không chính xác!' });
    }

    const user = userResult.rows[0];

    // So khớp mật khẩu đã mã hóa
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập, email hoặc mật khẩu không chính xác!' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        location_id: user.location_id
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Trả về kết quả
    return res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        location_id: user.location_id,
        location_name: user.location_name
      }
    });

  } catch (error: any) {
    console.error('[Auth Controller Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ trong quá trình xử lý đăng nhập!' });
  }
};

// Lấy thông tin tài khoản hiện tại từ token xác thực
export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa đăng nhập!' });
  }

  try {
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.role, u.location_id, l.name as location_name 
       FROM users u 
       LEFT JOIN locations l ON u.location_id = l.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này!' });
    }

    return res.status(200).json(userResult.rows[0]);
  } catch (error: any) {
    console.error('[GetMe Controller Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy thông tin tài khoản!' });
  }
};

// Cập nhật thông tin cá nhân (username, email, location_id)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { username, email, location_id } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Tên người dùng và Email không được để trống!' });
  }

  try {
    // Kiểm tra xem tên đăng nhập hoặc email đã tồn tại ở tài khoản khác chưa
    const checkDuplicate = await query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, userId]
    );

    if (checkDuplicate.rowCount !== null && checkDuplicate.rowCount > 0) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc Email đã được sử dụng bởi một tài khoản khác!' });
    }

    // Cập nhật thông tin
    await query(
      'UPDATE users SET username = $1, email = $2, location_id = $3 WHERE id = $4',
      [username, email, location_id || null, userId]
    );

    // Lấy thông tin mới nhất bao gồm cả tên khu vực
    const updatedUserResult = await query(
      `SELECT u.id, u.username, u.email, u.role, u.location_id, l.name as location_name 
       FROM users u 
       LEFT JOIN locations l ON u.location_id = l.id 
       WHERE u.id = $1`,
      [userId]
    );

    const updatedUser = updatedUserResult.rows[0];

    // Tạo JWT token mới
    const token = jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        location_id: updatedUser.location_id
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Cập nhật thông tin thành công!',
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error('[UpdateProfile Controller Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật thông tin cá nhân!' });
  }
};

// Đổi mật khẩu
export const updatePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới!' });
  }

  try {
    // Lấy mật khẩu cũ trong database
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng!' });
    }

    const user = userResult.rows[0];

    // So khớp mật khẩu cũ
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: 'Mật khẩu cũ không chính xác!' });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const new_password_hash = await bcrypt.hash(newPassword, salt);

    // Cập nhật vào database
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [new_password_hash, userId]);

    return res.status(200).json({ message: 'Thay đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('[UpdatePassword Controller Error]:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật mật khẩu!' });
  }
};
