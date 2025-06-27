import { Router } from 'express';
import pool from '../config/database';
import { updateUserNotificationSchedule } from '../services/scheduler';

const router = Router();

router.use((req, res, next) => {
  if (!req.session.userEmail) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

router.post('/preferences', async (req, res) => {
  try {
    const userEmail = req.session.userEmail!;
    const {
      notificationSchedule,
      notificationEnabled,
      advanceNoticeHours,
      includeInternalMeetings,
      includeExternalMeetings
    } = req.body;

    const query = `
      UPDATE user_preferences
      SET 
        notification_schedule = $2,
        notification_enabled = $3,
        advance_notice_hours = $4,
        include_internal_meetings = $5,
        include_external_meetings = $6
      WHERE user_email = $1
    `;

    await pool.query(query, [
      userEmail,
      notificationSchedule,
      notificationEnabled,
      advanceNoticeHours,
      includeInternalMeetings,
      includeExternalMeetings
    ]);

    updateUserNotificationSchedule(userEmail, notificationSchedule, notificationEnabled);

    res.json({ success: true });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

router.get('/events/stats', async (req, res) => {
  try {
    const userEmail = req.session.userEmail!;
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN meeting_type = 'internal' THEN 1 END) as internal,
        COUNT(CASE WHEN meeting_type = 'external' THEN 1 END) as external,
        COUNT(CASE WHEN is_customer_meeting THEN 1 END) as customer
      FROM calendar_events
      WHERE organizer_email = $1
      AND start_time >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
      AND start_time <= CURRENT_DATE
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [userEmail]);
    res.json(result.rows);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;