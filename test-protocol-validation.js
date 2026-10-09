// Test script to validate the Agent Generation Protocol
// This simulates what happens when an agent is created through any interface

console.log("🧪 Starting Agent Generation Protocol Validation Test...");

async function validateProtocol() {
  try {
    const response = await fetch('http://localhost:5000/api/test-protocol-creation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: "Protocol Validation Agent",
        description: "Testing automatic generation protocol functionality",
        category: "Testing",
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: "You are a test agent created to validate the automatic generation protocol.",
        status: "active",
        isPrivate: false,
        voiceEnabled: true,
        userId: "protocol-test-user"
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Protocol test completed successfully");
      console.log("📊 Results:", result);
    } else {
      const error = await response.text();
      console.log("❌ Protocol test failed:", error);
    }
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

validateProtocol();