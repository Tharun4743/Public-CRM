import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * PRODUCTION-GRADE EMAIL TEMPLATING SYSTEM
 * Designed for High-Aesthetic Government Portal Identity
 */
const getGovermentBranding = (content: string, title: string) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Smart Public Services</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 14px;">Official Communication Portal</p>
    </div>
    <div style="padding: 40px; background: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">${title}</h2>
      ${content}
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© 2026 Smart Public Services CRM. This is an automated notification. Please do not reply.</p>
        <p>Verified Secure Communication Stack</p>
      </div>
    </div>
  </div>
`;

export const createTransporter = () => {
    const currentPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
    const currentUser = (process.env.SMTP_USER || '').trim();

    if (!currentUser || !currentPass) {
      console.error('[SMTP] CRITICAL: Missing Credentials');
      return null;
    }
    
    // NATIVE GMAIL OPTIMIZATION
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: currentUser, pass: currentPass },
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
      socketTimeout: 20000
    });
};

export const emailService = {
  sendVerificationEmail: async (email: string, code: string) => {
    const transporter = createTransporter();
    if (!transporter) return { success: false };
    const currentUser = (process.env.SMTP_USER || '').trim();

    const content = `
      <p style="color: #475569; line-height: 1.6;">Welcome to the Smart Public Services portal. To complete your identity verification, please use the secure One-Time Password (OTP) below:</p>
      <div style="background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
        <span style="font-size: 48px; font-weight: 800; color: #1e40af; letter-spacing: 15px; font-family: 'Courier New', Courier, monospace;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; font-style: italic;">This verification window is active for 5 minutes. Protect this code from unauthorized users.</p>
    `;

    try {
      await transporter.sendMail({
        from: `"Smart City Verification" <${currentUser}>`,
        to: email,
        subject: `Your Secure OTP: ${code}`,
        html: getGovermentBranding(content, 'Identity Verification Request')
      });
      console.log(`[SMTP] ✅ Delivered to ${email}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[SMTP] ❌ Delay/Error: ${err.message}`);
      return { success: false };
    }
  },

  sendForgotPasswordEmail: async (email: string, code: string, role: string) => {
    const transporter = createTransporter();
    if (!transporter) return { success: false };
    const currentUser = (process.env.SMTP_USER || '').trim();

    const content = `
      <p style="color: #475569; line-height: 1.6;">We received a request to reset your **${role}** account security credentials. If you did not initiate this, please secure your account immediately.</p>
      <div style="background: #fdf2f8; border: 2px solid #f472b6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
        <span style="font-size: 48px; font-weight: 800; color: #db2777; letter-spacing: 15px;">${code}</span>
      </div>
      <p style="color: #ef4444; font-size: 13px;">Confidentiality Notice: Valid for 5 minutes.</p>
    `;

    try {
      await transporter.sendMail({
        from: `"Smart City Security" <${currentUser}>`,
        to: email,
        subject: `Security Alert: Recovery Code ${code}`,
        html: getGovermentBranding(content, 'Account Recovery Procedure')
      });
      return { success: true };
    } catch (err: any) {
      console.error(`[SMTP] ❌ Recovery Failed: ${err.message}`);
      return { success: false };
    }
  },

  sendTrackingCodeEmail: async (email: string, trackingCode: string, complaintId: string) => {
    const transporter = createTransporter();
    if (!transporter) return;
    const currentUser = (process.env.SMTP_USER || '').trim();

    const content = `
      <p style="color: #475569;">Your grievance has been successfully lodged in the Central Monitoring System.</p>
      <div style="background: #f0fdf4; border-left: 5px solid #22c55e; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <div style="font-size: 11px; color: #166534; font-weight: bold; text-transform: uppercase;">Official Tracking ID</div>
        <div style="font-size: 22px; font-weight: 700; color: #14532d; margin: 5px 0;">${trackingCode}</div>
        <div style="font-size: 13px; color: #166534; margin-top: 10px;">Reference: ${complaintId}</div>
      </div>
      <p style="color: #64748b; font-size: 14px;">Use this ID to check status updates in real-time on our dashboard.</p>
    `;

    try {
      await transporter.sendMail({
        from: `"Smart Public Service" <${currentUser}>`,
        to: email,
        subject: `Lodged Successfully: ${complaintId}`,
        html: getGovermentBranding(content, 'Grievance Tracking Activated')
      });
    } catch (e) {}
  },

  sendStatusUpdateEmail: async (email: string, trackingCode: string, newStatus: string) => {
    const transporter = createTransporter();
    if (!transporter) return;
    const currentUser = (process.env.SMTP_USER || '').trim();

    const statusColors: any = { 'Pending': '#f59e0b', 'In Progress': '#3b82f6', 'Resolved': '#10b981' };
    const color = statusColors[newStatus] || '#3b82f6';

    const content = `
      <p style="color: #475569;">There is a new update regarding your complaint <strong>${trackingCode}</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="background: ${color}; color: white; padding: 12px 30px; border-radius: 100px; font-weight: bold; font-size: 18px; text-transform: uppercase;">${newStatus}</span>
      </div>
      <p style="color: #64748b; font-size: 14px; text-align: center;">Our officers are working to resolve your issue as quickly as possible.</p>
    `;

    try {
      await transporter.sendMail({
        from: `"Departmental Updates" <${currentUser}>`,
        to: email,
        subject: `Update on Case: ${trackingCode}`,
        html: getGovermentBranding(content, 'Status Change Notification')
      });
    } catch (e) {}
  }
};
