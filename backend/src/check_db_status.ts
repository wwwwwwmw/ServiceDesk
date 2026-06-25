import { query } from './config/db';

const checkStatus = async () => {
  try {
    const result = await query(
      `SELECT pr.id, pr.status, pr.created_at, pr.completed_at, u.username, u.email 
       FROM password_reset_requests pr
       JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC`
    );
    console.log('--- RESET REQUESTS ---');
    result.rows.forEach((r, i) => {
      console.log(`${i+1}. ID: ${r.id} | User: ${r.username} | Status: ${r.status} | Completed: ${r.completed_at}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
};

checkStatus();
