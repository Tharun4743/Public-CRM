import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Strip spaces from Gmail App Password (dotenv may include them if not quoted)
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s/g, '');
const smtpUser = process.env.SMTP_USER || '';

// Use Gmail service mode (more reliable on cloud servers than manual host/port)
const createTransporter = () => {
  if (smtpUser && smtpPass && smtpUser !== 'mock_user@ethereal.email') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false }
    });
  }
  // Fallback: no real transporter (dev/log-only mode)
  return null;
};

export const emailService = {
  sendVerificationEmail: async (email: string, code: string) => {
    console.log(`[EMAIL] Verification code for ${email}: ${code}`);
    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('SMTP not configured — email not sent');
    }
    const fromAddress = smtpUser;
    const mailOptions = {
      from: `"PS-CRM System" <${fromAddress}>`,
      to: email,
      subject: 'Email Verification - Smart Public Services CRM',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #059669;">Verify Your Identity</h2>
          <p>Thank you for registering with the Smart Public Services CRM. Please use the following code to verify your email address:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #065f46; margin: 20px 0; border: 2px solid #6ee7b7;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Secure, Transparent, and Citizen-Centric Governance — Smart Public Services CRM</p>
        </div>
      `,
    };
    // This will THROW if SMTP fails — caller handles the fallback
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Verification email sent to ${email} — MessageId: ${info.messageId}`);
    return info;
  },

  sendTrackingCodeEmail: async (email: string, trackingCode: string, category: string) => {
    const transporter = createTransporter();
    if (!transporter) { console.log(`[EMAIL] Tracking code for ${email}: ${trackingCode}`); return; }
    const mailOptions = {
      from: `"PS-CRM System" <${smtpUser}>`,
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
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending tracking code email:', error);
    }
  },

  sendEscalationEmail: async (email: string, trackingCode: string, level: number, reason: string) => {
    const transporter = createTransporter();
    if (!transporter) { console.warn(`[ESCALATION] Level ${level} for ${trackingCode}`); return; }
    const levelLabel = level === 1 ? 'Department Head' : level === 2 ? 'Senior Administration' : 'Commissioner Office';
    const alertLevel = level === 3 ? 'CRITICAL BREACH' : 'HIGH PRIORITY ESCALATION';
    const mailOptions = {
        from: `"PS-CRM System" <${smtpUser}>`,
        to: email,
        subject: `[${alertLevel}] Escalation Level ${level} - ${trackingCode}`,
        html: `
            <div style="font-family: sans-serif; padding: 30px; border: 1px solid #fecaca; border-radius: 12px; max-width: 600px; margin: auto; background-color: #fffafb;">
                <h2 style="color: #e11d48; margin-bottom: 5px;">🔥 ${alertLevel}</h2>
                <span style="font-size: 10px; font-weight: bold; color: #9f1239; text-transform: uppercase; letter-spacing: 2px;">SLA Enforcement Engine Active</span>
                
                <p style="margin-top: 25px; color: #1e293b;">The following complaint has breached the mandated SLA (Service Level Agreement) and has been automatically escalated to your office.</p>
                
                <div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #fee2e2; margin: 25px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Tracking ID</div>
                    <div style="font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 15px;">${trackingCode}</div>
                    
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Escalation Level</div>
                    <div style="font-size: 16px; font-weight: bold; color: #e11d48;">Level ${level}: ${levelLabel}</div>
                    
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-top: 15px;">Reason for Escalation</div>
                    <div style="font-size: 14px; color: #475569;">${reason}</div>
                </div>

                <p style="font-size: 13px; color: #64748b; line-height: 1.6;">Please take immediate action to resolve this matter within the next 2 hours to avoid further escalation to a higher authority level.</p>
                
                <hr style="border: none; border-top: 1px solid #fecaca; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Automated Regulatory Compliance Notification from PS-CRM Intelligence System</p>
                <p style="font-size: 10px; color: #cbd5e1; text-align: center; margin-top: 5px;">Secure Transparent Smart Governance Platform</p>
            </div>
        `,
    };

    try {
        console.warn(`[ESCALATION] Alert for Level ${level} sent to ${email} for ${trackingCode}`);
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending escalation email:', error);
    }
  },

  sendResolutionEmail: async (email: string, trackingCode: string, notes: string) => {
    const transporter = createTransporter();
    if (!transporter) { console.log(`[EMAIL] Resolution for ${email}: ${trackingCode}`); return; }
    const mailOptions = {
        from: `"PS-CRM System" <${smtpUser}>`,
        to: email,
        subject: `Complaint Resolved - Tracking ID: ${trackingCode}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
                <h2 style="color: #059669;">Service Request Resolved</h2>
                <p>We are pleased to inform you that your complaint <strong>${trackingCode}</strong> has been resolved.</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; color: #166534; margin: 20px 0;">
                    <strong style="display: block; margin-bottom: 5px;">Resolution Notes from Officer:</strong>
                    ${notes}
                </div>
                <p><strong>Photographic Proof:</strong> A resolution proof image has been uploaded to the system. You can view it by visiting the tracking portal with your ID.</p>
                <p>Thank you for using Smart Public Services CRM.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #6b7280;">Secure, Transparent, and Citizen-Centric Governance.</p>
            </div>
        `,
    };

    try {
        console.log(`[EMAIL] Resolution notification sent to ${email} for ${trackingCode}`);
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending resolution email:', error);
    }
  },

  sendFeedbackEmail: async (email: string, trackingCode: string, token: string) => {
    const transporter = createTransporter();
    if (!transporter) { console.log(`[EMAIL] Feedback token for ${email}: ${token}`); return; }
    const appUrl = process.env.APP_URL || 'https://ps-crm-995a.onrender.com';
    const feedbackUrl = `${appUrl}/feedback?token=${token}`;
    const mailOptions = {
        from: `"PS-CRM System" <${smtpUser}>`,
        to: email,
        subject: `How did we do? - Feedback Request: ${trackingCode}`,
        html: `
            <div style="font-family: sans-serif; padding: 30px; border: 2px solid #ecfdf5; border-radius: 16px; max-width: 600px; margin: auto; background-color: #ffffff;">
                <h2 style="color: #059669; margin-bottom: 10px;">Your Opinion Matters 🌟</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Your grievance <strong>${trackingCode}</strong> was recently marked as resolved. We want to ensure you are 100% satisfied with our service.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${feedbackUrl}" style="background-color: #059669; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">Rate Our Performance</a>
                </div>
                <p style="font-size: 13px; color: #9ca3af; text-align: center;">This link is for one-time use and will expire once submitted.</p>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 30px 0;" />
                <p style="font-size: 12px; color: #6b7280; text-align: center;">Smart Public Services CRM - Direct Feedback Loop</p>
            </div>
        `,
    };

    try {
        console.log(`[EMAIL] Feedback link for ${email}: ${feedbackUrl}`);
        const info = await transporter.sendMail(mailOptions);
        if (info) console.log(`📬 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
        console.error('Error sending feedback email:', error);
    }
  },

  sendApologyEmail: async (email: string, trackingCode: string) => {
    const transporter = createTransporter();
    if (!transporter) { console.warn(`[EMAIL] Apology for ${email}: ${trackingCode}`); return; }
    const mailOptions = {
        from: `"PS-CRM System" <${smtpUser}>`,
        to: email,
        subject: `[Re-Opened] Deepest Apologies regarding Grievance ${trackingCode}`,
        html: `
            <div style="font-family: sans-serif; padding: 30px; border: 2px solid #fef2f2; border-radius: 16px; max-width: 600px; margin: auto; background-color: #fffafb;">
                <h2 style="color: #e11d48; margin-bottom: 10px;">We're Making Things Right 🛠️</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">We've received your feedback regarding <strong>${trackingCode}</strong>. We are truly sorry that our previous resolution did not meet your expectations.</p>
                <div style="background-color: #fff1f2; padding: 20px; border-radius: 12px; border-left: 4px solid #e11d48; margin: 25px 0;">
                    <p style="margin: 0; color: #9f1239; font-weight: bold;">Action Taken:</p>
                    <p style="margin: 5px 0 0 0; color: #be123c;">Your case has been automatically re-opened for high-level re-examination. A senior officer will be assigned immediately.</p>
                </div>
                <p style="font-size: 14px; color: #475569;">Thank you for your honesty. We are committed to achieving a resolution that satisfies you.</p>
                <hr style="border: none; border-top: 1px solid #fee2e2; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center;">Regulatory Compliance & Quality Assurance Intelligence</p>
            </div>
        `,
    };

    try {
        console.warn(`[EMAIL] Re-opening apology sent to ${email} for ${trackingCode}`);
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending apology email:', error);
    }
  },

  sendVoucherEmail: async (email: string, title: string, code: string) => {
    const transporter = createTransporter();
    if (!transporter) { console.log(`[EMAIL] Voucher ${code} for ${email}`); return; }
    const mailOptions = {
        from: `"PS-CRM Rewards" <${smtpUser}>`,
        to: email,
        subject: `Your Reward is Here! - ${title}`,
        html: `
            <div style="font-family: sans-serif; padding: 30px; border: 2px solid #fbd38d; border-radius: 20px; max-width: 600px; margin: auto; background-color: #fffaf0;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 50px;">🎁</span>
                    <h2 style="color: #c05621; margin-top: 10px;">Congratulations!</h2>
                    <p style="color: #744210; font-size: 18px;">You've successfully redeemed your points for:</p>
                    <strong style="font-size: 24px; color: #1a202c; display: block; margin: 10px 0;">${title}</strong>
                </div>
                
                <div style="background: white; border: 3px dashed #cbd5e0; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
                    <span style="font-size: 12px; font-weight: bold; color: #a0aec0; text-transform: uppercase; letter-spacing: 2px;">Your Unique Voucher Code</span>
                    <div style="font-size: 32px; font-weight: bold; color: #2d3748; margin: 10px 0; font-family: monospace; letter-spacing: 1px;">
                        ${code}
                    </div>
                    <p style="font-size: 12px; color: #718096; margin-top: 10px;">Valid for 30 days from today. Redeem at any participating location.</p>
                </div>

                <p style="font-size: 14px; color: #4a5568; line-height: 1.6; text-align: center;">Thank you for being an active citizen and helping us improve public services. Every contribution makes our community better!</p>
                
                <hr style="border: none; border-top: 1px solid #fbd38d; margin: 30px 0;" />
                <p style="font-size: 11px; color: #a0aec0; text-align: center;">Smart Public Services - Digital Reward Distribution System</p>
                <p style="font-size: 10px; color: #cbd5e0; text-align: center; margin-top: 5px;">Secure Transparent Smart Governance Platform</p>
            </div>
        `,
    };

    try {
        console.log(`[EMAIL] Voucher ${code} sent to ${email}`);
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending voucher email:', error);
    }
  }
};
