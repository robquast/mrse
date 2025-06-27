import express from 'express';
import session from 'express-session';
import path from 'path';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './utils/dbInit';
import { startScheduler } from './services/scheduler';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'mrse-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Add error handling for route imports
try {
  app.use('/auth', authRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/api', apiRoutes);
} catch (error) {
  console.error('Error setting up routes:', error);
}

app.get('/', (req, res) => {
  console.log('Root route accessed');
  if (req.session?.userEmail) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/auth/login');
  }
});

// Add a test route
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', err);
  res.status(500).send('Internal Server Error');
});

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized');
    
    startScheduler();
    console.log('Scheduler started');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`MrSE server running on http://localhost:${PORT}`);
    });
    
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  // Don't exit immediately, log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack trace:', reason.stack);
  }
  // Don't exit immediately, log and continue
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});