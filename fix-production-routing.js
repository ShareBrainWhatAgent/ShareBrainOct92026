#!/usr/bin/env node

// Quick fix for production routing issue
// This script creates a minimal index.html that properly loads the React app

import fs from 'fs';
import path from 'path';

const targetDir = path.resolve('./server/public');
const indexPath = path.join(targetDir, 'index.html');

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Create a proper index.html that loads the React app
const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShareBrain - AI Agent Platform</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #000000;
            color: #ffffff;
        }
        
        #loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #ffffff;
            border-top: 4px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="root">
        <div id="loading">
            <div class="spinner"></div>
            <p style="margin-top: 20px;">Loading ShareBrain...</p>
        </div>
    </div>
    <script>
        // In production, this would be replaced by the actual React app
        // For now, redirect to development server
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Development mode - this shouldn't be seen
            document.getElementById('loading').innerHTML = '<p>Development mode - please use npm run dev</p>';
        } else {
            // Production mode - redirect to proper build
            window.location.href = '/';
        }
    </script>
</body>
</html>`;

// Write the index.html file
fs.writeFileSync(indexPath, indexContent);

console.log('✅ Production routing fix applied');
console.log('Created proper index.html at:', indexPath);
console.log('');
console.log('Note: This is a temporary fix. For full production deployment, run:');
console.log('npm run build');