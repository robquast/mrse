import { Router } from 'express';
import pool from '../config/database';
import { syncCalendarEvents } from '../services/calendarSync';

const router = Router();

router.use((req, res, next) => {
  if (!req.session.userEmail) {
    return res.redirect('/auth/login');
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const userEmail = req.session.userEmail!;
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN meeting_type = 'internal' THEN 1 END) as internal_meetings,
        COUNT(CASE WHEN meeting_type = 'external' THEN 1 END) as external_meetings,
        COUNT(CASE WHEN is_customer_meeting THEN 1 END) as customer_meetings,
        COUNT(CASE WHEN is_recurring THEN 1 END) as recurring_events,
        COUNT(CASE WHEN start_time >= CURRENT_TIMESTAMP AND start_time < CURRENT_TIMESTAMP + INTERVAL '7 days' THEN 1 END) as week_events,
        COUNT(CASE WHEN start_time >= CURRENT_TIMESTAMP AND start_time < CURRENT_TIMESTAMP + INTERVAL '1 day' THEN 1 END) as today_events
      FROM calendar_events
      WHERE organizer_email = $1
      AND start_time >= CURRENT_TIMESTAMP
    `;
    
    const eventsQuery = `
      SELECT * FROM calendar_events
      WHERE organizer_email = $1
      AND start_time >= CURRENT_TIMESTAMP
      ORDER BY start_time ASC
      LIMIT 20
    `;
    
    const prefsQuery = `
      SELECT * FROM user_preferences
      WHERE user_email = $1
    `;
    
    const [statsResult, eventsResult, prefsResult] = await Promise.all([
      pool.query(statsQuery, [userEmail]),
      pool.query(eventsQuery, [userEmail]),
      pool.query(prefsQuery, [userEmail])
    ]);
    
    const stats = statsResult.rows[0];
    const events = eventsResult.rows;
    const preferences = prefsResult.rows[0];
    
    res.render('dashboard', {
      userEmail,
      stats,
      events,
      preferences
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const userEmail = req.session.userEmail!;
    const count = await syncCalendarEvents(userEmail);
    res.json({ success: true, eventsCount: count });
  } catch (error: any) {
    console.error('Sync error:', error);
    
    let errorMessage = 'Sync failed';
    
    // Handle specific Google API errors
    if (error.message && error.message.includes('Google Calendar API has not been used')) {
      errorMessage = 'Google Calendar API is not enabled. Please enable it in Google Cloud Console and try again.';
    } else if (error.message && error.message.includes('insufficient permissions')) {
      errorMessage = 'Insufficient permissions. Please re-authorize the application.';
    } else if (error.code === 403) {
      errorMessage = 'Permission denied. Check your Google Calendar API settings.';
    } else if (error.code === 401) {
      errorMessage = 'Authentication failed. Please log in again.';
    }
    
    res.status(500).json({ success: false, error: errorMessage });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const userEmail = req.session.userEmail!;
    const query = 'SELECT * FROM user_preferences WHERE user_email = $1';
    const result = await pool.query(query, [userEmail]);
    
    res.render('settings', {
      userEmail,
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).render('error', { message: 'Failed to load settings' });
  }
});

export default router;