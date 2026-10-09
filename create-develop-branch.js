#!/usr/bin/env node

// Script to create development branch through backend API
import { execSync } from 'child_process';

async function createDevelopBranch() {
  try {
    console.log('🔄 Creating development branch...');
    
    // Create develop branch from main
    console.log('Creating develop branch...');
    execSync('git branch develop', { stdio: 'inherit' });
    
    // Switch to develop branch  
    console.log('Switching to develop branch...');
    execSync('git checkout develop', { stdio: 'inherit' });
    
    // Push develop branch to remote
    console.log('Pushing develop branch to remote...');
    execSync('git push -u origin develop', { stdio: 'inherit' });
    
    console.log('✅ Development branch created successfully!');
    console.log('Current branch:', execSync('git branch --show-current', { encoding: 'utf8' }).trim());
    
  } catch (error) {
    console.error('❌ Failed to create development branch:', error.message);
    console.log('\nTrying alternative approach...');
    
    try {
      // Alternative approach - create and checkout in one command
      execSync('git checkout -b develop', { stdio: 'inherit' });
      execSync('git push -u origin develop', { stdio: 'inherit' });
      console.log('✅ Development branch created with alternative method!');
    } catch (altError) {
      console.error('❌ Alternative approach also failed:', altError.message);
      console.log('\nPlease create the branch manually with:');
      console.log('git checkout -b develop');
      console.log('git push -u origin develop');
    }
  }
}

createDevelopBranch();