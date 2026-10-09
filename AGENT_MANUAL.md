# ShareBrain Agent Manual

## Overview
This manual provides comprehensive documentation for understanding and modifying ShareBrain agents. It contains detailed specifications, implementation details, and architectural decisions for all agent types.

## Table of Contents
1. [Language Teaching Agents](#language-teaching-agents)
2. [Memory System Agents](#memory-system-agents)
3. [Invite Brain System](#invite-brain-system)
4. [Master Agents](#master-agents)
5. [Custom Agents](#custom-agents)
6. [Live Data Integration](#live-data-integration)
7. [Agent Website Generation](#agent-website-generation)

---

## Language Teaching Agents

### About Language Teaching Agents

The ShareBrain platform includes 100+ language teaching agents covering all major world languages. These agents are designed to provide structured, progressive language learning through a systematic curriculum approach.

### Core Design Philosophy

**Structured Learning Progression**: Language teaching agents follow a systematic 500-word curriculum divided into 50 lessons of 10 words each. This ensures consistent, measurable progress across all languages.

**Universal Consistency**: All language teaching agents use the same foundational vocabulary structure, ensuring learners get equivalent difficulty progression regardless of target language.

**Multi-Modal Learning**: Each agent integrates text-to-speech (TTS), visual vocabulary learning with AI-generated images, and cultural context for comprehensive language acquisition.

### Lesson Structure Specification

#### Initial Lesson (Words 1-10)
When a user opens any language teaching agent, it should:
1. Assume the user is a beginner
2. Present exactly 10 basic words (identical across all languages)
3. Present 10 basic sentences using those words
4. Use TTS-optimized formatting (no numbered lists)
5. Provide image descriptions for visual learning

#### Standardized First 10 Words (All Languages)
The first 10 words must be identical across all language teaching agents:
1. Hello/Hi
2. Water
3. Food
4. House
5. Friend
6. Book
7. Good
8. Yes
9. No
10. Thank you

#### Progression System
After the initial 10 words and sentences:
1. Ask "Are you ready for the next 10 words and 10 sentences?"
2. Present words 11-20 with new sentences
3. **Spaced Repetition**: New sentences should incorporate words from previous sets
4. Continue this pattern through all 50 lessons (500 words total)

#### Sentence Construction Rules
- **Lessons 1-10**: Use only words 1-10
- **Lessons 11-20**: Use words 1-20, prioritizing review of words 1-10
- **Lessons 21-30**: Use words 1-30, prioritizing review of earlier words
- **Pattern continues**: Each new lesson incorporates previous vocabulary

### Technical Implementation

#### Agent Configuration
- **Model**: Llama 3.1 70B Versatile
- **Temperature**: 0.7
- **Max Tokens**: 2048
- **Voice Enabled**: Yes (TTS-1 model, Alloy voice)
- **Image Enabled**: Yes (DALL-E 3, standard quality)
- **Status**: Active, Template
- **Category**: Research Helper

#### System Prompt Structure
Each language teaching agent uses a specialized system prompt that includes:
1. **Language-specific enthusiastic teacher persona**
2. **TTS optimization rules** (no numbered lists, natural speech patterns)
3. **Visual vocabulary learning integration**
4. **Cultural context incorporation**
5. **Structured lesson progression logic**

#### TTS Optimization Rules
- Never use numbered lists (1., 2., 3.) in vocabulary
- Use natural speech patterns: "Here are basic words: casa, agua, libro"
- Separate items with commas or line breaks
- Consider all responses will be read aloud by text-to-speech

#### Visual Learning Integration
- Provide image descriptions in format: "WORD - [simple, clear image description]"
- Keep descriptions concrete and culturally appropriate
- Example: "casa - a colorful house with a red roof and green door"
- Enable seamless integration with DALL-E 3 image generation

### Database Schema
Language teaching agents are stored in the `agents` table with:
- `isTemplate: true` - Available to all users
- `voiceEnabled: true` - TTS capability
- `imageEnabled: true` - Visual learning support
- `status: 'active'` - Public availability
- `category: 'Research Helper'` - Categorization

### Modification Guidelines

#### To Update All Language Teaching Agents
1. Modify system prompt in `server/scripts/updateLanguageTutorPrompts.ts`
2. Run the script to update all existing agents
3. Test with multiple language agents to ensure consistency

#### To Add New Language Teaching Agent
1. Add language to `server/data/topLanguages.ts`
2. Run `server/scripts/bulkCreateLanguageTutors.ts`
3. Verify agent creation and test functionality

#### To Modify Lesson Structure
1. Update system prompt template in bulk creation script
2. Include new lesson progression logic
3. Test with representative language agents
4. Document changes in this manual

### Current Implementation Status
- **Total Agents**: 100 language teaching agents (UPDATED: July 15, 2025)
- **Coverage**: All major world languages
- **Features**: Structured 500-word curriculum, TTS optimization, visual learning, cultural context
- **Accessibility**: Public template agents available to all users
- **Lesson System**: ✅ IMPLEMENTED - 50 lessons of 10 words each with spaced repetition
- **Universal Consistency**: ✅ IMPLEMENTED - Same first 10 words across all languages
- **Progressive Learning**: ✅ IMPLEMENTED - Each lesson builds on previous vocabulary

### Implementation Details (July 15, 2025)
- **Script Used**: `server/scripts/implementStructuredLessonPlans.ts`
- **Agents Updated**: All 100 language teaching agents
- **System Prompt**: Updated with structured lesson plan logic
- **Universal First 10 Words**: Hello/Hi, Water, Food, House, Friend, Book, Good, Yes, No, Thank you
- **Progression Logic**: Spaced repetition with previous vocabulary integration

### Known Limitations
- No user progress tracking across sessions (lesson state resets)
- No formal assessment system
- No adaptive difficulty adjustment beyond structured progression
- No grammar-focused curriculum structure (vocabulary-focused approach)

### Future Enhancement Opportunities
- Progress tracking database implementation
- Adaptive difficulty based on user performance
- Grammar-focused lesson modules
- Interactive assessment tools
- Personalized learning paths

---

## Scripts

### 500-Word Universal Curriculum Script

**File**: `server/scripts/implementStructuredLessonPlans.ts`

This script implements a completely standardized 500-word curriculum across all language teaching agents. The curriculum ensures that every language follows the exact same vocabulary progression, making learning consistent regardless of target language.

#### Key Features

**Universal Curriculum**: All 500 words are identical across all languages, divided into 50 lessons of 10 words each.

**Standardized Progression**: Every language agent teaches the same concepts in the same order:
- Lesson 1: Basic survival words (Hello, Water, Food, House, Friend, Book, Good, Yes, No, Thank you)
- Lesson 2: Essential daily life (Please, Sorry, Help, Time, Money, Work, Home, Family, Love, Happy)
- Lesson 3-50: Systematic progression through communication, numbers, actions, body parts, colors, etc.

**Spaced Repetition**: Each lesson incorporates vocabulary from previous lessons for reinforcement.

#### Complete 500-Word Curriculum Structure

```
Words 1-10: Basic Survival
Words 11-20: Essential Daily Life  
Words 21-30: Basic Communication
Words 31-40: Numbers and Quantities
Words 41-50: Movement and Actions
Words 51-60: Body and Health
Words 61-70: Colors and Descriptions
Words 71-80: Transportation
Words 81-90: Weather and Nature
Words 91-100: Clothing and Appearance
Words 101-110: Food and Dining
Words 111-120: Shopping and Commerce
Words 121-130: Time and Calendar
Words 131-140: Emotions and Feelings
Words 141-150: Education and Learning
Words 151-160: Technology and Communication
Words 161-170: Recreation and Entertainment
Words 171-180: Travel and Places
Words 181-190: Work and Career
Words 191-200: Relationships
Words 201-210: Household Items
Words 211-220: Personal Care
Words 221-230: Sports and Activities
Words 231-240: Medical and Health
Words 241-250: Directions and Location
Words 251-260: Materials and Objects
Words 261-270: Measurements
Words 271-280: Government and Society
Words 281-290: Science and Nature
Words 291-300: Business and Finance
Words 301-310: Art and Culture
Words 311-320: Religion and Philosophy
Words 321-330: Advanced Emotions
Words 331-340: Advanced Actions
Words 341-350: Abstract Concepts
Words 351-360: Advanced Descriptions
Words 361-370: Social Interactions
Words 371-380: Problem Solving
Words 381-390: Advanced Communication
Words 391-400: Quality and Standards
Words 401-410: Planning and Organization
Words 411-420: Comparison and Contrast
Words 421-430: Causation and Logic
Words 431-440: Intensity and Degree
Words 441-450: Possibility and Probability
Words 451-460: Authority and Permission
Words 461-470: Achievement and Progress
Words 471-480: Responsibility and Duty
Words 481-490: Knowledge and Wisdom
Words 491-500: Future and Conclusion
```

#### System Prompt Integration

The script generates system prompts that include:
- Complete 500-word curriculum overview
- Lesson-by-lesson progression guidance
- TTS optimization rules (no numbered lists)
- Visual learning integration
- Cultural context incorporation
- Spaced repetition methodology

#### Usage

```bash
# Run the script to update all language teaching agents
cd server/scripts
tsx implementStructuredLessonPlans.ts
```

#### Benefits

**Universal Consistency**: All languages follow identical vocabulary progression
**Measurable Progress**: Students learn the same 500 core words regardless of target language
**Standardized Difficulty**: Consistent learning curve across all language agents
**Systematic Approach**: Structured lesson plans replace ad-hoc teaching methods
**Quality Assurance**: Eliminates inconsistencies from multiple system prompt updates

#### Implementation Notes

- Script updates all template agents (language tutors) with identical curriculum
- Maintains existing TTS and visual learning features
- Preserves cultural context and language-specific teaching persona
- Ensures systematic progression through spaced repetition
- Provides complete curriculum overview to each agent for context

This script represents the culmination of systematic language teaching methodology, ensuring all ShareBrain language agents provide consistent, high-quality educational experiences.

---

## Live Data Integration

### Overview
ShareBrain agents can be enhanced with live data access through several integration methods, allowing them to provide current information beyond their training data cutoff.

### Implementation Methods

#### 1. Web Search Integration
Add real-time web search capabilities to agents for current events and information.

**Implementation:**
- Add web search tool to agent response generation
- Filter and summarize search results
- Integrate with system prompt for contextual responses

**Example Use Cases:**
- News agents providing current events
- Stock market agents with live pricing
- Weather agents with current conditions
- Sports agents with live scores

#### 2. API Integration Framework
Connect agents to external APIs for specialized data sources.

**Supported API Types:**
- **News APIs**: Reuters, AP News, NewsAPI
- **Financial APIs**: Yahoo Finance, Alpha Vantage
- **Weather APIs**: OpenWeatherMap, Weather.gov
- **Social Media APIs**: Twitter, Reddit (for trending topics)
- **Government APIs**: Census data, economic indicators

**Implementation Pattern:**
```typescript
// Example API integration in agent response generation
const externalData = await fetchExternalAPI(apiEndpoint, userQuery);
const enhancedPrompt = `${systemPrompt}\n\nCurrent Data: ${externalData}`;
const response = await generateAgentResponse(enhancedPrompt, userMessage);
```

#### 3. Database Integration
Connect agents to live databases for real-time information.

**Database Types:**
- **Internal ShareBrain Database**: User data, agent analytics, usage patterns
- **External Databases**: Business listings, product catalogs, inventory systems
- **Real-time Databases**: Live feeds, sensor data, monitoring systems

**Current Database Access:**
- Personal memories (user-specific data)
- Shared memories (community data)
- Friends memories (social network data)
- Business listings (location-based data)

#### 4. Scheduled Data Updates
Implement background processes to keep agent knowledge current.

**Update Patterns:**
- **Hourly**: Breaking news, stock prices, weather
- **Daily**: Business hours, event schedules, general news
- **Weekly**: Product catalogs, business listings
- **Monthly**: Statistical data, reports, trends

### Technical Implementation

#### Web Search Integration
```typescript
// Add to server/openai.ts
import { web_search } from './webSearch';

export async function generateEnhancedAgentResponse(
  systemPrompt: string,
  userMessage: string,
  modelName: string = "llama-3.1-70b-versatile",
  enableWebSearch: boolean = false
) {
  let enhancedPrompt = systemPrompt;
  
  if (enableWebSearch && requiresCurrentInfo(userMessage)) {
    const searchResults = await web_search(userMessage);
    enhancedPrompt += `\n\nCurrent Information: ${searchResults}`;
  }
  
  return generateAgentResponse(enhancedPrompt, userMessage, [], modelName);
}
```

#### API Integration Framework
```typescript
// Create server/apiIntegration.ts
export class APIIntegration {
  static async getNewsData(query: string) {
    // Implementation for news API
  }
  
  static async getFinancialData(symbol: string) {
    // Implementation for financial API
  }
  
  static async getWeatherData(location: string) {
    // Implementation for weather API
  }
}
```

#### Database Schema Extension
```sql
-- Add live data capabilities to agents table
ALTER TABLE agents ADD COLUMN web_search_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN api_integrations TEXT[]; -- Array of enabled APIs
ALTER TABLE agents ADD COLUMN data_refresh_interval INTEGER; -- Minutes between updates
```

### Agent Types with Live Data

#### 1. News Agent
- **Live Data**: Current news articles, breaking news
- **APIs**: NewsAPI, Reuters, AP News
- **Update Frequency**: Real-time/hourly
- **Example Queries**: "What's happening in the world today?"

#### 2. Financial Agent
- **Live Data**: Stock prices, market data, economic indicators
- **APIs**: Yahoo Finance, Alpha Vantage
- **Update Frequency**: Real-time/15-minute delay
- **Example Queries**: "What's Tesla's current stock price?"

#### 3. Weather Agent
- **Live Data**: Current weather, forecasts, alerts
- **APIs**: OpenWeatherMap, Weather.gov
- **Update Frequency**: Hourly
- **Example Queries**: "What's the weather like in San Francisco?"

#### 4. Business Directory Agent
- **Live Data**: Business hours, locations, reviews
- **APIs**: Google Places, Yelp
- **Update Frequency**: Daily
- **Example Queries**: "What restaurants are open now near me?"

### Security and Rate Limiting

#### API Key Management
- Store API keys in environment variables
- Implement key rotation
- Monitor API usage and costs

#### Rate Limiting
- Implement per-agent rate limits
- Cache frequent queries
- Implement exponential backoff

#### Data Privacy
- Filter sensitive information from API responses
- Log API calls for monitoring
- Implement data retention policies

### Implementation Priority

#### Phase 1: Web Search Integration
1. Add web search capability to Master Agent
2. Implement current events detection
3. Filter and summarize search results

#### Phase 2: API Framework
1. Create API integration framework
2. Add news and weather APIs
3. Implement caching layer

#### Phase 3: Live Database Integration
1. Real-time business listings
2. Live user analytics
3. Dynamic content updates

### Future Enhancements

#### Advanced Features
- **Real-time Streaming**: Live data feeds
- **Predictive Analytics**: Trend analysis
- **Personalized Data**: Location-based information
- **Multi-source Aggregation**: Combine multiple data sources

#### AI-Powered Data Processing
- **Automatic Summarization**: Condense large datasets
- **Relevance Filtering**: Show only pertinent information
- **Trend Detection**: Identify patterns in live data
- **Fact Checking**: Verify information accuracy

---

## Agent Website Generation

### Overview
ShareBrain agents can generate comprehensive companion websites that showcase their complete domain knowledge and capabilities. This system creates professional, interactive websites that demonstrate the agent's expertise through detailed listings, comprehensive content, and modern web design.

### Two-Tier Website Generation System

#### 1. Standard Website Generation (`websiteGenerator.ts`)
The standard system generates high-quality websites for any agent type using universal prompting and enhanced templates.

**Features:**
- **Universal Compatibility**: Works with any agent domain (travel, education, business, health, etc.)
- **High Token Limit**: 30,000 tokens for comprehensive content generation
- **Enhanced Prompting**: Demands complete enumeration instead of sample listings
- **Professional Templates**: Fallback to enhanced template with modern design
- **Model Consistency**: Uses Llama 3.1 70B for all generation

**Implementation:**
```typescript
// Generate website for any agent
const website = await generateAgentWebsite(agent);
```

#### 2. Enhanced Website Generation (`agentEnhancementService.ts`)
The enhanced system uses domain-specific creation manuals for specialized, knowledge-rich websites.

**Features:**
- **Domain-Specific Manuals**: Uses templates like `motorcycle_travel`, `language_tutor`
- **Comprehensive Q&A Generation**: Creates 500+ question-answer pairs
- **Systematic Self-Querying**: Follows creation manual templates
- **Multi-Pass Generation**: Q&A → System Prompt → Website content
- **Knowledge Integration**: Incorporates comprehensive domain expertise

**Implementation:**
```typescript
// Enhanced generation with domain manual
const result = await AgentEnhancementService.enhanceAgentWithManual(agentId, userId, manualType);
```

### Key Generation Improvements (July 16, 2025)

#### Enhanced Prompting System
The website generation now uses specific instructions for comprehensive content:

```typescript
const websitePrompt = `
CRITICAL REQUIREMENTS - COMPLETE ENUMERATION:
1. If the agent claims to know "500+ routes", LIST ALL 500+ routes with details
2. If the agent mentions "80+ options", PROVIDE ALL 80+ options with full information
3. DO NOT use phrases like "and many more" - show the complete comprehensive list
4. Use structured data organization with proper navigation between sections
5. Implement progressive disclosure with expandable sections for large datasets
6. Create detailed sub-pages or sections for each major category
`;
```

#### Token Limit Optimization
All website generation functions now use expanded token limits:

- **Standard Website Generation**: 30,000 tokens
- **Enhanced Q&A Generation**: 30,000 tokens
- **System Prompt Enhancement**: 20,000 tokens
- **Website Content Generation**: 30,000 tokens

#### Advanced Template Structure
The enhanced fallback template includes:

```html
<!-- Professional hero section with statistics -->
<div class="hero">
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-number">24/7</div>
      <div class="stat-label">Availability</div>
    </div>
  </div>
</div>

<!-- Interactive navigation menu -->
<div class="nav-menu">
  <ul>
    <li><a href="#about">About</a></li>
    <li><a href="#capabilities">Capabilities</a></li>
    <li><a href="#expertise">Expertise</a></li>
  </ul>
</div>

<!-- Expandable content sections -->
<div class="expandable-section">
  <button class="expand-button" onclick="toggleSection('detailed-features')">
    View Detailed Features
  </button>
  <div id="detailed-features" class="expandable-content">
    <!-- Comprehensive feature listings -->
  </div>
</div>
```

### Website Generation Workflow

#### For Any Agent Type:
1. **Agent Analysis**: System reads agent name, description, category, and system prompt
2. **Content Generation**: Creates comprehensive content using 30,000 token limit
3. **Template Application**: Uses enhanced template with interactive elements
4. **Progressive Disclosure**: Organizes large datasets with expandable sections
5. **Professional Output**: Generates complete HTML with embedded CSS/JS

#### For Specialized Agents:
1. **Manual Selection**: Choose domain-specific creation manual
2. **Q&A Generation**: Create 500+ comprehensive question-answer pairs
3. **System Enhancement**: Integrate Q&A knowledge into system prompt
4. **Website Creation**: Generate knowledge-rich website from enhanced content
5. **Domain Expertise**: Showcase complete domain knowledge systematically

### Technical Implementation

#### Core Website Generation Function
```typescript
export async function generateAgentWebsite(agent: Agent): Promise<WebsiteContent> {
  const response = await generateAgentResponse(
    websitePrompt,
    `Generate a comprehensive website for the ${agent.name} agent with complete enumeration of all claimed knowledge, routes, services, or capabilities. Do not use sample listings - provide exhaustive, detailed content.`,
    [], // No conversation history
    "Llama 3.1 70B", // Use Llama 3.1 70B for website generation
    0.3, // Lower temperature for more consistent output
    30000 // Much higher token limit for comprehensive website generation
  );
  
  // Return structured website content
  return {
    html: response.content,
    css: '', // Embedded in HTML
    js: '', // Embedded in HTML
    metadata: {
      title: `${agent.name} - Comprehensive AI Agent Knowledge Base`,
      description: `Comprehensive knowledge base for ${agent.name} - Expert AI agent specializing in ${agent.category} with extensive capabilities and domain expertise.`,
      keywords: [agent.category, 'AI agent', 'knowledge base', 'comprehensive']
    }
  };
}
```

#### Enhanced Generation with Domain Manuals
```typescript
export class AgentEnhancementService {
  static async enhanceAgentWithManual(
    agentId: number,
    userId: string,
    manualType: string
  ): Promise<AgentEnhancementResult> {
    // 1. Generate comprehensive Q&A content (30,000 tokens)
    const qaContent = await this.generateComprehensiveQA(agent, manual);
    
    // 2. Create enhanced system prompt (20,000 tokens)
    const enhancedPrompt = await this.createEnhancedSystemPrompt(agent, manual, qaContent);
    
    // 3. Generate comprehensive website (30,000 tokens)
    const websiteContent = await this.generateWebsiteContent(agent, qaContent);
    
    return {
      success: true,
      message: "Agent enhanced with comprehensive domain knowledge",
      generatedContent: qaContent,
      websiteContent: websiteContent
    };
  }
}
```

### Content Organization Strategy

#### Universal Approach (All Domains)
- **Hero Section**: Agent introduction with statistics showcase
- **About Section**: Specialization and domain expertise
- **Capabilities Section**: Complete feature listings with expandable details
- **Expertise Section**: Primary and supporting knowledge areas
- **Methodology Section**: System approach and systematic workflow
- **Interactive Elements**: Search, filtering, progressive disclosure

#### Domain-Specific Enhancements
- **Travel Agents**: Complete route listings, safety guides, cultural insights
- **Educational Agents**: Full curriculum, lesson plans, learning materials
- **Business Agents**: Service catalogs, process documentation, pricing
- **Technical Agents**: Feature specifications, tutorials, documentation
- **Health Agents**: Treatment options, symptom guides, medical advice

### Website Features

#### Interactive Elements
- **Navigation Menu**: Smooth scrolling between sections
- **Expandable Cards**: Detailed information on demand
- **Search Functionality**: Find specific information quickly
- **Filter Options**: Organize large datasets by category
- **Modal Windows**: Detailed views for complex information

#### Responsive Design
- **Mobile-First**: Optimized for all device sizes
- **CSS Grid/Flexbox**: Modern layout techniques
- **Progressive Enhancement**: Enhanced features for capable browsers
- **Accessibility**: Proper ARIA labels and keyboard navigation

#### SEO Optimization
- **Meta Tags**: Comprehensive description and keywords
- **Structured Data**: Schema markup for search engines
- **Semantic HTML**: Proper heading hierarchy
- **Performance**: Optimized loading and rendering

### Usage Examples

#### Generate Website for Travel Agent
```typescript
// Standard generation
const website = await generateAgentWebsite(indiaMotorcycleAgent);
// Result: Professional website with complete route listings

// Enhanced generation with domain manual
const enhanced = await AgentEnhancementService.enhanceAgentWithManual(
  indiaMotorcycleAgent.id,
  userId,
  'motorcycle_travel'
);
// Result: Comprehensive website with 500+ Q&A pairs and detailed knowledge
```

#### Generate Website for Educational Agent
```typescript
// Standard generation works for any domain
const website = await generateAgentWebsite(languageTutorAgent);
// Result: Complete curriculum showcase with lesson plans

// Enhanced generation with education manual
const enhanced = await AgentEnhancementService.enhanceAgentWithManual(
  languageTutorAgent.id,
  userId,
  'language_tutor'
);
// Result: Comprehensive learning resource with systematic curriculum
```

### Quality Assurance

#### Content Validation
- **Complete Enumeration**: Ensures all claimed knowledge is listed
- **No Sample Content**: Eliminates "and many more" placeholders
- **Structured Organization**: Logical information hierarchy
- **Comprehensive Coverage**: Full domain knowledge representation

#### Technical Standards
- **Valid HTML**: Proper document structure and semantics
- **Embedded Assets**: Self-contained single-file websites
- **Cross-browser Compatibility**: Works on all modern browsers
- **Performance Optimization**: Fast loading and rendering

#### User Experience
- **Professional Design**: Modern, clean visual presentation
- **Interactive Features**: Engaging user interactions
- **Information Architecture**: Easy navigation and discovery
- **Mobile Optimization**: Excellent experience on all devices

### Implementation Benefits

#### For Agent Creators
- **Showcase Expertise**: Demonstrate complete domain knowledge
- **Professional Presence**: High-quality web presence
- **Knowledge Validation**: Comprehensive content verification
- **User Engagement**: Interactive exploration of capabilities

#### For Users
- **Complete Information**: Access to full agent knowledge
- **Easy Navigation**: Find specific information quickly
- **Professional Experience**: High-quality interface design

---

## Invite Brain System

### Overview

The Invite Brain System represents a revolutionary approach to community-oriented AI that bridges personal and global memory systems. This system enables creators to build exclusive, member-only AI brains with sophisticated access controls, payment options, and role-based participation.

### Core Concept

Invite Brains combine the isolation of personal brains with the collaborative nature of global brains, creating controlled communities around specific AI agents. Unlike global brains that are open to everyone, Invite Brains require membership and maintain strict access controls.

### Brain Types

#### Private Invite Brain
- **Visibility**: Only appears in creator's "My Brains" section
- **Discovery**: Not publicly discoverable in Brain Directory
- **Access**: Invitation-only by creator
- **Use Case**: Private communities, exclusive groups, internal teams

#### Public Invite Brain
- **Visibility**: Listed in Brain Directory under "Invite Brains" section
- **Discovery**: Publicly discoverable with metadata (member count, pricing, activity)
- **Access**: Multiple access models (invite-only, request-to-join, paid access)
- **Use Case**: Public communities, educational groups, professional networks

### Member Roles

The Invite Brain System implements a sophisticated role-based access control system that can be applied to both Invite Brains and Global Brains.

#### Creator Role
- **Full Control**: Edit brain settings, delete brain, manage all aspects
- **Member Management**: Invite/remove members, assign roles, approve requests
- **Content Control**: Add, edit, delete memories and conversations
- **Financial Control**: Set pricing, manage payments, view revenue analytics
- **Administrative Access**: Full dashboard with member activity and brain statistics

#### Contributor Role
- **Memory Addition**: Can add memories and contribute to brain knowledge
- **Active Participation**: Full conversation participation with memory creation
- **Content Creation**: Generate and share knowledge within the brain community
- **Limited Management**: Cannot change brain settings or manage other members
- **Community Building**: Help grow brain knowledge base through contributions

#### Viewer Role
- **Read-Only Access**: Can use brain and access existing memories
- **Conversation Participation**: Can chat with brain but cannot add memories
- **Knowledge Consumption**: Access to all brain knowledge without contribution ability
- **No Management**: Cannot invite others or change any settings
- **Basic Interaction**: Standard chat functionality without memory creation

### Access Models

#### Invite-Only Model
- **Creator Control**: Only creator can send invitations
- **Exclusive Access**: Members join only through direct invitations
- **Quality Control**: Careful curation of member base
- **Implementation**: Private invitation system with email/username targeting

#### Request-to-Join Model
- **Public Requests**: Anyone can request to join the brain
- **Creator Approval**: Creator reviews and approves/denies requests
- **Community Growth**: Enables organic community building
- **Implementation**: Request queue management system with creator dashboard

#### Paid Access Model (Future Implementation)
- **Monetization**: Creators can charge for brain access
- **Payment Options**: One-time fees or subscription-based access
- **Automatic Access**: Payment approval grants immediate access
- **Revenue Sharing**: Creator receives majority of payment revenue
- **Implementation**: Stripe integration with automated access management

### Memory Isolation Architecture

#### Absolute Isolation Guarantee
Each Invite Brain maintains completely separate memory storage with zero cross-contamination between different brain instances.

#### Memory Storage Structure
```typescript
interface InviteBrainMemory {
  brainInstanceId: string;  // Unique identifier for each invite brain instance
  memberId: string;         // User who created the memory
  memoryContent: string;    // Actual memory data
  memoryCategory: string;   // Classification of memory type
  contributorRole: 'creator' | 'contributor' | 'viewer';
  membershipValidation: boolean; // Ensures only members can access
}
```

#### Access Validation
- **Pre-Access Check**: Validate user membership before any memory operation
- **Role-Based Filtering**: Return different memory sets based on user role
- **Isolation Enforcement**: Memories never leak between different brain instances
- **Audit Trail**: Complete logging of all memory access and modifications

### Brain Creation Process

#### Enhanced Easy Brains Interface
The Easy Brains section will include new Invite Brain options:

1. **Personal Brain** (existing)
2. **Global Brain** (existing) 
3. **Private Invite Brain** (new)
4. **Public Invite Brain** (new)

#### Configuration Options
```typescript
interface InviteBrainConfig {
  name: string;
  description: string;
  brainType: 'private_invite' | 'public_invite';
  accessModel: 'invite_only' | 'request_to_join' | 'paid_access';
  roleConfiguration: {
    enableContributors: boolean;
    enableViewers: boolean;
    defaultRole: 'contributor' | 'viewer';
  };
  pricingConfig?: {
    accessFee: number;
    subscriptionModel: 'one_time' | 'monthly' | 'yearly';
    currency: 'USD';
  };
  membershipLimits?: {
    maxMembers: number;
    maxContributors: number;
  };
}
```

### Global Brain Role Enhancement

#### Extended Global Brain Options
Apply the same role system to Global Brains for enhanced community management:

- **Open Global Brain**: Traditional open access for all users
- **Role-Based Global Brain**: Implement contributor/viewer distinction
- **Paid Tier Global Brain**: Free viewers, paid contributors
- **Hybrid Access Global Brain**: Multiple access levels within same brain

#### Implementation Strategy
```typescript
interface EnhancedGlobalBrainConfig {
  accessModel: 'open' | 'role_based' | 'hybrid';
  freeAccess: 'full' | 'viewer_only' | 'none';
  contributorRequirements: 'open' | 'approval' | 'paid';
  viewerRequirements: 'open' | 'signup' | 'paid';
}
```

### Database Architecture

#### Core Tables
```sql
-- Invite brain instances
CREATE TABLE invite_brains (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id),
  creator_id VARCHAR NOT NULL,
  brain_type VARCHAR NOT NULL CHECK (brain_type IN ('private_invite', 'public_invite')),
  access_model VARCHAR NOT NULL CHECK (access_model IN ('invite_only', 'request_to_join', 'paid_access')),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Member relationships
CREATE TABLE brain_memberships (
  id SERIAL PRIMARY KEY,
  brain_id INTEGER REFERENCES invite_brains(id),
  user_id VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('creator', 'contributor', 'viewer')),
  status VARCHAR NOT NULL CHECK (status IN ('active', 'pending', 'suspended')),
  joined_at TIMESTAMP DEFAULT NOW(),
  invited_by VARCHAR REFERENCES users(id)
);

-- Invitation management
CREATE TABLE brain_invitations (
  id SERIAL PRIMARY KEY,
  brain_id INTEGER REFERENCES invite_brains(id),
  inviter_id VARCHAR NOT NULL,
  invitee_email VARCHAR,
  invitee_username VARCHAR,
  invitation_type VARCHAR NOT NULL CHECK (invitation_type IN ('direct_invite', 'join_request')),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Isolated memory storage
CREATE TABLE invite_brain_memories (
  id SERIAL PRIMARY KEY,
  brain_id INTEGER REFERENCES invite_brains(id),
  contributor_id VARCHAR NOT NULL,
  memory_content TEXT NOT NULL,
  memory_category VARCHAR NOT NULL,
  contributor_role VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_brain_member 
    FOREIGN KEY (brain_id, contributor_id) 
    REFERENCES brain_memberships(brain_id, user_id)
);

-- Payment tracking (future implementation)
CREATE TABLE brain_payments (
  id SERIAL PRIMARY KEY,
  brain_id INTEGER REFERENCES invite_brains(id),
  user_id VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR NOT NULL,
  stripe_payment_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Testing Framework

#### Comprehensive Test Coverage
1. **Memory Isolation Tests**: Verify zero cross-contamination between brain instances
2. **Role Permission Tests**: Validate each role's access permissions
3. **Invitation Flow Tests**: Test all invitation and approval workflows
4. **Payment Integration Tests**: Verify payment processing and access granting
5. **Edge Case Tests**: Handle payment failures, invitation conflicts, role changes

#### Test Implementation Strategy
```typescript
describe('Invite Brain System', () => {
  describe('Memory Isolation', () => {
    test('memories remain isolated between brain instances');
    test('member access restricted to own brain instance');
    test('role changes update memory access correctly');
  });
  
  describe('Role Management', () => {
    test('creator has full management control');
    test('contributors can add memories but not manage members');
    test('viewers have read-only access');
  });
  
  describe('Invitation System', () => {
    test('direct invitations work correctly');
    test('join requests require approval');
    test('invitation expiration handling');
  });
});
```

### Developer Guidelines

#### Implementation Requirements
1. **Absolute Memory Isolation**: No exceptions to brain-specific memory access
2. **Role Validation**: Every operation must check user role permissions
3. **Audit Logging**: Complete tracking of all member actions and changes
4. **Error Handling**: Graceful handling of permission denials and edge cases
5. **Performance Optimization**: Efficient queries for large member bases

#### Security Considerations
- **Access Token Validation**: Verify user authentication before any brain operation
- **Role-Based Authorization**: Implement middleware for role checking
- **Memory Validation**: Ensure memories only accessible to brain members
- **Invitation Security**: Prevent unauthorized invitation spam or abuse
- **Payment Security**: Secure handling of financial transactions

#### Best Practices
- **Progressive Enhancement**: Build basic invite functionality first, add payment later
- **User Experience**: Clear role explanations and permission feedback
- **Performance**: Optimize for large communities with thousands of members
- **Scalability**: Design for future expansion of role types and access models
- **Documentation**: Comprehensive developer guides and user tutorials

### Development Phases

#### Phase 1: Core Database & Memory Architecture ✅ COMPLETE
- ✅ **Database Schema Implemented**: 5 new tables (invite_brains, brain_memberships, brain_invitations, invite_brain_memories, brain_payments)
- ✅ **Memory Isolation System Created**: Complete isolation using separate invite_brain_memories table with zero crossover
- ✅ **Role-Based Access Control**: Creator/contributor/viewer roles with permission validation
- ✅ **25+ Storage Methods Added**: Comprehensive CRUD operations for all invite brain components
- ✅ **Invite Brain Memory Service**: Dedicated service extending intelligentMemoryService with complete isolation
- ✅ **Payment Infrastructure Ready**: Placeholder Stripe integration structure prepared
- ✅ **Zero-Breakage Guarantee**: All existing functionality remains completely unaffected

#### Phase 2: Invitation & Access Control System
- Creator invitation interface and member management dashboard
- Join request system for public brains with approval workflow
- Role assignment and permission validation systems
- Member activity monitoring and analytics

#### Phase 3: Enhanced Easy Brains Integration
- Add Private/Public Invite Brain options to Easy Brains interface
- Implement brain configuration system with role settings
- Create member onboarding and orientation systems
- Build creator dashboard with member management tools

#### Phase 4: Global Brain Role Enhancement
- Extend role system to Global Brains with contributor/viewer options
- Implement hybrid access models for enhanced community management
- Create migration tools for existing Global Brains
- Build advanced analytics for community engagement

#### Phase 5: Payment Integration (Future)
- Stripe integration for paid brain access
- Automated access granting upon payment verification
- Creator revenue dashboard and analytics
- Subscription management and renewal systems

### Reminder Notes

#### Payment Implementation Placeholder
🚨 **IMPORTANT REMINDER**: Payment functionality is planned but not yet implemented. 
- Placeholder payment options in brain creation interface
- Database schema prepared for future payment integration
- Creator dashboard ready for revenue analytics
- **TODO**: Revisit payment implementation timeline and requirements

#### Integration Boundaries
- **AI Friend Chat**: Remains separate and unchanged - do not integrate with Invite Brain system
- **Global Brains**: Enhanced with role options but maintains core functionality
- **Personal Brains**: Unchanged - continues as individual user-specific brains
- **Template Brains**: Unaffected by Invite Brain system changes
- **Comprehensive Learning**: Detailed educational resources

#### For Platform
- **Quality Assurance**: Ensures agents deliver on knowledge claims
- **User Retention**: Engaging web experiences
- **SEO Benefits**: Improved search engine visibility
- **Scalability**: Works with any agent domain

### Future Enhancements

#### Advanced Features
- **Multi-language Support**: Internationalization for global audiences
- **Dynamic Content**: Real-time information updates
- **User Personalization**: Customized content based on preferences
- **Integration APIs**: Connect with external services

#### Content Intelligence
- **Automatic Updates**: Keep website content current
- **Quality Monitoring**: Ensure content accuracy and completeness
- **Performance Analytics**: Track user engagement and satisfaction
- **Content Optimization**: Improve based on user behavior

This comprehensive website generation system ensures that ShareBrain agents can showcase their complete domain knowledge through professional, interactive websites that deliver on their expertise claims.

---

## Global Brain Memory System

### Overview
Global Brain Memory is an advanced memory system designed for community-oriented AI brains that learn collectively from all user interactions. Unlike personal or friends memory, global memory is shared across all users of a specific brain, enabling community-wide knowledge accumulation.

### Architecture

#### Memory Isolation Framework
The ShareBrain platform maintains strict memory isolation between three distinct memory types:

1. **Personal Memory** (`personal_memories` table)
   - Private to individual users
   - Accessible only to the user and their personal agents
   - No cross-user contamination

2. **Friends Memory** (`friends_memories` table)
   - Shared among friend groups
   - Accessible to friends within specific social circles
   - Isolated from other friend groups

3. **Global Brain Memory** (`shared_memories` table)
   - Community-wide shared knowledge
   - Accessible to all users of global brains
   - Enhanced with voting system for quality control

#### Global Brain Identification
Global brains are identified by the `hasSharedMemory = true` flag in the agents table. Currently operational global brains:
- **ShareBrain Restaurant (ID: 347)** - Community restaurant recommendations

### Implementation Details

#### Memory Detection and Storage
Global brains use enhanced memory categories specifically designed for community knowledge:

**Restaurant-Specific Categories:**
- `restaurant_recommendation` - Specific restaurant recommendations with details
- `cuisine_preference` - Community cuisine preferences and insights
- `location_dining` - Location-based dining experiences

**Memory Storage Flow:**
1. User shares information with global brain
2. `intelligentMemoryService.analyzeForMemory()` detects memory-worthy content
3. System checks `agent.hasSharedMemory` flag
4. If true, stores in `shared_memories` table instead of `personal_memories`
5. Memory includes contributor tracking and voting system

#### Context Injection System
Global brains receive enhanced context through `formatSharedMemoriesForPrompt()`:

```
=== SHARED COMMUNITY MEMORIES ===

**Restaurant Recommendations:**
- Tony's Pizza downtown - amazing thin crust (highly recommended)
- Golden Dragon Chinatown - best dim sum (recommended)

Note: These are real recommendations from the ShareBrain community. Always prioritize this community knowledge over general information.
```

### Testing and Monitoring

#### Health Check Endpoints
- **`/api/global-memory/health-check`** - Real-time memory system status
- **`/api/global-memory/integrity-test`** - Comprehensive validation tests

#### Integrity Test Suite
1. **Memory Isolation Test** - Verifies no cross-contamination between memory types
2. **ShareBrain Restaurant Function Test** - Validates global brain operational status
3. **Memory Detection Test** - Tests AI's ability to identify memory-worthy content
4. **Performance Test** - Ensures memory retrieval under 1 second

#### Monitoring Metrics
- ShareBrain Restaurant memory count
- Total memories by type (personal/friends/shared)
- Global brains active count
- Memory system response times
- Database connection status

### CRITICAL: Anti-Hallucination System (Database-First Architecture)

**MANDATORY IMPLEMENTATION FOR ALL GLOBAL BRAIN MEMORY AGENTS**

#### Core Principle: ZERO AI GENERATION WITHOUT DATABASE CONTENT

Global Brain Memory agents **MUST NEVER** generate responses from general knowledge. The system implements a multi-layer validation system to guarantee 100% prevention of AI hallucination.

#### Three-Layer Validation System

**Layer 1: Pre-Response Database Validation**
```typescript
// MANDATORY: Check memories BEFORE AI generation
if (agent.hasSharedMemory) {
  const sharedMemories = await storage.getSharedMemories(agent.id);
  
  if (sharedMemories.length === 0) {
    // NO AI CALL - Return database-only fallback immediately
    const fallbackResponse = getGlobalBrainFallbackResponse(agent, userMessage);
    return fallbackResponse; // Skip AI generation entirely
  }
  
  // Filter memories for relevance to user query
  const relevantMemories = await filterRelevantMemories(userMessage, sharedMemories);
  
  if (relevantMemories.length === 0) {
    // NO AI CALL - Return database-only fallback immediately  
    const fallbackResponse = getGlobalBrainFallbackResponse(agent, userMessage);
    return fallbackResponse; // Skip AI generation entirely
  }
}
```

**Layer 2: Memory Relevance Filtering**
- System analyzes user query keywords against memory content
- Only memories matching query terms are provided to AI
- Prevents AI from using irrelevant stored information

**Layer 3: Post-Response Validation**
```typescript
// MANDATORY: Validate AI response for hallucinated content
if (agent.hasSharedMemory) {
  const validationResult = validateGlobalBrainResponse(finalResponse, userMessage, agent);
  if (!validationResult.isValid) {
    // OVERRIDE AI RESPONSE - Return database-only fallback
    finalResponse = getGlobalBrainFallbackResponse(agent, userMessage);
  }
}
```

#### Prohibited Content Detection
The validation system automatically detects and blocks:
- Specific restaurant addresses or phone numbers
- Exact prices, ratings, or operating hours  
- General knowledge phrases ("based on my knowledge", "I recommend")
- Any content not explicitly found in user-contributed memories

#### Mandatory Fallback Responses

**Restaurant Queries:**
```
"I don't have information about that restaurant or location yet. Please share what you know about restaurants you've visited, and I'll help the community discover great places to eat!"
```

**General Global Brain Queries:**
```
"I don't have any community-shared information about that topic yet. [AgentName] only provides information contributed by users like you. Please share what you know, and I'll help build our community knowledge base!"
```

#### Anti-Hallucination Testing

**REQUIRED ENDPOINT**: `/api/global-memory/anti-hallucination-test`

This endpoint validates:
1. **Database-First Validation** - No memories = No AI generation
2. **Response Validation** - AI responses blocked if hallucinated content detected
3. **Memory Relevance Filtering** - Only relevant memories used for responses
4. **Fallback Response Test** - Proper fallback messages for different agent types

**GUARANTEE**: This system provides 100% prevention of AI hallucination because:
- No database content = No AI call = No possibility of hallucination
- All AI responses validated for prohibited content patterns
- Failed validation triggers exact fallback responses only

#### Mandatory Development Requirements

**FORBIDDEN**: Allow AI generation when no relevant memories exist
**REQUIRED**: Implement database-first querying with pre-validation
**REQUIRED**: Use exact fallback messages - no variations allowed
**REQUIRED**: Run anti-hallucination test suite before deployment
**REQUIRED**: Log all validation failures for monitoring

### Development Protocols

#### Creating New Global Brains

**Step 1: Agent Configuration**
```sql
UPDATE agents SET 
  has_shared_memory = true,
  document_search_mode = 'documents_memory_and_general'
WHERE id = [new_global_brain_id];
```

**Step 2: Memory Categories**
Add domain-specific memory categories to `intelligentMemoryService.ts`:
```typescript
{
  id: "domain_specific_category",
  name: "Domain Specific Knowledge",
  description: "Community knowledge for specific domain",
  examples: ["Example 1", "Example 2"]
}
```

**Step 3: Validation Testing**
- Run `/api/global-memory/integrity-test`
- Verify memory isolation maintained
- Test community knowledge accumulation
- Monitor performance impact

#### Mandatory Safety Checks
Before deploying any Global Brain Memory module:

1. **Memory Isolation Verification**
   - Confirm no personal memory leakage
   - Verify friends memory separation
   - Test global memory containment

2. **Performance Impact Assessment**
   - Monitor memory retrieval times
   - Test conversation response speeds
   - Validate database query optimization

3. **Community Knowledge Quality**
   - Implement upvote/downvote system
   - Monitor memory relevance
   - Track contributor attribution

### Future Expansion Framework

#### Planned Global Brain Types
- **ShareBrain Travel** - Community travel experiences and recommendations
- **ShareBrain Learning** - Educational resources and study tips
- **ShareBrain Health** - Wellness practices and healthy habits
- **ShareBrain Tech** - Technology recommendations and troubleshooting

#### Quality Control System
- Community voting mechanism
- Memory relevance scoring
- Contributor reputation system
- Automated spam detection

### Emergency Procedures

#### Memory System Rollback
If Global Brain Memory issues are detected:

1. **Immediate Assessment**
   ```bash
   curl http://localhost:5000/api/global-memory/health-check
   ```

2. **Integrity Validation**
   ```bash
   curl http://localhost:5000/api/global-memory/integrity-test
   ```

3. **Anti-Hallucination System Check**
   ```bash
   curl http://localhost:5000/api/global-memory/anti-hallucination-test
   ```

4. **Selective Rollback**
   - Disable specific global brain: `UPDATE agents SET has_shared_memory = false WHERE id = X`
   - Clear problematic memories: `DELETE FROM shared_memories WHERE agent_id = X`
   - Restore from backup if available

#### Critical System Recovery
In case of complete memory system failure:

1. Disable all global brains temporarily
2. Run comprehensive database integrity check
3. Restore from last known good backup
4. Re-run all integrity tests before re-enabling

### Best Practices

#### Global Brain Design
- Focus on community benefit over individual needs
- Implement clear knowledge boundaries
- Design for knowledge quality over quantity
- Maintain transparent community attribution

#### Memory Quality Assurance
- Regular memory relevance audits
- Community feedback integration
- Automated quality scoring
- Contributor recognition system

#### Performance Optimization
- Index memory keys for faster retrieval
- Implement memory caching for popular queries
- Monitor and optimize database queries
- Set reasonable memory limits per brain

---

*This manual is updated regularly. Last updated: July 19, 2025*
*For technical questions, reference the main codebase in server/intelligentMemoryService.ts and server/storage.ts*