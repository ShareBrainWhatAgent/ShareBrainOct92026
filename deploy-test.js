#!/usr/bin/env node
/**
 * Test Deployment Script for ShareBrain
 * Deploys current development environment to https://sharebrain.me/test
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function deployToTest() {
  console.log('🚀 Starting deployment to https://sharebrain.me/test');
  
  try {
    // 1. Build the application
    console.log('📦 Building application...');
    await execAsync('npm run build');

    // 2. Run language lesson update scripts
    console.log('📚 Updating language lesson content...');
    await execAsync('npm run seed:lesson-cache');
    await execAsync('tsx server/scripts/implementStructuredLessonPlans.ts');

    // 3. Copy test configuration
    console.log('⚙️  Configuring test environment...');
    if (fs.existsSync('.replit.test')) {
      fs.copyFileSync('.replit.test', '.replit');
    }

    // 4. Set test environment variables
    console.log('🔧 Setting test environment...');
    process.env.NODE_ENV = 'test';
    process.env.ENVIRONMENT = 'test';
    process.env.REPLIT_DOMAINS = 'test.sharebrain.me';

    // 5. Deploy to Replit
    console.log('🌐 Deploying to test environment...');
    await execAsync('replit deploy');
    
    console.log('✅ Successfully deployed to https://sharebrain.me/test');
    console.log('🔗 Your test environment is now live!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployToTest();
