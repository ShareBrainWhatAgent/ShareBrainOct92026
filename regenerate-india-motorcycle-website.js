// Regenerate India Motorcycle Trip Agent website with ShareBrain black/white design
import { generateAgentWebsite } from './server/websiteGenerator.js';
import { storage } from './server/storage.js';

async function regenerateWebsite() {
  try {
    console.log('Starting website regeneration for India Motorcycle Trip Agent...');
    
    // Get the agent details from database
    const agent = await storage.getAgent(321);
    if (!agent) {
      console.error('Agent 321 not found!');
      return;
    }
    
    console.log('Agent found:', agent.name);
    console.log('Description:', agent.description);
    
    // Generate new website with ShareBrain design
    console.log('Generating new website with ShareBrain black/white design...');
    const websiteContent = await generateAgentWebsite(agent);
    
    console.log('Website generated successfully!');
    console.log('HTML length:', websiteContent.html.length, 'characters');
    
    // Save the new website
    await storage.saveAgentWebsite(321, 'demo-user', websiteContent.html);
    console.log('Website saved to database!');
    
    // Show preview of the new design
    console.log('\nWebsite preview (first 1000 characters):');
    console.log(websiteContent.html.substring(0, 1000));
    
    console.log('\n✅ Website regeneration complete!');
    console.log('The India Motorcycle Trip Agent website now uses ShareBrain\'s black and white design.');
    
  } catch (error) {
    console.error('Error regenerating website:', error);
  }
}

regenerateWebsite();