import { Router } from 'express';
import { LiveDataService } from '../liveDataService';
import { WebSearchService } from '../webSearch';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * Test endpoint for web search functionality
 */
router.get('/api/live-data/search', isAuthenticated, async (req: any, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const searchResults = await WebSearchService.search(query as string);
    
    res.json({
      query,
      results: searchResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * Test endpoint for live data enhancement
 */
router.post('/api/live-data/enhance', isAuthenticated, async (req: any, res) => {
  try {
    const { systemPrompt, userMessage, modelName } = req.body;
    
    if (!systemPrompt || !userMessage) {
      return res.status(400).json({ error: 'systemPrompt and userMessage are required' });
    }
    
    const enhancedPrompt = await LiveDataService.enhanceWithWebSearch(
      systemPrompt,
      userMessage,
      modelName || 'llama-3.1-70b-versatile'
    );
    
    res.json({
      originalPrompt: systemPrompt,
      enhancedPrompt,
      userMessage,
      searchPerformed: enhancedPrompt !== systemPrompt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: 'Enhancement failed' });
  }
});

/**
 * Get live data agent templates
 */
router.get('/api/live-data/templates', isAuthenticated, async (req: any, res) => {
  try {
    const { LiveDataAgentTemplates } = await import('../liveDataService');
    
    res.json({
      templates: LiveDataAgentTemplates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

export default router;