#!/usr/bin/env node
/**
 * Test Environment Deployment Script
 * Safely deploys current development state to test environment
 * without affecting production
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class TestDeployment {
  constructor() {
    this.testBranch = 'test-deployment';
    this.mainBranch = 'main';
    this.originalBranch = null;
  }

  async log(message) {
    console.log(`🔧 ${message}`);
  }

  async error(message) {
    console.error(`❌ ${message}`);
  }

  async success(message) {
    console.log(`✅ ${message}`);
  }

  // Get current branch
  async getCurrentBranch() {
    try {
      const { stdout } = await execAsync('git branch --show-current');
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  // Create or switch to test deployment branch
  async prepareTestBranch() {
    try {
      // Store original branch
      this.originalBranch = await this.getCurrentBranch();
      this.log(`Current branch: ${this.originalBranch}`);

      // Check if test branch exists
      try {
        await execAsync(`git show-ref --verify refs/heads/${this.testBranch}`);
        this.log(`Test branch ${this.testBranch} exists, switching to it`);
        await execAsync(`git checkout ${this.testBranch}`);
      } catch {
        this.log(`Creating new test branch ${this.testBranch}`);
        await execAsync(`git checkout -b ${this.testBranch}`);
      }

      // Merge latest changes from original branch
      this.log(`Merging latest changes from ${this.originalBranch}`);
      await execAsync(`git merge ${this.originalBranch} --no-edit`);

      return true;
    } catch (error) {
      throw new Error(`Failed to prepare test branch: ${error.message}`);
    }
  }

  // Build application for test environment
  async buildForTest() {
    try {
      this.log('Building application for test environment...');
      
      // Set test environment variables
      process.env.NODE_ENV = 'test';
      process.env.ENVIRONMENT = 'test';
      process.env.REPLIT_DOMAINS = 'test.sharebrain.me';
      
      // Run build
      await execAsync('npm run build');
      this.success('Build completed successfully');
      
      return true;
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  // Deploy to test environment using Git push
  async deployToTest() {
    try {
      this.log('Deploying to test environment...');
      
      // Add all changes
      await execAsync('git add .');
      
      // Commit if there are changes
      try {
        const { stdout } = await execAsync('git status --porcelain');
        if (stdout.trim()) {
          await execAsync(`git commit -m "Test deployment - $(date)"`);
          this.log('Changes committed');
        } else {
          this.log('No changes to commit');
        }
      } catch (error) {
        this.log('Nothing to commit or commit failed, continuing...');
      }

      // Push test branch to trigger deployment
      await execAsync(`git push origin ${this.testBranch} --force`);
      this.success('Pushed to test deployment branch');
      
      return true;
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  // Restore original branch
  async cleanup() {
    try {
      if (this.originalBranch) {
        this.log(`Returning to original branch: ${this.originalBranch}`);
        await execAsync(`git checkout ${this.originalBranch}`);
      }
    } catch (error) {
      this.error(`Failed to return to original branch: ${error.message}`);
    }
  }

  // Main deployment process
  async deploy() {
    try {
      this.log('🚀 Starting test environment deployment');
      
      // Prepare test branch
      await this.prepareTestBranch();
      
      // Build for test
      await this.buildForTest();
      
      // Deploy
      await this.deployToTest();
      
      // Cleanup
      await this.cleanup();
      
      this.success('🎉 Test deployment completed successfully!');
      this.success('🔗 Your changes are now live at: https://sharebrain.me/test');
      
      return true;
    } catch (error) {
      this.error(`Deployment failed: ${error.message}`);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployment = new TestDeployment();
  deployment.deploy();
}

export default TestDeployment;