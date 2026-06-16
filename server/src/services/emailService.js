const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;

/**
 * Get or create the email transporter.
 * In dev mode without SMTP credentials, logs emails to console.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (config.email.user && config.email.pass) {
    // Real SMTP transport
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else {
    // Dev mode: use JSON transport (logs to console)
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return transporter;
}

/**
 * Send an email. In dev mode, logs the email content to console.
 */
async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  const mailOptions = {
    from: `"ExpenseTrack" <${config.email.from}>`,
    to,
    subject,
    html,
  };

  const info = await transport.sendMail(mailOptions);

  if (!config.email.user) {
    // Dev mode: log the email
    console.log('\n📧 ══════════════════════════════════════════');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    const parsed = JSON.parse(info.message);
    console.log(`  HTML: ${parsed.html?.substring(0, 200)}...`);
    console.log('══════════════════════════════════════════════\n');
  }

  return info;
}

/**
 * Send email verification email.
 */
async function sendVerificationEmail(email, token) {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Verify Your Email - ExpenseTrack',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1; margin: 0;">ExpenseTrack</h1>
          <p style="color: #64748b; margin-top: 5px;">Personal Finance Manager</p>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #475569; line-height: 1.6;">
            Thanks for signing up! Please click the button below to verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; 
                      padding: 14px 32px; border-radius: 8px; text-decoration: none; 
                      font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            This link expires in 24 hours. If you didn't create an account, ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  // Log the verification URL in dev mode for convenience
  if (!config.email.user) {
    console.log(`\n🔗 Verification URL: ${verifyUrl}\n`);
  }
}

/**
 * Send password reset email.
 */
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - ExpenseTrack',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1; margin: 0;">ExpenseTrack</h1>
          <p style="color: #64748b; margin-top: 5px;">Personal Finance Manager</p>
        </div>
        <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Reset Password</h2>
          <p style="color: #475569; line-height: 1.6;">
            You requested a password reset. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; 
                      padding: 14px 32px; border-radius: 8px; text-decoration: none; 
                      font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      </div>
    `,
  });

  if (!config.email.user) {
    console.log(`\n🔗 Reset URL: ${resetUrl}\n`);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
