"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
// Đăng nhập hệ thống (hỗ trợ cả Username và Email)
const login = async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên đăng nhập/email và mật khẩu!' });
    }
    try {
        // Tìm kiếm người dùng bằng username hoặc email, kết hợp lấy tên khu vực
        const userResult = await (0, db_1.query)(`SELECT u.id, u.username, u.email, u.password_hash, u.role, u.location_id, l.name as location_name 
       FROM users u 
       LEFT JOIN locations l ON u.location_id = l.id 
       WHERE u.username = $1 OR u.email = $1`, [usernameOrEmail]);
        if (userResult.rowCount === 0) {
            return res.status(401).json({ error: 'Tên đăng nhập, email hoặc mật khẩu không chính xác!' });
        }
        const user = userResult.rows[0];
        // So khớp mật khẩu đã mã hóa
        const isPasswordMatch = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Tên đăng nhập, email hoặc mật khẩu không chính xác!' });
        }
        // Tạo JWT token
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            location_id: user.location_id
        }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('[Auth Controller Error]:', error);
        return res.status(500).json({ error: 'Lỗi máy chủ trong quá trình xử lý đăng nhập!' });
    }
};
exports.login = login;
// Lấy thông tin tài khoản hiện tại từ token xác thực
const getMe = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa đăng nhập!' });
    }
    try {
        const userResult = await (0, db_1.query)(`SELECT u.id, u.username, u.email, u.role, u.location_id, l.name as location_name 
       FROM users u 
       LEFT JOIN locations l ON u.location_id = l.id 
       WHERE u.id = $1`, [req.user.id]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng này!' });
        }
        return res.status(200).json(userResult.rows[0]);
    }
    catch (error) {
        console.error('[GetMe Controller Error]:', error);
        return res.status(500).json({ error: 'Lỗi máy chủ khi lấy thông tin tài khoản!' });
    }
};
exports.getMe = getMe;
