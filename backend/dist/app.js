"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Tải tài liệu Swagger JSON
const swagger_json_1 = __importDefault(require("./config/swagger.json"));
// Import các routers
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
// Tải cấu hình biến môi trường
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Cấu hình Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Tích hợp tài liệu API Swagger UI
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
// Khai báo các Routes API
app.use('/api/auth', authRoutes_1.default);
app.use('/api', categoryRoutes_1.default); // Phục vụ /api/locations và /api/categories
app.use('/api', ticketRoutes_1.default); // Phục vụ /api/tickets, /api/employees...
app.use('/api', commentRoutes_1.default); // Phục vụ /api/tickets/:id/comments và /api/tickets/:id/timeline
app.use('/api', notificationRoutes_1.default); // Phục vụ các API liên quan đến thông báo
app.use('/api/admin', adminRoutes_1.default); // Phục vụ các API quản lý CRUD của Admin
// API Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Service Desk Backend is running successfully!',
        timestamp: new Date().toISOString()
    });
});
// Khởi chạy server
app.listen(PORT, () => {
    console.log(`[Server]: Express is running at http://localhost:${PORT}`);
    console.log(`[Swagger]: API Documentation is available at http://localhost:${PORT}/api-docs`);
});
