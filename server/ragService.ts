import OpenAI from "openai";
import { storage } from "./storage";

// Create OpenAI client for embeddings
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface PromptSimilarity {
  embedding: any;
  similarity: number;
  agentName: string;
  agentId: number;
}

/**
 * RAG (Retrieval-Augmented Generation) Service for document and memory processing
 */
export class RAGService {
  /**
   * Generate embeddings for a prompt text
   */
  async generateEmbedding(text: string): Promise<{ embedding: number[], tokens: number }> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  /**
   * Store prompt embeddings for an agent
   */
  async storeAgentEmbeddings(agentId: number, userId: string, prompts: {
    systemPrompt?: string;
    sampleUser?: string;
    sampleAgent?: string;
  }): Promise<void> {
    try {
      const embeddings = [];

      // Generate embeddings for each prompt type
      if (prompts.systemPrompt) {
        const { embedding, tokens } = await this.generateEmbedding(prompts.systemPrompt);
        embeddings.push({
          agentId,
          userId,
          promptType: "system" as const,
          promptText: prompts.systemPrompt,
          embedding: JSON.stringify(embedding),
          tokens,
        });
      }

      if (prompts.sampleUser) {
        const { embedding, tokens } = await this.generateEmbedding(prompts.sampleUser);
        embeddings.push({
          agentId,
          userId,
          promptType: "sample_user" as const,
          promptText: prompts.sampleUser,
          embedding: JSON.stringify(embedding),
          tokens,
        });
      }

      if (prompts.sampleAgent) {
        const { embedding, tokens } = await this.generateEmbedding(prompts.sampleAgent);
        embeddings.push({
          agentId,
          userId,
          promptType: "sample_agent" as const,
          promptText: prompts.sampleAgent,
          embedding: JSON.stringify(embedding),
          tokens,
        });
      }

      if (embeddings.length > 0) {
        await storage.storePromptEmbeddings(embeddings);
      }
    } catch (error) {
      console.error("Error storing agent embeddings:", error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Find similar prompts using semantic search
   */
  async findSimilarPrompts(
    queryText: string,
    userId: string,
    promptType?: string,
    limit = 10,
    minSimilarity = 0.7
  ): Promise<PromptSimilarity[]> {
    try {
      const { embedding: queryEmbedding } = await this.generateEmbedding(queryText);
      const embeddings = await storage.getPromptEmbeddings(userId, promptType);

      const similarities = embeddings.map(embedding => {
        let embeddingVector;
        try {
          embeddingVector = JSON.parse(embedding.embedding);
        } catch (e) {
          console.error("Error parsing embedding:", e);
          return null;
        }

        const similarity = this.cosineSimilarity(queryEmbedding, embeddingVector);
        return {
          embedding,
          similarity,
          agentName: embedding.agentId.toString(),
          agentId: embedding.agentId,
        };
      }).filter(result => result && result.similarity >= minSimilarity)
        .sort((a, b) => b!.similarity - a!.similarity)
        .slice(0, limit) as PromptSimilarity[];

      return similarities;
    } catch (error) {
      console.error("Error finding similar prompts:", error);
      return [];
    }
  }

  /**
   * Search for relevant document chunks for a given query
   */
  async searchDocuments(
    agentId: number,
    queryText: string,
    limit = 5,
    minSimilarity = 0.7
  ): Promise<Array<{ content: string; similarity: number; documentName: string }>> {
    try {
      // Generate query embedding
      const { embedding: queryEmbedding } = await this.generateEmbedding(queryText);
      
      // Get agent documents
      const documents = await storage.getAgentDocuments(agentId);
      
      if (documents.length === 0) {
        return [];
      }

      // Get all chunks for these documents
      const allChunks = [];
      for (const doc of documents) {
        const chunks = await storage.getDocumentChunks(doc.id);
        allChunks.push(...chunks.map(chunk => ({
          ...chunk,
          documentName: doc.fileName
        })));
      }

      if (allChunks.length === 0) {
        return [];
      }

      // Calculate similarities for all chunks
      const similarities = allChunks.map(chunk => {
        let chunkEmbedding;
        try {
          chunkEmbedding = JSON.parse(chunk.embedding);
        } catch (e) {
          console.error("Error parsing chunk embedding:", e);
          return {
            content: chunk.chunkText,
            similarity: 0,
            documentName: chunk.documentName
          };
        }

        const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
        return {
          content: chunk.chunkText,
          similarity,
          documentName: chunk.documentName
        };
      });

      // Filter and sort by similarity
      return similarities
        .filter(result => result.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error("Error searching documents:", error);
      return [];
    }
  }

  /**
   * Get prompt suggestions based on category or keywords
   */
  async getPromptSuggestions(
    category?: string,
    keywords?: string[],
    limit = 10
  ): Promise<any[]> {
    try {
      // This could be expanded to use category-based filtering
      // For now, return empty array as this is a placeholder
      return [];
    } catch (error) {
      console.error("Error getting prompt suggestions:", error);
      return [];
    }
  }

  /**
   * Update prompt analytics
   */
  async updatePromptAnalytics(agentId: number, userId: string, promptType: string): Promise<void> {
    try {
      await storage.updatePromptAnalytics(agentId, userId, promptType);
    } catch (error) {
      console.error("Error updating prompt analytics:", error);
    }
  }

  /**
   * Get top performing prompts
   */
  async getTopPrompts(userId: string, limit = 10): Promise<any[]> {
    try {
      return await storage.getTopPrompts(userId, limit);
    } catch (error) {
      console.error("Error getting top prompts:", error);
      return [];
    }
  }

  /**
   * Process document upload - extract text, chunk it, and create embeddings
   */
  async processDocumentUpload(
    fileBuffer: Buffer, 
    filename: string, 
    agentId: number, 
    userId: string
  ): Promise<any> {
    try {
      console.log(`=== DOCUMENT UPLOAD DEBUG ===`);
      console.log(`File: ${filename}, Size: ${fileBuffer.length} bytes`);
      
      // Extract text content from file with enhanced error handling
      const textContent = await this.extractTextFromFile(fileBuffer, filename);
      
      // Generate embedding for the full document
      const { embedding: docEmbedding } = await this.generateEmbedding(textContent);
      
      // Chunk the text for fine-grained search
      const chunks = this.chunkText(textContent);
      
      // Create document record
      const document = await storage.uploadDocument({
        agentId,
        userId,
        fileName: filename,
        fileType: this.getFileExtension(filename),
        fileSize: fileBuffer.length,
        fileContent: textContent,
        embedding: JSON.stringify(docEmbedding),
        chunks: chunks,
        metadata: { originalName: filename }
      });

      // Generate embeddings for chunks and store them
      const chunkEmbeddings = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const { embedding: chunkEmbedding } = await this.generateEmbedding(chunk);
        
        chunkEmbeddings.push({
          documentId: document.id,
          agentId,
          chunkIndex: i,
          chunkText: chunk,
          embedding: JSON.stringify(chunkEmbedding),
          tokens: chunk.split(' ').length, // Rough token count
          metadata: { chunkIndex: i }
        });
      }

      if (chunkEmbeddings.length > 0) {
        await storage.storeDocumentChunks(chunkEmbeddings);
      }

      return document;
    } catch (error) {
      console.error("Error processing document upload:", error);
      throw error;
    }
  }

  /**
   * Extract text content from different file types
   */
  private async extractTextFromFile(fileBuffer: Buffer, filename: string): Promise<string> {
    const extension = this.getFileExtension(filename).toLowerCase();
    
    switch (extension) {
      case 'txt':
      case 'md':
        return fileBuffer.toString('utf-8');
      
      case 'json':
      case 'jsonl':
      case 'geojson':
        // Use the exact same logic that worked in our test endpoint
        console.log('Processing JSON file...');
        
        // Try to read as UTF-8
        let content = '';
        try {
          content = fileBuffer.toString('utf-8');
          console.log("UTF-8 content (first 200 chars):", content.substring(0, 200));
        } catch (e: any) {
          console.log("UTF-8 failed:", e?.message || 'Unknown error');
          content = fileBuffer.toString('latin1');
        }
        
        // Try to parse as JSON
        try {
          const cleanContent = content.replace(/^\uFEFF/, '').trim();
          console.log("Cleaned content (first 200 chars):", cleanContent.substring(0, 200));
          
          let parsed;
          if (extension === 'jsonl') {
            // JSON Lines format - each line is a separate JSON object
            const lines = cleanContent.split('\n').filter(line => line.trim());
            parsed = lines.map(line => JSON.parse(line));
          } else {
            // Regular JSON
            parsed = JSON.parse(cleanContent);
          }
          
          console.log("JSON parsed successfully!");
          console.log("Type:", typeof parsed);
          return this.formatJsonForSearch(parsed);
        } catch (jsonError: any) {
          console.log("JSON parsing failed:", jsonError?.message || 'Unknown error');
          console.log("Falling back to plain text processing for file:", filename);
          
          // If JSON parsing fails, treat as plain text - this is the key fix
          return content;
        }
      
      case 'pdf':
        // For now, return placeholder - would need PDF parsing library
        return "PDF content extraction not implemented yet";
      
      case 'docx':
        // For now, return placeholder - would need DOCX parsing library
        return "DOCX content extraction not implemented yet";
      
      default:
        return fileBuffer.toString('utf-8');
    }
  }

  /**
   * Format JSON content for search by converting to readable text
   */
  private formatJsonForSearch(jsonData: any): string {
    // Convert JSON to a searchable text format
    const formatValue = (value: any, key?: string): string => {
      if (typeof value === 'string') {
        return value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      } else if (Array.isArray(value)) {
        return value.map(item => formatValue(item)).join(' ');
      } else if (typeof value === 'object' && value !== null) {
        return Object.entries(value)
          .map(([k, v]) => `${k}: ${formatValue(v)}`)
          .join(' ');
      }
      return String(value);
    };

    return formatValue(jsonData);
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  /**
   * Split text into chunks for processing
   */
  private chunkText(text: string, maxChunkSize = 1000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += sentence + '. ';
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence + '. ';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

export const ragService = new RAGService();