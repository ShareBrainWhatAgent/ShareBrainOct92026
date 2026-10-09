# Development Workflow Guide

## Current Repository Status
- **Local Branch**: main
- **Remote Repository**: https://github.com/ShareBrainWhatAgent/AiAgentPlatformJuly3 (OLD)
- **Target Repository**: https://github.com/postrenostr/AiAgentPlatformJuly18 (NEW)

## Development Branch Setup

Since Git operations are restricted in Replit, here's how to work in development mode:

### Option 1: Direct Development (Recommended)
1. **Work directly in Replit**: Make all your changes here
2. **Test locally**: Use the running workflow to test changes
3. **Manual deployment**: Copy/paste changes to GitHub when ready

### Option 2: Repository Migration
To properly use the new repository, you would need to:
1. Update the remote URL to the new repository
2. Create and switch to a `develop` branch
3. Push changes to the develop branch for staging deployment

## Current Workaround
- The `.dev-branch` file tracks that we're working in "development mode"
- All changes made here can be considered "develop branch" work
- When ready to deploy, manually copy changes to the GitHub repository

## Next Steps for Production Deployment
1. Copy all current files to the new repository
2. Create develop branch on GitHub  
3. Set up proper branch protection rules
4. Enable GitHub Actions workflows