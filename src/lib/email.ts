import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string, shopName: string) {
  await transporter.sendMail({
    from: `"${shopName}" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your Login OTP - ${shopName}`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;text-align:center;">
        <h2 style="color:#7c3aed;">${shopName}</h2>
        <p>Your login verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f3f4f6;border-radius:8px;margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:14px;">This code is valid for 5 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
