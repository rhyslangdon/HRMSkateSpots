# Deployment Guide

## Deployment Options

| Platform   | Best For                    | Free Tier | Ease of Setup |
| ---------- | --------------------------- | --------- | ------------- |
| **Vercel** | Next.js (recommended)       | ✅ Yes    | ⭐⭐⭐⭐⭐    |
| Netlify    | Static/JAMstack sites       | ✅ Yes    | ⭐⭐⭐⭐      |
| Railway    | Full-stack with databases   | ✅ Yes    | ⭐⭐⭐        |
| Render     | Containers and web services | ✅ Yes    | ⭐⭐⭐        |

## Deploying to Vercel (Recommended)

Vercel is the company behind Next.js. Their platform is optimized for Next.js deployments with zero configuration.

### Step-by-Step

1. **Create a Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Your Repository**
   - Click "Add New Project"
   - Select your GitHub repository
   - Vercel will auto-detect that it's a Next.js project

3. **Configure Environment Variables**
   - In the project settings, add your environment variables
   - These are the same ones from your `.env.local` file
   - Never hardcode secrets in your code

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your project
   - You'll get a live URL like `your-project.vercel.app`

5. **Automatic Deployments**
   - Every push to `main` triggers a new production deployment
   - Every PR gets a **preview deployment** with its own URL

### Preview Deployments

When you open a PR, Vercel automatically creates a preview deployment. This lets your team (and instructor) see the changes live before merging. The preview URL is posted as a comment on the PR.

## Environment Variables in Production

Your `.env.local` file is for local development only. In production, you configure environment variables through your hosting platform's dashboard:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment Variables
- **Railway**: Project → Variables tab

**Important**: Never commit `.env.local` to git. It's already in `.gitignore`.

## Custom Domain

Most hosting platforms let you add a custom domain:

1. Purchase a domain from a registrar (Namecheap, Google Domains, etc.)
2. In your hosting platform, go to domain settings
3. Add your custom domain
4. Update your DNS records as instructed
5. Wait for DNS propagation (can take up to 48 hours)

## Production Auth Email

This project uses Supabase Auth for sign-up confirmation and password reset emails. For production, configure a custom SMTP provider instead of relying on Supabase's built-in sender.

### Recommended Setup

- Host the app on `https://hrmskatespots.com`
- Use a dedicated auth email subdomain such as `auth.hrmskatespots.com`
- Send auth emails from an address such as `no-reply@auth.hrmskatespots.com`
- Keep web hosting DNS and email DNS separate by using the root domain for Vercel and the `auth` subdomain for email delivery

### Supabase Auth URL Configuration

In the Supabase Dashboard, configure:

- **Site URL**: `https://hrmskatespots.com`
- **Redirect URL**: `https://hrmskatespots.com/auth/callback`
- **Redirect URL**: `https://www.hrmskatespots.com/auth/callback`

These values match the current sign-up and resend flows, which redirect users to `/auth/callback` after they click an email link.

### SMTP Provider Configuration

The easiest production setup is Resend over SMTP.

In Supabase `Auth -> SMTP`, use:

- **Host**: `smtp.resend.com`
- **Port**: `587`
- **Username**: `resend`
- **Password**: your Resend API key
- **Sender email**: `no-reply@auth.hrmskatespots.com`
- **Sender name**: `HRM Skate Spots`

### DNS Requirements

The DNS records for the email subdomain are managed at the domain registrar or DNS host, not in Supabase.

For the current setup, Namecheap is used to manage DNS. Add the SPF, DKIM, and DMARC records provided by Resend there.

Minimum requirements before enabling production auth email:

- Resend domain status is `verified`
- SPF passes
- DKIM passes
- DMARC record exists for the auth subdomain or root domain, depending on the sending setup

If sign-up starts returning `500` from Supabase Auth, check the Supabase Auth logs first. A common cause is that the configured sending domain is not yet verified in Resend.

### Deliverability Notes

It is normal for a new sending domain or subdomain to land in spam or junk initially.

To improve deliverability:

- Use a dedicated auth sender subdomain
- Keep auth emails plain and transactional
- Avoid extra links and images
- Disable click/open tracking if your provider enables it for auth emails
- Allow time for domain reputation to build

## Account Deletion Behavior

User deletion in this project is a soft-delete flow, not a hard delete.

Current behavior:

- The user's profile and auth identity are anonymized
- Their spots are preserved
- Spot ownership is reassigned to a reserved placeholder account
- Existing references remain valid instead of breaking relations

This is intentional and prevents spot content from disappearing when a user deletes their account.

## Useful Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)
- [Netlify Docs](https://docs.netlify.com/)
- [Railway Docs](https://docs.railway.app/)
