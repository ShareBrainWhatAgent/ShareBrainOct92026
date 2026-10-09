#!/usr/bin/env tsx

/**
 * Universal Vocabulary Image Generation Script
 * 
 * This script generates and caches images for all 500 universal curriculum words
 * used by language teaching agents. It prevents duplicate generations and ensures
 * consistent visual vocabulary across all 100+ language agents.
 * 
 * Usage: npm run generate-vocabulary-images
 */

import { VocabularyImageService } from '../services/vocabularyImageService.js';
import { db } from '../db.js';
import { vocabularyImages, vocabularyGenerationQueue } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

// Universal 500-word curriculum used by all language teaching agents
// This is the same vocabulary progression used across all languages
const UNIVERSAL_VOCABULARY = [
  // Lesson 1 (Words 1-10): Basic Survival
  'hello', 'water', 'food', 'house', 'friend',
  'book', 'good', 'yes', 'no', 'thank you',
  
  // Lesson 2 (Words 11-20): Essential Daily Life
  'eat', 'drink', 'sleep', 'work', 'home',
  'family', 'love', 'happy', 'sad', 'big',
  
  // Lesson 3 (Words 21-30): Basic Communication
  'small', 'hot', 'cold', 'new', 'old',
  'come', 'go', 'see', 'hear', 'speak',
  
  // Lesson 4 (Words 31-40): Numbers and Time
  'one', 'two', 'three', 'four', 'five',
  'today', 'tomorrow', 'yesterday', 'morning', 'night',
  
  // Lesson 5 (Words 41-50): Colors and Basic Adjectives
  'red', 'blue', 'green', 'white', 'black',
  'beautiful', 'ugly', 'fast', 'slow', 'strong',
  
  // Continue with remaining 450 words...
  // Lesson 6-10: Body parts, clothing, transportation
  'head', 'hand', 'foot', 'eye', 'mouth',
  'shirt', 'pants', 'shoes', 'hat', 'dress',
  'car', 'bus', 'train', 'plane', 'bicycle',
  'walk', 'run', 'drive', 'fly', 'stop',
  
  // Lesson 11-15: Food and dining
  'rice', 'bread', 'meat', 'fish', 'fruit',
  'vegetable', 'milk', 'tea', 'coffee', 'sugar',
  'salt', 'pepper', 'sweet', 'sour', 'bitter',
  'restaurant', 'kitchen', 'plate', 'cup', 'spoon',
  
  // Lesson 16-20: Weather and nature
  'sun', 'moon', 'star', 'sky', 'cloud',
  'rain', 'snow', 'wind', 'storm', 'rainbow',
  'tree', 'flower', 'grass', 'mountain', 'river',
  'ocean', 'beach', 'forest', 'animal', 'bird',
  
  // Lesson 21-25: Shopping and money
  'money', 'buy', 'sell', 'price', 'cheap',
  'expensive', 'store', 'market', 'bank', 'credit',
  'cash', 'change', 'receipt', 'bag', 'box',
  'gift', 'present', 'birthday', 'party', 'celebration',
  
  // Lesson 26-30: Health and body
  'doctor', 'hospital', 'medicine', 'sick', 'healthy',
  'pain', 'hurt', 'fever', 'cold', 'cough',
  'tired', 'energy', 'exercise', 'sports', 'game',
  'win', 'lose', 'play', 'fun', 'enjoy',
  
  // Lesson 31-35: Education and learning
  'school', 'teacher', 'student', 'learn', 'study',
  'read', 'write', 'listen', 'understand', 'know',
  'think', 'remember', 'forget', 'question', 'answer',
  'test', 'exam', 'grade', 'homework', 'lesson',
  
  // Lesson 36-40: Technology and communication
  'computer', 'phone', 'internet', 'email', 'message',
  'call', 'text', 'send', 'receive', 'connect',
  'website', 'social', 'media', 'video', 'photo',
  'camera', 'television', 'radio', 'music', 'song',
  
  // Lesson 41-45: Emotions and relationships
  'feel', 'emotion', 'angry', 'excited', 'nervous',
  'calm', 'worried', 'confident', 'shy', 'brave',
  'kind', 'mean', 'helpful', 'selfish', 'generous',
  'honest', 'lie', 'trust', 'respect', 'care',
  
  // Lesson 46-50: Advanced concepts
  'future', 'past', 'present', 'change', 'improve',
  'problem', 'solution', 'decision', 'choice', 'option',
  'important', 'necessary', 'possible', 'impossible', 'easy',
  'difficult', 'simple', 'complex', 'clear', 'confusing',
  
  // Additional vocabulary to reach 500 words
  'culture', 'tradition', 'custom', 'language', 'country',
  'city', 'village', 'government', 'law', 'rule',
  'freedom', 'peace', 'war', 'safety', 'danger',
  'hope', 'dream', 'goal', 'success', 'failure',
  'try', 'attempt', 'effort', 'practice', 'skill',
  'talent', 'ability', 'strength', 'weakness', 'improve',
  'develop', 'grow', 'increase', 'decrease', 'reduce',
  'create', 'build', 'make', 'destroy', 'break',
  'fix', 'repair', 'clean', 'dirty', 'organize',
  'mess', 'order', 'chaos', 'control', 'freedom',
  'responsible', 'accountable', 'reliable', 'dependable', 'trustworthy',
  'honest', 'truthful', 'faithful', 'loyal', 'dedicated',
  'committed', 'passionate', 'enthusiastic', 'motivated', 'inspired',
  'creative', 'innovative', 'original', 'unique', 'special',
  'ordinary', 'normal', 'average', 'typical', 'unusual',
  'strange', 'weird', 'funny', 'serious', 'formal',
  'informal', 'casual', 'professional', 'personal', 'private',
  'public', 'secret', 'open', 'closed', 'available',
  'busy', 'free', 'occupied', 'empty', 'full',
  'complete', 'finished', 'done', 'ready', 'prepared',
  'organized', 'planned', 'scheduled', 'arranged', 'confirmed',
  'certain', 'sure', 'doubtful', 'uncertain', 'confused',
  'clear', 'obvious', 'hidden', 'visible', 'invisible',
  'bright', 'dark', 'light', 'heavy', 'thin',
  'thick', 'wide', 'narrow', 'long', 'short',
  'tall', 'high', 'low', 'deep', 'shallow',
  'soft', 'hard', 'smooth', 'rough', 'sharp',
  'dull', 'clean', 'dirty', 'fresh', 'stale',
  'wet', 'dry', 'solid', 'liquid', 'gas',
  'material', 'substance', 'object', 'thing', 'item',
  'piece', 'part', 'whole', 'section', 'area',
  'space', 'place', 'location', 'position', 'direction',
  'distance', 'near', 'far', 'close', 'away',
  'inside', 'outside', 'above', 'below', 'beside',
  'between', 'among', 'through', 'across', 'around',
  'behind', 'front', 'back', 'side', 'corner',
  'edge', 'center', 'middle', 'top', 'bottom',
  'left', 'right', 'north', 'south', 'east',
  'west', 'forward', 'backward', 'up', 'down',
  'level', 'floor', 'ceiling', 'wall', 'door',
  'window', 'room', 'building', 'structure', 'construction',
  'architecture', 'design', 'style', 'fashion', 'trend',
  'popular', 'famous', 'well-known', 'unknown', 'mysterious',
  'curious', 'interesting', 'boring', 'exciting', 'amazing',
  'wonderful', 'terrible', 'awful', 'great', 'excellent',
  'perfect', 'ideal', 'best', 'worst', 'better',
  'worse', 'same', 'different', 'similar', 'equal',
  'fair', 'unfair', 'just', 'unjust', 'right',
  'wrong', 'correct', 'incorrect', 'true', 'false',
  'real', 'fake', 'genuine', 'artificial', 'natural',
  'synthetic', 'organic', 'chemical', 'physical', 'mental',
  'emotional', 'spiritual', 'intellectual', 'practical', 'theoretical',
  'scientific', 'technical', 'medical', 'legal', 'financial',
  'economic', 'political', 'social', 'cultural', 'religious',
  'historical', 'modern', 'ancient', 'contemporary', 'traditional',
  'progressive', 'conservative', 'liberal', 'radical', 'moderate',
  'extreme', 'mild', 'gentle', 'harsh', 'severe',
  'strict', 'loose', 'tight', 'flexible', 'rigid',
  'stable', 'unstable', 'steady', 'shaky', 'firm',
  'weak', 'powerful', 'influential', 'important', 'significant'
];

