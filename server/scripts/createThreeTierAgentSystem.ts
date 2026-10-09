import { storage } from "../storage";

// Three-tier agent system implementation
const threeTierAgents = [
  {
    name: "Spanish Learning - Private Study",
    description: "Personal Spanish tutor that adapts to your individual learning style, pace, and goals with private progress tracking.",
    baseExpertise: "Spanish grammar, vocabulary, pronunciation, conversation practice, cultural context, personal progress tracking",
    category: "Language Learning",
    voiceType: "nova" as const,
    tier: "private",
    accessLevel: "owner_only"
  },
  {
    name: "Spanish Learning - Study Group",
    description: "Collaborative Spanish learning agent for friend groups studying together, sharing vocabulary lists and practice exercises.",
    baseExpertise: "Spanish grammar, vocabulary, pronunciation, conversation practice, cultural context, group learning activities",
    category: "Language Learning", 
    voiceType: "nova" as const,
    tier: "friends",
    accessLevel: "friends_circle"
  },
  {
    name: "Spanish Learning - Community Hub",
    description: "Global Spanish learning community where learners worldwide share tips, resources, and cultural insights.",
    baseExpertise: "Spanish grammar, vocabulary, pronunciation, conversation practice, cultural context, community resources",
    category: "Language Learning",
    voiceType: "nova" as const,
    tier: "global",
    accessLevel: "all_users"
  },
  {
    name: "Python Coding - Personal Mentor",
    description: "Private Python tutor that tracks your coding journey, remembers your projects, and adapts to your learning style.",
    baseExpertise: "Python fundamentals, web development, data science, project guidance, personal coding journey",
    category: "Programming",
    voiceType: "alloy" as const,
    tier: "private",
    accessLevel: "owner_only"
  },
  {
    name: "Python Coding - Team Collaboration",
    description: "Python agent for development teams and coding friends to share solutions, best practices, and project insights.",
    baseExpertise: "Python fundamentals, web development, data science, team collaboration, code review, project management",
    category: "Programming",
    voiceType: "alloy" as const,
    tier: "friends",
    accessLevel: "friends_circle"
  },
  {
    name: "Python Coding - Developer Community",
    description: "Global Python community hub where developers share solutions, libraries, and collective programming wisdom.",
    baseExpertise: "Python fundamentals, web development, data science, open source projects, community solutions",
    category: "Programming",
    voiceType: "alloy" as const,
    tier: "global",
    accessLevel: "all_users"
  },
  {
    name: "Fitness Journey - Personal Trainer",
    description: "Private fitness coach that remembers your goals, tracks progress, and adapts workouts to your personal journey.",
    baseExpertise: "strength training, cardio, nutrition, personal goals, progress tracking, workout customization",
    category: "Health & Fitness",
    voiceType: "onyx" as const,
    tier: "private",
    accessLevel: "owner_only"
  },
  {
    name: "Fitness Journey - Workout Buddies",
    description: "Fitness agent for workout partners and fitness friends to share routines, motivation, and progress together.",
    baseExpertise: "strength training, cardio, nutrition, group workouts, motivation, shared challenges",
    category: "Health & Fitness",
    voiceType: "onyx" as const,
    tier: "friends",
    accessLevel: "friends_circle"
  },
  {
    name: "Fitness Journey - Global Community",
    description: "Worldwide fitness community sharing workout routines, nutrition tips, and fitness success stories.",
    baseExpertise: "strength training, cardio, nutrition, community challenges, success stories, global fitness trends",
    category: "Health & Fitness",
    voiceType: "onyx" as const,
    tier: "global",
    accessLevel: "all_users"
  }
];

function generateSystemPrompt(agentData: any) {
  const basePrompt = `You are "${agentData.name}", a specialized ${agentData.description.toLowerCase()}

YOUR EXPERTISE AREAS:
${agentData.baseExpertise.split(', ').map((skill: string) => `• ${skill.charAt(0).toUpperCase() + skill.slice(1)}`).join('\n')}

MEMORY & LEARNING SYSTEM:
${getMemorySystemPrompt(agentData.tier, agentData.accessLevel)}

TEACHING APPROACH:
- Provide expert guidance tailored to your access level
- Use practical examples and actionable advice
- Encourage skill development and knowledge sharing
- Build upon collective knowledge when appropriate

TTS-FRIENDLY COMMUNICATION:
- Use natural speech patterns
- Pronounce technical terms clearly
- Maintain conversational flow

VISUAL LEARNING:
When discussing concepts, provide image descriptions:
- Format: "CONCEPT - [detailed visual description]"
- Focus on practical demonstrations and examples

SAFETY & BEST PRACTICES:
- Always emphasize safety procedures
- Recommend proper techniques and equipment
- Maintain quality standards regardless of access level

${getAccessLevelGuidance(agentData.tier, agentData.accessLevel)}`;

  return basePrompt;
}

