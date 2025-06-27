import * as cron from 'node-cron';
import { syncCalendarEvents } from './calendarSync';
import { sendNotificationEmail } from './emailService';
import pool from '../config/database';

const scheduledJobs = new Map<string, cron.ScheduledTask>();

export function startScheduler() {
  scheduleCalendarSync();
  scheduleEmailNotifications();
}

function scheduleCalendarSync() {
  const task = cron.schedule('0 * * * *', async () => {
    console.log('Running calendar sync...');
    try {
      const usersQuery = 'SELECT DISTINCT user_email FROM oauth_tokens';
      const users = await pool.query(usersQuery);
      
      for (const user of users.rows) {
        try {
          const count = await syncCalendarEvents(user.user_email);
          console.log(`Synced ${count} events for ${user.user_email}`);
        } catch (error) {
          console.error(`Error syncing calendar for ${user.user_email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in calendar sync scheduler:', error);
    }
  });

  scheduledJobs.set('calendar-sync', task);
  task.start();
}

async function scheduleEmailNotifications() {
  const query = 'SELECT * FROM user_preferences WHERE notification_enabled = true';
  const result = await pool.query(query);

  for (const pref of result.rows) {
    const task = cron.schedule(pref.notification_schedule, async () => {
      try {
        await sendNotificationEmail(pref.user_email, pref);
      } catch (error) {
        console.error(`Error sending notification to ${pref.user_email}:`, error);
      }
    });

    scheduledJobs.set(`email-${pref.user_email}`, task);
    task.start();
  }
}

export function updateUserNotificationSchedule(userEmail: string, schedule: string, enabled: boolean) {
  const existingTask = scheduledJobs.get(`email-${userEmail}`);
  if (existingTask) {
    existingTask.stop();
    scheduledJobs.delete(`email-${userEmail}`);
  }

  if (enabled && cron.validate(schedule)) {
    const task = cron.schedule(schedule, async () => {
      try {
        const prefQuery = 'SELECT * FROM user_preferences WHERE user_email = $1';
        const prefResult = await pool.query(prefQuery, [userEmail]);
        
        if (prefResult.rows[0]) {
          await sendNotificationEmail(userEmail, prefResult.rows[0]);
        }
      } catch (error) {
        console.error(`Error sending notification to ${userEmail}:`, error);
      }
    });

    scheduledJobs.set(`email-${userEmail}`, task);
    task.start();
  }
}

export function stopScheduler() {
  scheduledJobs.forEach(task => task.stop());
  scheduledJobs.clear();
}