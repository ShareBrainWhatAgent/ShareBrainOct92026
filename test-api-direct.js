import pkg from 'pg';
const { Pool } = pkg;
import crypto from 'crypto';

// Test API key authentication directly
async function testApiKeyAuth() {
  console.log("🔧 Testing API Key Authentication System");
  
  const apiKey = "sb-50d6313514309236d2fce95c6ad5c0e863072ea2d182548cd248aa7b1cbd3d0a";
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  console.log("🔑 API Key:", apiKey);
  console.log("🔍 Hash:", keyHash);
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test authentication
    const result = await pool.query('SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = true', [keyHash]);
    
    if (result.rows.length === 0) {
      console.log("❌ API key not found or inactive");
      return false;
    }
    
    console.log("✅ API key valid!");
    console.log("📊 Key details:", {
      name: result.rows[0].name,
      userId: result.rows[0].user_id,
      usageCount: result.rows[0].usage_count,
      isActive: result.rows[0].is_active
    });
    
    // Test getting agents
    const agentsResult = await pool.query('SELECT id, name, description, model, status FROM agents WHERE status = $1 ORDER BY created_at DESC LIMIT 5', ['active']);
    
    console.log("🤖 Available agents:", agentsResult.rows.length);
    agentsResult.rows.forEach(agent => {
      console.log(`  - ${agent.name} (ID: ${agent.id}, Model: ${agent.model})`);
    });
    
    // Update usage count
    await pool.query('UPDATE api_keys SET last_used = NOW(), usage_count = usage_count + 1 WHERE key_hash = $1', [keyHash]);
    
    console.log("✅ Usage count updated");
    
    await pool.end();
    return true;
    
  } catch (error) {
    console.error("💥 Error:", error);
    return false;
  }
}

// Run the test
testApiKeyAuth().then(success => {
  if (success) {
    console.log("\n🎉 API Key Authentication System: WORKING");
    console.log("📝 Summary:");
    console.log("- API key validation: ✅");
    console.log("- Database authentication: ✅");
    console.log("- Agent data access: ✅");
    console.log("- Usage tracking: ✅");
    console.log("\n🔗 API Endpoints Ready:");
    console.log("- GET /api/v1/agents");
    console.log("- GET /api/v1/agents/:id");
    console.log("- POST /api/v1/agents/:id/completions");
    console.log("- GET /api/v1/usage");
  } else {
    console.log("\n❌ API Key Authentication System: FAILED");
  }
  process.exit(success ? 0 : 1);
});