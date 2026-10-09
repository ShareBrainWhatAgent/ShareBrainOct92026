import { neon } from '@neondatabase/serverless';

async function addAIFriendChatToAllUsers() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🤖 Adding AI Friend Chat brain to all existing users...');
    
    // Get all existing users
    const users = await sql`SELECT id, email FROM users`;
    console.log(`📊 Found ${users.length} existing users`);
    
    // AI Friend Chat brain ID
    const AI_FRIEND_CHAT_ID = 348;
    
    let addedCount = 0;
    let alreadyHadCount = 0;
    
    for (const user of users) {
      try {
        // Check if user already has AI Friend Chat
        const existingAgent = await sql`
          SELECT id FROM user_agents 
          WHERE user_id = ${user.id} AND agent_id = ${AI_FRIEND_CHAT_ID}
        `;
        
        if (existingAgent.length === 0) {
          // Add AI Friend Chat to user's agents
          await sql`
            INSERT INTO user_agents (user_id, agent_id, created_at)
            VALUES (${user.id}, ${AI_FRIEND_CHAT_ID}, NOW())
          `;
          addedCount++;
          console.log(`✅ Added AI Friend Chat to ${user.email}`);
        } else {
          alreadyHadCount++;
          console.log(`📝 ${user.email} already has AI Friend Chat`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }
    
    console.log('\n🎉 AI Friend Chat Distribution Complete!');
    console.log(`📊 Summary:`);
    console.log(`   • Users who received AI Friend Chat: ${addedCount}`);
    console.log(`   • Users who already had it: ${alreadyHadCount}`);
    console.log(`   • Total users processed: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error adding AI Friend Chat to users:', error);
  }
}

// Run the script
addAIFriendChatToAllUsers().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});

export { addAIFriendChatToAllUsers };