# Google Cloud Setup Guide

This guide will help you set up Google Cloud Console for MrSE to access your Google Calendar.

## Prerequisites

- Google account with access to Google Cloud Console
- Basic understanding of Google APIs

## Step 1: Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Either create a new project or select existing project
3. Note your project ID (you can see it in the project selector)

## Step 2: Enable Required APIs

### Enable Google Calendar API
1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click **"Enable"**

**Direct link for your project:**
```
https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=448138038092
```

### Enable People API (Optional - for user info)
1. Search for "People API" in the library
2. Click on "People API" 
3. Click **"Enable"**

## Step 3: Create OAuth 2.0 Credentials

1. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"OAuth 2.0 Client IDs"**
4. Choose **"Web application"** as application type
5. Configure:
   - **Name**: `MrSE Local Development`
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback`

## Step 4: Get Your Credentials

After creating the OAuth client:
1. Note down your **Client ID** (starts with numbers, ends with `.apps.googleusercontent.com`)
2. Note down your **Client Secret** (starts with `GOCSPX-`)
3. Update your `.env` file with these values

## Step 5: Configure OAuth Consent Screen

1. Go to [APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose **"External"** user type (unless you have Google Workspace)
3. Fill in required information:
   - **App name**: `MrSE`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/calendar.readonly`
   - `../auth/userinfo.email`
5. Add test users (your email) if app is in testing mode

## Troubleshooting

### "Google Calendar API has not been used" Error
- **Cause**: Calendar API is not enabled
- **Solution**: Follow Step 2 to enable the API
- **Wait**: Allow 2-3 minutes for changes to propagate

### "insufficient permissions" Error
- **Cause**: OAuth scopes not properly configured
- **Solution**: Check OAuth consent screen scopes
- **Re-auth**: Log out and log back in to MrSE

### "redirect_uri_mismatch" Error
- **Cause**: Redirect URI in OAuth client doesn't match app configuration
- **Solution**: Ensure redirect URI is exactly `http://localhost:3000/auth/google/callback`

### 403 Forbidden Errors
- **Cause**: Various permission issues
- **Solutions**:
  1. Check API is enabled
  2. Verify OAuth scopes
  3. Ensure user has calendar access
  4. Check quotas and billing (if applicable)

## Production Deployment

For production deployment:

1. **Update redirect URIs** in OAuth client:
   - Add your production domain
   - Remove localhost URIs

2. **Verify domain ownership** (if required)

3. **Publish OAuth consent screen** (move from Testing to Production)

4. **Set up proper environment variables** on your server

5. **Consider service account** for server-to-server operations

## Security Best Practices

- Never commit OAuth credentials to git
- Use environment variables for sensitive data
- Regularly rotate client secrets
- Monitor API usage and quotas
- Set up proper error handling and logging
- Use HTTPS in production
- Implement proper session management

## API Quotas and Limits

Google Calendar API has the following default limits:
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 1,000
- **Queries per 100 seconds**: 300,000

Monitor usage in [Google Cloud Console → APIs & Services → Quotas](https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas).

## Support

If you encounter issues:
1. Check [Google Calendar API documentation](https://developers.google.com/calendar/api)
2. Review [OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check Google Cloud Console error logs
4. Verify MrSE application logs