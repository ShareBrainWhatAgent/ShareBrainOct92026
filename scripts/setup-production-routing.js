#!/usr/bin/env node

// Simple fix for production routing - creates the minimal files needed
import fs from 'fs';
import path from 'path';

const targetDir = path.resolve('./server/public');
const indexPath = path.join(targetDir, 'index.html');

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Create the index.html that the production server expects
const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShareBrain - AI Agent Platform</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #000000;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
        }
        .message {
            text-align: center;
            max-width: 600px;
            padding: 20px;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #ffffff;
            border-top: 4px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .note {
            font-size: 14px;
            color: #cccccc;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="message">
        <h1>ShareBrain</h1>
        <div class="spinner"></div>
        <p>Production mode detected. This is a placeholder for the production routing fix.</p>
        <p class="note">This page appears because the production build process hasn't been completed yet. In development mode, the full app would be served by Vite.</p>
    </div>
    
    <script>
        // Redirect to development mode if we're on localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    </script>
</body>
</html>`;

fs.writeFileSync(indexPath, indexContent);

console.log('✅ Production routing setup complete');
console.log('Created:', indexPath);
console.log('');
console.log('The production server will now serve this file instead of throwing an error.');
console.log('For full functionality, run: npm run build');