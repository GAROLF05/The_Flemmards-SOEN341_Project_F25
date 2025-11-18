const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create transporter once
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailService = {
  generateVerificationToken: () => {
    return crypto.randomBytes(32).toString("hex");
  },

  sendVerificationEmail: async (email, name, role, verificationToken) => {
    const verificationLink = `http://localhost:3000/api/users/verify-email?token=${verificationToken}&redirectTo=http://localhost:5173/verify-success`; // Change in deployment to actual link!

    const mailOptions = {
      from: `"The Flemmards Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - The Flemmards",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4A90E2; margin: 0;">Welcome to The Flemmards!</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${name},</h2>
            <p style="color: #34495e; line-height: 1.6;">Thank you for registering ${
              role.toLowerCase() == "student" ? "a" : "an"
            } <strong style="color: #4A90E2"> ${role} Account </strong> with <strong>The Flemmards</strong>. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
          </div>

          <div style="color: #7f8c8d; margin-top: 20px; font-size: 14px;">
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${verificationLink}</p>
          </div>

          <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px; text-align: center;">
            <p style="color: #7f8c8d; font-size: 14px;">Best regards,<br>The Flemmards Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  },

  sendPasswordResetEmail: async (email, name, resetToken) => {
    const frontendResetLink = `http://localhost:5173/reset-password?token=${resetToken}`; // Change when deploying

    const mailOptions = {
      from: `"The Flemmards Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - The Flemmards",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4A90E2; margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin-top: 0;">Hello ${name || ""},</h2>
            <p style="color: #34495e; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to reset your password. This link will expire in one hour.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendResetLink}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <div style="color: #7f8c8d; margin-top: 20px; font-size: 14px;">
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${frontendResetLink}</p>
          </div>
          <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px; text-align: center;">
            <p style="color: #7f8c8d; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
            <p style="color: #7f8c8d; font-size: 14px;">Best regards,<br>The Flemmards Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  },
};

module.exports = emailService;
