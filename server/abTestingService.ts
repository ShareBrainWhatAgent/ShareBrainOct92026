import { db } from "./db";
import { signupQuestionSets, signupTestSessions, signupQuestionResponses } from "@shared/schema";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";

export interface QuestionSet {
  id: number;
  name: string;
  description: string;
  questions: Question[];
  isActive: boolean;
  weight: number;
}

export interface Question {
  id: string;
  title: string;
  subtitle: string;
  placeholder: string;
  type: 'input' | 'textarea' | 'select';
  options?: string[]; // For select questions
  required?: boolean;
}

export interface TestSession {
  id: number;
  userId: string;
  questionSetId: number;
  startedAt: Date;
  completedAt?: Date;
  totalQuestions: number;
  questionsAnswered: number;
  completionRate: number;
  timeToComplete?: number;
  abandonedAt?: Date;
  abandonedOnStep?: number;
}

export interface ABTestAnalytics {
  questionSet: QuestionSet;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageTimeToComplete: number;
  abandonmentByStep: { step: number; count: number; percentage: number }[];
  topPerformingQuestions: { questionId: string; responseRate: number }[];
}

export class ABTestingService {
  
  /**
   * Get active question set for a user (random selection based on weights)
   */
  async getQuestionSetForUser(userId: string): Promise<QuestionSet | null> {
    // Check if user already has an active session
    const existingSession = await db.select()
      .from(signupTestSessions)
      .where(
        and(
          eq(signupTestSessions.userId, userId),
          sql`${signupTestSessions.completedAt} IS NULL`
        )
      )
      .limit(1);
    
    if (existingSession.length > 0) {
      // Return the question set from existing session
      const [questionSet] = await db.select()
        .from(signupQuestionSets)
        .where(eq(signupQuestionSets.id, existingSession[0].questionSetId))
        .limit(1);
      
      return questionSet ? {
        ...questionSet,
        questions: questionSet.questions as Question[]
      } : null;
    }
    
    // Get all active question sets
    const questionSets = await db.select()
      .from(signupQuestionSets)
      .where(eq(signupQuestionSets.isActive, true));
    
    if (questionSets.length === 0) {
      return null;
    }
    
    // Weighted random selection
    const totalWeight = questionSets.reduce((sum, set) => sum + set.weight, 0);
    const random = Math.random() * totalWeight;
    let weightSum = 0;
    
    for (const set of questionSets) {
      weightSum += set.weight;
      if (random <= weightSum) {
        return {
          ...set,
          questions: set.questions as Question[]
        };
      }
    }
    
    // Fallback to first set
    return {
      ...questionSets[0],
      questions: questionSets[0].questions as Question[]
    };
  }
  
  /**
   * Start a new test session for a user
   */
  async startTestSession(userId: string, questionSetId: number): Promise<TestSession> {
    const questionSet = await db.select()
      .from(signupQuestionSets)
      .where(eq(signupQuestionSets.id, questionSetId))
      .limit(1);
    
    if (!questionSet[0]) {
      throw new Error('Question set not found');
    }
    
    const questions = questionSet[0].questions as Question[];
    
    const [session] = await db.insert(signupTestSessions).values({
      userId,
      questionSetId,
      totalQuestions: questions.length,
      questionsAnswered: 0,
      completionRate: 0,
    }).returning();
    
    return session;
  }
  
  /**
   * Record a question response
   */
  async recordQuestionResponse(
    sessionId: number,
    questionId: string,
    questionText: string,
    response: string,
    responseTime: number,
    stepNumber: number,
    isSkipped: boolean = false
  ): Promise<void> {
    await db.insert(signupQuestionResponses).values({
      sessionId,
      questionId,
      questionText,
      response: response.trim() || null,
      responseTime,
      stepNumber,
      isSkipped,
    });
    
    // Update session progress
    const session = await db.select()
      .from(signupTestSessions)
      .where(eq(signupTestSessions.id, sessionId))
      .limit(1);
    
    if (session[0]) {
      const questionsAnswered = session[0].questionsAnswered + 1;
      const completionRate = questionsAnswered / session[0].totalQuestions;
      
      await db.update(signupTestSessions)
        .set({
          questionsAnswered,
          completionRate,
        })
        .where(eq(signupTestSessions.id, sessionId));
    }
  }
  
  /**
   * Complete a test session
   */
  async completeTestSession(sessionId: number): Promise<void> {
    const session = await db.select()
      .from(signupTestSessions)
      .where(eq(signupTestSessions.id, sessionId))
      .limit(1);
    
    if (session[0]) {
      const timeToComplete = Math.floor((Date.now() - session[0].startedAt.getTime()) / 1000);
      
      await db.update(signupTestSessions)
        .set({
          completedAt: new Date(),
          timeToComplete,
          completionRate: 1.0,
        })
        .where(eq(signupTestSessions.id, sessionId));
    }
  }
  
