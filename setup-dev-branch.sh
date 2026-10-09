#!/bin/bash

echo "🔄 Setting up development branch for ShareBrain..."

# Check current status
echo "Current branch: $(git branch --show-current)"
echo "Available branches:"
git branch -a

# Create develop branch
echo ""
echo "Creating develop branch..."
git checkout -b develop

# Push to remote
echo "Pushing develop branch to remote..."
git push -u origin develop

echo ""
echo "✅ Development branch setup complete!"
echo "Current branch: $(git branch --show-current)"
echo ""
echo "You can now:"
echo "- Work on development in the 'develop' branch"  
echo "- Switch to production with: git checkout main"
echo "- Switch back to development with: git checkout develop"