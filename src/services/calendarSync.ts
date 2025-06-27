import { google, calendar_v3 } from 'googleapis';
import pool from '../config/database';
import { getAuthenticatedClient } from './googleAuth';

export interface CalendarEvent {
  googleEventId: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  organizerEmail?: string;
  attendees: any[];
  status?: string;
  htmlLink?: string;
}

export async function syncCalendarEvents(userEmail: string) {
  const auth = await getAuthenticatedClient(userEmail);
  if (!auth) {
    throw new Error('User not authenticated');
  }

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    console.log('🔍 Starting calendar sync for user:', userEmail);
    
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    console.log('📅 Requesting events from', now.toISOString(), 'to', threeMonthsFromNow.toISOString());

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: threeMonthsFromNow.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    console.log('✅ Successfully received calendar response');

    const events = response.data.items || [];
    
    for (const event of events) {
      await saveOrUpdateEvent(event, userEmail);
    }

    await detectDeletedEvents(events.map(e => e.id!), userEmail);
    
    return events.length;
  } catch (error) {
    console.error('Error syncing calendar:', error);
    throw error;
  }
}

async function saveOrUpdateEvent(event: calendar_v3.Schema$Event, userEmail: string) {
  const startTime = event.start?.dateTime || event.start?.date;
  const endTime = event.end?.dateTime || event.end?.date;
  
  if (!startTime || !endTime || !event.id) {
    return;
  }

  const isAllDay = !event.start?.dateTime;
  const isRecurring = !!event.recurringEventId || !!event.recurrence;
  const attendees = event.attendees || [];
  const organizerEmail = event.organizer?.email || userEmail;
  
  const meetingType = determineMeetingType(organizerEmail, attendees, userEmail);

  const existingEvent = await getEventById(event.id);
  const changeType = existingEvent ? 'updated' : 'created';

  const query = `
    INSERT INTO calendar_events (
      google_event_id, summary, description, location, start_time, end_time,
      is_all_day, is_recurring, recurrence_rule, organizer_email, attendees,
      is_internal, meeting_type, status, html_link
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (google_event_id) 
    DO UPDATE SET
      summary = $2, description = $3, location = $4, start_time = $5,
      end_time = $6, is_all_day = $7, is_recurring = $8, recurrence_rule = $9,
      organizer_email = $10, attendees = $11, is_internal = $12, meeting_type = $13,
      status = $14, html_link = $15, last_synced_at = CURRENT_TIMESTAMP
  `;

  await pool.query(query, [
    event.id,
    event.summary || 'No title',
    event.description,
    event.location,
    new Date(startTime),
    new Date(endTime),
    isAllDay,
    isRecurring,
    event.recurrence?.join('\n'),
    organizerEmail,
    JSON.stringify(attendees || []), // Ensure we always store a valid array
    meetingType === 'internal',
    meetingType,
    event.status,
    event.htmlLink
  ]);

  if (changeType === 'updated' && existingEvent) {
    await logEventChange(event.id, changeType, { 
      old: existingEvent, 
      new: event 
    });
  } else if (changeType === 'created') {
    await logEventChange(event.id, changeType, event);
  }
}

function determineMeetingType(organizerEmail: string, attendees: any[], userEmail: string): string {
  const userDomain = userEmail.split('@')[1];
  const organizerDomain = organizerEmail.split('@')[1];
  
  if (attendees.length === 0) {
    return 'internal';
  }

  const externalAttendees = attendees.filter(attendee => {
    const attendeeDomain = attendee.email?.split('@')[1];
    return attendeeDomain && attendeeDomain !== userDomain;
  });

  if (externalAttendees.length === 0) {
    return 'internal';
  }

  return 'external';
}

async function getEventById(googleEventId: string) {
  const query = 'SELECT * FROM calendar_events WHERE google_event_id = $1';
  const result = await pool.query(query, [googleEventId]);
  return result.rows[0];
}

async function logEventChange(googleEventId: string, changeType: string, changeData: any) {
  const query = `
    INSERT INTO event_changes (google_event_id, change_type, change_data)
    VALUES ($1, $2, $3)
  `;
  await pool.query(query, [googleEventId, changeType, JSON.stringify(changeData)]);
}

async function detectDeletedEvents(currentEventIds: string[], userEmail: string) {
  const query = `
    SELECT google_event_id FROM calendar_events 
    WHERE organizer_email = $1 
    AND google_event_id NOT IN (${currentEventIds.map((_, i) => `$${i + 2}`).join(', ')})
    AND start_time > CURRENT_TIMESTAMP
  `;
  
  const result = await pool.query(query, [userEmail, ...currentEventIds]);
  
  for (const row of result.rows) {
    await logEventChange(row.google_event_id, 'deleted', { eventId: row.google_event_id });
  }
}