import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  location_id: string | null;
}

// Mở rộng Request interface của Express để chứa dữ liệu user đã xác thực
export interface AuthRequest extends Request {
  user?: UserPayload;
}

// Middleware xác thực JWT token
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Định dạng: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ error: 'Truy cập bị từ chối: Thiếu Token xác thực!' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
    
    req.user = decoded as UserPayload;
    next();
  });
};

// Middleware kiểm tra vai trò (RBAC)
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện hành động này!' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này!' });
    }

    next();
  };
};
