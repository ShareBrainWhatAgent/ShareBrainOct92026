import { Router } from "express";
import { VocabularyImageService } from "../services/vocabularyImageService.js";
import { isAuthenticated } from "../googleAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
const vocabularyImageService = new VocabularyImageService();

/**
 * Get image for a single word
 * GET /api/vocabulary-cache/word/:word
 */
router.get("/word/:word", async (req, res) => {
  try {
    const { word } = req.params;
    const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
    
    const result = await vocabularyImageService.getVocabularyImage(word);
    
    res.json({
      success: result.success,
      word,
      imageUrl: result.imageUrl,
      cached: result.cached,
      generatedAt: result.generatedAt
    });
  } catch (error) {
    console.error("Vocabulary cache error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get word image"
    });
  }
});

/**
 * Get images for multiple words
 * POST /api/vocabulary-cache/words
 */
router.post("/words", async (req, res) => {
  try {
    const { words, agentId } = req.body;
    
    if (!Array.isArray(words)) {
      return res.status(400).json({
        success: false,
        error: "Words must be an array"
      });
    }
    
    const results = await vocabularyImageService.getMultipleWordImages(words, agentId);
    
    // Convert Map to object for JSON response
    const response = Object.fromEntries(
      Array.from(results.entries()).map(([word, result]) => [
        word,
        {
          imageUrl: result.url,
          isCached: result.isCached,
          generatedAt: result.generatedAt
        }
      ])
    );
    
    res.json({
      success: true,
      words: response
    });
  } catch (error) {
    console.error("Multiple words cache error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get word images"
    });
  }
});

/**
 * Get cache statistics
 * GET /api/vocabulary-cache/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await vocabularyImageService.getCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Cache stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cache statistics"
    });
  }
});

/**
 * Pre-populate universal curriculum (admin only)
 * POST /api/vocabulary-cache/prepopulate
 */
router.post("/prepopulate", isAuthenticated, async (req, res) => {
  try {
    // Only allow admin users to trigger pre-population
    if (req.user?.email !== "tom@colorfulranch.com") {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }
    
    await vocabularyImageService.prePopulateUniversalCurriculum();
    
    res.json({
      success: true,
      message: "Universal curriculum added to generation queue"
    });
  } catch (error) {
    console.error("Pre-populate error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to pre-populate curriculum"
    });
  }
});

/**
 * Process generation queue (admin only)
 * POST /api/vocabulary-cache/process-queue
 */
router.post("/process-queue", isAuthenticated, async (req, res) => {
  try {
    // Only allow admin users to trigger queue processing
    if (req.user?.email !== "tom@colorfulranch.com") {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }
    
    const batchSize = req.body.batchSize || 10;
    await vocabularyImageService.processGenerationQueue(batchSize);
    
    res.json({
      success: true,
      message: `Processing batch of ${batchSize} items from queue`
    });
  } catch (error) {
    console.error("Process queue error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process generation queue"
    });
  }
});

/**
 * Clear cache (admin only)
 * DELETE /api/vocabulary-cache/clear
 */
router.delete("/clear", isAuthenticated, async (req, res) => {
  try {
    // Only allow admin users to clear cache
    if (req.user?.email !== "tom@colorfulranch.com") {
      return res.status(403).json({
        success: false,
        error: "Admin access required"
      });
    }
    
    await vocabularyImageService.clearCache();
    
    res.json({
      success: true,
      message: "Vocabulary image cache cleared"
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cache"
    });
  }
});

export default router;