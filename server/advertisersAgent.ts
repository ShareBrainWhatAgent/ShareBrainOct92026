import { db } from "./db";
import { advertisements } from "@shared/schema";
import { eq, ilike, or } from "drizzle-orm";

export interface AdvertisersAgentContext {
  query: string;
  keywords?: string[];
  category?: string;
}

export class AdvertisersAgentService {
  /**
   * Search advertisements based on user query
   */
  async searchAdvertisements(query: string): Promise<any[]> {
    try {
      // Extract keywords from query
      const keywords = this.extractKeywords(query);
      
      // Search active advertisements
      const ads = await db.select()
        .from(advertisements)
        .where(eq(advertisements.isActive, true));
      
      // Filter and rank advertisements based on relevance
      const relevantAds = ads.filter(ad => {
        const adKeywords = ad.keywords.toLowerCase().split(',').map(k => k.trim());
        const queryLower = query.toLowerCase();
        
        // Check if query matches any ad keywords
        const keywordMatch = adKeywords.some(keyword => 
          queryLower.includes(keyword) || keyword.includes(queryLower)
        );
        
        // Check if query matches title or description
        const titleMatch = ad.title.toLowerCase().includes(queryLower);
        const descriptionMatch = ad.description.toLowerCase().includes(queryLower);
        
        return keywordMatch || titleMatch || descriptionMatch;
      });
      
      // Sort by relevance (simple scoring based on keyword matches)
      relevantAds.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, query);
        const bScore = this.calculateRelevanceScore(b, query);
        return bScore - aScore;
      });
      
      return relevantAds;
    } catch (error) {
      console.error("Error searching advertisements:", error);
      return [];
    }
  }

  /**
   * Get all advertisements for general browsing
   */
  async getAllAdvertisements(): Promise<any[]> {
    try {
      return await db.select()
        .from(advertisements)
        .where(eq(advertisements.isActive, true))
        .orderBy(advertisements.createdAt);
    } catch (error) {
      console.error("Error fetching all advertisements:", error);
      return [];
    }
  }

  /**
   * Extract keywords from user query
   */
  private extractKeywords(query: string): string[] {
    const stopWords = ['i', 'need', 'want', 'looking', 'for', 'a', 'an', 'the', 'is', 'are', 'help', 'me', 'find'];
    const words = query.toLowerCase().split(' ').filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    return words;
  }

  /**
   * Calculate relevance score for advertisement
   */
  private calculateRelevanceScore(ad: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const adKeywords = ad.keywords.toLowerCase().split(',').map(k => k.trim());
    
    // Title match gets highest score
    if (ad.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Keyword matches
    adKeywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        score += 5;
      }
    });
    
    // Description match
    if (ad.description.toLowerCase().includes(queryLower)) {
      score += 3;
    }
    
    // Performance bonus (popular ads get slight boost)
    score += (ad.clicks || 0) * 0.1;
    
    return score;
  }

  /**
   * Format advertisements for AI agent response
   */
  formatAdvertisementsForResponse(ads: any[], query: string): string {
    if (ads.length === 0) {
      return `I couldn't find any advertisements matching "${query}". You might want to try different keywords or browse all available services.`;
    }
    
    let response = `I found ${ads.length} advertiser${ads.length > 1 ? 's' : ''} matching "${query}":\n\n`;
    
    ads.slice(0, 5).forEach((ad, index) => {
      response += `${index + 1}. **${ad.title}**\n`;
      response += `   ${ad.description}\n`;
      
      // Add contact information
      const contactInfo = [];
      if (ad.website) contactInfo.push(`Website: ${ad.website}`);
      if (ad.phoneNumber) contactInfo.push(`Phone: ${ad.phoneNumber}`);
      if (ad.email) contactInfo.push(`Email: ${ad.email}`);
      if (ad.address) contactInfo.push(`Location: ${ad.address}`);
      
      if (contactInfo.length > 0) {
        response += `   Contact: ${contactInfo.join(' | ')}\n`;
      }
      
      // Add social media links
      const socialLinks = [];
      if (ad.facebookUrl) socialLinks.push(`Facebook: ${ad.facebookUrl}`);
      if (ad.instagramUrl) socialLinks.push(`Instagram: ${ad.instagramUrl}`);
      if (ad.twitterUrl) socialLinks.push(`Twitter: ${ad.twitterUrl}`);
      if (ad.linkedinUrl) socialLinks.push(`LinkedIn: ${ad.linkedinUrl}`);
      
      if (socialLinks.length > 0) {
        response += `   Social: ${socialLinks.join(' | ')}\n`;
      }
      
      response += `   Keywords: ${ad.keywords}\n\n`;
    });
    
    if (ads.length > 5) {
      response += `...and ${ads.length - 5} more results. Try being more specific to narrow down your search.`;
    }
    
    return response;
  }

  /**
   * Create system prompt for Advertisers Agent
   */
  createAdvertisersAgentSystemPrompt(): string {
    return `You are the Advertisers Agent, a specialized AI assistant that helps users find and connect with local service providers, professionals, and businesses through our advertising directory.

Your primary functions:
1. Search for relevant advertisers based on user queries
2. Present advertiser information in a clear, helpful format
3. Help users find the right service provider for their needs
4. Provide contact information and details about services offered

When a user asks about a service or business:
1. Search the advertising directory for relevant matches
2. Present the top results with full contact information
3. Include website, phone, email, and social media links when available
4. Highlight key services and specialties
5. Suggest related services if the exact match isn't found

Guidelines:
- Always search for advertisers when users ask about services, businesses, or professionals
- Present information in a organized, easy-to-read format
- Include all available contact methods (website, phone, email, social media)
- Be helpful in suggesting alternatives if no exact matches are found
- Encourage users to contact advertisers directly for detailed information
- Track ad impressions by calling the impression tracking API

You have access to a comprehensive directory of local service providers including:
- Professional services (lawyers, accountants, consultants)
- Home services (contractors, cleaners, landscapers)
- Personal services (tutors, trainers, stylists)
- Creative services (photographers, designers, musicians)
- And many more categories

Ask users to be specific about their location and service needs to provide the most relevant results.`;
  }
}

export const advertisersAgentService = new AdvertisersAgentService();