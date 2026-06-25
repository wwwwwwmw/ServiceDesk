import pool from './config/db';

async function migrate() {
  console.log('[Migration V2]: Starting schema updates for Room and Password Reset...');
  try {
    // 1. Add 'room' column to users
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS room VARCHAR(255);
    `);
    console.log('[Migration V2]: Column "room" added to table "users" (if not exists).');

    // 2. Add 'room' column to tickets
    await pool.query(`
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS room VARCHAR(255);
    `);
    console.log('[Migration V2]: Column "room" added to table "tickets" (if not exists).');

    // 3. Create password_reset_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('[Migration V2]: Table "password_reset_requests" checked/created successfully.');

    // 4. Update seed data with sample rooms for testing
    console.log('[Migration V2]: Updating existing users with sample default rooms...');
    await pool.query(`UPDATE users SET room = 'Phòng 103' WHERE username IN ('employee1', 'employee2', 'user3', 'user4')`);
    await pool.query(`UPDATE users SET room = 'Phòng 201' WHERE username IN ('user1', 'user5')`);
    await pool.query(`UPDATE users SET room = 'Phòng 204' WHERE username IN ('employee3', 'employee4')`);
    await pool.query(`UPDATE users SET room = 'Phòng 305' WHERE username IN ('employee5', 'user2')`);
    console.log('[Migration V2]: Seed data rooms updated successfully.');

    console.log('[Migration V2]: Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Migration V2 Error]:', error);
    process.exit(1);
  }
}

migrate();
