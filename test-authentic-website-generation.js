// Test script to generate India Motorcycle Trip Agent website with authentic data
import { DataIntegrationService } from './server/dataIntegrationService.js';
import { VerifiedDataScraper } from './server/verifiedDataScraper.js';

async function testAuthenticWebsiteGeneration() {
  console.log("Testing authentic data integration...");
  
  try {
    // Test fetching real motorcycle routes
    console.log("Fetching real motorcycle routes...");
    const routes = await DataIntegrationService.fetchRealMotorcycleRoutes();
    console.log(`Found ${routes.length} verified routes`);
    
    routes.forEach(route => {
      console.log(`- ${route.name}: ${route.distance} (${route.difficulty})`);
      console.log(`  Source: ${route.sourceUrl}`);
      console.log(`  Last updated: ${route.lastUpdated}`);
    });
    
    // Test scraping verified repair shops
    console.log("\nScraping verified repair shops...");
    const repairShops = await VerifiedDataScraper.scrapeAllVerifiedSources();
    console.log(`Found ${repairShops.length} verified repair shops`);
    
    repairShops.forEach(shop => {
      console.log(`- ${shop.name} (${shop.city}, ${shop.state})`);
      console.log(`  Specialty: ${shop.specialty}`);
      console.log(`  Phone: ${shop.phone}`);
      console.log(`  Source: ${shop.sourceUrl}`);
      console.log(`  Last updated: ${shop.lastUpdated}`);
    });
    
    console.log("\n✅ Authentic data integration test completed successfully!");
    console.log("The website generator will now use this verified data with proper source attribution.");
    
  } catch (error) {
    console.error("❌ Error testing authentic data integration:", error);
  }
}

testAuthenticWebsiteGeneration();