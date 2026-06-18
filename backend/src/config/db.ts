import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function để truy vấn database nhanh chóng
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Log queries trong môi trường development nếu cần
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Database SQL]:', { text, duration, rowsCount: res.rowCount });
  }
  return res;
};

export default pool;
