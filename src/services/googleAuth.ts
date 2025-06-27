import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/database';

export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function saveTokens(userEmail: string, tokens: any) {
  const query = `
    INSERT INTO oauth_tokens (user_email, access_token, refresh_token, token_type, expiry_date)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_email) 
    DO UPDATE SET 
      access_token = $2,
      refresh_token = $3,
      token_type = $4,
      expiry_date = $5,
      updated_at = CURRENT_TIMESTAMP
  `;

  await pool.query(query, [
    userEmail,
    tokens.access_token,
    tokens.refresh_token,
    tokens.token_type,
    new Date(tokens.expiry_date)
  ]);
}

export async function getStoredTokens(userEmail: string) {
  const query = 'SELECT * FROM oauth_tokens WHERE user_email = $1';
  const result = await pool.query(query, [userEmail]);
  return result.rows[0];
}

export async function getAuthenticatedClient(userEmail: string): Promise<OAuth2Client | null> {
  const oauth2Client = getOAuth2Client();
  const tokens = await getStoredTokens(userEmail);

  if (!tokens) {
    return null;
  }

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date
  });

  return oauth2Client;
}