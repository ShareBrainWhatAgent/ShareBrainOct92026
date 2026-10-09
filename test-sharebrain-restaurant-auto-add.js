// Test script to verify ShareBrain Restaurant auto-addition for new users

import { DatabaseStorage } from './server/storage.js';

const storage = new DatabaseStorage();

async function testAutoAddShareBrainRestaurant() {
  console.log("Testing ShareBrain Restaurant auto-addition for new users...");
  
  try {
    // Create a test user
    const testUserData = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
    };
    
    console.log("Creating test user:", testUserData.id);
    
    // This should trigger the auto-addition of ShareBrain Restaurant
    const user = await storage.upsertUser(testUserData);
    
    console.log("User created successfully:", user.id);
    
    // Wait a moment for the contact creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if ShareBrain Restaurant was added to user's contacts
    const contacts = await storage.getContactsByUser(user.id);
    console.log("User contacts:", contacts);
    
    const shareBrainRestaurant = contacts.find(contact => 
      contact.contactType === 'agent' && contact.agentId === 347
    );
    
    if (shareBrainRestaurant) {
      console.log("✅ SUCCESS: ShareBrain Restaurant was automatically added to new user!");
      console.log("Contact details:", shareBrainRestaurant);
    } else {
      console.log("❌ FAILED: ShareBrain Restaurant was not added to new user");
    }
    
    // Clean up test user
    console.log("Cleaning up test data...");
    // Note: In a real implementation, you'd want proper cleanup methods
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testAutoAddShareBrainRestaurant();