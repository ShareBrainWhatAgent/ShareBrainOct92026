// Script to add ShareBrain Restaurant brain to ALL existing users

import { DatabaseStorage } from './server/storage.js';

const storage = new DatabaseStorage();

async function addShareBrainRestaurantToAllUsers() {
  console.log("Adding ShareBrain Restaurant brain to all existing users...");
  
  try {
    // Get all users
    const allUsers = await storage.getAllUsers();
    console.log(`Found ${allUsers.length} total users`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const user of allUsers) {
      try {
        // Check if user already has ShareBrain Restaurant
        const existingContacts = await storage.getContactsByUser(user.id);
        const hasShareBrainRestaurant = existingContacts.some(contact => 
          contact.contactType === 'agent' && contact.agentId === 347
        );
        
        if (hasShareBrainRestaurant) {
          console.log(`⏭️  User ${user.id} already has ShareBrain Restaurant - skipping`);
          skipCount++;
          continue;
        }
        
        // Add ShareBrain Restaurant to user's contacts
        await storage.createContact({
          userId: user.id,
          contactUserId: null,
          agentId: 347,
          contactType: "agent",
          displayName: "ShareBrain Restaurant",
          hasNewMessage: true, // Show as new so users notice it
        });
        
        console.log(`✅ Added ShareBrain Restaurant to user: ${user.id}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to add ShareBrain Restaurant to user ${user.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log("\n=== SUMMARY ===");
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Successfully added: ${successCount}`);
    console.log(`Already had it: ${skipCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`✅ ShareBrain Restaurant brain added to all existing users!`);
    
  } catch (error) {
    console.error("❌ Script failed:", error);
  }
}

// Run the script
addShareBrainRestaurantToAllUsers();