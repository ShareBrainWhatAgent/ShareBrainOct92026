#!/usr/bin/env node
import { storage } from './server/storage.js';
import { DataIntegrationService } from './server/dataIntegrationService.js';

async function updateWebsiteWithAuthenticData() {
  try {
    console.log('Fetching authentic data from verified sources...');
    
    // Get authentic data
    const authenticData = await DataIntegrationService.generateAuthenticDataset();
    
    console.log(`Retrieved ${authenticData.routes.length} authentic routes`);
    console.log(`Retrieved ${authenticData.repairShops.length} authentic repair shops`);
    
    // Generate repair shops section with source attribution
    const repairShopsSection = `
        <div class="faq-section">
            <h3>Verified Motorcycle Repair Shops</h3>
            <div class="faq-content">
                <p>Here are verified motorcycle repair shops across India with contact information and specializations:</p>
                <div class="repair-shops-grid">
                    ${authenticData.repairShops.map(shop => `
                        <div class="repair-shop-card">
                            <h4>${shop.name}</h4>
                            <p><strong>Location:</strong> ${shop.address}, ${shop.city}, ${shop.state}</p>
                            <p><strong>Phone:</strong> ${shop.phone}</p>
                            <p><strong>Specialty:</strong> ${shop.specialty}</p>
                            <p><strong>Services:</strong> ${shop.services.join(', ')}</p>
                            <p><strong>Rating:</strong> ${shop.rating}/5</p>
                            <p><strong>Hours:</strong> ${shop.hours}</p>
                            <p class="source-attribution">
                                <small>Source: <a href="${shop.sourceUrl}" target="_blank" style="color: #4CAF50;">${shop.sourceUrl}</a></small>
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    
    // Generate routes section with source attribution
    const routesSection = `
        <div class="faq-section">
            <h3>Verified Motorcycle Routes</h3>
            <div class="faq-content">
                <p>Here are verified motorcycle routes with authentic information:</p>
                <div class="routes-grid">
                    ${authenticData.routes.map(route => `
                        <div class="route-card">
                            <h4>${route.name}</h4>
                            <p><strong>From:</strong> ${route.startCity} <strong>To:</strong> ${route.endCity}</p>
                            <p><strong>Distance:</strong> ${route.distance}</p>
                            <p><strong>Duration:</strong> ${route.duration}</p>
                            <p><strong>Difficulty:</strong> ${route.difficulty}</p>
                            <p><strong>Best Season:</strong> ${route.bestSeason}</p>
                            <p><strong>Highlights:</strong> ${route.highlights.join(', ')}</p>
                            <p><strong>Road Conditions:</strong> ${route.roadConditions}</p>
                            <p class="source-attribution">
                                <small>Source: <a href="${route.sourceUrl}" target="_blank" style="color: #4CAF50;">${route.sourceUrl}</a></small>
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
    
    // Get current website
    const currentWebsite = await storage.getAgentWorkspace(321);
    
    if (!currentWebsite) {
      console.log('No existing website found');
      return;
    }
    
    // Add styles for the new sections
    const additionalStyles = `
        .repair-shops-grid, .routes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1rem;
        }
        
        .repair-shop-card, .route-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 1.5rem;
            color: #ffffff;
        }
        
        .repair-shop-card h4, .route-card h4 {
            color: #ffffff;
            margin-bottom: 0.5rem;
        }
        
        .source-attribution {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #333;
            color: #cccccc;
        }
        
        .source-attribution a {
            color: #4CAF50;
            text-decoration: none;
        }
        
        .source-attribution a:hover {
            text-decoration: underline;
        }
    `;
    
    // Insert the authentic data sections into the website
    let updatedCode = currentWebsite.code;
    
    // Add styles
    updatedCode = updatedCode.replace('</style>', additionalStyles + '\n</style>');
    
    // Find a good place to insert the new sections (before the closing main tag)
    const insertPoint = updatedCode.indexOf('</main>');
    if (insertPoint !== -1) {
      updatedCode = updatedCode.slice(0, insertPoint) + 
                   repairShopsSection + '\n' + 
                   routesSection + '\n' + 
                   updatedCode.slice(insertPoint);
    }
    
    // Update the website in the database
    await storage.updateAgentWorkspace(321, {
      code: updatedCode,
      description: 'Enhanced with authentic data sources and proper attribution - verified repair shops and routes'
    });
    
    console.log('Successfully updated website with authentic data and source attribution');
    
  } catch (error) {
    console.error('Error updating website:', error);
  }
}

updateWebsiteWithAuthenticData();