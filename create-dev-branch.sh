#!/bin/bash

# Script to create development branch for AiAgentPlatformJuly3
echo "Creating development branch workflow..."

# Check current branch
echo "Current branch: $(git branch --show-current)"

# Create and switch to develop branch
echo "Creating develop branch..."
git checkout -b develop

# Push develop branch to remote
echo "Pushing develop branch to remote..."
git push -u origin develop

# Show branch status
echo "Branch setup complete!"
echo "Available branches:"
git branch -a

echo ""
echo "Development workflow ready:"
echo "- main branch = production"
echo "- develop branch = development/staging"
echo "- Current branch: $(git branch --show-current)"