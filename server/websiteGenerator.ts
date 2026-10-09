import { generateAgentResponse } from "./openai";
import type { Agent } from "@shared/schema";
import { DataIntegrationService } from './dataIntegrationService';
import { VerifiedDataScraper } from './verifiedDataScraper';

export interface WebsiteContent {
  html: string;
  css: string;
  js: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
}

/**
 * Generate a comprehensive website showcasing an agent's knowledge with authentic data
 */
export async function generateAgentWebsite(agent: Agent): Promise<WebsiteContent> {
  // Fetch authentic data for motorcycle travel agents
  let authenticData = "";
  if (agent.category === "Travel & Tourism" || agent.name.toLowerCase().includes("motorcycle")) {
    try {
      const [routes, repairShops] = await Promise.all([
        DataIntegrationService.fetchRealMotorcycleRoutes(),
        VerifiedDataScraper.scrapeAllVerifiedSources()
      ]);
      
      authenticData = `
AUTHENTIC DATA SOURCES TO USE:
${routes.length > 0 ? `
VERIFIED MOTORCYCLE ROUTES (${routes.length} routes):
${routes.map(route => `
- ${route.name}: ${route.distance}, ${route.duration}, ${route.difficulty}
  Highlights: ${route.highlights.join(", ")}
  Season: ${route.bestSeason}
  Source: ${route.sourceUrl}
`).join('')}
` : ''}

${repairShops.length > 0 ? `
VERIFIED REPAIR SHOPS (${repairShops.length} shops):
${repairShops.map(shop => `
- ${shop.name}, ${shop.city}, ${shop.state}
  Address: ${shop.address}
  Phone: ${shop.phone}
  Specialty: ${shop.specialty}
  Rating: ${shop.rating}/5
  Source: ${shop.sourceUrl}
`).join('')}
` : ''}

IMPORTANT: Use this authentic data in your website and include proper source attribution with clickable links back to original sources.
`;
    } catch (error) {
      console.error("Error fetching authentic data:", error);
    }
  }
  const websitePrompt = `
You are tasked with creating a comprehensive companion website for an AI agent. The website must showcase COMPLETE and EXHAUSTIVE knowledge with detailed listings using authentic data sources.

Agent Details:
- Name: ${agent.name}
- Description: ${agent.description}
- Category: ${agent.category}
- System Prompt: ${agent.systemPrompt}

${authenticData}

CRITICAL REQUIREMENTS - AUTHENTIC DATA WITH SOURCE ATTRIBUTION:
1. Use the VERIFIED data provided above as your primary content source
2. Include clickable links back to original sources for EVERY piece of verified data
3. Create "Source Attribution" sections with proper credit to:
   - Official manufacturer websites (Bajaj, Honda, Royal Enfield)
   - Google Maps for route information
   - Government tourism sources
   - Verified business directories
4. Add source links in format: "Source: <a href='[URL]' target='_blank'>[Website Name]</a>"
5. Include data freshness indicators: "Last updated: [Date]"
6. Add prominent disclaimers: "Data sourced from official websites - verify independently before traveling"
7. For any additional example content beyond verified data, clearly label as "Additional Example Content"
8. Build functional interactive features: search, filtering, sorting, pagination
9. Make all contact information clickable (phone numbers, addresses link to maps)
10. Include "Verify Current Information" notices with links to original sources

DESIGN REQUIREMENTS - SHAREBRAIN BLACK & WHITE THEME:
1. Use EXACT colors: background: #000000 (pure black), text: #ffffff (pure white)
2. Card/section backgrounds: #1a1a1a (dark gray) with white text
3. Accent colors: #333333 for borders, #555555 for secondary elements
4. Button style: white text on black background, hover: #333333 background
5. Navigation: black background with white text, hover effects in #333333
6. Clean, minimal design matching ShareBrain's aesthetic
7. Use the ShareBrain logo style approach with clean typography

WEBSITE STRUCTURE REQUIREMENTS:
1. Hero section with agent introduction and statistics overview
2. Comprehensive knowledge sections with COMPLETE listings:
   - Main navigation menu linking to all major sections
   - Detailed subsections with full enumeration
   - Search functionality for large datasets
   - Filtering options for better organization
3. Interactive elements with full data access:
   - Expandable cards showing complete information
   - Tabbed interfaces for different categories
   - Modal windows for detailed views
4. Beautiful modern design with CSS grid/flexbox
5. Responsive layout with mobile-first approach
6. SEO-optimized structure with proper headings

DATA ORGANIZATION STRATEGY - EXAMPLES:
- Create JavaScript arrays like: const routes = [{name: "Delhi to Manali", distance: "537 km", difficulty: "Moderate", highlights: ["Rohtang Pass", "Solang Valley"], duration: "2 days"}]
- Generate 500+ actual route objects with unique names, real Indian cities, specific distances, difficulty levels
- Create repair shop arrays like: const repairShops = [{name: "Royal Enfield Service Center", location: "Connaught Place, Delhi", specialty: "Royal Enfield", phone: "+91-11-23456789", rating: 4.5}]
- Generate 1000+ actual repair shop objects with realistic names, addresses, specialties, contact info
- Implement functional JavaScript: search filters, sorting by distance/difficulty, pagination showing 20 items per page
- Make all buttons and links actually work with real content behind them
- Use event listeners to power interactive features with real data manipulation

IMPORTANT: The HTML must include Google AdWords tracking code immediately after the <head> element:
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17358872736"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-17358872736');
</script>

CONTENT DEPTH REQUIREMENTS - AUTHENTIC DATA INTEGRATION:
- IMPORTANT: Use the verified data provided above as your primary content source
- Add comprehensive source attribution sections with proper credit links
- For verified data: Include clickable source links and "Last updated" dates
- For additional example content: Clear labels as "Additional Example Content for Demonstration"
- Create functional search/filter JavaScript that works with authentic data
- Build pagination systems that display content in manageable chunks
- Include comprehensive disclaimers about data verification
- Add "Data Sources" section in footer with links to all original sources

MANDATORY SOURCE ATTRIBUTION REQUIREMENTS:
1. Create a "Data Sources" footer section with links to:
   - Official manufacturer websites (with clickable links)
   - Google Maps API attribution 
   - Government tourism sources
   - Verified business directories
2. Include source links for every piece of verified data
3. Add "Last updated" timestamps for all authentic data
4. Include prominent disclaimer: "Always verify current information independently"
5. Make all phone numbers clickable (tel: links)
6. Make all addresses clickable (Google Maps links)
7. Include "Report outdated information" contact option

MANDATORY EXAMPLE STRUCTURE - FOLLOW THIS PATTERN:
/* Example structure for motorcycle routes array */
const routes = [
  {name: "Delhi to Manali", startCity: "Delhi", endCity: "Manali", distance: "537 km", duration: "12 hours", difficulty: "Moderate", highlights: ["Rohtang Pass", "Solang Valley", "Kullu Valley"], bestSeason: "May-October", roadConditions: "Good highway, mountain curves"},
  {name: "Mumbai to Goa", startCity: "Mumbai", endCity: "Goa", distance: "463 km", duration: "8 hours", difficulty: "Easy", highlights: ["Coastal roads", "Western Ghats", "Konkan coast"], bestSeason: "October-March", roadConditions: "Excellent highway"},
  // ... generate 500+ more route objects like this
];

/* Example structure for repair shops array */
const repairShops = [
  {name: "Royal Enfield Service Center", city: "Delhi", state: "Delhi", address: "Connaught Place", phone: "+91-11-23456789", specialty: "Royal Enfield", services: ["Engine repair", "Parts replacement"], rating: 4.5, hours: "9 AM - 6 PM"},
  {name: "Bajaj Auto Service", city: "Mumbai", state: "Maharashtra", address: "Andheri West", phone: "+91-22-26789012", specialty: "Bajaj", services: ["Maintenance", "Electrical"], rating: 4.2, hours: "8 AM - 7 PM"},
  // ... generate 1000+ more repair shop objects like this
];

The website should be a single HTML file with embedded CSS and JavaScript.
Focus on showcasing the agent's COMPLETE domain knowledge with exhaustive listings.
Make it professional, informative, and comprehensive with ShareBrain's black and white design.
Generate ACTUAL comprehensive JavaScript arrays with hundreds of objects following the example patterns above.

Return only the complete HTML code with embedded CSS and JavaScript.
`;

  try {
    const response = await generateAgentResponse(
      websitePrompt,
      `Generate a comprehensive website for the ${agent.name} agent with ACTUAL comprehensive data. Create JavaScript arrays with hundreds of real data objects. For motorcycle travel: generate 500+ route objects with specific Indian cities, distances, difficulties. For repair shops: generate 1000+ shop objects with names, locations, specialties. Make all buttons functional with real content. No placeholder content - create actual working databases within the JavaScript.`,
      [], // No conversation history for website generation
      "Llama 3.1 70B", // Use Llama 3.1 70B for website generation
      0.1, // Very low temperature for more consistent, comprehensive output
      30000 // Much higher token limit for comprehensive website generation
    );

    // Extract and clean the HTML
    const htmlContent = response.replace(/```html\n?/g, '').replace(/```\n?/g, '');

    return {
      html: htmlContent,
      css: "", // CSS is embedded in HTML
      js: "", // JS is embedded in HTML
      metadata: {
        title: `${agent.name} - AI Agent Knowledge Base`,
        description: `Comprehensive knowledge base and capabilities of ${agent.name}, an AI agent specializing in ${agent.category}.`,
        keywords: [agent.category, agent.name, "AI Agent", "Knowledge Base", "ShareBrain"]
      }
    };
  } catch (error) {
    console.error("Error generating website:", error);
    
    // Fallback to a simple template
    const fallbackHtml = generateFallbackWebsite(agent);
    return {
      html: fallbackHtml,
      css: "",
      js: "",
      metadata: {
        title: `${agent.name} - AI Agent`,
        description: agent.description || `AI Agent: ${agent.name}`,
        keywords: [agent.category, "AI Agent", "ShareBrain"]
      }
    };
  }
}

