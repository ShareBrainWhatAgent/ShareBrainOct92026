# How to Create Development Branch - Step by Step

## Method 1: Using Replit Shell (Easiest)

1. **Open the Shell tab** in Replit (look for "Shell" tab at the bottom)

2. **Copy and paste this command** into the shell:
   ```
   git checkout -b develop
   ```
   Then press Enter

3. **Copy and paste this second command**:
   ```
   git push -u origin develop
   ```
   Then press Enter

## Method 2: If Shell doesn't work

1. Look for a "Console" or "Terminal" tab in Replit
2. Run the same two commands above

## What these commands do:
- `git checkout -b develop` - Creates a new branch called "develop" and switches to it
- `git push -u origin develop` - Saves this new branch to GitHub

## After running these commands:
- Go back to your Git Manager at `/git-manager`
- You should see it now shows "develop" as the current branch
- You can then switch between "main" (production) and "develop" (development) using the buttons

## If you get stuck:
- Look for any tab labeled "Shell", "Terminal", or "Console" in Replit
- The commands are safe - they just create a new branch for development work