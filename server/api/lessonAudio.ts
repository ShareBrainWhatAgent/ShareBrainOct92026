import { Request, Response } from "express";
import { lessonAudioService } from "../services/lessonAudioService";
// import { requireAuth } from "../middleware/requireAuth"; // Will add auth when needed

/**
 * API Routes for Lesson Audio Caching System
 * Provides instant audio playback for vocabulary words and complete lessons
 */

/**
 * GET /api/lesson-audio/word/:word
 * Get cached audio for a vocabulary word
 */
export async function getWordAudio(req: Request, res: Response) {
  try {
    const { word } = req.params;
    const { language = 'en', voice = 'alloy' } = req.query;

    if (!word) {
      return res.status(400).json({ error: 'Word parameter is required' });
    }

    const audioResult = await lessonAudioService.getWordAudio(
      word,
      language as string,
      voice as string
    );

    res.json({
      success: true,
      data: audioResult
    });
  } catch (error) {
    console.error('Error getting word audio:', error);
    res.status(500).json({
      error: 'Failed to get word audio',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/lesson-audio/lesson/:language/:lessonNumber
 * Get complete cached lesson with audio
 */
export async function getCachedLesson(req: Request, res: Response) {
  try {
    const { language, lessonNumber } = req.params;
    const { voice = 'alloy' } = req.query;

    if (!language || !lessonNumber) {
      return res.status(400).json({ error: 'Language and lesson number are required' });
    }

    const lesson = await lessonAudioService.getOrGenerateLesson(
      language,
      parseInt(lessonNumber),
      voice as string
    );

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    console.error('Error getting cached lesson:', error);
    res.status(500).json({
      error: 'Failed to get cached lesson',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/lesson-audio/cache-lesson
 * Cache a complete lesson with content and audio
 */
export async function cacheLesson(req: Request, res: Response) {
  try {
    const {
      language,
      lessonNumber,
      lessonTitle,
      lessonContent,
      vocabularyWords,
      voice = 'alloy'
    } = req.body;

    if (!language || !lessonNumber || !lessonTitle || !lessonContent || !vocabularyWords) {
      return res.status(400).json({
        error: 'Missing required fields: language, lessonNumber, lessonTitle, lessonContent, vocabularyWords'
      });
    }

    await lessonAudioService.cacheLesson(
      language,
      lessonNumber,
      lessonTitle,
      lessonContent,
      vocabularyWords,
      voice
    );

    res.json({
      success: true,
      message: 'Lesson cached successfully'
    });
  } catch (error) {
    console.error('Error caching lesson:', error);
    res.status(500).json({
      error: 'Failed to cache lesson',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/lesson-audio/stats
 * Get audio cache statistics
 */
export async function getCacheStats(req: Request, res: Response) {
  try {
    const stats = await lessonAudioService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/lesson-audio/generate-universal-cache
 * Generate audio cache for universal 500-word curriculum (Admin only)
 */
export async function generateUniversalCache(req: Request, res: Response) {
  try {
    const { languages = ['es', 'fr', 'de', 'it', 'pt'] } = req.body;

    await lessonAudioService.generateUniversalAudioCache(languages);

    res.json({
      success: true,
      message: `Universal audio cache generation started for ${languages.length} languages`
    });
  } catch (error) {
    console.error('Error generating universal cache:', error);
    res.status(500).json({
      error: 'Failed to generate universal cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/lesson-audio/health-check
 * Health check endpoint for audio caching system
 */
export async function healthCheck(req: Request, res: Response) {
  try {
    const stats = await lessonAudioService.getCacheStats();
    
    res.json({
      success: true,
      system: 'Lesson Audio Caching Service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    console.error('Audio cache health check failed:', error);
    res.status(500).json({
      success: false,
      system: 'Lesson Audio Caching Service',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}