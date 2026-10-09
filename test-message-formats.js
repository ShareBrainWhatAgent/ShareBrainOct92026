#!/usr/bin/env node

const API_KEY = "sb-50d6313514309236d2fce95c6ad5c0e863072ea2d182548cd248aa7b1cbd3d0a";
const BASE_URL = "http://localhost:5000/api/v1";
const AGENT_ID = "34"; // Final Test Agent

async function testMessageFormat(format, data) {
  console.log(`\n🧪 Testing ${format} format...`);
  
  try {
    const response = await fetch(`${BASE_URL}/agents/${AGENT_ID}/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ ${format} format failed: ${response.status} - ${error}`);
      return false;
    }
    
    const result = await response.json();
    console.log(`✅ ${format} format successful!`);
    console.log(`📝 Response: ${result.choices[0].message.content}`);
    console.log(`🔢 Tokens: ${result.usage.total_tokens}`);
    return true;
  } catch (error) {
    console.log(`❌ ${format} format error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Testing ShareBrain API Message Format Support");
  console.log("=" .repeat(60));
  
  const testCases = [
    {
      name: "Original 'input' format",
      data: { input: "Hello, testing with input parameter" }
    },
    {
      name: "Alternative 'message' format", 
      data: { message: "Hello, testing with message parameter" }
    },
    {
      name: "OpenAI 'messages' array format",
      data: { 
        messages: [
          { role: "user", content: "Hello, testing with messages array" }
        ]
      }
    },
    {
      name: "Complex messages with system prompt",
      data: {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "What is 2+2?" }
        ]
      }
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    const success = await testMessageFormat(testCase.name, testCase.data);
    if (success) passed++;
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log(`🎯 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log("🎉 All message formats are working correctly!");
  } else {
    console.log("⚠️  Some message formats failed - check the logs above");
  }
}

runTests().catch(console.error);