  /**
   * Record session abandonment
   */
  async recordAbandonmentSession(sessionId: number, abandonedOnStep: number): Promise<void> {
    await db.update(signupTestSessions)
      .set({
        abandonedAt: new Date(),
        abandonedOnStep,
      })
      .where(eq(signupTestSessions.id, sessionId));
  }
  
  /**
   * Get analytics for all question sets
   */
  async getAnalytics(dateRange?: { startDate: Date; endDate: Date }): Promise<ABTestAnalytics[]> {
    const questionSets = await db.select()
      .from(signupQuestionSets)
      .orderBy(desc(signupQuestionSets.createdAt));
    
    const analytics: ABTestAnalytics[] = [];
    
    for (const questionSet of questionSets) {
      let sessionsQuery = db.select()
        .from(signupTestSessions)
        .where(eq(signupTestSessions.questionSetId, questionSet.id));
      
      if (dateRange) {
        sessionsQuery = sessionsQuery.where(
          and(
            eq(signupTestSessions.questionSetId, questionSet.id),
            gte(signupTestSessions.startedAt, dateRange.startDate),
            lt(signupTestSessions.startedAt, dateRange.endDate)
          )
        );
      }
      
      const sessions = await sessionsQuery;
      const completedSessions = sessions.filter(s => s.completedAt);
      const totalSessions = sessions.length;
      const completionRate = totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0;
      
      const averageTimeToComplete = completedSessions.length > 0
        ? Math.floor(completedSessions.reduce((sum, s) => sum + (s.timeToComplete || 0), 0) / completedSessions.length)
        : 0;
      
      // Calculate abandonment by step
      const abandonmentByStep: { step: number; count: number; percentage: number }[] = [];
      const questions = questionSet.questions as Question[];
      
      for (let step = 1; step <= questions.length; step++) {
        const abandonedAtStep = sessions.filter(s => s.abandonedOnStep === step).length;
        const percentage = totalSessions > 0 ? (abandonedAtStep / totalSessions) * 100 : 0;
        
        abandonmentByStep.push({
          step,
          count: abandonedAtStep,
          percentage: Math.round(percentage * 100) / 100
        });
      }
      
      // Get top performing questions
      const responses = await db.select()
        .from(signupQuestionResponses)
        .innerJoin(signupTestSessions, eq(signupQuestionResponses.sessionId, signupTestSessions.id))
        .where(eq(signupTestSessions.questionSetId, questionSet.id));
      
      const questionResponseRates = new Map<string, { total: number; answered: number }>();
      
      responses.forEach(response => {
        const questionId = response.signup_question_responses.questionId;
        const current = questionResponseRates.get(questionId) || { total: 0, answered: 0 };
        current.total += 1;
        if (!response.signup_question_responses.isSkipped && response.signup_question_responses.response) {
          current.answered += 1;
        }
        questionResponseRates.set(questionId, current);
      });
      
      const topPerformingQuestions = Array.from(questionResponseRates.entries())
        .map(([questionId, stats]) => ({
          questionId,
          responseRate: stats.total > 0 ? (stats.answered / stats.total) * 100 : 0
        }))
        .sort((a, b) => b.responseRate - a.responseRate);
      
      analytics.push({
        questionSet: {
          ...questionSet,
          questions: questions
        },
        totalSessions,
        completedSessions: completedSessions.length,
        completionRate: Math.round(completionRate * 100) / 100,
        averageTimeToComplete,
        abandonmentByStep,
        topPerformingQuestions
      });
    }
    
    return analytics;
  }
  
  /**
   * Create a new question set
   */
  async createQuestionSet(
    name: string,
    description: string,
    questions: Question[],
    weight: number = 1
  ): Promise<QuestionSet> {
    const [questionSet] = await db.insert(signupQuestionSets).values({
      name,
      description,
      questions: questions as any,
      weight,
    }).returning();
    
    return {
      ...questionSet,
      questions: questionSet.questions as Question[]
    };
  }
  
  /**
   * Update question set status
   */
  async updateQuestionSetStatus(id: number, isActive: boolean): Promise<void> {
    await db.update(signupQuestionSets)
      .set({ isActive })
      .where(eq(signupQuestionSets.id, id));
  }
  
  /**
   * Get current user's active session
   */
  async getUserActiveSession(userId: string): Promise<TestSession | null> {
    const [session] = await db.select()
      .from(signupTestSessions)
      .where(
        and(
          eq(signupTestSessions.userId, userId),
          sql`${signupTestSessions.completedAt} IS NULL`
        )
      )
      .limit(1);
    
    return session || null;
  }
}

export const abTestingService = new ABTestingService();