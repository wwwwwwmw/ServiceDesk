import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

/**
 * Gửi email thông báo đặt lại mật khẩu cho người dùng.
 */
export const sendResetEmail = async (toEmail: string, username: string, newPassword: string): Promise<boolean> => {
  // Nạp lại cấu hình từ file .env mới nhất để tránh việc cập nhật .env nhưng chưa restart server
  try {
    dotenv.config({ override: true });
  } catch (err) {
    console.error('[EmailService Warning] Không thể nạp lại file .env dynamically:', err);
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true'; // false cho cổng 587 (STARTTLS), true cho 465 (SSL)
  const user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const fromName = process.env.SMTP_FROM_NAME || 'ServiceDesk';

  console.log(`[EmailService]: Chuẩn bị gửi email đặt lại mật khẩu tới ${toEmail}...`);

  // Chuẩn hóa mật khẩu ứng dụng Gmail (bỏ khoảng trắng nếu có dạng xxxx xxxx xxxx xxxx)
  if (pass && pass.includes(' ')) {
    const cleanPass = pass.replace(/\s+/g, '');
    if (cleanPass.length === 16) {
      pass = cleanPass;
      console.log('[EmailService]: Đã chuẩn hóa mật khẩu ứng dụng Gmail (xóa khoảng trắng).');
    }
  }

  // Nếu thiếu thông tin cấu hình thì ghi log ra console và trả về true (Simulation mode)
  if (!user || !pass) {
    console.warn('[EmailService Warning]: Không cấu hình SMTP_USER hoặc SMTP_PASS trong file .env.');
    console.log(`[EMAIL SEND SIMULATION]:
    ========================================
    To: ${toEmail}
    From: "${fromName}" <${from}>
    Subject: Thông báo thay đổi mật khẩu tài khoản ServiceDesk
    Content:
    Chào ${username},
    Mật khẩu tài khoản của bạn đã được thay đổi. Mật khẩu mới là: ${newPassword}
    ========================================`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Để tránh lỗi chứng chỉ trên môi trường test/local
      },
      connectionTimeout: 5000,   // Giới hạn kết nối tối đa 5 giây
      greetingTimeout: 5000,     // Giới hạn phản hồi chào mừng tối đa 5 giây
      socketTimeout: 8000,       // Giới hạn phản hồi socket tối đa 8 giây
    });

    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: toEmail,
      subject: 'Thông báo thay đổi mật khẩu tài khoản ServiceDesk',
      text: `Chào ${username},\n\nMật khẩu tài khoản của bạn đã được thay đổi bởi quản trị viên theo yêu cầu của bạn.\n\nMật khẩu mới là: ${newPassword}\n\nVui lòng đăng nhập và thay đổi mật khẩu để bảo mật tài khoản của bạn.\n\nTrân trọng,\nBan quản trị ServiceDesk.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #e0f2fe; padding-bottom: 10px;">Thay đổi mật khẩu thành công</h2>
          <p>Chào <strong>${username}</strong>,</p>
          <p>Mật khẩu tài khoản của bạn trên hệ thống <strong>ServiceDesk</strong> đã được thay đổi thành công bởi quản trị viên theo yêu cầu khôi phục mật khẩu của bạn.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #475569;">Mật khẩu mới của bạn là:</p>
            <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold; color: #ef4444; letter-spacing: 1px;">${newPassword}</p>
          </div>
          
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">Vui lòng đăng nhập lại và thực hiện đổi mật khẩu ngay lập tức trong phần cài đặt cá nhân để đảm bảo an toàn tuyệt đối cho tài khoản của bạn.</p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Thư này được tạo tự động từ ServiceDesk. Vui lòng không trả lời thư này.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService Success]: Email đã được gửi đi thành công! MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[EmailService Error]: Gửi email thất bại:', error);
    return false;
  }
};
