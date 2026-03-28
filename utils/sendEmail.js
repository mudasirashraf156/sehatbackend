const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, firstName, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
   from: 'SehatSehul <noreply@sehatsehul.in>',
    to: email,
    subject: 'Verify your SehatSehul account ✅',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:28px;color:#0f172a;margin-bottom:4px;">🩺 SehatSehul</h1>
          <p style="color:#64748b;font-size:14px;">Healthcare at Your Door · J&K</p>
        </div>
        <div style="background:white;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;font-size:20px;margin-bottom:8px;">Hi ${firstName}! 👋</h2>
          <p style="color:#64748b;line-height:1.6;margin-bottom:24px;">
            Thank you for registering on SehatSehul. Please verify your email address to activate your account.
          </p>
          <a href="${verifyUrl}"
            style="display:block;background:#0d9488;color:white;text-align:center;padding:14px 24px;border-radius:50px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:20px;">
            ✅ Verify My Email
          </a>
          <p style="color:#94a3b8;font-size:12px;text-align:center;line-height:1.6;">
            This link expires in 24 hours.<br/>
            If you didn't create this account, ignore this email.
          </p>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px;">
          © 2025 SehatSehul · Budgam, Srinagar J&K
        </p>
      </div>
    `,
  });
}

async function sendWelcomeEmail(email, firstName, role) {
  await resend.emails.send({
    from: 'SehatSehul <onboarding@resend.dev>',
    to: email,
    subject: 'Welcome to SehatSehul! 🎉',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:28px;color:#0f172a;">🩺 SehatSehul</h1>
        </div>
        <div style="background:white;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;">Welcome, ${firstName}! 🎉</h2>
          <p style="color:#64748b;line-height:1.6;">
            Your email has been verified. Your <strong>${role}</strong> account is now active on SehatSehul.
          </p>
          ${role === 'nurse' ? `
            <div style="background:#f0fdfa;border-radius:10px;padding:16px;margin:16px 0;border:1px solid #ccfbf1;">
              <p style="color:#0f766e;font-size:13px;margin:0;">
                ⏳ <strong>Next step:</strong> Your nurse license will be verified by our team within 24 hours before your profile goes live.
              </p>
            </div>
          ` : ''}
          <a href="${process.env.FRONTEND_URL}/login"
            style="display:block;background:#0d9488;color:white;text-align:center;padding:14px;border-radius:50px;font-weight:700;text-decoration:none;margin-top:20px;">
            Login to Your Account →
          </a>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px;">
          © 2025 SehatSehul · Budgam, Srinagar J&K
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };