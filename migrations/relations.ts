import { relations } from "drizzle-orm/relations";
import { advertisements, adSubscriptions, adImpressions, adClicks, abTestingQuestionSets, abTestingSessions, abTestingQuestions } from "./schema";

export const adSubscriptionsRelations = relations(adSubscriptions, ({one}) => ({
	advertisement: one(advertisements, {
		fields: [adSubscriptions.advertisementId],
		references: [advertisements.id]
	}),
}));

export const advertisementsRelations = relations(advertisements, ({many}) => ({
	adSubscriptions: many(adSubscriptions),
	adImpressions: many(adImpressions),
	adClicks: many(adClicks),
}));

export const adImpressionsRelations = relations(adImpressions, ({one}) => ({
	advertisement: one(advertisements, {
		fields: [adImpressions.advertisementId],
		references: [advertisements.id]
	}),
}));

export const adClicksRelations = relations(adClicks, ({one}) => ({
	advertisement: one(advertisements, {
		fields: [adClicks.advertisementId],
		references: [advertisements.id]
	}),
}));

export const abTestingSessionsRelations = relations(abTestingSessions, ({one, many}) => ({
	abTestingQuestionSet: one(abTestingQuestionSets, {
		fields: [abTestingSessions.questionSetId],
		references: [abTestingQuestionSets.id]
	}),
	abTestingQuestions: many(abTestingQuestions),
}));

export const abTestingQuestionSetsRelations = relations(abTestingQuestionSets, ({many}) => ({
	abTestingSessions: many(abTestingSessions),
}));

export const abTestingQuestionsRelations = relations(abTestingQuestions, ({one}) => ({
	abTestingSession: one(abTestingSessions, {
		fields: [abTestingQuestions.sessionId],
		references: [abTestingSessions.id]
	}),
}));