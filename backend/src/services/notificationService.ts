import pool from '../config/db';

/**
 * Tạo một thông báo mới cho người dùng cụ thể.
 */
export const createNotification = async (
  userId: string,
  title: string,
  content: string,
  ticketId?: string,
  client?: any
) => {
  const db = client || pool;
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, content, ticket_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, content, ticketId || null]
    );
    return result.rows[0];
  } catch (error) {
    console.error('[CreateNotification Error]:', error);
  }
};

/**
 * Gửi thông báo đến toàn bộ các Manager và Admin.
 */
export const notifyManagersAndAdmins = async (
  title: string,
  content: string,
  ticketId: string,
  client?: any
) => {
  const db = client || pool;
  try {
    const usersResult = await db.query("SELECT id FROM users WHERE role IN ('manager', 'admin')");
    for (const row of usersResult.rows) {
      await createNotification(row.id, title, content, ticketId, db);
    }
  } catch (error) {
    console.error('[NotifyManagersAndAdmins Error]:', error);
  }
};

/**
 * Gửi thông báo tới toàn bộ các người dùng liên quan đến ticket (người tạo, người yêu cầu, người xử lý),
 * ngoại trừ người vừa thực hiện hành động (excludeUserId).
 */
export const notifyTicketInvolvedUsers = async (
  ticketId: string,
  excludeUserId: string,
  title: string,
  content: string,
  client?: any
) => {
  const db = client || pool;
  try {
    const ticketResult = await db.query(
      'SELECT creator_id, requester_id, assignee_id FROM tickets WHERE id = $1',
      [ticketId]
    );
    if (ticketResult.rowCount === 0) return;

    const { creator_id, requester_id, assignee_id } = ticketResult.rows[0];
    const userIds = new Set<string>();
    
    if (creator_id) userIds.add(creator_id);
    if (requester_id) userIds.add(requester_id);
    if (assignee_id) userIds.add(assignee_id);
    
    // Loại trừ người vừa tương tác
    userIds.delete(excludeUserId);

    for (const userId of userIds) {
      await createNotification(userId, title, content, ticketId, db);
    }
  } catch (error) {
    console.error('[NotifyTicketInvolvedUsers Error]:', error);
  }
};
