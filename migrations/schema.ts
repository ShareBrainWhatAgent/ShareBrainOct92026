import { pgTable, serial, integer, varchar, text, json, boolean, timestamp, real, unique, index, foreignKey, numeric, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const agentDocuments = pgTable("agent_documents", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	userId: varchar("user_id").notNull(),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: integer("file_size").notNull(),
	fileContent: text("file_content").notNull(),
	embedding: text().notNull(),
	chunks: json().notNull(),
	metadata: json(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const agentListings = pgTable("agent_listings", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	businessName: text("business_name").notNull(),
	description: text().notNull(),
	category: text().notNull(),
	contactEmail: text("contact_email").notNull(),
	phone: text(),
	website: text(),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	country: text().default('US'),
	latitude: real(),
	longitude: real(),
	hours: json(),
	priceRange: text("price_range"),
	specialOffers: text("special_offers"),
	amenities: text().array(),
	images: text().array(),
	status: text().default('pending').notNull(),
	submittedBy: text("submitted_by"),
	moderatedBy: text("moderated_by"),
	moderationNotes: text("moderation_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const agents = pgTable("agents", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	name: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	model: text().notNull(),
	temperature: real().default(0.7).notNull(),
	maxTokens: integer("max_tokens").default(2048).notNull(),
	systemPrompt: text("system_prompt"),
	sampleUser: text("sample_user"),
	sampleAgent: text("sample_agent"),
	status: text().default('draft').notNull(),
	isTemplate: boolean("is_template").default(false).notNull(),
	uses: integer().default(0).notNull(),
	rating: real().default(0).notNull(),
	voiceEnabled: boolean("voice_enabled").default(false).notNull(),
	voiceModel: text("voice_model").default('tts-1'),
	voiceType: text("voice_type").default('alloy'),
	isMasterAgent: boolean("is_master_agent").default(false).notNull(),
	isPersonal: boolean("is_personal").default(false).notNull(),
	triggerKeywords: text("trigger_keywords"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	documentSearchMode: text("document_search_mode").default('documents_memory_and_general').notNull(),
	isPrivate: boolean("is_private").default(false).notNull(),
	imageEnabled: boolean("image_enabled").default(false).notNull(),
	imageModel: text("image_model").default('dall-e-3'),
	imageQuality: text("image_quality").default('standard'),
	hasSharedMemory: boolean("has_shared_memory").default(false).notNull(),
	hasFriendsMemory: boolean("has_friends_memory").default(false).notNull(),
	isPubliclyVisible: boolean("is_publicly_visible").default(true).notNull(),
	hasOnboardingQuestions: boolean("has_onboarding_questions").default(false).notNull(),
	onboardingQuestions: json("onboarding_questions"),
	requiresSignup: boolean("requires_signup").default(false).notNull(),
	signupFields: json("signup_fields"),
	locationAware: boolean("location_aware").default(true),
	hasWeatherCapabilities: boolean("has_weather_capabilities").default(true),
});

export const apiKeys = pgTable("api_keys", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	keyHash: text("key_hash").notNull(),
	keyPrefix: text("key_prefix").notNull(),
	name: text().notNull(),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	usageCount: integer("usage_count").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("api_keys_key_hash_unique").on(table.keyHash),
]);

export const contacts = pgTable("contacts", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	contactUserId: varchar("contact_user_id"),
	agentId: integer("agent_id"),
	contactType: text("contact_type").notNull(),
	displayName: text("display_name"),
	isOnline: boolean("is_online").default(false),
	lastSeen: timestamp("last_seen", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	conversationId: integer("conversation_id"),
	hasNewMessage: boolean("has_new_message").default(false),
});

export const conversationParticipants = pgTable("conversation_participants", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	contactId: integer("contact_id").notNull(),
	userId: varchar("user_id"),
	agentId: integer("agent_id"),
	participantType: text("participant_type").notNull(),
	role: text().default('member'),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	lastRead: timestamp("last_read", { mode: 'string' }),
});

export const conversations = pgTable("conversations", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	userId: varchar("user_id").notNull(),
	title: text().notNull(),
	currentActiveAgentId: integer("current_active_agent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const documentChunks = pgTable("document_chunks", {
	id: serial().primaryKey().notNull(),
	documentId: integer("document_id").notNull(),
	agentId: integer("agent_id").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	chunkText: text("chunk_text").notNull(),
	embedding: text().notNull(),
	tokens: integer().notNull(),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const friendRequests = pgTable("friend_requests", {
	id: serial().primaryKey().notNull(),
	senderId: varchar("sender_id").notNull(),
	receiverId: varchar("receiver_id").notNull(),
	status: text().default('pending').notNull(),
	message: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
	id: serial().primaryKey().notNull(),
	requesterId: varchar("requester_id").notNull(),
	addresseeId: varchar("addressee_id").notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const personalMemories = pgTable("personal_memories", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	agentId: integer("agent_id").notNull(),
	memoryKey: varchar("memory_key", { length: 100 }).notNull(),
	memoryValue: text("memory_value").notNull(),
	originalStatement: text("original_statement"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isCustomizeMode: boolean("is_customize_mode").default(false),
});

export const promptAnalytics = pgTable("prompt_analytics", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	userId: varchar("user_id").notNull(),
	promptType: text("prompt_type").notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	avgRating: real("avg_rating").default(0),
	lastUsed: timestamp("last_used", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const promptEmbeddings = pgTable("prompt_embeddings", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	userId: varchar("user_id").notNull(),
	promptType: text("prompt_type").notNull(),
	promptText: text("prompt_text").notNull(),
	embedding: text().notNull(),
	tokens: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const unifiedConversations = pgTable("unified_conversations", {
	id: serial().primaryKey().notNull(),
	title: text(),
	type: text().notNull(),
	createdBy: varchar("created_by").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lastMessageId: integer("last_message_id"),
	lastActivity: timestamp("last_activity", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const unifiedMessages = pgTable("unified_messages", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	senderId: varchar("sender_id"),
	senderAgentId: integer("sender_agent_id"),
	senderType: text("sender_type").notNull(),
	content: text().notNull(),
	messageType: text("message_type").default('text'),
	replyToId: integer("reply_to_id"),
	metadata: json(),
	isEdited: boolean("is_edited").default(false),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: varchar().primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	handle: varchar(),
	profileImageUrl: varchar("profile_image_url"),
	stripeCustomerId: varchar("stripe_customer_id"),
	stripeSubscriptionId: varchar("stripe_subscription_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	trialStartDate: timestamp("trial_start_date", { mode: 'string' }),
	trialEndDate: timestamp("trial_end_date", { mode: 'string' }),
	subscriptionStatus: varchar("subscription_status").default('trial'),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_handle_unique").on(table.handle),
]);

export const sharedMemories = pgTable("shared_memories", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	contributorId: varchar("contributor_id").notNull(),
	memoryKey: varchar("memory_key", { length: 100 }).notNull(),
	memoryValue: text("memory_value").notNull(),
	originalStatement: text("original_statement"),
	isVerified: boolean("is_verified").default(false).notNull(),
	upvotes: integer().default(0).notNull(),
	downvotes: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const friendsMemories = pgTable("friends_memories", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	contributorId: varchar("contributor_id").notNull(),
	memoryKey: varchar("memory_key", { length: 100 }).notNull(),
	memoryValue: text("memory_value").notNull(),
	originalStatement: text("original_statement"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const agentWorkspaces = pgTable("agent_workspaces", {
	id: varchar().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	name: varchar().notNull(),
	description: text(),
	code: text().notNull(),
	systemPrompt: text("system_prompt").notNull(),
	memoryType: varchar("memory_type").default('personal').notNull(),
	status: varchar().default('development').notNull(),
	replitUrl: varchar("replit_url"),
	replitProjectId: varchar("replit_project_id"),
	deployedAgentId: integer("deployed_agent_id"),
	isPublic: boolean("is_public").default(false).notNull(),
	version: integer().default(1).notNull(),
	lastTestResults: json("last_test_results"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	agentId: integer("agent_id"),
	websiteSlug: varchar("website_slug"),
}, (table) => [
	unique("agent_workspaces_website_slug_unique").on(table.websiteSlug),
]);

export const agentCreationManuals = pgTable("agent_creation_manuals", {
	id: serial().primaryKey().notNull(),
	domain: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	domainQuestions: text("domain_questions"),
	enthusiastQuestions: text("enthusiast_questions"),
	contentStructure: text("content_structure"),
	qualityBenchmarks: text("quality_benchmarks"),
	exampleAgent: text("example_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const chatInvitations = pgTable("chat_invitations", {
	id: serial().primaryKey().notNull(),
	conversationId: integer("conversation_id").notNull(),
	invitedUserId: varchar("invited_user_id").notNull(),
	invitedByUserId: varchar("invited_by_user_id").notNull(),
	agentId: integer("agent_id"),
	status: varchar().default('pending').notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const advertisements = pgTable("advertisements", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	website: varchar({ length: 255 }),
	phoneNumber: varchar("phone_number", { length: 50 }),
	email: varchar({ length: 255 }),
	address: text(),
	facebookUrl: varchar("facebook_url", { length: 255 }),
	instagramUrl: varchar("instagram_url", { length: 255 }),
	twitterUrl: varchar("twitter_url", { length: 255 }),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	keywords: text().notNull(),
	targetAgentIds: text("target_agent_ids"),
	isActive: boolean("is_active").default(true),
	impressions: integer().default(0),
	clicks: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const adSubscriptions = pgTable("ad_subscriptions", {
	id: serial().primaryKey().notNull(),
	advertisementId: integer("advertisement_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).default('active'),
	monthlyRate: numeric("monthly_rate", { precision: 10, scale:  2 }).default('10.00'),
	startDate: timestamp("start_date", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	endDate: timestamp("end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.advertisementId],
			foreignColumns: [advertisements.id],
			name: "ad_subscriptions_advertisement_id_fkey"
		}).onDelete("cascade"),
]);

export const adImpressions = pgTable("ad_impressions", {
	id: serial().primaryKey().notNull(),
	advertisementId: integer("advertisement_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	agentId: integer("agent_id"),
	keyword: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.advertisementId],
			foreignColumns: [advertisements.id],
			name: "ad_impressions_advertisement_id_fkey"
		}).onDelete("cascade"),
]);

export const adClicks = pgTable("ad_clicks", {
	id: serial().primaryKey().notNull(),
	advertisementId: integer("advertisement_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	agentId: integer("agent_id"),
	keyword: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.advertisementId],
			foreignColumns: [advertisements.id],
			name: "ad_clicks_advertisement_id_fkey"
		}).onDelete("cascade"),
]);

export const abTestingQuestionSets = pgTable("ab_testing_question_sets", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	questions: jsonb().notNull(),
	isActive: boolean("is_active").default(true),
	weight: integer().default(100),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const abTestingSessions = pgTable("ab_testing_sessions", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	questionSetId: integer("question_set_id").notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	totalQuestions: integer("total_questions").notNull(),
	questionsAnswered: integer("questions_answered").default(0),
	completionRate: numeric("completion_rate", { precision: 5, scale:  2 }).default('0.0'),
	timeToComplete: integer("time_to_complete"),
	abandonedAt: timestamp("abandoned_at", { mode: 'string' }),
	abandonedOnStep: integer("abandoned_on_step"),
}, (table) => [
	foreignKey({
			columns: [table.questionSetId],
			foreignColumns: [abTestingQuestionSets.id],
			name: "ab_testing_sessions_question_set_id_fkey"
		}),
]);

export const abTestingQuestions = pgTable("ab_testing_questions", {
	id: serial().primaryKey().notNull(),
	sessionId: integer("session_id").notNull(),
	questionId: varchar("question_id", { length: 255 }).notNull(),
	response: text(),
	isSkipped: boolean("is_skipped").default(false),
	responseTime: integer("response_time"),
	respondedAt: timestamp("responded_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [abTestingSessions.id],
			name: "ab_testing_questions_session_id_fkey"
		}),
]);

export const agentSignups = pgTable("agent_signups", {
	id: serial().primaryKey().notNull(),
	agentId: integer("agent_id").notNull(),
	userId: varchar("user_id").notNull(),
	signupData: json("signup_data").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("agent_signups_agent_id_user_id_key").on(table.agentId, table.userId),
]);
