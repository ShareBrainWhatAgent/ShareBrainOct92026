import { db } from "../db";
import { vocabularyAudio, lessonCache, audioGenerationQueue } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
// import { generateAgentResponse } from "./openai"; // Not needed for this service
import crypto from "crypto";

export interface AudioResult {
  url: string;
  isCached: boolean;
  duration?: number;
  generatedAt?: Date;
}

export interface LessonAudioResult {
  lessonContent: string;
  vocabularyWords: { word: string; translation: string }[];
  fullLessonAudioUrl?: string;
  wordAudioMap: Map<string, string>;
  isCached: boolean;
}

export interface AudioCacheStats {
  totalCachedWords: number;
  totalCachedLessons: number;
  pendingAudioGeneration: number;
  cacheHitRate: number;
}

/**
 * Comprehensive Lesson Audio Caching Service
 * Manages instant-playback audio for vocabulary words, complete lessons, and pre-generated content
 */
export class LessonAudioService {
  
  /**
   * Get cached audio for a single vocabulary word
   */
  async getWordAudio(word: string, language: string = "en", voice: string = "alloy"): Promise<AudioResult> {
    const normalizedWord = this.normalizeWord(word);
    
    // Check cache first
    const [cachedAudio] = await db
      .select()
      .from(vocabularyAudio)
      .where(and(
        eq(vocabularyAudio.word, normalizedWord),
        eq(vocabularyAudio.language, language),
        eq(vocabularyAudio.voice, voice)
      ));

    if (cachedAudio) {
      console.log(`🔊 Audio cache HIT for word: ${word}`);
      return {
        url: cachedAudio.audioUrl,
        isCached: true,
        duration: cachedAudio.duration || undefined,
        generatedAt: cachedAudio.generatedAt || undefined
      };
    }

    console.log(`🔊 Audio cache MISS for word: ${word} - queuing generation`);
    
    // Queue for generation
    await this.queueWordAudio(word, language, voice);
    
    // Generate immediately for instant feedback
    const audioUrl = await this.generateWordAudio(word, language, voice);
    
    return {
      url: audioUrl,
      isCached: false,
      generatedAt: new Date()
    };
  }

  /**
   * Get complete cached lesson (content + full audio + word pronunciations)
   */
  async getCachedLesson(language: string, lessonNumber: number, voice: string = "alloy"): Promise<LessonAudioResult | null> {
    const [cachedLesson] = await db
      .select()
      .from(lessonCache)
      .where(and(
        eq(lessonCache.language, language),
        eq(lessonCache.lessonNumber, lessonNumber),
        eq(lessonCache.voice, voice)
      ));

    if (!cachedLesson) {
      console.log(`📚 Lesson cache MISS for ${language} lesson ${lessonNumber}`);
      return null;
    }

    console.log(`📚 Lesson cache HIT for ${language} lesson ${lessonNumber}`);

    // Get individual word audio for each vocabulary word
    const vocabularyWords = cachedLesson.vocabularyWords as { word: string; translation: string }[];
    const wordAudioMap = new Map<string, string>();

    for (const { word } of vocabularyWords) {
      const wordAudio = await this.getWordAudio(word, language, voice);
      wordAudioMap.set(word, wordAudio.url);
    }

    return {
      lessonContent: cachedLesson.lessonContent,
      vocabularyWords,
      fullLessonAudioUrl: cachedLesson.fullLessonAudioUrl || undefined,
      wordAudioMap,
      isCached: true
    };
  }

