#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building production version...');

// Step 1: Build the frontend
console.log('Building frontend with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

// Step 2: Copy build output to server/public
console.log('Copying build output to server/public...');
const sourceDir = path.resolve('./dist/public');
const targetDir = path.resolve('./server/public');

// Remove existing server/public contents
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true });
}

// Copy dist/public to server/public
fs.cpSync(sourceDir, targetDir, { recursive: true });

// Step 3: Build the backend
console.log('Building backend with esbuild...');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

console.log('Production build complete!');
console.log('Frontend built to: server/public');
console.log('Backend built to: dist/index.js');