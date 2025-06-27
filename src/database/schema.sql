-- Create tables for MrSE application

-- OAuth tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50),
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    google_event_id VARCHAR(255) NOT NULL UNIQUE,
    summary VARCHAR(500),
    description TEXT,
    location VARCHAR(500),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,
    organizer_email VARCHAR(255),
    attendees JSONB,
    is_internal BOOLEAN,
    is_customer_meeting BOOLEAN DEFAULT FALSE,
    meeting_type VARCHAR(50), -- 'internal', 'external', 'customer', 'unknown'
    status VARCHAR(50),
    html_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event changes history table
CREATE TABLE IF NOT EXISTS event_changes (
    id SERIAL PRIMARY KEY,
    google_event_id VARCHAR(255) NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
    change_data JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (google_event_id) REFERENCES calendar_events(google_event_id) ON DELETE CASCADE
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    notification_schedule VARCHAR(50) DEFAULT '0 8 * * *', -- Cron format
    notification_enabled BOOLEAN DEFAULT TRUE,
    advance_notice_hours INTEGER DEFAULT 24,
    include_internal_meetings BOOLEAN DEFAULT TRUE,
    include_external_meetings BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification log table
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    events_included JSONB,
    status VARCHAR(50), -- 'sent', 'failed', 'pending'
    error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON calendar_events(organizer_email);
CREATE INDEX IF NOT EXISTS idx_events_meeting_type ON calendar_events(meeting_type);
CREATE INDEX IF NOT EXISTS idx_event_changes_event_id ON event_changes(google_event_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_email);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();