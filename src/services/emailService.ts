import nodemailer from 'nodemailer';
import pool from '../config/database';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendNotificationEmail(userEmail: string, preferences: any) {
  try {
    const upcomingEvents = await getUpcomingEvents(userEmail, preferences.advance_notice_hours);
    
    if (upcomingEvents.length === 0) {
      return;
    }

    const emailContent = generateEmailContent(upcomingEvents);
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: `MrSE: Upcoming Meetings - ${new Date().toLocaleDateString()}`,
      html: emailContent
    });

    await logNotification(userEmail, upcomingEvents, 'sent');
  } catch (error) {
    console.error('Error sending notification email:', error);
    await logNotification(userEmail, [], 'failed', error.message);
    throw error;
  }
}

async function getUpcomingEvents(userEmail: string, advanceHours: number) {
  const query = `
    SELECT * FROM calendar_events
    WHERE organizer_email = $1
    AND start_time BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '${advanceHours} hours'
    AND status != 'cancelled'
    ORDER BY start_time ASC
  `;
  
  const result = await pool.query(query, [userEmail]);
  return result.rows;
}

function generateEmailContent(events: any[]): string {
  const groupedEvents = {
    internal: events.filter(e => e.meeting_type === 'internal'),
    external: events.filter(e => e.meeting_type === 'external'),
    customer: events.filter(e => e.is_customer_meeting)
  };

  let html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .header { background-color: #2c3e50; color: white; padding: 20px; }
          .section { margin: 20px 0; }
          .event { border-left: 4px solid #3498db; padding: 10px; margin: 10px 0; background: #f4f4f4; }
          .external { border-left-color: #e74c3c; }
          .customer { border-left-color: #27ae60; }
          .time { font-weight: bold; color: #2c3e50; }
          .attendees { font-size: 0.9em; color: #666; }
          .prep-tip { background: #fffacd; padding: 10px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your Upcoming Meetings</h1>
          <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
  `;

  if (groupedEvents.customer.length > 0) {
    html += `
      <div class="section">
        <h2>🎯 Customer Meetings (${groupedEvents.customer.length})</h2>
        ${groupedEvents.customer.map(event => generateEventHtml(event, 'customer')).join('')}
      </div>
    `;
  }

  if (groupedEvents.external.length > 0) {
    html += `
      <div class="section">
        <h2>🤝 External Meetings (${groupedEvents.external.length})</h2>
        ${groupedEvents.external.map(event => generateEventHtml(event, 'external')).join('')}
      </div>
    `;
  }

  if (groupedEvents.internal.length > 0) {
    html += `
      <div class="section">
        <h2>🏢 Internal Meetings (${groupedEvents.internal.length})</h2>
        ${groupedEvents.internal.map(event => generateEventHtml(event, 'internal')).join('')}
      </div>
    `;
  }

  html += `
        <div class="prep-tip">
          <h3>Meeting Preparation Tips:</h3>
          <ul>
            <li>Review previous meeting notes and action items</li>
            <li>Prepare agenda items and questions</li>
            <li>Check for any pre-read materials</li>
            <li>Test your audio/video setup 5 minutes before</li>
          </ul>
        </div>
      </body>
    </html>
  `;

  return html;
}

function generateEventHtml(event: any, type: string): string {
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  const attendees = JSON.parse(event.attendees || '[]');
  
  return `
    <div class="event ${type}">
      <div class="time">
        ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
        ${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <h3>${event.summary}</h3>
      ${event.location ? `<p>📍 ${event.location}</p>` : ''}
      ${event.description ? `<p>${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}</p>` : ''}
      ${attendees.length > 0 ? `
        <div class="attendees">
          👥 ${attendees.length} attendees: ${attendees.slice(0, 3).map(a => a.email).join(', ')}${attendees.length > 3 ? ', ...' : ''}
        </div>
      ` : ''}
      ${event.is_recurring ? '<p>🔄 Recurring event</p>' : ''}
    </div>
  `;
}

async function logNotification(userEmail: string, events: any[], status: string, errorMessage?: string) {
  const query = `
    INSERT INTO notification_logs (user_email, events_included, status, error_message)
    VALUES ($1, $2, $3, $4)
  `;
  
  await pool.query(query, [
    userEmail,
    JSON.stringify(events.map(e => ({ id: e.google_event_id, summary: e.summary }))),
    status,
    errorMessage
  ]);
}