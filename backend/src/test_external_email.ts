import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const testExternal = async () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  if (pass && pass.includes(' ')) {
    pass = pass.replace(/\s+/g, '');
  }

  const targetEmail = 'anhle081004@gmail.com';

  console.log(`Sending from ${user} to ${targetEmail}...`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'ServiceDesk'}" <${user}>`,
      to: targetEmail,
      subject: 'ServiceDesk Test External Mail Delivery',
      text: 'This is a test email sent from ServiceDesk system to an external gmail account.',
    });
    console.log('✔ Nodemailer reports success!');
    console.log('Message ID:', info.messageId);
    console.log('Accepted Recipients:', info.accepted);
    console.log('Rejected Recipients:', info.rejected);
    console.log('Response String:', info.response);
  } catch (error: any) {
    console.error('✖ SMTP External Send FAILED!');
    console.error('Error Code:', error.code || 'N/A');
    console.error('Error Message:', error.message || error);
  }
  process.exit(0);
};

testExternal();
