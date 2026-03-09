import nodemailer from 'nodemailer';

// Configure your SMTP settings here (e.g., Gmail, Outlook, etc.)
// For testing, you can use a service like Ethereal or a real Gmail account with an App Password.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'mock_user@ethereal.email',
    pass: process.env.SMTP_PASS || 'mock_password',
  },
});

export const emailService = {
  sendVerificationEmail: async (email: string, code: string) => {
    const fromAddress = process.env.SMTP_USER || 'noreply@ps-crm.gov';
    const mailOptions = {
      from: `"PS-CRM System" <${fromAddress}>`,
      to: email,
      subject: 'Email Verification - Smart Public Services CRM',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #059669;">Verify Your Identity</h2>
          <p>Thank you for registering with the Smart Public Services CRM. Please use the following code to verify your email address:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Secure, Transparent, and Citizen-Centric Governance.</p>
        </div>
      `,
    };

    try {
      // In a real environment, this would send the email.
      // For this demo, we'll log it to the console.
      console.log(`[EMAIL] Verification code for ${email}: ${code}`);
      
      // Only attempt to send if credentials are provided
      if (process.env.SMTP_USER && process.env.SMTP_USER !== 'mock_user@ethereal.email') {
        await transporter.sendMail(mailOptions);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  },

  sendTrackingCodeEmail: async (email: string, trackingCode: string, category: string) => {
    const fromAddress = process.env.SMTP_USER || 'noreply@ps-crm.gov';
    const mailOptions = {
      from: `"PS-CRM System" <${fromAddress}>`,
      to: email,
      subject: `Complaint Submitted - Tracking ID: ${trackingCode}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #059669;">Complaint Successfully Submitted</h2>
          <p>Your grievance regarding <strong>${category}</strong> has been successfully registered in our system.</p>
          <p>You can track the progress of your complaint using the following Tracking ID:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; color: #059669; margin: 20px 0;">
            ${trackingCode}
          </div>
          <p>We will notify you via email as soon as there is an update on your complaint.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Secure, Transparent, and Citizen-Centric Governance.</p>
        </div>
      `,
    };

    try {
      console.log(`[EMAIL] Tracking code for ${email}: ${trackingCode}`);
      
      if (process.env.SMTP_USER && process.env.SMTP_USER !== 'mock_user@ethereal.email') {
        await transporter.sendMail(mailOptions);
      }
    } catch (error) {
      console.error('Error sending tracking code email:', error);
    }
  }
};
