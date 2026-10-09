# ShareBrain Development Workflow

This document outlines the complete development workflow for the ShareBrain AI platform, including Git branch management, automated deployments, development environment setup, and major architectural implementations.

## Latest Major Implementation: Invite Brain System Phase 2 ✅ COMPLETE

**July 20, 2025** - Successfully completed comprehensive Phase 2 of the Invite Brain System:

### **COMPREHENSIVE API SUITE IMPLEMENTED** ✅
- **16 Complete API Endpoints**: Full CRUD operations for invite brain system
- **Authentication Integration**: All endpoints secured with existing isAuthenticated middleware  
- **Role-Based Access Control**: Creator/contributor/viewer permissions enforced
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Health Monitoring**: System health check endpoint for development

### **ENDPOINT CATEGORIES DELIVERED** ✅
1. **Brain Management**: Create, read, update, delete invite brains
2. **Membership System**: Handle user memberships and role management
3. **Invitation System**: Send invitations, respond to invites, join requests  
4. **Memory Integration**: Add/retrieve memories with AI analysis
5. **Analytics & Monitoring**: Comprehensive analytics and health checking

### **ZERO-BREAKAGE MAINTAINED** ✅
- All existing systems remain completely unaffected
- New API routes follow existing authentication patterns
- Storage methods extend existing infrastructure  
- Memory system integrates with established AI analysis

### **PRODUCTION READY STATUS** ✅
- All 16 endpoints tested and functional
- Authentication working correctly (401 responses for unauthorized)
- Database connections verified via health check
- Ready for Phase 3: Frontend Implementation

## Previous Implementation: Invite Brain System Phase 1 ✅ COMPLETE

**July 19, 2025** - Successfully completed comprehensive Phase 1 of the Invite Brain System:

### Database Architecture ✅
- **5 New Tables Created**: invite_brains, brain_memberships, brain_invitations, invite_brain_memories, brain_payments
- **Schema Extensions**: Added is_invite_brain and invite_brain_type fields to agents table
- **Complete Isolation**: Separate memory storage with zero crossover to existing systems

### Storage Layer ✅
- **25+ Storage Methods**: Full CRUD operations for all invite brain components
- **Role-Based Access**: Creator/contributor/viewer permission validation
- **Memory Operations**: AI-powered memory classification and storage
- **Payment Infrastructure**: Stripe-ready payment tracking system

### Memory System ✅
- **Isolated Memory Service**: inviteBrainMemoryService extending intelligentMemoryService
- **AI-Powered Classification**: Consistent memory detection using existing Llama 3.1 70B system
- **Context Injection**: Formatted memory context for AI responses
- **Statistics & Analytics**: Memory tracking, contributor analytics, activity monitoring

### Zero-Breakage Guarantee ✅
- **All Existing Systems Protected**: Personal, Template, Global Brains, Master Agents, AI Friend Chat unaffected
- **Additive-Only Implementation**: No modifications to existing functionality
- **Production Ready**: Complete Phase 1 infrastructure ready for Phase 2

## Architecture Overview

ShareBrain uses a Git-based development workflow with automated CI/CD pipelines for seamless deployment to staging and production environments.

### Environment Structure

- **Development** (`feature/*` branches): Local development and testing
- **Staging** (`develop` branch): Integration testing → https://test.sharebrain.me
- **Production** (`main` branch): Live application → https://sharebrain.me

## Branch Strategy

### Main Branches

- **`main`** - Production branch
  - Deployed to: https://sharebrain.me
  - Auto-deploys on push via GitHub Actions
  - Protected branch with required reviews

- **`develop`** - Staging branch
  - Deployed to: https://test.sharebrain.me
  - Auto-deploys on push via GitHub Actions
  - Integration testing environment

### Feature Branches

- **`feature/feature-name`** - Development branches
  - Created from `develop` branch
  - Merged back to `develop` via pull requests
  - Local development and testing

## Development Commands

### Using the Command Line Interface

The `scripts/dev-workflow.js` script provides easy Git management:

```bash
# Initialize Git workflow
node scripts/dev-workflow.js init

# Check current status
node scripts/dev-workflow.js status

# Switch to development branch
node scripts/dev-workflow.js dev

# Switch to production branch
node scripts/dev-workflow.js prod

# Create new feature branch
node scripts/dev-workflow.js feature my-new-feature

# Commit changes
node scripts/dev-workflow.js commit "Add new feature"

# Push to remote
node scripts/dev-workflow.js push

# Deploy to staging
node scripts/dev-workflow.js deploy-staging

# Deploy to production
node scripts/dev-workflow.js deploy-production
```

### Using the Web Interface

Access the Git Manager at `/git-manager` for a visual interface:

- **Real-time status monitoring**: See current branch and changes
- **One-click branch switching**: Switch between development and production
- **Feature branch creation**: Create new feature branches with ease
- **Commit and push operations**: Commit changes and push to remote
- **Environment indicators**: Visual status for staging and production

## Automated Deployment Pipeline

### GitHub Actions Workflows

#### Staging Deployment (`.github/workflows/deploy-staging.yml`)

Triggered on:
- Push to `develop` branch
- Pull requests to `develop` branch

Pipeline steps:
1. **Checkout code**: Get latest code from repository
2. **Setup Node.js**: Install Node.js 20 with npm caching
3. **Install dependencies**: Run `npm ci` for reproducible builds
4. **Run tests**: Execute test suite (if present)
5. **Build application**: Create production build
6. **Deploy to staging**: Deploy to test.sharebrain.me
7. **Notify completion**: Log deployment status

#### Production Deployment (`.github/workflows/deploy-production.yml`)

