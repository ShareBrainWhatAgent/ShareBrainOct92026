import { db } from "../db";
import { vocabularyImages, vocabularyGenerationQueue } from "@shared/schema";
import { universalCurriculum } from "../data/universalCurriculum";
import { eq, and, desc, asc } from "drizzle-orm";
import { generateAgentResponse } from "./openai";

export interface VocabularyImageResult {
  url: string;
  isCached: boolean;
  generatedAt?: Date;
}

export interface CacheStats {
  totalCachedWords: number;
  pendingGeneration: number;
  failedGeneration: number;
  cacheHitRate: number;
}

/**
 * Vocabulary Image Caching Service
 * Manages intelligent caching of vocabulary word images for language learning
 */
export class VocabularyImageService {
  
  /**
   * Get image for a word - checks cache first, generates if needed
   */
  async getWordImage(word: string, agentId?: number): Promise<VocabularyImageResult> {
    const normalizedWord = this.normalizeWord(word);
    
    // Check cache first
    const cachedImage = await this.getCachedImage(normalizedWord);
    if (cachedImage) {
      console.log(`📸 Cache HIT for word: ${word}`);
      return {
        url: cachedImage.imageUrl,
        isCached: true,
        generatedAt: cachedImage.createdAt || undefined
      };
    }
    
    console.log(`📸 Cache MISS for word: ${word} - generating new image`);
    
    // Generate new image
    const imageUrl = await this.generateWordImage(word, agentId);
    
    // Cache the result
    await this.cacheWordImage(word, imageUrl);
    
    return {
      url: imageUrl,
      isCached: false,
      generatedAt: new Date()
    };
  }
  
  /**
   * Get multiple word images efficiently
   */
  async getMultipleWordImages(words: string[], agentId?: number): Promise<Map<string, VocabularyImageResult>> {
    const results = new Map<string, VocabularyImageResult>();
    const uncachedWords: string[] = [];
    
    // Check cache for all words
    for (const word of words) {
      const normalizedWord = this.normalizeWord(word);
      const cachedImage = await this.getCachedImage(normalizedWord);
      
      if (cachedImage) {
        results.set(word, {
          url: cachedImage.imageUrl,
          isCached: true,
          generatedAt: cachedImage.createdAt || undefined
        });
      } else {
        uncachedWords.push(word);
      }
    }
    
    // Generate missing images in parallel (but limit concurrency)
    const batchSize = 3; // Limit concurrent generations
    for (let i = 0; i < uncachedWords.length; i += batchSize) {
      const batch = uncachedWords.slice(i, i + batchSize);
      const promises = batch.map(async (word) => {
        try {
          const imageUrl = await this.generateWordImage(word, agentId);
          await this.cacheWordImage(word, imageUrl);
          results.set(word, {
            url: imageUrl,
            isCached: false,
            generatedAt: new Date()
          });
        } catch (error) {
          console.error(`Failed to generate image for word: ${word}`, error);
          // Use fallback image or placeholder
          results.set(word, {
            url: this.getFallbackImageUrl(word),
            isCached: false,
            generatedAt: new Date()
          });
        }
      });
      
      await Promise.all(promises);
    }
    
    return results;
  }
  
  /**
   * Pre-populate cache with universal curriculum words
   */
  async prePopulateUniversalCurriculum(): Promise<void> {
    // Universal curriculum shared across all languages
    const universalWords = universalCurriculum;
    
    console.log(`🚀 Pre-populating ${universalWords.length} universal curriculum words...`);
    
    // Add words to generation queue
    for (let lessonIndex = 0; lessonIndex < universalWords.length; lessonIndex++) {
      const lesson = universalWords[lessonIndex];
      for (let wordIndex = 0; wordIndex < lesson.length; wordIndex++) {
        const word = lesson[wordIndex];
        await this.addToGenerationQueue(word, lessonIndex + 1, wordIndex + 1);
      }
    }
    
    console.log(`✅ Added ${universalWords.flat().length} words to generation queue`);
  }
  
