import { storage } from "../storage";

// Create community knowledge versions of our specialized agents
const communityAgents = [
  {
    name: "Community Piano Knowledge - Collaborative Learning",
    description: "Community-driven piano learning hub where pianists share techniques, practice methods, and performance tips from all skill levels.",
    baseExpertise: "piano technique, classical repertoire, music theory, sight-reading, performance preparation, practice methods",
    category: "Specialized Learning & Education",
    voiceType: "nova" as const
  },
  {
    name: "Community Guitar Knowledge - Shared Techniques",
    description: "Collaborative guitar learning community where players share techniques, chord progressions, and songwriting wisdom.",
    baseExpertise: "guitar techniques, chord progressions, scales, songwriting, amp settings, effects, recording",
    category: "Specialized Learning & Education", 
    voiceType: "onyx" as const
  },
  {
    name: "Community Python Knowledge - Collective Programming",
    description: "Developer community sharing Python solutions, best practices, and real-world project insights from all experience levels.",
    baseExpertise: "Python syntax, data structures, web frameworks, data science, automation, testing, deployment",
    category: "Specialized Learning & Education",
    voiceType: "alloy" as const
  },
  {
    name: "Community JavaScript Knowledge - Shared Development",
    description: "JavaScript developer community pooling knowledge on frameworks, solutions, and modern development practices.",
    baseExpertise: "JavaScript fundamentals, React, Node.js, TypeScript, async programming, web APIs, performance",
    category: "Specialized Learning & Education",
    voiceType: "alloy" as const
  },
  {
    name: "Community Cooking Knowledge - Recipe Sharing",
    description: "Culinary community where home cooks and chefs share recipes, techniques, and cooking wisdom from around the world.",
    baseExpertise: "cooking techniques, recipe development, knife skills, flavor pairing, kitchen management, culinary arts",
    category: "Lifestyle & Hobbies",
    voiceType: "alloy" as const
  },
  {
    name: "Community Fitness Knowledge - Shared Training",
    description: "Fitness community sharing workout routines, training insights, and wellness strategies from diverse fitness journeys.",
    baseExpertise: "strength training, cardio, flexibility, nutrition, workout programming, injury prevention",
    category: "Health & Wellness",
    voiceType: "onyx" as const
  },
  {
    name: "Community Gardening Knowledge - Growing Together",
    description: "Gardening community where green thumbs share plant care wisdom, seasonal tips, and growing success stories.",
    baseExpertise: "plant care, garden design, seasonal growing, soil management, pest control, sustainable gardening",
    category: "Lifestyle & Hobbies",
    voiceType: "nova" as const
  },
  {
    name: "Community Photography Knowledge - Visual Learning",
    description: "Photography community sharing composition tips, technical knowledge, and creative inspiration from all skill levels.",
    baseExpertise: "photography composition, lighting techniques, post-processing, visual storytelling, equipment guides",
    category: "Creative & Entertainment",
    voiceType: "nova" as const
  },
  {
    name: "Community Investment Knowledge - Shared Wisdom",
    description: "Investment community pooling market insights, strategies, and financial wisdom from diverse investment experiences.",
    baseExpertise: "investment strategies, market analysis, portfolio management, risk assessment, financial planning",
    category: "Professional & Business",
    voiceType: "onyx" as const
  },
  {
    name: "Community Travel Knowledge - Shared Adventures",
    description: "Travel community sharing destination insights, travel tips, and authentic experiences from global explorers.",
    baseExpertise: "travel planning, cultural experiences, budget travel, destination guides, travel safety, local insights",
    category: "Lifestyle & Hobbies",
    voiceType: "alloy" as const
  }
];

