CREATE TABLE "contacts" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" varchar NOT NULL,
    "contact_user_id" varchar,
    "agent_id" integer,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
    "id" serial PRIMARY KEY NOT NULL,
    "conversation_id" integer NOT NULL,
    "contact_id" integer NOT NULL
);
