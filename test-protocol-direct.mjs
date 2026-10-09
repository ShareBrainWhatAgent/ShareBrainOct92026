import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { agents, llmTxtConfigs, agentWorkspaces } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testProtocolDirect() {
  console.log("🧪 Testing Agent Generation Protocol Direct...");
  
  try {
    // Create a test agent directly through storage
    const testAgent = await storage.createAgent({
      name: "Direct Protocol Test Agent",
      description: "Testing automatic generation protocol directly",
      category: "Testing",
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: "You are a test agent for protocol verification.",
      status: "active",
      isPrivate: false,
      voiceEnabled: true,
      userId: "test-user-12345"
    });
    
    console.log("✅ Test agent created:", testAgent.id, testAgent.name);
    
    // Wait a moment for protocol to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if LLM.txt config was created
    const llmConfig = await db.select()
      .from(llmTxtConfigs)
      .where(eq(llmTxtConfigs.agentId, testAgent.id));
    
    console.log("🔍 LLM.txt config created:", llmConfig.length > 0 ? "✅ YES" : "❌ NO");
    if (llmConfig.length > 0) {
      console.log("   Title:", llmConfig[0].title);
      console.log("   Access Level:", llmConfig[0].accessLevel);
    }
    
    // Check if workspace was created
    const workspace = await db.select()
      .from(agentWorkspaces)
      .where(eq(agentWorkspaces.agentId, testAgent.id));
    
    console.log("🔍 Agent workspace created:", workspace.length > 0 ? "✅ YES" : "❌ NO");
    if (workspace.length > 0) {
      console.log("   Website slug:", workspace[0].websiteSlug);
      console.log("   Memory type:", workspace[0].memoryType);
      console.log("   Is public:", workspace[0].isPublic);
    }
    
    console.log("\n🎉 Agent Generation Protocol Test Complete!");
    console.log("📊 Results Summary:");
    console.log("   Agent created: ✅");
    console.log("   LLM.txt config:", llmConfig.length > 0 ? "✅" : "❌");
    console.log("   Agent workspace:", workspace.length > 0 ? "✅" : "❌");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

testProtocolDirect();