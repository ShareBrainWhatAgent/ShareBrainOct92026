#!/bin/bash

# ShareBrain Development Workflow Script
# Usage: bash scripts/git-workflow.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository. Please run git init first."
        exit 1
    fi
}

# Function to get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Function to start a new feature
start_feature() {
    local feature_name="$1"
    if [[ -z "$feature_name" ]]; then
        print_error "Please provide a feature name: bash scripts/git-workflow.sh start-feature my-feature"
        exit 1
    fi
    
    check_git_repo
    
    print_info "Starting new feature: $feature_name"
    
    # Switch to develop and pull latest
    git checkout develop
    git pull origin develop
    
    # Create feature branch
    git checkout -b "feature/$feature_name"
    
    print_status "Created feature branch: feature/$feature_name"
    print_info "You can now make changes and commit them"
}

# Function to commit changes
commit_changes() {
    local message="$1"
    if [[ -z "$message" ]]; then
        print_error "Please provide a commit message: bash scripts/git-workflow.sh commit 'Your message'"
        exit 1
    fi
    
    check_git_repo
    
    print_info "Committing changes: $message"
    
    # Add all changes
    git add .
    
    # Commit with message
    git commit -m "$message"
    
    print_status "Changes committed successfully"
}

# Function to push to staging (develop branch)
push_to_staging() {
    check_git_repo
    
    local current_branch=$(get_current_branch)
    
    print_info "Pushing $current_branch to staging..."
    
    # Push current branch
    git push origin "$current_branch"
    
    print_status "Pushed to GitHub: $current_branch"
    print_info "Create a PR to develop branch at: https://github.com/postrenostr/AiAgentPlatformJuly18/compare/develop...$current_branch"
}

# Function to deploy to production
deploy_to_production() {
    check_git_repo
    
    print_info "Deploying to production..."
    
    # Switch to main and pull latest
    git checkout main
    git pull origin main
    
    # Merge develop into main
    git merge develop
    
    # Push to main
    git push origin main
    
    print_status "Deployed to production (main branch)"
}

# Function to switch branches
switch_branch() {
    local branch="$1"
    if [[ -z "$branch" ]]; then
        print_error "Please provide a branch name: bash scripts/git-workflow.sh switch develop"
        exit 1
    fi
    
    check_git_repo
    
    print_info "Switching to branch: $branch"
    git checkout "$branch"
    print_status "Switched to $branch"
}

# Function to show status
show_status() {
    check_git_repo
    
    local current_branch=$(get_current_branch)
    
    print_info "Current branch: $current_branch"
    print_info "Git status:"
    git status --short
    
    print_info "Recent commits:"
    git log --oneline -5
}

# Main script logic
case "$1" in
    "start-feature")
        start_feature "$2"
        ;;
    "commit")
        commit_changes "$2"
        ;;
    "push-staging")
        push_to_staging
        ;;
    "deploy-prod")
        deploy_to_production
        ;;
    "switch")
        switch_branch "$2"
        ;;
    "status")
        show_status
        ;;
    *)
        echo "ShareBrain Development Workflow Commands:"
        echo ""
        echo "  start-feature [name]  - Start a new feature branch"
        echo "  commit '[message]'    - Commit all changes with message"
        echo "  push-staging         - Push current branch to GitHub"
        echo "  deploy-prod          - Deploy develop to production"
        echo "  switch [branch]      - Switch to specified branch"
        echo "  status               - Show current status"
        echo ""
        echo "Example workflow:"
        echo "  bash scripts/git-workflow.sh start-feature enhanced-codex"
        echo "  # Make your changes..."
        echo "  bash scripts/git-workflow.sh commit 'Added new code analysis features'"
        echo "  bash scripts/git-workflow.sh push-staging"
        echo "  # Create PR on GitHub, test on staging"
        echo "  bash scripts/git-workflow.sh deploy-prod"
        ;;
esac