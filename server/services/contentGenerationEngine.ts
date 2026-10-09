import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ContentGenerationRequest {
  type: 'lessons' | 'vocabulary' | 'exercises' | 'conversations' | 'content';
  language?: string;
  count: number;
  parameters: {
    wordsPerLesson?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    topic?: string;
    style?: string;
    format?: string;
  };
  existingContent?: any;
  aiProvider: 'claude' | 'gpt4';
}

export interface GeneratedContent {
  type: string;
  content: any;
  metadata: {
    generatedCount: number;
    totalItems: number;
    aiProvider: string;
    generatedAt: Date;
  };
}

export class ContentGenerationEngine {
  
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    switch (request.type) {
      case 'lessons':
        return await this.generateLessons(request);
      case 'vocabulary':
        return await this.generateVocabulary(request);
      case 'exercises':
        return await this.generateExercises(request);
      case 'conversations':
        return await this.generateConversations(request);
      case 'content':
        return await this.generateGenericContent(request);
      default:
        throw new Error(`Unsupported content type: ${request.type}`);
    }
  }

  private async generateLessons(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { language = 'Spanish', count, parameters } = request;
    const { wordsPerLesson = 20, difficulty = 'beginner', topic } = parameters;

    const prompt = `Create ${count} ${language} language lessons for ${difficulty} level learners. Each lesson should:

1. Include exactly ${wordsPerLesson} vocabulary words with English translations
2. Have a clear theme or topic ${topic ? `focusing on: ${topic}` : ''}
3. Include example sentences using the vocabulary
4. Provide pronunciation guides for key words
5. Include a brief grammar explanation relevant to the vocabulary

Format as JSON array with this structure:
{
  "lessons": [
    {
      "lessonNumber": 1,
      "title": "Lesson Title",
      "topic": "Topic/Theme",
      "vocabulary": [
        {
          "word": "Spanish word",
          "translation": "English translation",
          "pronunciation": "phonetic guide",
          "partOfSpeech": "noun/verb/adjective/etc"
        }
      ],
      "exampleSentences": [
        {
          "spanish": "Example sentence",
          "english": "Translation"
        }
      ],
      "grammarNote": "Brief grammar explanation",
      "culturalNote": "Optional cultural context"
    }
  ]
}

Make sure each lesson is unique and builds vocabulary progressively.`;

    const result = await this.callAI(request.aiProvider, prompt);
    const lessons = JSON.parse(result);

    return {
      type: 'lessons',
      content: lessons,
      metadata: {
        generatedCount: lessons.lessons?.length || 0,
        totalItems: count,
        aiProvider: request.aiProvider,
        generatedAt: new Date()
      }
    };
  }

  private async generateVocabulary(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { language = 'Spanish', count, parameters } = request;
    const { difficulty = 'beginner', topic } = parameters;

    const prompt = `Generate ${count} ${language} vocabulary words for ${difficulty} level learners${topic ? ` on the topic of: ${topic}` : ''}.

For each word, provide:
1. The word in ${language}
2. English translation
3. Phonetic pronunciation guide
4. Part of speech
5. An example sentence in both languages
6. Any cultural or usage notes

Format as JSON array:
{
  "vocabulary": [
    {
      "word": "${language} word",
      "translation": "English translation",
      "pronunciation": "phonetic guide",
      "partOfSpeech": "noun/verb/adjective/etc",
      "example": {
        "target": "Example in ${language}",
        "english": "English translation"
      },
      "notes": "Usage or cultural notes"
    }
  ]
}`;

    const result = await this.callAI(request.aiProvider, prompt);
    const vocabulary = JSON.parse(result);

    return {
      type: 'vocabulary',
      content: vocabulary,
      metadata: {
        generatedCount: vocabulary.vocabulary?.length || 0,
        totalItems: count,
        aiProvider: request.aiProvider,
        generatedAt: new Date()
      }
    };
  }

  private async generateExercises(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { language = 'Spanish', count, parameters } = request;
    const { difficulty = 'beginner', existingContent } = request;

    const contextPrompt = existingContent 
      ? `Base exercises on this existing vocabulary: ${JSON.stringify(existingContent).substring(0, 500)}...`
      : `Create exercises for ${difficulty} level ${language} learners`;

    const prompt = `Create ${count} ${language} learning exercises. ${contextPrompt}

Include various exercise types:
1. Multiple choice questions
2. Fill-in-the-blank exercises
3. Translation exercises
4. Sentence construction
5. Listening comprehension (describe audio needed)

Format as JSON array:
{
  "exercises": [
    {
      "id": 1,
      "type": "multiple_choice|fill_blank|translation|construction|listening",
      "question": "Exercise question/prompt",
      "options": ["option1", "option2", "option3", "option4"], // for multiple choice
      "correctAnswer": "correct answer",
      "explanation": "Why this is correct",
      "difficulty": "beginner|intermediate|advanced",
      "skill": "vocabulary|grammar|listening|reading"
    }
  ]
}`;

    const result = await this.callAI(request.aiProvider, prompt);
    const exercises = JSON.parse(result);

    return {
      type: 'exercises',
      content: exercises,
      metadata: {
        generatedCount: exercises.exercises?.length || 0,
        totalItems: count,
        aiProvider: request.aiProvider,
        generatedAt: new Date()
      }
    };
  }

  private async generateConversations(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { language = 'Spanish', count, parameters } = request;
    const { difficulty = 'beginner', topic } = parameters;

    const prompt = `Create ${count} realistic ${language} conversations for ${difficulty} level learners${topic ? ` in the context of: ${topic}` : ''}.

Each conversation should:
1. Be appropriate for ${difficulty} level
2. Include natural, everyday expressions
3. Demonstrate proper grammar usage
4. Include cultural context when relevant

Format as JSON array:
{
  "conversations": [
    {
      "id": 1,
      "title": "Conversation title",
      "context": "Setting/situation description",
      "participants": ["Person A", "Person B"],
      "dialogue": [
        {
          "speaker": "Person A",
          "text": "${language} text",
          "translation": "English translation",
          "notes": "Optional cultural/grammar notes"
        }
      ],
      "vocabulary": ["key", "words", "used"],
      "learningPoints": ["grammar point 1", "cultural point 2"]
    }
  ]
}`;

    const result = await this.callAI(request.aiProvider, prompt);
    const conversations = JSON.parse(result);

    return {
      type: 'conversations',
      content: conversations,
      metadata: {
        generatedCount: conversations.conversations?.length || 0,
        totalItems: count,
        aiProvider: request.aiProvider,
        generatedAt: new Date()
      }
    };
  }

  private async generateGenericContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { count, parameters } = request;
    const { format, style, topic } = parameters;

    const prompt = `Generate ${count} pieces of content with the following specifications:
- Topic: ${topic || 'General content'}
- Style: ${style || 'Educational'}
- Format: ${format || 'Text-based'}

Create content that is:
1. High-quality and engaging
2. Appropriate for the specified style and format
3. Well-structured and informative
4. Ready to use in an AI agent context

Format as JSON array:
{
  "content": [
    {
      "id": 1,
      "title": "Content title",
      "body": "Main content body",
      "metadata": {
        "style": "${style}",
        "format": "${format}",
        "wordCount": 0,
        "readingLevel": "beginner|intermediate|advanced"
      }
    }
  ]
}`;

    const result = await this.callAI(request.aiProvider, prompt);
    const content = JSON.parse(result);

    return {
      type: 'content',
      content: content,
      metadata: {
        generatedCount: content.content?.length || 0,
        totalItems: count,
        aiProvider: request.aiProvider,
        generatedAt: new Date()
      }
    };
  }

  private async callAI(provider: 'claude' | 'gpt4', prompt: string): Promise<string> {
    try {
      switch (provider) {
        case 'claude':
          const claudeResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{ 
              role: 'user', 
              content: `You are an expert content generation AI specializing in educational materials. ${prompt}
              
              Important: Respond with valid JSON only. Do not include any explanatory text before or after the JSON.` 
            }]
          });
          return claudeResponse.content[0].text;

        case 'gpt4':
          const gptResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 4000,
            messages: [
              { 
                role: 'system', 
                content: 'You are an expert content generation AI specializing in educational materials. Always respond with valid JSON only.' 
              },
              { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
          });
          return gptResponse.choices[0].message.content || '{}';

        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`AI content generation failed with ${provider}:`, error);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  async validateContent(content: any, expectedType: string): Promise<boolean> {
    try {
      // Basic validation logic
      if (!content || typeof content !== 'object') {
        return false;
      }

      switch (expectedType) {
        case 'lessons':
          return Array.isArray(content.lessons) && content.lessons.length > 0;
        case 'vocabulary':
          return Array.isArray(content.vocabulary) && content.vocabulary.length > 0;
        case 'exercises':
          return Array.isArray(content.exercises) && content.exercises.length > 0;
        case 'conversations':
          return Array.isArray(content.conversations) && content.conversations.length > 0;
        case 'content':
          return Array.isArray(content.content) && content.content.length > 0;
        default:
          return true;
      }
    } catch {
      return false;
    }
  }
}

export const contentGenerationEngine = new ContentGenerationEngine();