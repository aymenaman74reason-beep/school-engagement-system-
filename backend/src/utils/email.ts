import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
  html?: string;
  fromName?: string;
}) => {
  const mailOptions = {
    from: `"${options.fromName || "School Management System"}" <${env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
};

export const sendInvitationEmail = async (options: {
  email: string;
  firstName: string;
  password: string;
  role: string;
  fromName?: string;
}) => {
  const loginUrl = `${env.FRONTEND_URL}/login`;
  const subject = `Welcome to School Management System — Your Account is Ready`;
  const message = `Hello ${options.firstName}, your ${options.role} account has been created. Email: ${options.email} Password: ${options.password} Login at: ${loginUrl}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">School Management System</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your account has been created</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">Hello <strong>${options.firstName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          You have been invited to join the School Management System as a <strong style="text-transform: capitalize;">${options.role}</strong>. 
          Please use the credentials below to log in.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0; width: 80px;">Email:</td>
              <td style="color: #0f172a; font-weight: 600;">${options.email}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Password:</td>
              <td style="color: #0f172a; font-weight: 600; font-family: monospace; letter-spacing: 1px;">${options.password}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Log In Now
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0; line-height: 1.5;">
          For security, please change your password after your first login.
          If you did not expect this email, please contact your school administrator.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} School Management System. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ 
    email: options.email, 
    subject, 
    message, 
    html,
    fromName: options.fromName 
  });
};

