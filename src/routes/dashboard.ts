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
    
    console.log(`📊 Dashboard loaded for ${userEmail}: ${events.length} events found`);
    
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

router.get('/database', async (req, res) => {
  try {
    const userEmail = req.session.userEmail!;
    
    // Get comprehensive database information
    const eventsQuery = `
      SELECT 
        google_event_id,
        summary,
        description,
        location,
        start_time,
        end_time,
        is_all_day,
        is_recurring,
        organizer_email,
        attendees,
        is_internal,
        meeting_type,
        is_customer_meeting,
        status,
        created_at,
        updated_at,
        last_synced_at
      FROM calendar_events 
      WHERE organizer_email = $1 
      ORDER BY start_time ASC
    `;
    
    const changesQuery = `
      SELECT 
        c.google_event_id,
        c.change_type,
        c.changed_at,
        e.summary
      FROM event_changes c
      LEFT JOIN calendar_events e ON c.google_event_id = e.google_event_id
      WHERE e.organizer_email = $1 OR c.google_event_id IN (
        SELECT google_event_id FROM calendar_events WHERE organizer_email = $1
      )
      ORDER BY c.changed_at DESC
      LIMIT 50
    `;
    
    const tokenQuery = `
      SELECT 
        user_email,
        token_type,
        expiry_date,
        created_at,
        updated_at
      FROM oauth_tokens 
      WHERE user_email = $1
    `;
    
    const preferencesQuery = `
      SELECT * FROM user_preferences WHERE user_email = $1
    `;
    
    const notificationQuery = `
      SELECT 
        sent_at,
        status,
        error_message,
        events_included
      FROM notification_logs 
      WHERE user_email = $1 
      ORDER BY sent_at DESC 
      LIMIT 20
    `;
    
    const [eventsResult, changesResult, tokenResult, prefsResult, notificationResult] = await Promise.all([
      pool.query(eventsQuery, [userEmail]),
      pool.query(changesQuery, [userEmail]),
      pool.query(tokenQuery, [userEmail]),
      pool.query(preferencesQuery, [userEmail]),
      pool.query(notificationQuery, [userEmail])
    ]);
    
    res.render('database', {
      userEmail,
      events: eventsResult.rows,
      changes: changesResult.rows,
      token: tokenResult.rows[0],
      preferences: prefsResult.rows[0],
      notifications: notificationResult.rows
    });
    
  } catch (error) {
    console.error('Database view error:', error);
    res.status(500).render('error', { message: 'Failed to load database view' });
  }
});

export default router;