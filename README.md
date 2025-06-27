# MrSE - Sales Engineer Productivity Assistant

MrSE (Mr. Sales Engineer) is a productivity tool designed to help sales engineers manage their time more effectively by integrating with Google Calendar, automatically categorizing meetings, and providing timely notifications for meeting preparation.

## Features

- 🗓️ **Google Calendar Integration** - Automatic synchronization with your Google Calendar
- 🔄 **Hourly Sync** - Keeps your calendar data up-to-date with hourly synchronization
- 📊 **Meeting Classification** - Automatically identifies internal vs external meetings
- 📧 **Email Notifications** - Customizable email reminders for upcoming meetings
- 📈 **Dashboard Analytics** - Visual insights into your meeting patterns
- 🔐 **OAuth Authentication** - Secure Google OAuth integration
- 🚀 **OpenShift Ready** - Containerized for easy deployment

## Prerequisites

- Node.js 20+
- PostgreSQL
- Google Cloud Console account for OAuth credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mrse.git
cd mrse
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```bash
createdb mrse
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:3000/auth/google/callback`

## Configuration

Update the `.env` file with your credentials:

```env
# Database
DATABASE_URL=postgresql://localhost/mrse

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Production Deployment

### Docker
```bash
docker build -t mrse .
docker run -p 3000:3000 --env-file .env mrse
```

### OpenShift
```bash
oc create secret generic mrse-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=google-client-id=$GOOGLE_CLIENT_ID \
  --from-literal=google-client-secret=$GOOGLE_CLIENT_SECRET \
  --from-literal=smtp-user=$SMTP_USER \
  --from-literal=smtp-pass=$SMTP_PASS \
  --from-literal=session-secret=$SESSION_SECRET

oc apply -f deployment.yaml
```

## Usage

1. Navigate to http://localhost:3000
2. Sign in with your Google account
3. Grant calendar permissions
4. View your dashboard with meeting statistics
5. Configure notification preferences in Settings

## Architecture

- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL
- **Authentication**: Google OAuth 2.0
- **Scheduler**: node-cron for automated tasks
- **Email**: Nodemailer for notifications
- **Frontend**: EJS templates with vanilla JavaScript

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.