import nodemailer from "nodemailer";

/**
 * Send password reset email using Nodemailer with Gmail Account & Google App Password
 */
export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
  // Strip any spaces from Google App Password if copied as "xxxx xxxx xxxx xxxx"
  const emailAppPassword = process.env.EMAIL_APP_PASSWORD
    ? process.env.EMAIL_APP_PASSWORD.trim().replace(/\s+/g, "")
    : "";

  const displayName = name || "User";

  // Safe server-side diagnostic status logging (NO secret credentials exposed)
  if (process.env.NODE_ENV !== "production") {
    console.log("Email configuration status:", {
      emailConfigured: Boolean(emailUser),
      appPasswordConfigured: Boolean(emailAppPassword),
      appUrlConfigured: Boolean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL),
    });
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f9fafb; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .logo { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 8px 14px; font-size: 14px; font-weight: 700; color: #f59e0b; margin-bottom: 24px; }
          h1 { font-size: 20px; font-weight: 800; margin: 0 0 12px 0; color: #ffffff; }
          p { font-size: 14px; line-height: 1.6; color: #9ca3af; margin: 0 0 20px 0; }
          .btn-container { margin: 28px 0; text-align: center; }
          .btn { display: inline-block; background-color: #f59e0b; color: #0b0f17; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; transition: all 0.2s; }
          .footer { font-size: 12px; color: #6b7280; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 28px; }
          .link-box { word-break: break-all; font-size: 11px; color: #9ca3af; background: #1f2937; padding: 10px; border-radius: 8px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Lead Management CRM</div>
          <h1>Reset your password</h1>
          <p>Hello ${displayName},</p>
          <p>We received a request to reset your password for your Lead Management CRM account. Click the button below to create a new password:</p>
          
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>

          <p>This link will expire in <strong>1 hour</strong>.</p>
          <p>If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.</p>

          <div class="footer">
            Regards,<br>
            <strong>Lead Management CRM Team</strong>
            <div style="margin-top: 12px;">If the button above does not work, copy and paste this URL into your browser:</div>
            <div class="link-box">${resetUrl}</div>
          </div>
        </div>
      </body>
    </html>
  `;

  // If email credentials are not set, log safe dev fallback message
  if (!emailUser || !emailAppPassword) {
    console.log("\n[SERVER WARNING] EMAIL_USER or EMAIL_APP_PASSWORD is not configured in environment.");
    if (process.env.NODE_ENV !== "production") {
      console.log("============ 🔑 DEV MODE PASSWORD RESET LINK ============");
      console.log(`Target Email: ${to}`);
      console.log(`Reset URL:    ${resetUrl}`);
      console.log("=========================================================\n");
    }
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailAppPassword,
      },
    });

    // Development connection verification
    if (process.env.NODE_ENV !== "production") {
      try {
        await transporter.verify();
        console.log("Nodemailer Gmail transporter authentication verified successfully.");
      } catch (verifyErr) {
        console.error("Nodemailer Gmail verification failed:", {
          message: verifyErr?.message,
          code: verifyErr?.code,
          command: verifyErr?.command,
          response: verifyErr?.response,
        });
      }
    }

    const info = await transporter.sendMail({
      from: `"Lead Management CRM" <${emailUser}>`,
      to,
      subject: "Reset your password",
      html: htmlContent,
    });

    console.log(`Password reset email successfully sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Password reset email failed:", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
    });
    return { success: false, error: error?.message || "Failed to send email via Gmail." };
  }
}
