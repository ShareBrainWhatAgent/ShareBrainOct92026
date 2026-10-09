#!/usr/bin/env node

// Development Workflow Script for ShareBrain
// Easy Git management without shell access

import { GitManager } from './git-manager.js';

const gitManager = new GitManager();

const commands = {
  'init': async () => {
    console.log('🚀 Initializing ShareBrain Git workflow...');
    await gitManager.setupWorkflow();
    console.log('✅ Git workflow initialized successfully!');
  },
  
  'status': async () => {
    console.log('📊 Getting current Git status...');
    const status = await gitManager.getStatus();
    console.log(`\n🌿 Current branch: ${status.branch}`);
    console.log(`📋 Status: ${status.clean ? 'Clean' : 'Changes detected'}`);
    if (status.status) {
      console.log(`📝 Changes:\n${status.status}`);
    }
  },
  
  'dev': async () => {
    console.log('🔧 Switching to development branch...');
    await gitManager.switchBranch('develop');
    console.log('✅ Now on development branch');
  },
  
  'prod': async () => {
    console.log('🚀 Switching to production branch...');
    await gitManager.switchBranch('main');
    console.log('✅ Now on production branch');
  },
  
  'feature': async (featureName) => {
    if (!featureName) {
      console.log('❌ Please provide a feature name');
      console.log('Usage: node scripts/dev-workflow.js feature my-new-feature');
      return;
    }
    console.log(`💡 Creating feature branch: ${featureName}`);
    const branchName = await gitManager.createFeatureBranch(featureName);
    console.log(`✅ Created and switched to ${branchName}`);
  },
  
  'commit': async (message) => {
    if (!message) {
      console.log('❌ Please provide a commit message');
      console.log('Usage: node scripts/dev-workflow.js commit "Your commit message"');
      return;
    }
    console.log(`💾 Committing changes: ${message}`);
    await gitManager.commitChanges(message);
    console.log('✅ Changes committed successfully');
  },
  
  'push': async (branch) => {
    console.log(`📤 Pushing to remote${branch ? ` (${branch})` : ''}...`);
    await gitManager.pushToRemote(branch);
    console.log('✅ Pushed to remote successfully');
  },
  
  'switch': async (branchName) => {
    if (!branchName) {
      console.log('❌ Please provide a branch name');
      console.log('Usage: node scripts/dev-workflow.js switch branch-name');
      return;
    }
    console.log(`🔄 Switching to branch: ${branchName}`);
    await gitManager.switchBranch(branchName);
    console.log(`✅ Switched to ${branchName}`);
  },
  
  'deploy-staging': async () => {
    console.log('🔧 Deploying to staging (test.sharebrain.me)...');
    await gitManager.switchBranch('develop');
    await gitManager.commitChanges('Deploy to staging');
    await gitManager.pushToRemote('develop');
    console.log('✅ Deployed to staging - will be live at test.sharebrain.me');
  },
  
  'deploy-production': async () => {
    console.log('🚀 Deploying to production (sharebrain.me)...');
    await gitManager.switchBranch('main');
    await gitManager.commitChanges('Deploy to production');
    await gitManager.pushToRemote('main');
    console.log('✅ Deployed to production - will be live at sharebrain.me');
  },
  
  'help': () => {
    console.log('🛠️  ShareBrain Development Workflow Commands:');
    console.log('');
    console.log('Setup:');
    console.log('  init                     Initialize Git workflow');
    console.log('  status                   Show current Git status');
    console.log('');
    console.log('Branch Management:');
    console.log('  dev                      Switch to development branch');
    console.log('  prod                     Switch to production branch');
    console.log('  switch [branch]          Switch to any branch');
    console.log('  feature [name]           Create new feature branch');
    console.log('');
    console.log('Development:');
    console.log('  commit "[message]"       Commit changes');
    console.log('  push [branch]            Push to remote');
    console.log('');
    console.log('Deployment:');
    console.log('  deploy-staging           Deploy to test.sharebrain.me');
    console.log('  deploy-production        Deploy to sharebrain.me');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/dev-workflow.js init');
    console.log('  node scripts/dev-workflow.js dev');
    console.log('  node scripts/dev-workflow.js feature user-authentication');
    console.log('  node scripts/dev-workflow.js commit "Add user login feature"');
    console.log('  node scripts/dev-workflow.js push');
    console.log('  node scripts/dev-workflow.js deploy-staging');
  }
};

async function main() {
  const [,, command, ...args] = process.argv;
  
  if (!command || command === 'help') {
    commands.help();
    return;
  }
  
  try {
    if (commands[command]) {
      await commands[command](...args);
    } else {
      console.log(`❌ Unknown command: ${command}`);
      console.log('Run "node scripts/dev-workflow.js help" for available commands');
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

main();