  /**
   * Process generation queue (background job)
   */
  async processGenerationQueue(batchSize: number = 10): Promise<void> {
    const pendingItems = await db
      .select()
      .from(vocabularyGenerationQueue)
      .where(eq(vocabularyGenerationQueue.status, "pending"))
      .orderBy(desc(vocabularyGenerationQueue.priority), asc(vocabularyGenerationQueue.createdAt))
      .limit(batchSize);
    
    console.log(`🔄 Processing ${pendingItems.length} items from generation queue`);
    
    for (const item of pendingItems) {
      try {
        // Mark as processing
        await db
          .update(vocabularyGenerationQueue)
          .set({ 
            status: "processing", 
            attempts: item.attempts + 1,
            processedAt: new Date()
          })
          .where(eq(vocabularyGenerationQueue.id, item.id));
        
        // Generate image
        const imageUrl = await this.generateWordImage(item.word);
        
        // Cache the result
        await this.cacheWordImage(item.word, imageUrl);
        
        // Mark as completed
        await db
          .update(vocabularyGenerationQueue)
          .set({ status: "completed" })
          .where(eq(vocabularyGenerationQueue.id, item.id));
        
        console.log(`✅ Generated and cached image for: ${item.word}`);
        
      } catch (error) {
        console.error(`❌ Failed to generate image for: ${item.word}`, error);
        
        // Mark as failed or retry
        const shouldRetry = item.attempts < item.maxAttempts;
        await db
          .update(vocabularyGenerationQueue)
          .set({ 
            status: shouldRetry ? "pending" : "failed",
            error: error instanceof Error ? error.message : "Unknown error"
          })
          .where(eq(vocabularyGenerationQueue.id, item.id));
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const [totalCached] = await db.$count(vocabularyImages);
    const [pendingQueue] = await db.$count(vocabularyGenerationQueue, eq(vocabularyGenerationQueue.status, "pending"));
    const [failedQueue] = await db.$count(vocabularyGenerationQueue, eq(vocabularyGenerationQueue.status, "failed"));
    
    const universalWordsCount = universalCurriculum.flat().length;
    const cacheHitRate = totalCached > 0 ? (totalCached / universalWordsCount) * 100 : 0;
    
    return {
      totalCachedWords: totalCached,
      pendingGeneration: pendingQueue,
      failedGeneration: failedQueue,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    };
  }
  
  /**
   * Clear cache (admin function)
   */
  async clearCache(): Promise<void> {
    await db.delete(vocabularyImages);
    await db.delete(vocabularyGenerationQueue);
    console.log("🗑️ Vocabulary image cache cleared");
  }
  
  // Private helper methods
  
  private normalizeWord(word: string): string {
    return word.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }
  
  private async getCachedImage(normalizedWord: string) {
    const [result] = await db
      .select()
      .from(vocabularyImages)
      .where(eq(vocabularyImages.normalizedWord, normalizedWord))
      .limit(1);
    
    return result;
  }
  
  private async generateWordImage(word: string, agentId?: number): Promise<string> {
    const prompt = `${word} - simple, clear illustration on white background, educational, child-friendly`;
    
    const response = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt, 
        agentId: agentId || 0
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.url;
  }
  
  private async cacheWordImage(word: string, imageUrl: string): Promise<void> {
    const normalizedWord = this.normalizeWord(word);
    const prompt = `${word} - simple, clear illustration on white background, educational, child-friendly`;
    
    await db
      .insert(vocabularyImages)
      .values({
        word,
        normalizedWord,
        imageUrl,
        promptUsed: prompt,
        generationStatus: "completed",
        generationAttempts: 1
      })
      .onConflictDoUpdate({
        target: vocabularyImages.word,
        set: {
          imageUrl,
          promptUsed: prompt,
          generationStatus: "completed",
          updatedAt: new Date()
        }
      });
  }
  
  private async addToGenerationQueue(word: string, lessonNumber: number, wordPosition: number): Promise<void> {
    const normalizedWord = this.normalizeWord(word);
    
    // Check if word already exists in cache
    const existing = await this.getCachedImage(normalizedWord);
    if (existing) {
      return; // Skip if already cached
    }
    
    // Check if already in queue
    const [inQueue] = await db
      .select()
      .from(vocabularyGenerationQueue)
      .where(eq(vocabularyGenerationQueue.word, normalizedWord))
      .limit(1);
    
    if (inQueue) {
      return; // Skip if already queued
    }
    
    await db
      .insert(vocabularyGenerationQueue)
      .values({
        word: normalizedWord,
        priority: 100 - lessonNumber, // Earlier lessons have higher priority
        status: "pending"
      });
  }
  
  private getFallbackImageUrl(word: string): string {
    // Return a placeholder image URL
    return `https://via.placeholder.com/300x300/4a90e2/ffffff?text=${encodeURIComponent(word)}`;
  }
  
  // Removed legacy curriculum stub in favor of shared data import
}

// Export singleton instance
export const vocabularyImageService = new VocabularyImageService();