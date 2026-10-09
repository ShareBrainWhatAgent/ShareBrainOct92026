/**
 * Test Agent Creation Agent functionality
 * Simple test script to verify the conversational agent creation system
 */

const API_BASE = 'http://localhost:5000';

async function testAgentCreationAgent() {
  try {
    console.log("🧪 Testing Agent Creation Agent...");

    // Test 1: Basic conversation start
    console.log("\n1. Starting conversation with Agent Creation Agent...");
    const response1 = await fetch(`${API_BASE}/api/v1/agents/372/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key' // Using test key for now
      },
      body: JSON.stringify({
        input: "I want to create a customer service agent for my restaurant",
        max_tokens: 500
      })
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log("✅ Agent Creation Agent responded:");
      console.log(result1.choices[0].message.content);
      
      if (result1.agent_creation_meta) {
        console.log("📊 Metadata:", result1.agent_creation_meta);
      }
    } else {
      console.log("❌ Failed:", response1.status, await response1.text());
    }

    // Test 2: Confirmation to create agent
    console.log("\n2. Confirming agent creation...");
    const response2 = await fetch(`${API_BASE}/api/v1/agents/372/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify({
        input: "Yes, create it. Make it friendly and professional for pizza restaurant customers.",
        max_tokens: 500
      })
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log("✅ Agent Creation Response:");
      console.log(result2.choices[0].message.content);
      
      if (result2.agent_creation_meta) {
        console.log("📊 Creation Metadata:", result2.agent_creation_meta);
        if (result2.agent_creation_meta.createdAgentId) {
          console.log(`🎉 New agent created with ID: ${result2.agent_creation_meta.createdAgentId}`);
        }
      }
    } else {
      console.log("❌ Failed:", response2.status, await response2.text());
    }

    // Test 3: Regular agent for comparison
    console.log("\n3. Testing regular agent for comparison...");
    const response3 = await fetch(`${API_BASE}/api/v1/agents/1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-key'
      },
      body: JSON.stringify({
        input: "Hello, how are you?",
        max_tokens: 100
      })
    });

    if (response3.ok) {
      const result3 = await response3.json();
      console.log("✅ Regular agent responded:");
      console.log(result3.choices[0].message.content);
    } else {
      console.log("❌ Regular agent failed:", response3.status);
    }

  } catch (error) {
    console.error("💥 Test failed:", error.message);
  }
}

// Run test
testAgentCreationAgent();