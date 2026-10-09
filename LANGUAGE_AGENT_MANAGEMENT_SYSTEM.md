# Language Agent Management System

## Overview
This document establishes the formal procedures and safeguards for managing the 100+ language teaching agents across the ShareBrain platform to ensure consistency, reliability, and proper functionality.

## Core Principles

### 1. Single Source of Truth
- **PRIMARY SCRIPT**: `server/scripts/implementStructuredLessonPlans.ts`
- **RULE**: ALL language teaching agent modifications MUST go through this script
- **PROHIBITION**: Never modify individual language agents directly in the database or through other scripts

### 2. Universal Consistency
- All 100 language agents follow the EXACT same 500-word curriculum
- All agents use identical lesson navigation system
- All agents maintain consistent TTS optimization
- All agents use the same structured lesson plan format

### 3. Comprehensive System Architecture
The language teaching system consists of these interconnected components:

#### A. Core Script Components
- **Universal Curriculum**: 500-word vocabulary in 50 lessons of 10 words each
- **Lesson Navigation**: Commands for jumping between lessons 1-50
- **TTS Optimization**: Formatting rules for text-to-speech readability
- **Cultural Context**: Language-specific cultural insights and explanations

#### B. System Features
- **Structured Progression**: Each lesson builds on previous vocabulary
- **Spaced Repetition**: New sentences incorporate previous words
- **Intelligent Translation**: AI translates universal English curriculum to target language
- **Model Consistency**: All agents use Llama 3.1 70B Versatile

## Mandatory Procedures

### When Making ANY Language Agent Changes

#### Step 1: Identify Change Scope
Before making any changes, determine:
- [ ] Does this affect the curriculum structure?
- [ ] Does this affect lesson navigation?
- [ ] Does this affect TTS formatting?
- [ ] Does this affect cultural context instructions?
- [ ] Does this affect model or technical specifications?

#### Step 2: Gather Required Resources
Always reference these files when making language agent changes:
- [ ] `server/scripts/implementStructuredLessonPlans.ts` (PRIMARY SCRIPT)
- [ ] `server/data/topLanguages.ts` (Language list)
- [ ] `TTS_LANGUAGE_LEARNING_GUIDE.md` (Usage documentation)
- [ ] `AGENT_MANUAL.md` (Agent specifications)
- [ ] `replit.md` (Recent changes history)

#### Step 3: Modification Process
1. **ALWAYS** modify the `implementStructuredLessonPlans.ts` script first
2. **NEVER** modify individual agents directly
3. Test changes in the script before applying to all agents
4. Run the script to update all 100 agents simultaneously
5. Verify changes applied correctly to sample agents

#### Step 4: Verification Protocol
After running the script:
- [ ] Check 3-5 random language agents for proper system prompt updates
- [ ] Verify curriculum structure remains intact
- [ ] Confirm lesson navigation commands are preserved
- [ ] Test TTS formatting compliance
- [ ] Validate model consistency (Llama 3.1 70B Versatile)

#### Step 5: Documentation Update
- [ ] Update `TTS_LANGUAGE_LEARNING_GUIDE.md` if user-facing features changed
- [ ] Update `AGENT_MANUAL.md` if technical specifications changed
- [ ] Update `replit.md` with change summary and date
- [ ] Update this document if procedures changed

## Protected System Components

### DO NOT MODIFY DIRECTLY
These components should ONLY be modified through the primary script:
- Individual language agent system prompts
- Agent curriculum structure
- Lesson navigation commands
- TTS formatting rules
- Cultural context instructions

### SAFE TO MODIFY INDEPENDENTLY
These components can be modified without affecting language agents:
- User interface elements
- Chat interface functionality
- Database schema (non-agent tables)
- Frontend routing and navigation
- General platform features

## Emergency Procedures

### If Language Agents Are Broken
1. **STOP**: Do not modify individual agents
2. **DIAGNOSE**: Check the last modification to `implementStructuredLessonPlans.ts`
3. **REVERT**: Restore the script to last known working version
4. **REAPPLY**: Run the script to restore all 100 agents
5. **VERIFY**: Test multiple agents to confirm restoration

### If Changes Need to be Rolled Back
1. Use Git to revert `implementStructuredLessonPlans.ts` to previous version
2. Run the reverted script to restore all agents
3. Document the rollback in `replit.md`
4. Investigate and fix the issue before attempting changes again

## Quality Assurance Checklist

Before deploying ANY language agent changes:
- [ ] All 100 agents updated through primary script
- [ ] Universal curriculum maintained across all languages
- [ ] Lesson navigation system functional
- [ ] TTS formatting optimized
- [ ] Cultural context preserved
- [ ] Model consistency maintained (Llama 3.1 70B Versatile)
- [ ] No English words appearing in target language responses
- [ ] Vocabulary and sentences provided only in the target language unless translations are requested
- [ ] Documentation updated
- [ ] Changes logged in `replit.md`

## Automation Safeguards

### Script Safety Features
The primary script includes these safeguards:
- Finds existing agents by name to prevent duplicates
- Updates only language teaching agents (not other agent types)
- Applies changes consistently across all 100 agents
- Logs all updates for verification

### Database Integrity
- Language agents are stored with `user_id = 'demo-user'`
- All agents maintain consistent naming convention: "[Language] Language Tutor"
- System preserves agent IDs and other metadata during updates

## Future Enhancements

### Planned Improvements
- Automated testing system for language agent functionality
- Version control for curriculum changes
- Performance monitoring for lesson navigation
- User feedback integration system

### Expansion Considerations
- Additional language support through `topLanguages.ts`
- Advanced lesson structures for specialized topics
- Integration with external language learning APIs
- Multi-modal learning enhancements

## Contact and Support

### For Language Agent Issues
1. Reference this document first
2. Check `replit.md` for recent changes
3. Review `implementStructuredLessonPlans.ts` for current configuration
4. Follow the mandatory procedures outlined above

### Development Team Notes
- This system manages 100+ agents across multiple languages
- Changes affect thousands of potential user interactions
- Consistency is critical for user experience
- Always test changes thoroughly before deployment

---

**REMEMBER**: The language teaching system is a complex, interconnected architecture. ANY changes to language agents must follow these procedures to maintain system integrity and user experience quality.