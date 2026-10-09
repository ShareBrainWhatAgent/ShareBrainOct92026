// Git Service for ShareBrain Development
// Programmatic Git operations that can be called from the application

import { GitManager } from '../../scripts/git-manager.js';

class GitService {
  constructor() {
    this.gitManager = new GitManager();
    this.initialized = false;
  }

  // Initialize the Git service
  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.gitManager.setupWorkflow();
      this.initialized = true;
      console.log('✅ Git service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Git service:', error.message);
      throw error;
    }
  }

  // Switch to development branch
  async switchToDevelopment() {
    await this.initialize();
    return await this.gitManager.switchBranch('develop');
  }

  // Switch to production branch
  async switchToProduction() {
    await this.initialize();
    return await this.gitManager.switchBranch('main');
  }

  // Switch to any branch
  async switchToBranch(branchName) {
    await this.initialize();
    return await this.gitManager.switchBranch(branchName);
  }

  // Create new feature branch
  async createFeatureBranch(featureName) {
    await this.initialize();
    return await this.gitManager.createFeatureBranch(featureName);
  }

  // Commit changes with message
  async commitChanges(message) {
    await this.initialize();
    return await this.gitManager.commitChanges(message);
  }

  // Push to remote
  async pushToRemote(branchName = null) {
    await this.initialize();
    return await this.gitManager.pushToRemote(branchName);
  }

  // Get current status
  async getStatus() {
    await this.initialize();
    return await this.gitManager.getStatus();
  }

  // Get current branch
  async getCurrentBranch() {
    await this.initialize();
    return await this.gitManager.getCurrentBranch();
  }

  // Complete workflow: switch to development, make changes, commit, and push
  async developmentWorkflow(featureName, commitMessage) {
    await this.initialize();
    
    try {
      // Create feature branch
      const branchName = await this.createFeatureBranch(featureName);
      
      // The changes would be made here by the calling code
      // This method just handles the Git operations
      
      // Commit changes
      await this.commitChanges(commitMessage);
      
      // Push to remote
      await this.pushToRemote(branchName);
      
      return {
        success: true,
        branch: branchName,
        message: `Feature ${featureName} created and pushed successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Complete workflow: switch to production and deploy
  async productionWorkflow(commitMessage) {
    await this.initialize();
    
    try {
      // Switch to main branch
      await this.switchToProduction();
      
      // Pull latest changes
      await this.gitManager.fetchFromRemote();
      
      // Merge develop into main would happen here
      // For now, just push any changes
      await this.commitChanges(commitMessage);
      await this.pushToRemote('main');
      
      return {
        success: true,
        message: 'Production deployment completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const gitService = new GitService();
export default gitService;