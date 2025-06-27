import pool from '../config/database';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    // Check if tables already exist
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'calendar_events'
      );
    `;
    
    const result = await pool.query(tableCheckQuery);
    const tablesExist = result.rows[0].exists;
    
    if (!tablesExist) {
      const schemaPath = path.join(process.cwd(), 'src/database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await pool.query(schema);
      console.log('Database schema initialized successfully');
    } else {
      console.log('Database schema already exists');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}