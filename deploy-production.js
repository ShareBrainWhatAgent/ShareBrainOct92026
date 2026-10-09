#!/usr/bin/env node
/**
 * Production Deployment Script for ShareBrain
 * Deploys current development environment to https://sharebrain.me (production)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function deployToProduction() {
  console.log('🚀 Starting deployment to https://sharebrain.me (PRODUCTION)');
  
  try {
    // 1. Confirmation check
    console.log('⚠️  This will deploy to PRODUCTION. Make sure you have tested on test environment first!');
    
    // 2. Build the application
    console.log('📦 Building application...');
    await execAsync('npm run build');

    // 3. Copy production configuration
    console.log('⚙️  Configuring production environment...');
    if (fs.existsSync('.replit.production')) {
      fs.copyFileSync('.replit.production', '.replit');
    } else {
      // Use default .replit for production
      console.log('Using default .replit configuration for production');
    }

    // 4. Set production environment variables
    console.log('🔧 Setting production environment...');
    process.env.NODE_ENV = 'production';
    process.env.ENVIRONMENT = 'production';

    // 5. Run language lesson update scripts
    console.log('📚 Updating language lesson content...');
    await execAsync('npm run seed:lesson-cache');
    await execAsync('tsx server/scripts/implementStructuredLessonPlans.ts');

    // 6. Deploy to Replit
    console.log('🌐 Deploying to production environment...');
    await execAsync('replit deploy');
    
    console.log('✅ Successfully deployed to https://sharebrain.me');
    console.log('🔗 Your production environment is now live!');
    
  } catch (error) {
    console.error('❌ Production deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deployToProduction();
