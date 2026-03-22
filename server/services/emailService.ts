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
    
    // NATIVE GMAIL OPTIMIZATION:
    // We are using the internal 'gmail' driver in Nodemailer.
    // This is the fastest method for Gmail as it uses pre-configured secure settings.
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: currentUser, pass: currentPass },
      // Minimal config = Faster speeds
      connectionTimeout: 8000, 
      greetingTimeout: 8000,
      socketTimeout: 15000
    });
};

export const emailService = {
  sendVerificationEmail: async (email: string, code: string) => {
    const transporter = createTransporter();
    if (!transporter) return { success: false };

    const currentUser = (process.env.SMTP_USER || '').trim();
    const mailOptions = {
        from: `"Smart City Portal" <${currentUser}>`,
        to: email,
        subject: `Your OTP: ${code}`,
        text: `Your Verification Code is: ${code}. Valid for 5 minutes.`,
        html: `<h3>Your Verification Code: <strong>${code}</strong></h3>`
    };

    try {
      console.log(`[SMTP] DISPATCHING REAL-TIME EMAIL TO ${email}...`);
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] ✅ REAL-TIME DELIVERY COMPLETE.`);
      return { success: true };
    } catch (err: any) {
      console.error(`[SMTP] ❌ Real-Time Delivery STALLED: ${err.message}`);
      return { success: false };
    }
  },

  sendForgotPasswordEmail: async (email: string, code: string, role: string) => {
    const transporter = createTransporter();
    if (!transporter) return { success: false };
    const currentUser = (process.env.SMTP_USER || '').trim();
    try {
      await transporter.sendMail({
        from: `"Smart City Security" <${currentUser}>`,
        to: email,
        subject: `Password Reset: ${code}`,
        text: `Your Recovery Code: ${code}`
      });
      return { success: true };
    } catch (err: any) {
      console.error(`[SMTP] ❌ Recovery STALLED: ${err.message}`);
      return { success: false };
    }
  },

  // These are secondary and shouldn't block any main auth flow
  sendTrackingCodeEmail: async (email: string, trackingCode: string, complaintId: string) => {
    const transporter = createTransporter();
    if (!transporter) return;
    try {
      await transporter.sendMail({
        from: `"Smart City" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Tracking ID: ${complaintId}`,
        text: `Your Tracking ID: ${trackingCode}`
      });
    } catch (e) {}
  },

  sendStatusUpdateEmail: async (email: string, trackingCode: string, newStatus: string) => {
    const transporter = createTransporter();
    if (!transporter) return;
    try {
      await transporter.sendMail({
        from: `"Smart City" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Update: ${trackingCode}`,
        text: `The status of ${trackingCode} is now ${newStatus}`
      });
    } catch (e) {}
  }
};
