import { Router } from 'express';
import { getOAuth2Client, saveTokens } from '../services/googleAuth';
import pool from '../config/database';

const router = Router();


router.get('/login', (req, res) => {
  try {
    console.log('Login page requested');
    res.render('login');
  } catch (error) {
    console.error('Error rendering login page:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/google', (req, res) => {
  try {
    console.log('Google OAuth requested');
    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
    console.log('Redirecting to:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error in Google OAuth:', error);
    res.status(500).send('OAuth setup error');
  }
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/auth/login?error=no_code');
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const { data } = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });

    const userEmail = (data as any).email;
    await saveTokens(userEmail, tokens);

    const prefQuery = `
      INSERT INTO user_preferences (user_email)
      VALUES ($1)
      ON CONFLICT (user_email) DO NOTHING
    `;
    await pool.query(prefQuery, [userEmail]);

    req.session.userEmail = userEmail;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/auth/login?error=auth_failed');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default router;