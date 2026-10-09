# ShareBrain Deployment Workflow

## Complete Development to Production Pipeline

### 1. Development Environment (Current)
- **Location**: Your current Replit environment
- **Purpose**: Make all changes and test locally
- **URL**: Preview URL in Replit

### 2. Test Environment
- **Location**: https://sharebrain.me/test
- **Purpose**: Test changes in production-like environment
- **Deploy Command**: `tsx deploy-test.js`

### 3. Production Environment
- **Location**: https://sharebrain.me
- **Purpose**: Live production site for users
- **Deploy Command**: `tsx deploy-production.js`

## Deployment Process

### Step 1: Develop & Test Locally
1. Make changes in your current environment
2. Test using the live preview
3. Verify everything works correctly

### Step 2: Deploy to Test
```bash
tsx deploy-test.js
```
- Deploys to https://sharebrain.me/test
- Test all functionality in production-like environment
- Verify everything works as expected

### Step 3: Deploy to Production
```bash
tsx deploy-production.js
```
- Deploys to https://sharebrain.me
- Your changes are now live for all users

## Safety Features

✅ **Separate Test Environment** - Test before production
✅ **Automated Build Process** - Consistent deployments
✅ **Environment Configuration** - Proper settings for each stage
✅ **Rollback Capability** - Can revert if needed

## Quick Commands

```bash
# Deploy to test
tsx deploy-test.js

# Deploy to production (after testing)
tsx deploy-production.js
```

Your complete development workflow is now ready!