import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

// Tải tài liệu Swagger JSON
import swaggerDocument from './config/swagger.json';

// Import các routers
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import ticketRoutes from './routes/ticketRoutes';
import commentRoutes from './routes/commentRoutes';
import adminRoutes from './routes/adminRoutes';

// Tải cấu hình biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middlewares
app.use(cors());
app.use(express.json());

// Tích hợp tài liệu API Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Khai báo các Routes API
app.use('/api/auth', authRoutes);
app.use('/api', categoryRoutes); // Phục vụ /api/locations và /api/categories
app.use('/api', ticketRoutes);   // Phục vụ /api/tickets, /api/employees...
app.use('/api', commentRoutes);  // Phục vụ /api/tickets/:id/comments và /api/tickets/:id/timeline
app.use('/api/admin', adminRoutes); // Phục vụ các API quản lý CRUD của Admin

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
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
