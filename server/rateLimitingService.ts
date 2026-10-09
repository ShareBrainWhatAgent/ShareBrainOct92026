interface SessionData {
  messageCount: number;
  firstMessage: Date;
  lastMessage: Date;
  captchaRequired: boolean;
  captchaSolved: boolean;
  blocked: boolean;
  blockExpires?: Date;
  ip: string;
  userAgent: string;
}

class RateLimitingService {
  private sessions: Map<string, SessionData> = new Map();
  
  // Clean up old sessions every hour
  constructor() {
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000); // 1 hour
  }
  
  private cleanupOldSessions() {
    const now = new Date();
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      // Remove sessions older than 24 hours
      if (now.getTime() - session.firstMessage.getTime() > 24 * 60 * 60 * 1000) {
        this.sessions.delete(sessionId);
      }
      // Remove expired blocks
      if (session.blocked && session.blockExpires && now > session.blockExpires) {
        session.blocked = false;
        session.blockExpires = undefined;
      }
    }
  }
  
  private generateBrowserFingerprint(ip: string, userAgent: string): string {
    // Simple fingerprint based on IP and User Agent
    return Buffer.from(`${ip}_${userAgent}`).toString('base64').slice(0, 16);
  }
  
  public checkRateLimit(sessionId: string, ip: string, userAgent: string): {
    allowed: boolean;
    messageCount: number;
    requiresCaptcha: boolean;
    isBlocked: boolean;
    remainingTime?: number;
    captchaSolved: boolean;
  } {
    const fingerprint = this.generateBrowserFingerprint(ip, userAgent);
    const compositeKey = `${sessionId}_${fingerprint}`;
    
    let session = this.sessions.get(compositeKey);
    if (!session) {
      session = {
        messageCount: 0,
        firstMessage: new Date(),
        lastMessage: new Date(),
        captchaRequired: false,
        captchaSolved: false,
        blocked: false,
        ip,
        userAgent
      };
      this.sessions.set(compositeKey, session);
    }
    
    const now = new Date();
    
    // Check if session is blocked
    if (session.blocked) {
      if (session.blockExpires && now > session.blockExpires) {
        // Block expired, reset session
        session.blocked = false;
        session.blockExpires = undefined;
        session.messageCount = 0;
        session.captchaRequired = false;
        session.captchaSolved = false;
      } else {
        const remainingTime = session.blockExpires ? 
          Math.ceil((session.blockExpires.getTime() - now.getTime()) / 1000) : 3600;
        return {
          allowed: false,
          messageCount: session.messageCount,
          requiresCaptcha: false,
          isBlocked: true,
          remainingTime,
          captchaSolved: false
        };
      }
    }
    
    // Check daily reset (reset at midnight)
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    if (session.firstMessage < dayStart) {
      // Reset daily counters
      session.messageCount = 0;
      session.firstMessage = now;
      session.captchaRequired = false;
      session.captchaSolved = false;
    }
    
    // Determine current status
    const messageCount = session.messageCount;
    const requiresCaptcha = messageCount >= 16 && messageCount < 21;
    const isBlocked = messageCount >= 21;
    
    if (isBlocked) {
      return {
        allowed: false,
        messageCount,
        requiresCaptcha: false,
        isBlocked: true,
        remainingTime: 0, // Show sign-in prompt instead
        captchaSolved: session.captchaSolved
      };
    }
    
    if (requiresCaptcha && !session.captchaSolved) {
      session.captchaRequired = true;
      return {
        allowed: false,
        messageCount,
        requiresCaptcha: true,
        isBlocked: false,
        captchaSolved: false
      };
    }
    
    return {
      allowed: true,
      messageCount,
      requiresCaptcha: false,
      isBlocked: false,
      captchaSolved: session.captchaSolved
    };
  }
  
  public incrementMessageCount(sessionId: string, ip: string, userAgent: string) {
    const fingerprint = this.generateBrowserFingerprint(ip, userAgent);
    const compositeKey = `${sessionId}_${fingerprint}`;
    
    let session = this.sessions.get(compositeKey);
    if (!session) {
      session = {
        messageCount: 0,
        firstMessage: new Date(),
        lastMessage: new Date(),
        captchaRequired: false,
        captchaSolved: false,
        blocked: false,
        ip,
        userAgent
      };
      this.sessions.set(compositeKey, session);
    }
    
    session.messageCount++;
    session.lastMessage = new Date();
    
    // Set captcha requirement
    if (session.messageCount >= 16) {
      session.captchaRequired = true;
    }
    
    // Set block after 21 messages
    if (session.messageCount >= 21) {
      session.blocked = true;
      session.blockExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour block
    }
  }
  
  public solveCaptcha(sessionId: string, ip: string, userAgent: string, answer: number, correctAnswer: number): boolean {
    const fingerprint = this.generateBrowserFingerprint(ip, userAgent);
    const compositeKey = `${sessionId}_${fingerprint}`;
    
    const session = this.sessions.get(compositeKey);
    if (!session) return false;
    
    if (answer === correctAnswer) {
      session.captchaSolved = true;
      session.captchaRequired = false;
      return true;
    }
    
    return false;
  }
  
  public generateCaptcha(): { question: string; answer: number } {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return {
      question: `What is ${num1} + ${num2}?`,
      answer: num1 + num2
    };
  }
  
  public getSessionStats(): { totalSessions: number; activeSessions: number; blockedSessions: number } {
    const now = new Date();
    let activeSessions = 0;
    let blockedSessions = 0;
    
    for (const session of Array.from(this.sessions.values())) {
      // Consider session active if used within last hour
      if (now.getTime() - session.lastMessage.getTime() < 60 * 60 * 1000) {
        activeSessions++;
      }
      if (session.blocked) {
        blockedSessions++;
      }
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions,
      blockedSessions
    };
  }
}

export const rateLimitingService = new RateLimitingService();