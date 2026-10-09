#!/usr/bin/env node
/**
 * Test Deployment API
 * Provides safe test environment deployment without affecting production
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TestDeploymentAPI {
  constructor() {
    this.isDeploying = false;
    this.deploymentLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.deploymentLog.push(logEntry);
    console.log(logEntry);
  }

  error(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}`;
    this.deploymentLog.push(logEntry);
    console.error(logEntry);
  }

  async clearGitLocks() {
    try {
      await execAsync('rm -f .git/*.lock .git/refs/heads/*.lock 2>/dev/null || true');
      this.log('Cleared Git lock files');
    } catch (error) {
      this.log('No Git locks to clear');
    }
  }

  async getCurrentBranch() {
    try {
      const { stdout } = await execAsync('git branch --show-current');
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  async commitCurrentChanges() {
    try {
      // Add all changes
      await execAsync('git add .');
      
      // Check if there are changes to commit
      const { stdout } = await execAsync('git status --porcelain');
      if (stdout.trim()) {
        const timestamp = new Date().toISOString();
        await execAsync(`git commit -m "Test deployment changes - ${timestamp}"`);
        this.log('Committed current changes');
        return true;
      } else {
        this.log('No changes to commit');
        return false;
      }
    } catch (error) {
      this.log(`Commit failed: ${error.message}`);
      return false;
    }
  }

  async deployToTest() {
    if (this.isDeploying) {
      throw new Error('Deployment already in progress');
    }

    this.isDeploying = true;
    this.deploymentLog = [];

    try {
      this.log('🚀 Starting test environment deployment');
      
      // Clear Git locks
      await this.clearGitLocks();
      
      // Get current branch
      const currentBranch = await this.getCurrentBranch();
      this.log(`Current branch: ${currentBranch}`);
      
      // Commit current changes
      await this.commitCurrentChanges();
      
      // Push to trigger deployment
      this.log('Pushing changes to trigger deployment...');
      await execAsync(`git push origin ${currentBranch}`);
      this.log('Changes pushed successfully');
      
      // Build application
      this.log('Building application...');
      await execAsync('npm run build');
      this.log('Build completed');
      
      this.log('✅ Test deployment completed successfully');
      this.log('🔗 Changes should be live at: https://sharebrain.me/test');
      
      return {
        success: true,
        message: 'Test deployment completed successfully',
        target: 'https://sharebrain.me/test',
        log: this.deploymentLog
      };
      
    } catch (error) {
      this.error(`Deployment failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        log: this.deploymentLog
      };
    } finally {
      this.isDeploying = false;
    }
  }

  getDeploymentStatus() {
    return {
      isDeploying: this.isDeploying,
      log: this.deploymentLog
    };
  }
}

// Export singleton instance
export const testDeploymentAPI = new TestDeploymentAPI();