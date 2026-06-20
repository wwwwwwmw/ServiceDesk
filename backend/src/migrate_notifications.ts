import pool from './config/db';

async function migrate() {
  console.log('[Migration]: Checking/Creating notifications table...');
  try {
    // 1. Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Create index on user_id if not exists
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    `);

    console.log('[Migration]: notifications table checked/created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Migration Error]:', error);
    process.exit(1);
  }
}

migrate();