function getMemorySystemPrompt(tier: string, accessLevel: string) {
  switch (tier) {
    case "private":
      return `- I remember only YOUR personal information and progress
- Your data is completely private and secure
- I adapt specifically to your learning style and goals
- Only you can add information to my memory
- I provide personalized guidance based on your unique journey`;
    
    case "friends":
      return `- I remember information shared by you and your friends
- Knowledge is shared within your friend circle only
- Friends can contribute tips, resources, and experiences
- I help coordinate group learning and collaboration
- Privacy is maintained within your trusted friend group`;
    
    case "global":
      return `- I learn from the entire user community
- All users can contribute knowledge and experiences
- I provide insights from global collective wisdom
- Community contributions are validated and integrated
- I connect you with the broader learning community`;
    
    default:
      return "- I provide expert guidance with appropriate memory capabilities";
  }
}

function getAccessLevelGuidance(tier: string, accessLevel: string) {
  switch (tier) {
    case "private":
      return `PRIVATE ACCESS FEATURES:
- Complete privacy and personalization
- Your progress and preferences are secure
- Tailored recommendations based on your history
- No information sharing with other users
- Maximum personalization and adaptation`;
    
    case "friends":
      return `FRIENDS CIRCLE FEATURES:
- Collaborative learning with trusted friends
- Share resources and tips within your group
- Group challenges and shared goals
- Coordinate learning activities together
- Balanced privacy and collaboration`;
    
    case "global":
      return `GLOBAL COMMUNITY FEATURES:
- Access to worldwide collective knowledge
- Contribute to and learn from the global community
- Discover diverse perspectives and approaches
- Connect with learners worldwide
- Participate in community-driven learning`;
    
    default:
      return "- Appropriate access level guidance provided";
  }
}

function getMemorySettings(tier: string) {
  switch (tier) {
    case "private":
      return { hasMemory: true, hasSharedMemory: false, isPrivate: true };
    case "friends":
      return { hasMemory: true, hasSharedMemory: true, isPrivate: false }; // Friends memory system
    case "global":
      return { hasMemory: false, hasSharedMemory: true, isPrivate: false };
    default:
      return { hasMemory: false, hasSharedMemory: false, isPrivate: true };
  }
}

async function createThreeTierAgent(agentData: any) {
  const systemPrompt = generateSystemPrompt(agentData);
  const memorySettings = getMemorySettings(agentData.tier);

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
      isPublic: !memorySettings.isPrivate,
      isActive: true,
      voiceEnabled: true,
      voiceModel: "tts-1",
      voiceType: agentData.voiceType,
      imageEnabled: true,
      hasMemory: memorySettings.hasMemory,
      hasSharedMemory: memorySettings.hasSharedMemory,
      userId: "system"
    });

    return agent;
  } catch (error) {
    console.error(`Failed to create ${agentData.name}:`, error);
    throw error;
  }
}

async function main() {
  console.log("Creating three-tier agent system...");
  
  const results = {
    private: [] as any[],
    friends: [] as any[],
    global: [] as any[]
  };

  for (const agentData of threeTierAgents) {
    try {
      const agent = await createThreeTierAgent(agentData);
      console.log(`✅ ${agent.name} (ID: ${agent.id}) [${agentData.tier.toUpperCase()}]`);
      results[agentData.tier as keyof typeof results].push(agent);
    } catch (error) {
      console.log(`❌ Failed to create ${agentData.name}`);
    }
  }

  console.log(`\n🎉 Three-tier agent system created!`);
  console.log(`📊 Total agents created: ${Object.values(results).flat().length}`);
  
  console.log(`\n🔒 TIER 1 - PRIVATE AGENTS (${results.private.length}):`);
  console.log(`   • Owner-only access and modifications`);
  console.log(`   • Complete privacy and personalization`);
  console.log(`   • Personal memory system`);
  for (const agent of results.private) {
    console.log(`     → ${agent.name} (ID: ${agent.id})`);
  }
  
  console.log(`\n👥 TIER 2 - FRIENDS CIRCLE AGENTS (${results.friends.length}):`);
  console.log(`   • Friend group can contribute and access`);
  console.log(`   • Collaborative learning within trusted circle`);
  console.log(`   • Friends memory system`);
  for (const agent of results.friends) {
    console.log(`     → ${agent.name} (ID: ${agent.id})`);
  }
  
  console.log(`\n🌍 TIER 3 - GLOBAL COMMUNITY AGENTS (${results.global.length}):`);
  console.log(`   • Entire userbase can contribute`);
  console.log(`   • Global collective knowledge`);
  console.log(`   • Shared memory system`);
  for (const agent of results.global) {
    console.log(`     → ${agent.name} (ID: ${agent.id})`);
  }

  console.log(`\n🎯 PERFECT USE CASES:`);
  console.log(`   SPANISH STUDY GROUP:`);
  console.log(`   • Private: Personal vocabulary and grammar weak spots`);
  console.log(`   • Friends: Shared vocabulary lists and group practice`);
  console.log(`   • Global: Cultural insights from native speakers worldwide`);
  console.log(`\n   CODING TEAM:`);
  console.log(`   • Private: Personal coding journey and project notes`);
  console.log(`   • Friends: Team coding standards and shared solutions`);
  console.log(`   • Global: Open source community knowledge and libraries`);
  console.log(`\n   FITNESS BUDDIES:`);
  console.log(`   • Private: Personal health data and workout preferences`);
  console.log(`   • Friends: Shared workout routines and motivation`);
  console.log(`   • Global: Community challenges and success stories`);
}

main().catch(console.error);