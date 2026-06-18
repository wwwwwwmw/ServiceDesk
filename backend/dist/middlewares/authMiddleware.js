"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware xác thực JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Định dạng: Bearer <TOKEN>
    if (!token) {
        return res.status(401).json({ error: 'Truy cập bị từ chối: Thiếu Token xác thực!' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn!' });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
// Middleware kiểm tra vai trò (RBAC)
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện hành động này!' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này!' });
        }
        next();
    };
};
exports.requireRole = requireRole;