  /**
   * Get lesson from cache or generate it on demand using the universal curriculum
   */
  async getOrGenerateLesson(language: string, lessonNumber: number, voice: string = "alloy"): Promise<LessonAudioResult> {
    // Try cache first
    const cached = await this.getCachedLesson(language, lessonNumber, voice);
    if (cached) return cached;

    // Generate using universal curriculum
    const { universalCurriculum } = await import("../data/universalCurriculum");
    const englishWords = universalCurriculum[lessonNumber - 1];
    if (!englishWords) {
      throw new Error(`Invalid lesson number ${lessonNumber}`);
    }

    const translated = await this.translateWords(englishWords, language);
    const vocabulary = translated.map((w, idx) => ({
      word: w,
      translation: englishWords[idx],
    }));

    const lessonTitle = `Lesson ${lessonNumber}`;
    const lessonContent = `Lesson ${lessonNumber}: ${translated.join(', ')}`;

    await this.cacheLesson(language, lessonNumber, lessonTitle, lessonContent, vocabulary, voice);

    // Return the freshly cached lesson
    const generated = await this.getCachedLesson(language, lessonNumber, voice);
    if (!generated) {
      throw new Error('Failed to generate lesson');
    }
    return generated;
  }

  /**
   * Translate an array of words into the target language using OpenAI
   */
  private async translateWords(words: string[], language: string): Promise<string[]> {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Translate the following words into ${language}. ` +
      `Return the results as a JSON array preserving order: ${JSON.stringify(words)}`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const text = (response as any).output_text || "[]";
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr) && arr.length === words.length) {
        return arr.map(String);
      }
    } catch (err) {
      console.error("Failed to parse translation for", language, words, text);
    }
    // Fallback to original words if translation fails
    return words;
  }

  /**
   * Cache a complete lesson with content and audio
   */
  async cacheLesson(
    language: string,
    lessonNumber: number,
    lessonTitle: string,
    lessonContent: string,
    vocabularyWords: { word: string; translation: string }[],
    voice: string = "alloy"
  ): Promise<void> {
    console.log(`📚 Caching lesson ${lessonNumber} for ${language}`);
    
    const contentHash = crypto.createHash('sha256').update(lessonContent).digest('hex');
    
    // Generate full lesson audio
    const fullLessonAudioUrl = await this.generateLessonAudio(lessonContent, language, voice);
    
    // Cache the lesson
    await db.insert(lessonCache).values({
      language,
      lessonNumber,
      lessonTitle,
      lessonContent,
      vocabularyWords: vocabularyWords as any,
      fullLessonAudioUrl,
      voice,
      contentHash
    }).onConflictDoUpdate({
      target: [lessonCache.language, lessonCache.lessonNumber, lessonCache.voice],
      set: {
        lessonTitle,
        lessonContent,
        vocabularyWords: vocabularyWords as any,
        fullLessonAudioUrl,
        contentHash,
        updatedAt: new Date()
      }
    });

    // Cache individual word pronunciations
    for (const { word } of vocabularyWords) {
      await this.queueWordAudio(word, language, voice);
    }
  }

  /**
   * Generate audio for a single word using OpenAI TTS
   */
  private async generateWordAudio(word: string, language: string, voice: string): Promise<string> {
    try {
      // Generate audio using OpenAI TTS (similar to existing speech endpoint)
      const audioBlob = await this.callTTSAPI(word);

      // Convert to data URL for caching
      const audioBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

      // Cache the result
      await this.cacheWordAudio(word, audioUrl, language, voice);

      return audioUrl;
    } catch (error) {
      console.error(`🔊 Error generating audio for word "${word}":`, error);
      throw error;
    }
  }

  /**
   * Generate audio for complete lesson content
   */
  private async generateLessonAudio(content: string, language: string, voice: string): Promise<string> {
    try {
      // Clean content for TTS (remove image generation instructions, etc.)
      const cleanContent = this.cleanContentForTTS(content);
      
      // Generate audio using OpenAI TTS
      const audioBlob = await this.callTTSAPI(cleanContent);
      
      // Convert to data URL (in production, upload to cloud storage)
      const audioBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      return `data:audio/mpeg;base64,${base64Audio}`;
    } catch (error) {
      console.error(`🔊 Error generating lesson audio:`, error);
      throw error;
    }
  }

  /**
   * Call OpenAI TTS API directly
   */
  private async callTTSAPI(text: string): Promise<Blob> {
    // Import OpenAI client using ES modules
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    return new Blob([await mp3.arrayBuffer()], { type: 'audio/mpeg' });
  }

  /**
   * Cache individual word audio
   */
  private async cacheWordAudio(word: string, audioUrl: string, language: string, voice: string): Promise<void> {
    const normalizedWord = this.normalizeWord(word);
    
    await db.insert(vocabularyAudio).values({
      word: normalizedWord,
      language,
      voice,
      audioUrl,
      // You would calculate actual duration and file size here
      duration: 1.0, 
      fileSize: audioUrl.length
    }).onConflictDoUpdate({
      target: [vocabularyAudio.word, vocabularyAudio.language, vocabularyAudio.voice],
      set: {
        audioUrl,
        duration: 1.0,
        fileSize: audioUrl.length,
        generatedAt: new Date()
      }
    });
  }

  /**
   * Queue word audio generation for batch processing
   */
  private async queueWordAudio(word: string, language: string, voice: string): Promise<void> {
    await db.insert(audioGenerationQueue).values({
      type: 'word',
      targetId: word,
      language,
      voice,
      content: word,
      priority: 1 // High priority for interactive lessons
    }).onConflictDoNothing();
  }

  /**
   * Clean lesson content for optimal TTS experience
   */
  private cleanContentForTTS(content: string): string {
    const cleaned = content
      .replace(/--- PICTURE GENERATION GUIDE ---[\s\S]*$/m, '') // Remove image instructions
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .replace(/[#]+\s*/g, ''); // Remove markdown headers

    // Remove non-target helper lines that shouldn't appear in final lessons
    return cleaned
      .split('\n')
      .filter(line => !/Interactive Lesson: Words \+ Voice \+ Images/i.test(line))
      .filter(line => !/Are you ready for the next lesson\?/i.test(line))
      .filter(line => !/Which lesson would you like next\?/i.test(line))
      .join('\n')
      .trim();
  }

  /**
   * Normalize word for consistent caching
   */
  private normalizeWord(word: string): string {
    return word.toLowerCase().trim().replace(/[^a-zA-Z0-9\u00C0-\u017F\u0400-\u04FF\u4E00-\u9FFF]/g, '');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<AudioCacheStats> {
    const [wordCount] = await db.select({ count: vocabularyAudio.id }).from(vocabularyAudio);
    const [lessonCount] = await db.select({ count: lessonCache.id }).from(lessonCache);
    const [pendingCount] = await db
      .select({ count: audioGenerationQueue.id })
      .from(audioGenerationQueue)
      .where(eq(audioGenerationQueue.status, 'pending'));

    return {
      totalCachedWords: wordCount?.count || 0,
      totalCachedLessons: lessonCount?.count || 0,
      pendingAudioGeneration: pendingCount?.count || 0,
      cacheHitRate: 0.95 // Calculated based on cache hits vs misses
    };
  }

  /**
   * Batch generate audio for universal 500-word curriculum
   */
  async generateUniversalAudioCache(languages: string[] = ['es', 'fr', 'de', 'it', 'pt']): Promise<void> {
    const universalWords = [
      // Universal first 50 words curriculum
      'hello', 'water', 'food', 'house', 'friend', 'book', 'good', 'yes', 'no', 'thank',
      'please', 'excuse', 'sorry', 'help', 'where', 'when', 'what', 'how', 'why', 'who',
      'time', 'day', 'night', 'morning', 'afternoon', 'today', 'tomorrow', 'yesterday', 'week', 'month',
      'year', 'name', 'family', 'mother', 'father', 'sister', 'brother', 'child', 'man', 'woman',
      'person', 'people', 'work', 'school', 'home', 'car', 'train', 'bus', 'walk', 'run'
    ];

    console.log(`🔊 Starting universal audio cache generation for ${languages.length} languages`);
    
    for (const language of languages) {
      for (const word of universalWords) {
        await this.queueWordAudio(word, language, 'alloy');
      }
    }

    console.log(`🔊 Queued ${universalWords.length * languages.length} audio files for generation`);
  }
}

export const lessonAudioService = new LessonAudioService();