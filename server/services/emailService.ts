import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const createTransporter = () => {
    const currentPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
    const currentUser = (process.env.SMTP_USER || '').trim();

    if (!currentUser || !currentPass) {
      console.error('[SMTP] CRITICAL: Missing Credentials');
      return null;
    }
    
    // Using explicit Port 465 (SMTPS) which is often more stable for 'forever' connections than 587
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465
      auth: { user: currentUser, pass: currentPass },
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
      socketTimeout: 15000,
      dnsTimeout: 5000,
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
      html: `<div style="padding: 20px; font-family: sans-serif;">
          <h2>Your OTP: ${code}</h2>
          <p>Please enter this code into the app. Valid for 5 minutes.</p>
        </div>`
    };

    // STRICT 25s timeout to prevent Render 502 Bad Gateway (which happens at 30s)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_TIMEOUT')), 25000));
    const sendPromise = transporter.sendMail(mailOptions);

    try {
      console.log(`[EMAIL] Handshaking with Gmail for ${email}...`);
      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[EMAIL] ✅ Sent.`);
      return { success: true };
    } catch (err: any) {
      console.error(`[EMAIL] ❌ Failed: ${err.message}`);
      return { success: false };
    }
  },

  sendForgotPasswordEmail: async (email: string, code: string, role: string) => {
    const transporter = createTransporter();
    if (!transporter) return { success: false };

    const currentUser = (process.env.SMTP_USER || '').trim();
    const mailOptions = {
      from: `"PS-CRM Security" <${currentUser}>`,
      to: email,
      subject: 'Password Recovery',
      html: `<p>Your recovery code: <b>${code}</b></p>`
    };

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP_TIMEOUT')), 25000));
    const sendPromise = transporter.sendMail(mailOptions);

    try {
      await Promise.race([sendPromise, timeoutPromise]);
      return { success: true };
    } catch (err: any) {
      console.error(`[EMAIL] ❌ Recovery Failed: ${err.message}`);
      return { success: false };
    }
  },

  // Simplified these for speed
  sendTrackingCodeEmail: async (email: string, trackingCode: string, complaintId: string) => {
    const transporter = createTransporter();
    if (!transporter) return;
    const currentUser = (process.env.SMTP_USER || '').trim();
    try {
      await transporter.sendMail({
        from: `"PS-CRM" <${currentUser}>`,
        to: email,
        subject: `Tracking ID: ${complaintId}`,
        text: `Your Tracking ID: ${trackingCode}`
      });
    } catch (e) {}
  },

  sendStatusUpdateEmail: async (email: string, trackingCode: string, newStatus: string) => {
    const transporter = createTransporter();
    if (!transporter) return;
    const currentUser = (process.env.SMTP_USER || '').trim();
    try {
      await transporter.sendMail({
        from: `"PS-CRM Updates" <${currentUser}>`,
        to: email,
        subject: `Update: ${trackingCode}`,
        text: `Status: ${newStatus}`
      });
    } catch (e) {}
  }
};