class VocabularyGenerator {
  private vocabularyService: VocabularyImageService;
  private totalWords: number;
  private processedWords: number = 0;
  private successfulGenerations: number = 0;
  private failedGenerations: number = 0;
  private skippedWords: number = 0;

  constructor() {
    this.vocabularyService = new VocabularyImageService();
    this.totalWords = UNIVERSAL_VOCABULARY.length;
    
    console.log(`🎯 Universal Vocabulary Image Generation`);
    console.log(`📚 Total words to process: ${this.totalWords}`);
    console.log(`🌍 This vocabulary is used by 100+ language teaching agents`);
    console.log(`💡 Caching prevents duplicate generations and ensures consistency\n`);
  }

  /**
   * Generate images for all vocabulary words
   */
  async generateAllVocabulary(): Promise<void> {
    console.log(`🚀 Starting vocabulary image generation...\n`);
    
    // Process words in batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    const batches = this.chunkArray(UNIVERSAL_VOCABULARY, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      const totalBatches = batches.length;
      
      console.log(`📦 Processing Batch ${batchNumber}/${totalBatches} (${batch.length} words)`);
      console.log(`   Words: ${batch.join(', ')}`);
      
      // Process batch with concurrent requests
      await this.processBatch(batch, batchNumber);
      
      // Brief pause between batches to respect rate limits
      if (i < batches.length - 1) {
        console.log(`   ⏳ Pausing 2 seconds before next batch...\n`);
        await this.sleep(2000);
      }
    }
    
