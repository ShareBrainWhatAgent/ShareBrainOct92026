# ShareBrain Development Workflow

## Repository Structure
- **Repository**: https://github.com/ShareBrainWhatAgent/AiAgentPlatformJuly3
- **Production Branch**: `main` - Live production site
- **Development Branch**: `develop` - Development and staging environment

## Branch Strategy

### Main Branch (Production)
- Contains stable, production-ready code
- All changes must be thoroughly tested
- Direct commits should be avoided
- Deploy to: https://sharebrain.me

### Develop Branch (Development/Staging)  
- Active development branch
- All new features and fixes go here first
- Testing and experimentation
- Deploy to: https://test.sharebrain.me (when configured)

## Development Workflow

### 1. Switch to Development Branch
```bash
git checkout develop
```

### 2. Create Feature Branch (Optional)
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes
- Edit code in Replit
- Test using the running workflow
- Commit changes regularly

### 4. Commit Changes
```bash
git add .
git commit -m "Description of changes"
```

### 5. Push to Development
```bash
git push origin develop
```

### 6. Deploy to Production (When Ready)
```bash
git checkout main
git merge develop
git push origin main
```

## Current Status
- **Local Branch**: main
- **Available Branches**: main, replit-agent, Tom-July-5-Branch
- **Next Step**: Create develop branch

## Creating Development Branch
Run the provided script to set up the development workflow:
```bash
./create-dev-branch.sh
```

This will:
1. Create a new `develop` branch
2. Push it to the remote repository
3. Set up tracking for the develop branch
4. Switch you to the develop branch for development work