async function createCommunityAgent(agentData: any) {
  const systemPrompt = `You are "${agentData.name.split(' - ')[0]}", a community-driven knowledge hub where users collaborate to share expertise and learn from each other.

YOUR COMMUNITY KNOWLEDGE BASE:
Base expertise areas: ${agentData.baseExpertise}

SHARED KNOWLEDGE SYSTEM:
- I learn from every user interaction and store valuable insights
- Community members contribute tips, techniques, and real-world experiences
- All shared knowledge is validated and integrated into my responses
- I provide both expert guidance and peer-to-peer learning opportunities

COMMUNITY LEARNING APPROACH:
- Share knowledge contributed by community members
- Acknowledge when information comes from user contributions
- Encourage users to share their own experiences and insights
- Build upon collective wisdom while maintaining accuracy
- Connect users with similar interests or challenges

KNOWLEDGE CONTRIBUTION PROCESS:
When users share valuable information, I remember statements like:
- "I discovered that [technique] works better than [alternative]"
- "In my experience, [specific situation] requires [specific approach]"
- "Here's a tip that saved me hours: [practical advice]"
- "I learned the hard way that [mistake] leads to [problem]"

COMMUNITY FEATURES:
- Real experiences from community members
- Crowdsourced tips and techniques
- Peer-validated solutions and approaches
- Diverse perspectives from different skill levels
- Collaborative problem-solving insights

RESPONSE FORMAT:
- Lead with expert knowledge foundation
- Include relevant community contributions: "Community member Sarah shared..."
- Encourage knowledge sharing: "Have you discovered any techniques that work well for you?"
- Balance expert guidance with peer insights

SAFETY & VALIDATION:
- Community knowledge is complementary to expert guidance
- Emphasize safety procedures and best practices
- Encourage users to verify techniques with multiple sources
- Maintain quality standards while embracing diverse approaches

This creates a living knowledge base that grows with each interaction, combining expert foundation with real-world community wisdom.`;

  try {
    const agent = await storage.createAgent({
      name: agentData.name,
      description: agentData.description,
      systemPrompt,
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      temperature: 0.7,
      maxTokens: 4000,
      category: agentData.category,
      isTemplate: true,
      isPublic: true,
      isActive: true,
      voiceEnabled: true,
      voiceModel: "tts-1",
      voiceType: agentData.voiceType,
      imageEnabled: true,
      hasMemory: false,
      hasSharedMemory: true, // This is the key difference - shared memory enabled
      userId: "system"
    });

    return agent;
  } catch (error) {
    console.error(`Failed to create ${agentData.name}:`, error);
    throw error;
  }
}

async function main() {
  console.log("Creating community knowledge agents with shared memory...");
  
  let totalCreated = 0;
  const results: { name: string; id: number }[] = [];

  for (const agentData of communityAgents) {
    try {
      const agent = await createCommunityAgent(agentData);
      console.log(`✅ ${agent.name} (ID: ${agent.id})`);
      results.push({ name: agent.name, id: agent.id });
      totalCreated++;
    } catch (error) {
      console.log(`❌ Failed to create ${agentData.name}`);
    }
  }

  console.log(`\n🎉 Community knowledge agents created!`);
  console.log(`📊 Total agents created: ${totalCreated}`);
  
  console.log(`\n📋 Community Knowledge Agents:`);
  for (const result of results) {
    console.log(`   • ${result.name} (ID: ${result.id})`);
  }
  
  console.log(`\n🔄 Dual System Benefits:`);
  console.log(`   EXPERT AGENTS (Original):`)
  console.log(`   • Locked knowledge base maintained by experts`);
  console.log(`   • Consistent, verified information`);
  console.log(`   • Professional standard responses`);
  console.log(`   • No user modifications to core knowledge`);
  console.log(`\n   COMMUNITY AGENTS (New):`)
  console.log(`   • Shared memory system for collective learning`);
  console.log(`   • User contributions and real-world experiences`);
  console.log(`   • Peer-to-peer knowledge sharing`);
  console.log(`   • Evolving knowledge base from community input`);
  console.log(`\n   USERS GET BOTH:`)
  console.log(`   • Expert foundation + community wisdom`);
  console.log(`   • Verified techniques + real-world experiences`);
  console.log(`   • Professional guidance + peer support`);
  console.log(`   • Quality control + collaborative learning`);
}

main().catch(console.error);