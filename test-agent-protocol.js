const { db } = require('./server/db');
const { storage } = require('./server/storage');

async function testAgentProtocol() {
  console.log("🧪 Testing Agent Generation Protocol...");
  
  try {
    // Create a test agent
    const testAgent = await storage.createAgent({
      name: "Test Protocol Agent",
      description: "Testing automatic generation protocol",
      category: "Testing",
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: "You are a test agent for protocol verification.",
      status: "active",
      isPrivate: false,
      voiceEnabled: true,
      userId: "test-user"
    });
    
    console.log("✅ Test agent created:", testAgent.id, testAgent.name);
    
    // Check if LLM.txt config was created
    const llmConfig = await db.select()
      .from(require('./shared/schema').llmTxtConfigs)
      .where(require('drizzle-orm').eq(require('./shared/schema').llmTxtConfigs.agentId, testAgent.id));
    
    console.log("🔍 LLM.txt config created:", llmConfig.length > 0 ? "✅ YES" : "❌ NO");
    
    // Check if workspace was created
    const workspace = await db.select()
      .from(require('./shared/schema').agentWorkspaces)
      .where(require('drizzle-orm').eq(require('./shared/schema').agentWorkspaces.agentId, testAgent.id));
    
    console.log("🔍 Agent workspace created:", workspace.length > 0 ? "✅ YES" : "❌ NO");
    
    if (workspace.length > 0) {
      console.log("🌐 Website slug:", workspace[0].websiteSlug);
    }
    
    console.log("\n🎉 Agent Generation Protocol Test Complete!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

testAgentProtocol();