    this.printFinalSummary();
  }

  /**
   * Process a batch of vocabulary words
   */
  private async processBatch(words: string[], batchNumber: number): Promise<void> {
    const promises = words.map(word => this.processWord(word));
    const results = await Promise.allSettled(promises);
    
    let batchSuccess = 0;
    let batchFailures = 0;
    let batchSkipped = 0;
    
    results.forEach((result, index) => {
      const word = words[index];
      this.processedWords++;
      
      if (result.status === 'fulfilled') {
        const outcome = result.value;
        if (outcome === 'success') {
          batchSuccess++;
          this.successfulGenerations++;
          console.log(`   ✅ ${word} - Generated successfully`);
        } else if (outcome === 'skipped') {
          batchSkipped++;
          this.skippedWords++;
          console.log(`   ⏭️  ${word} - Already cached`);
        }
      } else {
        batchFailures++;
        this.failedGenerations++;
        console.log(`   ❌ ${word} - Failed: ${result.reason}`);
      }
    });
    
    console.log(`   📊 Batch ${batchNumber} Results: ${batchSuccess} generated, ${batchSkipped} skipped, ${batchFailures} failed`);
    console.log(`   📈 Overall Progress: ${this.processedWords}/${this.totalWords} (${Math.round(this.processedWords / this.totalWords * 100)}%)\n`);
  }

  /**
   * Process a single vocabulary word
   */
  private async processWord(word: string): Promise<'success' | 'skipped' | 'failed'> {
    try {
      // Check if word already has cached image
      const existing = await db.select()
        .from(vocabularyImages)
        .where(eq(vocabularyImages.word, word))
        .limit(1);
      
      if (existing.length > 0) {
        return 'skipped';
      }
      
      // Generate image for the word
      const result = await this.vocabularyService.getVocabularyImage(word);
      
      if (result.success && result.imageUrl) {
        return 'success';
      } else {
        throw new Error(result.error || 'Unknown generation error');
      }
    } catch (error) {
      throw error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Print final generation summary
   */
  private printFinalSummary(): void {
    console.log(`🎉 Universal Vocabulary Generation Complete!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Final Statistics:`);
    console.log(`   • Total words processed: ${this.processedWords}`);
    console.log(`   • Successfully generated: ${this.successfulGenerations}`);
    console.log(`   • Already cached (skipped): ${this.skippedWords}`);
    console.log(`   • Failed generations: ${this.failedGenerations}`);
    console.log(`   • Success rate: ${Math.round((this.successfulGenerations / (this.successfulGenerations + this.failedGenerations)) * 100)}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🌍 Impact:`);
    console.log(`   • 100+ language teaching agents will use these cached images`);
    console.log(`   • Eliminates thousands of duplicate image generations`);
    console.log(`   • Provides consistent visual vocabulary across all languages`);
    console.log(`   • Significantly improves interactive lesson load times`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (this.failedGenerations > 0) {
      console.log(`⚠️  Note: ${this.failedGenerations} words failed to generate. You can re-run this script to retry failed words.`);
    }
    
    console.log(`\n✨ Vocabulary cache is now ready for production use!`);
  }

  /**
   * Utility function to chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utility function to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const generator = new VocabularyGenerator();
    await generator.generateAllVocabulary();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during vocabulary generation:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { VocabularyGenerator, UNIVERSAL_VOCABULARY };