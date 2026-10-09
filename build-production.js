#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building production version...');

try {
  // Step 1: Build the frontend
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Copy build output to server/public
  console.log('Copying build output to server/public...');
  const sourceDir = path.resolve('./dist/public');
  const targetDir = path.resolve('./server/public');

  if (fs.existsSync(sourceDir)) {
    // Remove existing server/public contents
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true });
    }

    // Copy dist/public to server/public
    fs.cpSync(sourceDir, targetDir, { recursive: true });
    console.log('✅ Build files copied to server/public');
  } else {
    console.error('❌ Source directory dist/public not found');
    process.exit(1);
  }

  console.log('✅ Production build complete!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}