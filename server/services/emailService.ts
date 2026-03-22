import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const createTransporter = () => {
    const currentPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
    const currentUser = (process.env.SMTP_USER || '').trim();

    if (!currentUser || !currentPass) {
      console.error('[SMTP] CRITICAL: SMTP_USER or SMTP_PASS is missing in Render dashboard.');
      return null;
    }
    
    console.log(`[SMTP] Attempting Service:Gmail for ${currentUser}...`);
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: currentUser, pass: currentPass },
      logger: true,
      debug: false,
      tls: {
        rejectUnauthorized: false
      }
    } as any);
};

export const emailService = {
  sendVerificationEmail: async (email: string, code: string) => {
    const transporter = createTransporter();
    if (!transporter) return { success: false };

    const currentUser = (process.env.SMTP_USER || '').trim();
    const mailOptions = {
      from: `"PS-CRM System" <${currentUser}>`,
      to: email,
      subject: 'Email Verification - Smart Public Services CRM',
      html: `<div style="padding: 20px; font-family: sans-serif; background: #f8fafc; border-radius: 12px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Verification Required</h2>
          <p style="color: #475569; font-size: 16px; margin-top: 20px;">Your registration is almost complete. Please enter the following 6-digit code into the application:</p>
          <div style="background: #ffffff; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; border: 2px dashed #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1d4ed8; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 5 minutes for your security.</p>
        </div>`
    };

    try {
      console.log(`[EMAIL] Dispatching Verification to ${email}...`);
      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ Successfully sent verification to ${email}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[EMAIL] ❌ Delivery Critical Error: ${err.message}`);
      return { success: false };
    }
  },

  sendTrackingCodeEmail: async (email: string, trackingCode: string, complaintId: string, category: string) => {
    const transporter = createTransporter();
    if (!transporter) return;

    const currentUser = (process.env.SMTP_USER || '').trim();
    const mailOptions = {
        from: `"PS-CRM" <${currentUser}>`,
        to: email,
        subject: `Tracking ID: ${complaintId} - Verification Successful`,
        html: `
        <div style="font-family: sans-serif; padding: 25px; max-width: 600px; margin: auto; border-radius: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
          <h1 style="color: #2563eb; font-size: 24px;">Complaint Logged & Verified</h1>
          <p>Your official tracking ID has been generated and is now active in the system.</p>
          <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 5px solid #2563eb; margin: 20px 0;">
             <strong>Tracking ID:</strong> <span style="font-size: 18px; color: #1e40af;">${trackingCode}</span><br>
             <strong>Complaint Reference:</strong> ${complaintId}<br>
             <strong>Category:</strong> ${category}
          </div>
          <p>You can track your case anytime with this ID.</p>
        </div>`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err: any) {
      console.warn(`[EMAIL] Tracking email for ${trackingCode} failed - ${err.message}`);
    }
  },

  sendForgotPasswordEmail: async (email: string, code: string, role: 'Citizen' | 'Officer' | 'Admin') => {
    const transporter = createTransporter();
    if (!transporter) return { success: false };

    const currentUser = (process.env.SMTP_USER || '').trim();
    const mailOptions = {
      from: `"PS-CRM Security" <${currentUser}>`,
      to: email,
      subject: 'Password Recovery - Action Required',
      html: `<div style="padding: 20px; font-family: sans-serif; background: #fffbff; border-radius: 12px; max-width: 500px; margin: auto; border: 1px solid #fce7f3;">
          <h2 style="color: #be185d; border-bottom: 2px solid #f472b6; padding-bottom: 10px;">Security: Reset Password</h2>
          <p style="color: #475569; font-size: 16px; margin-top: 20px;">A password reset was requested for your ${role} account. If you did not request this, please ignore this email.</p>
          <div style="background: #ffffff; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; border: 2px dashed #f472b6;">
            <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #db2777;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Enter this code on the reset page to set a new password. Valid for 5 minutes.</p>
        </div>`
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (err: any) {
      console.error(`[EMAIL] Recovery Email Error: ${err.message}`);
      return { success: false };
    }
  },

  sendStatusUpdateEmail: async (email: string, trackingCode: string, newStatus: string, comment?: string) => {
    const transporter = createTransporter();
    if (!transporter) return;

    const currentUser = (process.env.SMTP_USER || '').trim();
    const mailOptions = {
      from: `"PS-CRM Updates" <${currentUser}>`,
      to: email,
      subject: `Update on your Complaint: ${trackingCode}`,
      html: `
        <div style="font-family: sans-serif; padding: 25px; max-width: 600px; margin: auto; border-radius: 12px; background-color: #f1f5f9; border: 1px solid #cbd5e1;">
          <h2 style="color: #334155;">Status Updated: ${newStatus}</h2>
          <p>The status of your complaint <strong>${trackingCode}</strong> has been updated to: <span style="font-weight: bold; color: #2563eb;">${newStatus}</span></p>
          ${comment ? `<div style="background: #ffffff; padding: 15px; border-radius: 8px; margin: 15px 0;"><strong>Official Comment:</strong><br>${comment}</div>` : ''}
          <p style="font-size: 13px; color: #64748b;">Visit the portal to see more details.</p>
        </div>`
    };

    const sendPromise = (transporter as any).sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_TIMEOUT')), 15000));

    try {
      await Promise.race([sendPromise, timeoutPromise]);
    } catch (err) {
      console.warn(`[EMAIL] Status update email for ${trackingCode} timed out.`);
    }
  }
};
