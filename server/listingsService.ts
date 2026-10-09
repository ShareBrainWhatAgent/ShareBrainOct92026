import { storage } from "./storage";
import type { AgentListing, Agent } from "@shared/schema";

export interface ListingSearchResult {
  listing: AgentListing;
  agent: Agent;
  relevanceScore: number;
}

export class ListingsService {
  /**
   * Search for relevant business listings based on location and keywords
   */
  async searchListings(query: string, city?: string, category?: string, limit = 10): Promise<ListingSearchResult[]> {
    try {
      // Get all approved listings
      const allListings = await storage.getAllListings("approved");
      
      if (!allListings || allListings.length === 0) {
        return [];
      }

      const results: ListingSearchResult[] = [];
      
      // For each listing, calculate relevance score
      for (const listing of allListings) {
        let relevanceScore = 0;
        
        // City matching (highest priority)
        if (city && listing.city) {
          if (listing.city.toLowerCase().includes(city.toLowerCase())) {
            relevanceScore += 50;
          }
        }
        
        // Category matching
        if (category && listing.category) {
          if (listing.category.toLowerCase().includes(category.toLowerCase())) {
            relevanceScore += 30;
          }
        }
        
        // Query keyword matching in business name and description
        const queryLower = query.toLowerCase();
        const searchText = `${listing.businessName} ${listing.description} ${listing.specialOffers || ''}`.toLowerCase();
        
        // Exact business name match
        if (listing.businessName.toLowerCase().includes(queryLower)) {
          relevanceScore += 40;
        }
        
        // Description/offers match
        if (searchText.includes(queryLower)) {
          relevanceScore += 20;
        }
        
        // Special keywords for happy hour
        if (queryLower.includes('happy hour') || queryLower.includes('drinks') || queryLower.includes('cocktails')) {
          if (listing.category.toLowerCase().includes('bar') || 
              listing.specialOffers?.toLowerCase().includes('happy hour') ||
              listing.description.toLowerCase().includes('happy hour')) {
            relevanceScore += 35;
          }
        }
        
        // Only include results with some relevance
        if (relevanceScore > 0) {
          // Get the agent this listing belongs to
          const agent = await storage.getAgent(listing.agentId);
          if (agent) {
            results.push({
              listing,
              agent,
              relevanceScore
            });
          }
        }
      }
      
      // Sort by relevance score and limit results
      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
        
    } catch (error) {
      console.error("Error searching listings:", error);
      return [];
    }
  }

  /**
   * Extract location information from a user query
   */
  extractLocationFromQuery(query: string): { city?: string; state?: string } {
    const queryLower = query.toLowerCase();
    
    // Common city patterns
    const cityPatterns = [
      /in ([a-z\s]+?)(?:\s|$|,)/i,
      /([a-z\s]+?) (bars|restaurants|happy hour)/i,
      /([a-z\s]+?) area/i,
    ];
    
    for (const pattern of cityPatterns) {
      const match = queryLower.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Filter out common words that aren't cities
        if (!['the', 'best', 'good', 'great', 'any'].includes(location)) {
          return { city: location };
        }
      }
    }
    
    return {};
  }

  /**
   * Extract category/business type from query
   */
  extractCategoryFromQuery(query: string): string | undefined {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('bar') || queryLower.includes('happy hour') || queryLower.includes('drinks')) {
      return 'bar';
    }
    if (queryLower.includes('restaurant') || queryLower.includes('food') || queryLower.includes('dining')) {
      return 'restaurant';
    }
    if (queryLower.includes('hotel') || queryLower.includes('accommodation')) {
      return 'hotel';
    }
    if (queryLower.includes('coffee') || queryLower.includes('cafe')) {
      return 'cafe';
    }
    
    return undefined;
  }

  /**
   * Format listings into a readable response for the Master Agent
   */
  formatListingsForResponse(results: ListingSearchResult[], query: string): string {
    if (results.length === 0) {
      return "I don't have any specific business listings for that area yet. You might want to check the individual agent pages or encourage local businesses to add their listings.";
    }

    const location = this.extractLocationFromQuery(query);
    const locationText = location.city ? ` in ${location.city}` : '';
    
    let response = `Here are some great options${locationText}:\n\n`;
    
    results.slice(0, 5).forEach((result, index) => {
      const { listing } = result;
      response += `**${index + 1}. ${listing.businessName}**\n`;
      
      if (listing.address && listing.city) {
        response += `📍 ${listing.address}, ${listing.city}\n`;
      } else if (listing.city) {
        response += `📍 ${listing.city}\n`;
      }
      
      if (listing.description) {
        response += `${listing.description}\n`;
      }
      
      if (listing.specialOffers) {
        response += `🎉 ${listing.specialOffers}\n`;
      }
      
      if (listing.priceRange) {
        response += `💰 Price range: ${listing.priceRange}\n`;
      }
      
      if (listing.phone) {
        response += `📞 ${listing.phone}\n`;
      }
      
      if (listing.website) {
        response += `🌐 ${listing.website}\n`;
      }
      
      response += '\n';
    });

    if (results.length > 5) {
      response += `\n*And ${results.length - 5} more options available...*`;
    }

    return response;
  }

  /**
   * Check if a query is asking for business listings
   */
  isListingQuery(query: string): boolean {
    const queryLower = query.toLowerCase();
    const listingKeywords = [
      'bars', 'restaurants', 'hotels', 'cafes', 'coffee shops',
      'happy hour', 'places to eat', 'places to drink',
      'where to', 'recommendations', 'suggest', 'find',
      'best', 'good', 'around', 'near', 'in'
    ];

    return listingKeywords.some(keyword => queryLower.includes(keyword));
  }
}

export const listingsService = new ListingsService();