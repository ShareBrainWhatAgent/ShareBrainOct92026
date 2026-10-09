import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// Widget chat interface for embedded Shopify stores
router.get('/widget-chat/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { shop, customer, email, greeting } = req.query;

  try {
    // Get agent details
    const agent = await storage.getAgent(parseInt(agentId));
    if (!agent) {
      return res.status(404).send('Agent not found');
    }

    // Create HTML interface for the chat widget
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat with ${agent.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: #f8f9fa;
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-height: 100vh;
        }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            word-wrap: break-word;
        }
        
        .message.user {
            align-self: flex-end;
            background: #007bff;
            color: white;
            border-bottom-right-radius: 4px;
        }
        
        .message.agent {
            align-self: flex-start;
            background: white;
            color: #333;
            border: 1px solid #e1e4e8;
            border-bottom-left-radius: 4px;
        }
        
        .input-container {
            padding: 16px;
            background: white;
            border-top: 1px solid #e1e4e8;
            display: flex;
            gap: 8px;
        }
        
        .message-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #e1e4e8;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
        }
        
        .message-input:focus {
            border-color: #007bff;
        }
        
        .send-button {
            padding: 12px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 24px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .send-button:hover:not(:disabled) {
            background: #0056b3;
        }
        
        .send-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .typing-indicator {
            align-self: flex-start;
            padding: 12px 16px;
            background: white;
            border: 1px solid #e1e4e8;
            border-radius: 18px;
            border-bottom-left-radius: 4px;
            display: none;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dot {
            width: 8px;
            height: 8px;
            background: #999;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
        
        .welcome-message {
            text-align: center;
            padding: 24px 16px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="welcome-message">
                ${greeting || 'Hi! How can I help you today?'}
            </div>
        </div>
        
        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
        
        <div class="input-container">
            <input 
                type="text" 
                class="message-input" 
                id="messageInput" 
                placeholder="Type your message..."
                maxlength="500"
            >
            <button class="send-button" id="sendButton">Send</button>
        </div>
    </div>

    <script>
        const agentId = ${agentId};
        const shopInfo = {
            shop: '${shop}',
            customer: '${customer}',
            email: '${email}'
        };
        
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const typingIndicator = document.getElementById('typingIndicator');
        
        let conversationId = null;
        
        function addMessage(content, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isUser ? 'user' : 'agent'}\`;
            messageDiv.textContent = content;
            
            // Insert before typing indicator
            messagesContainer.insertBefore(messageDiv, typingIndicator);
            scrollToBottom();
        }
        
        function showTyping() {
            typingIndicator.style.display = 'block';
            scrollToBottom();
        }
        
        function hideTyping() {
            typingIndicator.style.display = 'none';
        }
        
        function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;
            
            // Add user message
            addMessage(message, true);
            messageInput.value = '';
            sendButton.disabled = true;
            
            // Show typing indicator
            showTyping();
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        agentId: agentId,
                        message: message,
                        conversationId: conversationId,
                        shopify: shopInfo
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    conversationId = data.conversationId;
                    addMessage(data.response);
                } else {
                    addMessage('Sorry, I encountered an error. Please try again.');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                addMessage('Sorry, I encountered an error. Please try again.');
            } finally {
                hideTyping();
                sendButton.disabled = false;
                messageInput.focus();
            }
        }
        
        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', () => {
            sendButton.disabled = !messageInput.value.trim();
        });
        
        // Focus input on load
        messageInput.focus();
        
        // Initial scroll
        scrollToBottom();
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error creating widget chat:', error);
    res.status(500).send('Error loading chat widget');
  }
});

// API endpoint for Shopify app integration
router.post('/api/shopify/install', async (req, res) => {
  try {
    const { shop, accessToken, agentId, widgetConfig } = req.body;
    
    // Store Shopify installation data
    // This would typically be stored in a database
    console.log('Shopify app installed:', { shop, agentId, widgetConfig });
    
    res.json({ success: true, message: 'ShareBrain integrated successfully' });
  } catch (error) {
    console.error('Error installing Shopify app:', error);
    res.status(500).json({ error: 'Installation failed' });
  }
});

// Webhook endpoint for Shopify events
router.post('/api/shopify/webhooks/:event', async (req, res) => {
  try {
    const { event } = req.params;
    const data = req.body;
    
    console.log('Shopify webhook received:', event, data);
    
    // Handle different webhook events
    switch (event) {
      case 'app/uninstalled':
        // Clean up ShareBrain integration
        console.log('App uninstalled from shop:', data.myshopify_domain);
        break;
        
      case 'customers/create':
        // New customer created - could trigger welcome message
        console.log('New customer created:', data.email);
        break;
        
      case 'orders/create':
        // New order - could trigger order confirmation via chat
        console.log('New order created:', data.order_number);
        break;
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export { router as shopifyRouter };