#!/usr/bin/env node

// Git Manager for ShareBrain Development
// Handles Git operations programmatically within Replit

import { execSync } from 'child_process';
import { Octokit } from "@octokit/rest";
import fs from 'fs';
import path from 'path';

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

const REPO_OWNER = 'ShareBrainWhatAgent';
const REPO_NAME = 'AiAgentPlatformJuly3';

class GitManager {
  constructor() {
    this.workingDir = process.cwd();
  }

  // Execute git command with proper error handling
  async execGit(command, options = {}) {
    try {
      console.log(`🔄 Executing: ${command}`);
      const result = execSync(command, {
        cwd: this.workingDir,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return result?.trim();
    } catch (error) {
      console.error(`❌ Git command failed: ${command}`);
      console.error(error.message);
      throw error;
    }
  }

  // Get current branch
  async getCurrentBranch() {
    try {
      return await this.execGit('git rev-parse --abbrev-ref HEAD', { silent: true });
    } catch {
      return 'main';
    }
  }

  // Initialize git repository if needed
  async initializeRepo() {
    try {
      await this.execGit('git status', { silent: true });
      console.log('✅ Git repository already initialized');
    } catch {
      console.log('🔄 Initializing Git repository...');
      await this.execGit('git init');
      await this.execGit(`git remote add origin https://${process.env.GITHUB_ACCESS_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`);
      console.log('✅ Git repository initialized');
    }
  }

  // Configure git user
  async configureUser() {
    try {
      await this.execGit('git config user.name "ShareBrain Development"');
      await this.execGit('git config user.email "dev@sharebrain.me"');
      console.log('✅ Git user configured');
    } catch (error) {
      console.log('⚠️ Git user configuration failed');
    }
  }

  // Fetch latest changes from remote
  async fetchFromRemote() {
    try {
      await this.execGit('git fetch origin');
      console.log('✅ Fetched latest changes from remote');
    } catch (error) {
      console.log('⚠️ Fetch failed, continuing...');
    }
  }

  // Switch to branch
  async switchBranch(branchName) {
    try {
      const currentBranch = await this.getCurrentBranch();
      if (currentBranch === branchName) {
        console.log(`✅ Already on branch: ${branchName}`);
        return;
      }

      console.log(`🔄 Switching to branch: ${branchName}`);
      
      // Try to checkout existing branch
      try {
        await this.execGit(`git checkout ${branchName}`);
        console.log(`✅ Switched to existing branch: ${branchName}`);
      } catch {
        // Branch doesn't exist locally, try to create from remote
        try {
          await this.execGit(`git checkout -b ${branchName} origin/${branchName}`);
          console.log(`✅ Created and switched to branch: ${branchName}`);
        } catch {
          // Create new branch from current
          await this.execGit(`git checkout -b ${branchName}`);
          console.log(`✅ Created new branch: ${branchName}`);
        }
      }
      
      // Pull latest changes if branch exists on remote
      try {
        await this.execGit(`git pull origin ${branchName}`);
        console.log(`✅ Pulled latest changes for ${branchName}`);
      } catch {
        console.log(`ℹ️ No remote branch ${branchName} to pull from`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to switch to branch: ${branchName}`);
      throw error;
    }
  }

  // Create and switch to new feature branch
  async createFeatureBranch(featureName) {
    try {
      // Ensure we're on develop branch first
      await this.switchBranch('develop');
      
      // Create feature branch
      const branchName = `feature/${featureName}`;
      await this.execGit(`git checkout -b ${branchName}`);
      
      console.log(`✅ Created feature branch: ${branchName}`);
      return branchName;
    } catch (error) {
      console.error(`❌ Failed to create feature branch: ${featureName}`);
      throw error;
    }
  }

  // Commit changes
  async commitChanges(message) {
    try {
      // Check if there are changes to commit
      const status = await this.execGit('git status --porcelain', { silent: true });
      if (!status.trim()) {
        console.log('ℹ️ No changes to commit');
        return;
      }

      await this.execGit('git add .');
      await this.execGit(`git commit -m "${message}"`);
      console.log(`✅ Committed changes: ${message}`);
    } catch (error) {
      console.error('❌ Failed to commit changes');
      throw error;
    }
  }

  // Push to remote
  async pushToRemote(branchName = null) {
    try {
      const currentBranch = branchName || await this.getCurrentBranch();
      await this.execGit(`git push origin ${currentBranch}`);
      console.log(`✅ Pushed ${currentBranch} to remote`);
    } catch (error) {
      console.error('❌ Failed to push to remote');
      throw error;
    }
  }

  // Get status
  async getStatus() {
    try {
      const currentBranch = await this.getCurrentBranch();
      const status = await this.execGit('git status --short', { silent: true });
      
      console.log(`📋 Current branch: ${currentBranch}`);
      console.log(`📊 Status: ${status || 'Working directory clean'}`);
      
      return {
        branch: currentBranch,
        status: status,
        clean: !status.trim()
      };
    } catch (error) {
      console.error('❌ Failed to get status');
      throw error;
    }
  }

  // Setup complete workflow
  async setupWorkflow() {
    try {
      console.log('🚀 Setting up Git workflow...');
      
      await this.initializeRepo();
      await this.configureUser();
      await this.fetchFromRemote();
      
      // Ensure develop branch exists
      await this.switchBranch('develop');
      
      console.log('✅ Git workflow setup complete');
      return true;
    } catch (error) {
      console.error('❌ Failed to setup workflow');
      throw error;
    }
  }
}

// Command line interface
async function main() {
  const gitManager = new GitManager();
  const [,, command, ...args] = process.argv;
  
  try {
    switch (command) {
      case 'setup':
        await gitManager.setupWorkflow();
        break;
      case 'switch':
        await gitManager.switchBranch(args[0]);
        break;
      case 'create-feature':
        await gitManager.createFeatureBranch(args[0]);
        break;
      case 'commit':
        await gitManager.commitChanges(args[0]);
        break;
      case 'push':
        await gitManager.pushToRemote(args[0]);
        break;
      case 'status':
        await gitManager.getStatus();
        break;
      default:
        console.log('🛠️  Git Manager Commands:');
        console.log('  setup                    - Initialize and configure Git workflow');
        console.log('  switch [branch]          - Switch to specified branch');
        console.log('  create-feature [name]    - Create new feature branch');
        console.log('  commit "[message]"       - Commit all changes');
        console.log('  push [branch]            - Push to remote');
        console.log('  status                   - Show current status');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
export { GitManager };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}