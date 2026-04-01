import { sendEmail } from '@/lib/email';

export async function sendPremiumWelcomeEmail(to: string, name?: string | null) {
  const greeting = name ? `Hey ${name},` : 'Hey there,';
  await sendEmail({
    to,
    subject: 'Welcome to Premium! 🛹',
    text: `${greeting} Thanks for upgrading! You now have unlimited spot submissions, premium features, and priority support.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to Premium! 🛹</h1>
        <p>${greeting}</p>
        <p>Thanks for upgrading to <strong>Premium</strong>! Here's what you now have access to:</p>
        <ul>
          <li>Unlimited skate spot submissions</li>
          <li>Access to premium features</li>
          <li>Priority support</li>
        </ul>
        <p>Your subscription is <strong>$19.00/month</strong> and you can cancel anytime.</p>
        <p>Enjoy shredding! 🤙</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">HRM Skate Spots Team</p>
      </div>
    `,
  });
}

export async function sendDowngradeEmail(to: string, name?: string | null) {
  const greeting = name ? `Hey ${name},` : 'Hey there,';
  await sendEmail({
    to,
    subject: 'Your subscription has been cancelled',
    text: `${greeting} Your subscription has been downgraded to the free plan. You can re-subscribe anytime.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Subscription Cancelled</h1>
        <p>${greeting}</p>
        <p>Your subscription has been downgraded to the <strong>free plan</strong>.</p>
        <p>You can re-subscribe at any time from the <a href="/payment">payment page</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">HRM Skate Spots Team</p>
      </div>
    `,
  });
}
