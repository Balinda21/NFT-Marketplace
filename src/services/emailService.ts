import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM || 'ChainReturns <onboarding@resend.dev>';

const resend = apiKey ? new Resend(apiKey) : null;

const PASSWORD_RESET_HTML = (resetLink: string) => `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #050505; padding: 40px 24px; border-radius: 16px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: #bfdb31; line-height: 56px; text-align: center;">
        <span style="color: #050505; font-size: 18px; font-weight: 700;">CR</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 22px; margin: 16px 0 0;">ChainReturns</h1>
    </div>
    <h2 style="color: #FFFFFF; font-size: 20px; margin-bottom: 12px;">Password Reset</h2>
    <p style="color: #A0A0A0; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
      You requested a password reset. Click the button below to set a new password. This link expires in 15 minutes.
    </p>
    <a href="${resetLink}" style="display: block; text-align: center; background: #bfdb31; color: #050505; font-size: 16px; font-weight: 700; padding: 14px 24px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
      Reset Password
    </a>
    <p style="color: #6E6E6E; font-size: 13px; line-height: 1.5;">
      If you did not request this, you can safely ignore this email.
    </p>
  </div>
`;

export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string
): Promise<void> => {
  if (!resend) {
    console.log('[Resend] Not configured. Reset link:', resetLink);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: 'Reset Your Password - ChainReturns',
    html: PASSWORD_RESET_HTML(resetLink),
  });

  if (error) {
    console.error('[Resend] Failed to send password reset email:', error);
    throw new Error('Failed to send reset email. Please try again later.');
  }
};
