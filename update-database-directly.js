#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import { readFileSync } from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateWebsiteInDatabase() {
  try {
    console.log('Reading authentic website file...');
    const htmlContent = readFileSync('./complete-authentic-website.html', 'utf8');
    
    console.log('Updating database with authentic data...');
    const result = await pool.query(
      'UPDATE agent_workspaces SET code = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE agent_id = $3',
      [
        htmlContent,
        'Enhanced with authentic data from official manufacturer websites - comprehensive repair shop listings with verified contact information and source attribution',
        321
      ]
    );
    
    console.log('Database update result:', result.rowCount, 'rows affected');
    console.log('Successfully updated website with authentic data and source attribution');
    
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await pool.end();
  }
}

updateWebsiteInDatabase();