Triggered on:
- Push to `main` branch
- Manual workflow dispatch

Pipeline steps:
1. **Checkout code**: Get latest code from repository
2. **Setup Node.js**: Install Node.js 20 with npm caching
3. **Install dependencies**: Run `npm ci` for reproducible builds
4. **Run tests**: Execute test suite (if present)
5. **Build application**: Create production build
6. **Deploy to production**: Deploy to sharebrain.me
7. **Notify completion**: Log deployment status

## Development Workflow

### Starting a New Feature

1. **Switch to develop branch**:
   ```bash
   node scripts/dev-workflow.js dev
   ```

2. **Create feature branch**:
   ```bash
   node scripts/dev-workflow.js feature user-authentication
   ```

3. **Develop your feature**:
   - Make code changes
   - Test locally
   - Commit frequently

4. **Commit changes**:
   ```bash
   node scripts/dev-workflow.js commit "Add user authentication system"
   ```

5. **Push to remote**:
   ```bash
   node scripts/dev-workflow.js push
   ```

6. **Create pull request**:
   - Open pull request from `feature/user-authentication` to `develop`
   - Request code review
   - Merge after approval

### Deploying to Staging

1. **Merge to develop**: Merge approved pull requests to `develop` branch
2. **Automatic deployment**: GitHub Actions automatically deploys to staging
3. **Test staging**: Verify changes at https://test.sharebrain.me
4. **Integration testing**: Ensure all features work together

### Deploying to Production

1. **Merge to main**: Merge tested `develop` branch to `main`
2. **Automatic deployment**: GitHub Actions automatically deploys to production
3. **Production verification**: Verify changes at https://sharebrain.me
4. **Monitor**: Watch for any issues in production

## Git Management Tools

### GitManager Class (`scripts/git-manager.js`)

Core functionality for Git operations:

- **Repository initialization**: Set up Git repository and remote
- **Branch management**: Create, switch, and manage branches
- **Commit operations**: Stage and commit changes
- **Remote operations**: Push and pull from remote repository
- **Status monitoring**: Check repository status and changes

### GitService (`server/services/gitService.js`)

Backend service for programmatic Git operations:

- **Web API integration**: Expose Git operations via REST API
- **Branch switching**: Programmatic branch switching
- **Workflow management**: Complete development workflows
- **Status tracking**: Real-time Git status monitoring

### API Endpoints

- `GET /api/git/status` - Get current Git status
- `POST /api/git/switch-development` - Switch to development branch
- `POST /api/git/switch-production` - Switch to production branch
- `POST /api/git/switch-branch` - Switch to any branch
- `POST /api/git/create-feature` - Create new feature branch
- `POST /api/git/commit` - Commit changes
- `POST /api/git/push` - Push to remote

## Security and Access Control

### Branch Protection Rules

- **Main branch**: Protected with required reviews
- **Develop branch**: Protected with automated checks
- **Feature branches**: No restrictions for development

### Environment Secrets

- **Staging secrets**: Stored in GitHub repository secrets
- **Production secrets**: Stored in GitHub repository secrets
- **Development secrets**: Stored in local `.env` file

### Access Control

- **Repository access**: Limited to authorized developers
- **Deployment access**: Automated via GitHub Actions
- **Environment access**: Role-based access control

## Monitoring and Logging

### Deployment Monitoring

- **GitHub Actions logs**: Complete deployment history
- **Status notifications**: Deployment success/failure notifications
- **Environment health**: Application health monitoring

### Development Monitoring

- **Git status tracking**: Real-time repository status
- **Branch tracking**: Current branch and changes
- **Build status**: Development build success/failure

## Best Practices

### Code Quality

- **Consistent formatting**: Use project ESLint and Prettier configuration
- **Type safety**: Utilize TypeScript for type checking
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Document code changes and new features

### Git Workflow

- **Descriptive commits**: Use clear, descriptive commit messages
- **Small commits**: Make frequent, focused commits
- **Branch naming**: Use descriptive branch names (feature/fix/hotfix)
- **Pull requests**: Use pull requests for code review

### Deployment

- **Staging first**: Always deploy to staging before production
- **Testing**: Thoroughly test in staging environment
- **Rollback plan**: Have rollback strategy for production issues
- **Monitoring**: Monitor applications after deployment

## Troubleshooting

### Common Issues

1. **Git authentication errors**:
   - Check GitHub access token
   - Verify repository permissions

2. **Build failures**:
   - Check dependencies with `npm ci`
   - Review build logs for specific errors

3. **Deployment failures**:
   - Check GitHub Actions logs
   - Verify environment secrets

4. **Branch conflicts**:
   - Resolve merge conflicts locally
   - Use `git merge` or `git rebase` as appropriate

### Getting Help

- **Documentation**: Check this guide and project documentation
- **Git Manager**: Use `/git-manager` web interface for visual assistance
- **Command help**: Run `node scripts/dev-workflow.js help` for command reference
- **GitHub Issues**: Report bugs and request features via GitHub issues

## Environment Setup

### Prerequisites

- Node.js 20+
- Git installed and configured
- GitHub access token with repository permissions
- Environment variables configured

### Initial Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/postrenostr/AiAgentPlatformJuly18.git
   cd AiAgentPlatformJuly18
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize Git workflow**:
   ```bash
   node scripts/dev-workflow.js init
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Development Environment

- **Local development**: http://localhost:5000
- **Hot reload**: Automatic reloading on file changes
- **API testing**: Use provided API endpoints for testing
- **Database**: PostgreSQL database for data persistence

This workflow ensures consistent, reliable development and deployment processes for the ShareBrain AI platform.