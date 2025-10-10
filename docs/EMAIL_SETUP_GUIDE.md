# Email Service Setup Guide (Resend)

This guide explains how to configure the email service for sending password reset emails and other notifications using Resend.

## 🎯 Current Email Service Status

The backend uses **Resend** (https://resend.com) for email delivery with automatic fallback to console logging.

### How It Works

1. **With API Key**: Sends real emails via Resend API
2. **Without API Key**: Logs emails to console (development mode)

## 🔧 Quick Setup for Development

### Option 1: Use Console Logging (No Setup Required)

Leave `RESEND_API_KEY` empty in `.env`:

```bash
RESEND_API_KEY=
EMAIL_FROM=noreply@fitrecipes.com
```

**Result**: Emails are logged to console instead of being sent. Perfect for local development.

### Option 2: Send Real Emails (Requires Resend Account)

Follow the complete setup below to send actual emails.

## 📧 Complete Resend Setup

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email address

### Step 2: Add and Verify Your Domain

**⚠️ IMPORTANT**: You can only send emails from a verified domain in production.

#### For Testing (Use Resend's Test Domain)

Resend provides a test email for quick testing:

```bash
EMAIL_FROM=onboarding@resend.dev
```

**Limitations**:
- Only sends to the email address you signed up with
- Shows "via resend.dev" in recipient's inbox
- Good for initial testing only

#### For Production (Verify Your Domain)

1. **Add Domain in Resend**:
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain: `fitrecipes.com`
   - Click "Add"

2. **Add DNS Records**:
   
   Resend will show you DNS records to add. Add these to your domain registrar:

   **SPF Record** (TXT):
   ```
   Name: @
   Type: TXT
   Value: v=spf1 include:_spf.resend.com ~all
   ```

   **DKIM Records** (CNAME):
   ```
   Name: resend._domainkey
   Type: CNAME
   Value: [provided by Resend]
   
   Name: resend2._domainkey
   Type: CNAME
   Value: [provided by Resend]
   ```

   **DMARC Record** (TXT):
   ```
   Name: _dmarc
   Type: TXT
   Value: v=DMARC1; p=none
   ```

3. **Verify Domain**:
   - Wait 5-10 minutes for DNS propagation
   - Click "Verify" in Resend dashboard
   - Status should change to "Verified ✓"

### Step 3: Get API Key

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. **Name**: `FitRecipes Backend Development` (or appropriate name)
4. **Permission**: `Full Access` or `Sending access`
5. Click "Create"
6. **Copy the API key** (starts with `re_`)
   - ⚠️ You won't be able to see it again!

### Step 4: Update Environment Variables

**Development** (`.env`):
```bash
# For Testing (Resend's test domain)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev

# OR for Production domain (after verification)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@fitrecipes.com
```

**Staging** (Render Environment Variables):
```bash
RESEND_API_KEY=re_staging_api_key_here
EMAIL_FROM=noreply@fitrecipes.com  # Use verified domain
```

**Production** (Render Environment Variables):
```bash
RESEND_API_KEY=re_production_api_key_here
EMAIL_FROM=noreply@fitrecipes.com  # Use verified domain
```

### Step 5: Restart Backend Server

**Critical**: After changing `.env`, restart your backend:

```bash
# Stop server (Ctrl+C)
# Then restart
bun run dev
```

Environment variables are loaded only on startup!

## ✅ Testing Email Sending

### Test Password Reset Email

1. **Via API** (using curl or Postman):
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

2. **Expected Console Output** (with API key):
```
✅ Email sent successfully to your-email@example.com
```

3. **Expected Console Output** (without API key):
```
📧 Email Service (Development Mode - No API Key)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: your-email@example.com
Subject: FitRecipes - Password Reset Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Email HTML content]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RESEND_API_KEY not set - emails are logged instead of sent
```

### Check Email Delivery

1. **Check your inbox** for the email
2. **Check spam folder** if not in inbox
3. **Check Resend Dashboard**:
   - Go to https://resend.com/emails
   - See delivery status, opens, clicks
   - View sent email content

## 🐛 Troubleshooting

### Issue: Still Seeing "Development Mode" Message

**Causes**:
1. Server not restarted after adding API key
2. API key has extra spaces or quotes
3. Wrong environment variable name

**Solutions**:
```bash
# 1. Restart server
# Stop with Ctrl+C, then:
bun run dev

# 2. Check .env file (no quotes needed):
RESEND_API_KEY=re_abc123...  # ✅ Correct
# NOT: RESEND_API_KEY="re_abc123..."  # ❌ Wrong

# 3. Verify environment variable is loaded:
# Add to your code temporarily:
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
```

### Issue: "Failed to send email" Error

**Causes**:
1. Invalid API key
2. Domain not verified
3. Using unverified domain in production
4. Sending to email that doesn't exist

**Solutions**:

1. **Check API Key**:
   - Go to https://resend.com/api-keys
   - Verify the key exists and is active
   - Regenerate if needed

2. **Check Domain Status**:
   - Go to https://resend.com/domains
   - Verify domain shows "Verified ✓"
   - If not, check DNS records

3. **Use Test Email for Development**:
```bash
EMAIL_FROM=onboarding@resend.dev
```

4. **Check Resend Dashboard**:
   - Go to https://resend.com/emails
   - Look for error messages
   - Check delivery status

### Issue: Email Goes to Spam

**Causes**:
1. Domain not verified
2. Missing or incorrect DNS records (SPF, DKIM, DMARC)
3. Low sender reputation (new domain)

**Solutions**:

1. **Verify All DNS Records**:
   - SPF: Allows Resend to send on your behalf
   - DKIM: Signs emails for authenticity
   - DMARC: Sets policy for failed authentication

2. **Check DNS Propagation**:
   ```bash
   # Check SPF
   nslookup -type=txt fitrecipes.com
   
   # Check DKIM
   nslookup -type=cname resend._domainkey.fitrecipes.com
   ```

3. **Warm Up Domain**:
   - Send to known recipients first
   - Gradually increase volume
   - Ask recipients to mark as "Not Spam"

### Issue: Rate Limiting

**Free Tier Limits**:
- 100 emails per day
- 1 API key
- 1 domain

**Solutions**:
1. Use console logging for development
2. Upgrade to paid plan for production
3. Be selective about which emails to send in development

## 📊 Email Templates

### Password Reset Email Template

Located in `src/utils/email.ts`:

```typescript
const subject = 'FitRecipes - Password Reset Request';
const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background-color: #f9fafb; }
      .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🥗 FitRecipes</h1>
      </div>
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>© 2025 FitRecipes. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
```

### Customize Templates

To customize email templates, edit the HTML in `src/utils/email.ts`:
- `sendPasswordResetEmail()` - Password reset
- `sendVerificationEmail()` - Email verification (when implemented)

## 🔐 Security Best Practices

1. **Never Commit API Keys**:
   ```bash
   # .env should be in .gitignore
   .env
   .env.local
   ```

2. **Use Different Keys Per Environment**:
   - Development: `re_dev_...`
   - Staging: `re_staging_...`
   - Production: `re_prod_...`

3. **Rotate Keys Regularly**:
   - Especially after team member changes
   - If key is accidentally exposed

4. **Limit API Key Permissions**:
   - Use "Sending access" instead of "Full Access" when possible
   - One key per application/environment

## 📚 Resources

- **Resend Dashboard**: https://resend.com/overview
- **API Documentation**: https://resend.com/docs
- **Domain Setup**: https://resend.com/docs/send-with-domains
- **Status Page**: https://status.resend.com
- **Support**: https://resend.com/support

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Domain verified in Resend
- [ ] All DNS records added (SPF, DKIM, DMARC)
- [ ] DNS records verified (wait 24 hours for propagation)
- [ ] Production API key created
- [ ] API key added to production environment variables
- [ ] `EMAIL_FROM` uses verified domain
- [ ] Test email sent successfully
- [ ] Email not landing in spam
- [ ] Email templates reviewed and approved
- [ ] Rate limits understood (upgrade plan if needed)

## 💰 Resend Pricing (As of 2025)

**Free Tier**:
- 100 emails/day
- 1 domain
- 1 API key
- Basic support

**Pro Plan** ($20/month):
- 50,000 emails/month
- Unlimited domains
- Unlimited API keys
- Priority support
- Advanced analytics

**For FitRecipes**: Free tier is sufficient for development and early stage. Upgrade when you hit limits.
