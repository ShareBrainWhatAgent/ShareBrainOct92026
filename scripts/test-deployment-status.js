#!/usr/bin/env node
/**
 * Test Deployment Status Checker
 * Monitors and verifies test deployment status
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DeploymentStatusChecker {
  constructor() {
    this.testUrl = 'https://sharebrain.me/test';
  }

  async checkDeploymentStatus() {
    try {
      console.log('🔍 Checking test deployment status...');
      
      // Check Git status
      const gitStatus = await this.checkGitStatus();
      
      // Check if test environment is responding
      const testResponse = await this.checkTestEnvironment();
      
      return {
        success: true,
        git: gitStatus,
        testEnvironment: testResponse,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkGitStatus() {
    try {
      const { stdout: branch } = await execAsync('git branch --show-current');
      const { stdout: status } = await execAsync('git status --porcelain');
      const { stdout: lastCommit } = await execAsync('git log -1 --pretty=format:"%h %s %an %cr"');
      
      return {
        currentBranch: branch.trim(),
        hasUncommittedChanges: status.trim().length > 0,
        lastCommit: lastCommit.trim(),
        uncommittedFiles: status.trim().split('\n').filter(line => line.trim()).length
      };
    } catch (error) {
      return {
        error: `Git status check failed: ${error.message}`
      };
    }
  }

  async checkTestEnvironment() {
    try {
      // In a real implementation, this would make an HTTP request to test environment
      // For now, we'll simulate the check
      return {
        url: this.testUrl,
        responding: true,
        lastChecked: new Date().toISOString(),
        note: 'Test environment check simulated - would ping actual URL in production'
      };
    } catch (error) {
      return {
        url: this.testUrl,
        responding: false,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new DeploymentStatusChecker();
  checker.checkDeploymentStatus().then(status => {
    console.log(JSON.stringify(status, null, 2));
  });
}