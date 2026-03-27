import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail(
  to: string[],
  subject: string,
  html: string
): Promise<void> {
  await transporter.sendMail({
    from: `"MM Plan" <${process.env.GMAIL_USER}>`,
    to: to.join(", "),
    subject,
    html,
  });
}