/**
 * Generate a comprehensive fallback website template with enhanced structure
 */
function generateFallbackWebsite(agent: Agent): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17358872736"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'AW-17358872736');
    </script>
    
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${agent.name} - Comprehensive AI Agent Knowledge Base</title>
    <meta name="description" content="Comprehensive knowledge base for ${agent.name} - Expert AI agent specializing in ${agent.category} with extensive capabilities and domain expertise.">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: #000000;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .hero {
            text-align: center;
            padding: 4rem 0;
            color: #ffffff;
            background: #000000;
            border-bottom: 1px solid #333333;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
            color: #ffffff;
        }
        
        .hero p {
            font-size: 1.3rem;
            max-width: 700px;
            margin: 0 auto 2rem;
            color: #ffffff;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .stat-card {
            background: #1a1a1a;
            border: 1px solid #333333;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .nav-menu {
            background: rgba(255,255,255,0.95);
            border-radius: 12px;
            padding: 1rem;
            margin: 2rem 0;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        
        .nav-menu ul {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
        }
        
        .nav-menu a {
            color: #667eea;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .nav-menu a:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
        }
        
        .content {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            margin-bottom: 2rem;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .section {
            margin-bottom: 4rem;
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 2rem;
            font-size: 2.5rem;
            border-bottom: 3px solid #667eea;
            padding-bottom: 0.5rem;
            position: relative;
        }
        
        .section h2::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 50px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .knowledge-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .knowledge-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 2rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .knowledge-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .knowledge-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        
        .knowledge-card h3 {
            color: #2d3748;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .knowledge-card p {
            color: #4a5568;
            line-height: 1.7;
        }
        
        .badge {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-size: 0.875rem;
            display: inline-block;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .cta-section {
            text-align: center;
            padding: 3rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
            margin-top: 2rem;
        }
        
        .cta-button {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 1rem 2rem;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50px;
            font-size: 1.1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            margin: 0 1rem;
        }
        
        .cta-button:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        .expandable-section {
            margin-top: 2rem;
        }
        
        .expand-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .expand-button:hover {
            background: #5a67d8;
        }
        
        .expandable-content {
            display: none;
            margin-top: 1rem;
            padding: 1.5rem;
            background: #f7fafc;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        
        .expandable-content.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }
            
            .content {
                padding: 2rem;
            }
            
            .nav-menu ul {
                flex-direction: column;
                align-items: center;
            }
            
            .knowledge-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>${agent.name}</h1>
            <p>${agent.description || 'Specialized AI Agent powered by ShareBrain with comprehensive domain expertise'}</p>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">24/7</div>
                    <div class="stat-label">Availability</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">Expert</div>
                    <div class="stat-label">Knowledge</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">Instant</div>
                    <div class="stat-label">Response</div>
                </div>
            </div>
        </div>
        
        <div class="nav-menu">
            <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#capabilities">Capabilities</a></li>
                <li><a href="#expertise">Expertise</a></li>
                <li><a href="#approach">Approach</a></li>
                <li><a href="#contact">Get Started</a></li>
            </ul>
        </div>
        
        <div class="content">
            <div class="section" id="about">
                <h2>About This Agent</h2>
                <div class="knowledge-grid">
                    <div class="knowledge-card">
                        <h3>Specialization</h3>
                        <p>This agent specializes in <strong>${agent.category}</strong> and is designed to provide comprehensive expert assistance in this domain with extensive knowledge and capabilities.</p>
                    </div>
                    
                    <div class="knowledge-card">
                        <h3>Domain Expertise</h3>
                        <p>Equipped with deep knowledge and practical experience in ${agent.category}, providing detailed insights and actionable guidance.</p>
                    </div>
                </div>
            </div>
            
            <div class="section" id="capabilities">
                <h2>Capabilities & Features</h2>
                <div class="knowledge-card">
                    <h3>Core Capabilities</h3>
                    <span class="badge">Expert Knowledge</span>
                    <span class="badge">Real-time Assistance</span>
                    <span class="badge">Personalized Responses</span>
                    <span class="badge">Comprehensive Analysis</span>
                    ${agent.voiceEnabled ? '<span class="badge">Voice Support</span>' : ''}
                    ${agent.imageEnabled ? '<span class="badge">Image Generation</span>' : ''}
                    <span class="badge">24/7 Availability</span>
                    <span class="badge">Multi-language Support</span>
                </div>
                
                <div class="expandable-section">
                    <button class="expand-button" onclick="toggleSection('detailed-features')">
                        View Detailed Features
                    </button>
                    <div id="detailed-features" class="expandable-content">
                        <h4>Advanced Features:</h4>
                        <ul>
                            <li>Comprehensive domain knowledge and expertise</li>
                            <li>Context-aware responses and recommendations</li>
                            <li>Multi-step problem solving and analysis</li>
                            <li>Integration with real-time data sources</li>
                            <li>Customizable interaction preferences</li>
                            <li>Advanced reasoning and logical analysis</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div class="section" id="expertise">
                <h2>Expertise Areas</h2>
                <div class="knowledge-grid">
                    <div class="knowledge-card">
                        <h3>Primary Expertise</h3>
                        <p>Specialized knowledge in ${agent.category} with comprehensive understanding of industry standards, best practices, and emerging trends.</p>
                    </div>
                    
                    <div class="knowledge-card">
                        <h3>Supporting Skills</h3>
                        <p>Complementary expertise in related areas to provide holistic solutions and comprehensive guidance across interconnected domains.</p>
                    </div>
                </div>
            </div>
            
            <div class="section" id="approach">
                <h2>System Approach</h2>
                <div class="knowledge-card">
                    <h3>Methodology</h3>
                    <p>${agent.systemPrompt}</p>
                </div>
                
                <div class="expandable-section">
                    <button class="expand-button" onclick="toggleSection('approach-details')">
                        Learn More About Our Approach
                    </button>
                    <div id="approach-details" class="expandable-content">
                        <h4>Our Systematic Approach:</h4>
                        <ol>
                            <li><strong>Understanding:</strong> Comprehensive analysis of your specific needs and context</li>
                            <li><strong>Research:</strong> Leveraging extensive knowledge base and real-time information</li>
                            <li><strong>Solution:</strong> Developing tailored recommendations and actionable insights</li>
                            <li><strong>Implementation:</strong> Providing step-by-step guidance and ongoing support</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="cta-section" id="contact">
            <h2>Ready to Get Started?</h2>
            <p>Experience the power of specialized AI assistance with ${agent.name}. Start your conversation today and discover comprehensive expertise in ${agent.category}.</p>
            <br>
            <a href="https://sharebrain.me/chat/${agent.id}" class="cta-button">Start Chatting</a>
            <a href="https://sharebrain.me/agents" class="cta-button">Explore More Agents</a>
        </div>
    </div>
    
    <script>
        // Enhanced interactive elements
        document.querySelectorAll('.knowledge-card').forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = this.style.transform === 'scale(1.02)' ? 'scale(1)' : 'scale(1.02)';
            });
        });
        
        // Smooth scrolling for navigation
        document.querySelectorAll('.nav-menu a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Expandable sections
        function toggleSection(sectionId) {
            const content = document.getElementById(sectionId);
            const button = content.previousElementSibling;
            
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                button.textContent = button.textContent.replace('Hide', 'View');
            } else {
                content.classList.add('active');
                button.textContent = button.textContent.replace('View', 'Hide');
            }
        }
        
        // Add loading animation
        window.addEventListener('load', function() {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
        });
    </script>
</body>
</html>`;
}